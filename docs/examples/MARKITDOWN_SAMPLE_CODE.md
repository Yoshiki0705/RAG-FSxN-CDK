# Markitdown統合機能 サンプルコード集

## 📋 概要

Permission-aware RAG SystemのMarkitdown統合機能を使用するためのサンプルコード集です。各種プログラミング言語での実装例を提供します。

## 🚀 基本的な使用例

### TypeScript/JavaScript

#### 1. 基本的な文書アップロード

```typescript
import axios from 'axios';

interface MarkitdownResponse {
  success: boolean;
  data?: {
    fileId: string;
    fileName: string;
    processingMethod: string;
    processingTime: number;
    qualityScore: number;
    markdownContent: string;
    chunks: Array<{
      id: string;
      content: string;
      metadata: any;
    }>;
  };
  error?: {
    code: string;
    message: string;
  };
}

class MarkitdownClient {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  async uploadDocument(
    file: File, 
    options: {
      processingStrategy?: string;
      projectId: string;
      enableOCR?: boolean;
      qualityThreshold?: number;
    }
  ): Promise<MarkitdownResponse> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', options.projectId);
    
    if (options.processingStrategy) {
      formData.append('processingStrategy', options.processingStrategy);
    }
    
    if (options.enableOCR !== undefined) {
      formData.append('enableOCR', options.enableOCR.toString());
    }
    
    if (options.qualityThreshold) {
      formData.append('qualityThreshold', options.qualityThreshold.toString());
    }

    try {
      const response = await axios.post(
        `${this.baseUrl}/documents/upload`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'multipart/form-data'
          },
          timeout: 300000 // 5分
        }
      );

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: {
            code: error.response?.data?.error?.code || 'NETWORK_ERROR',
            message: error.response?.data?.error?.message || error.message
          }
        };
      }
      throw error;
    }
  }

  async checkStatus(fileId: string): Promise<any> {
    const response = await axios.get(
      `${this.baseUrl}/documents/${fileId}/status`,
      {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      }
    );

    return response.data;
  }

  async getConfig(): Promise<any> {
    const response = await axios.get(
      `${this.baseUrl}/markitdown/config`,
      {
        headers: {
          'Authorization': `Bearer ${this.token}`
        }
      }
    );

    return response.data;
  }
}

// 使用例
const client = new MarkitdownClient('https://your-domain.com/api', 'your-token');

// ファイルアップロード
const fileInput = document.getElementById('fileInput') as HTMLInputElement;
const file = fileInput.files?.[0];

if (file) {
  const result = await client.uploadDocument(file, {
    processingStrategy: 'markitdown-first',
    projectId: 'project-123',
    enableOCR: true,
    qualityThreshold: 85
  });

  if (result.success) {
    console.log('処理成功:', result.data);
    console.log('マークダウンコンテンツ:', result.data?.markdownContent);
  } else {
    console.error('処理失敗:', result.error);
  }
}
```

#### 2. 進捗監視付きアップロード

```typescript
class ProgressiveUploader {
  private client: MarkitdownClient;

  constructor(client: MarkitdownClient) {
    this.client = client;
  }

  async uploadWithProgress(
    file: File,
    options: any,
    onProgress?: (progress: number) => void
  ): Promise<MarkitdownResponse> {
    // アップロード開始
    const uploadResult = await this.client.uploadDocument(file, options);
    
    if (!uploadResult.success) {
      return uploadResult;
    }

    const fileId = uploadResult.data!.fileId;
    
    // 進捗監視
    return new Promise((resolve) => {
      const checkProgress = async () => {
        const status = await this.client.checkStatus(fileId);
        
        if (status.success) {
          const progress = status.data.progress || 0;
          onProgress?.(progress);
          
          if (status.data.status === 'completed') {
            resolve(uploadResult);
          } else if (status.data.status === 'failed') {
            resolve({
              success: false,
              error: {
                code: 'PROCESSING_FAILED',
                message: '文書処理に失敗しました'
              }
            });
          } else {
            // 1秒後に再チェック
            setTimeout(checkProgress, 1000);
          }
        }
      };
      
      checkProgress();
    });
  }
}

// 使用例
const uploader = new ProgressiveUploader(client);

const result = await uploader.uploadWithProgress(
  file,
  {
    processingStrategy: 'both-compare',
    projectId: 'project-123'
  },
  (progress) => {
    console.log(`処理進捗: ${progress}%`);
    // プログレスバー更新
    document.getElementById('progressBar')!.style.width = `${progress}%`;
  }
);
```

#### 3. バッチ処理

```typescript
class BatchProcessor {
  private client: MarkitdownClient;
  private maxConcurrent: number;

  constructor(client: MarkitdownClient, maxConcurrent: number = 3) {
    this.client = client;
    this.maxConcurrent = maxConcurrent;
  }

  async processFiles(
    files: File[],
    options: any,
    onFileComplete?: (index: number, result: MarkitdownResponse) => void
  ): Promise<MarkitdownResponse[]> {
    const results: MarkitdownResponse[] = [];
    const semaphore = new Semaphore(this.maxConcurrent);

    const processFile = async (file: File, index: number) => {
      await semaphore.acquire();
      
      try {
        const result = await this.client.uploadDocument(file, {
          ...options,
          projectId: options.projectId || `batch-${Date.now()}`
        });
        
        results[index] = result;
        onFileComplete?.(index, result);
        
        return result;
      } finally {
        semaphore.release();
      }
    };

    await Promise.all(
      files.map((file, index) => processFile(file, index))
    );

    return results;
  }
}

class Semaphore {
  private permits: number;
  private waitQueue: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }

    return new Promise((resolve) => {
      this.waitQueue.push(resolve);
    });
  }

  release(): void {
    this.permits++;
    
    if (this.waitQueue.length > 0) {
      const resolve = this.waitQueue.shift()!;
      this.permits--;
      resolve();
    }
  }
}

// 使用例
const batchProcessor = new BatchProcessor(client, 3);

const files = Array.from(document.getElementById('multipleFiles')!.files || []);
const results = await batchProcessor.processFiles(
  files,
  {
    processingStrategy: 'auto',
    projectId: 'batch-project-123'
  },
  (index, result) => {
    console.log(`ファイル ${index + 1} 処理完了:`, result.success);
  }
);

console.log('バッチ処理完了:', results);
```

### Python

#### 1. 基本的なクライアント

```python
import requests
import json
import time
from typing import Optional, Dict, Any, List
from pathlib import Path

class MarkitdownClient:
    def __init__(self, base_url: str, token: str):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.session.headers.update({
            'Authorization': f'Bearer {token}'
        })
    
    def upload_document(
        self,
        file_path: str,
        processing_strategy: str = 'auto',
        project_id: str = 'default',
        enable_ocr: bool = True,
        quality_threshold: Optional[int] = None
    ) -> Dict[str, Any]:
        """文書をアップロードして処理"""
        
        file_path = Path(file_path)
        if not file_path.exists():
            return {
                'success': False,
                'error': {
                    'code': 'FILE_NOT_FOUND',
                    'message': f'ファイルが見つかりません: {file_path}'
                }
            }
        
        with open(file_path, 'rb') as f:
            files = {'file': (file_path.name, f, self._get_mime_type(file_path))}
            data = {
                'processingStrategy': processing_strategy,
                'projectId': project_id,
                'enableOCR': str(enable_ocr).lower()
            }
            
            if quality_threshold is not None:
                data['qualityThreshold'] = str(quality_threshold)
            
            try:
                response = self.session.post(
                    f'{self.base_url}/documents/upload',
                    files=files,
                    data=data,
                    timeout=300  # 5分
                )
                
                return response.json()
                
            except requests.exceptions.RequestException as e:
                return {
                    'success': False,
                    'error': {
                        'code': 'NETWORK_ERROR',
                        'message': str(e)
                    }
                }
    
    def check_status(self, file_id: str) -> Dict[str, Any]:
        """処理状況を確認"""
        try:
            response = self.session.get(
                f'{self.base_url}/documents/{file_id}/status'
            )
            return response.json()
        except requests.exceptions.RequestException as e:
            return {
                'success': False,
                'error': {
                    'code': 'NETWORK_ERROR',
                    'message': str(e)
                }
            }
    
    def wait_for_completion(
        self,
        file_id: str,
        timeout: int = 300,
        poll_interval: int = 2
    ) -> Dict[str, Any]:
        """処理完了まで待機"""
        start_time = time.time()
        
        while time.time() - start_time < timeout:
            status = self.check_status(file_id)
            
            if not status.get('success'):
                return status
            
            status_data = status['data']['status']
            
            if status_data == 'completed':
                return status
            elif status_data == 'failed':
                return {
                    'success': False,
                    'error': {
                        'code': 'PROCESSING_FAILED',
                        'message': '文書処理に失敗しました'
                    }
                }
            
            time.sleep(poll_interval)
        
        return {
            'success': False,
            'error': {
                'code': 'TIMEOUT',
                'message': f'処理がタイムアウトしました（{timeout}秒）'
            }
        }
    
    def get_config(self) -> Dict[str, Any]:
        """設定を取得"""
        try:
            response = self.session.get(f'{self.base_url}/markitdown/config')
            return response.json()
        except requests.exceptions.RequestException as e:
            return {
                'success': False,
                'error': {
                    'code': 'NETWORK_ERROR',
                    'message': str(e)
                }
            }
    
    def get_stats(self, period: str = '24h') -> Dict[str, Any]:
        """統計を取得"""
        try:
            response = self.session.get(
                f'{self.base_url}/markitdown/stats',
                params={'period': period}
            )
            return response.json()
        except requests.exceptions.RequestException as e:
            return {
                'success': False,
                'error': {
                    'code': 'NETWORK_ERROR',
                    'message': str(e)
                }
            }
    
    def _get_mime_type(self, file_path: Path) -> str:
        """ファイルのMIMEタイプを取得"""
        mime_types = {
            '.pdf': 'application/pdf',
            '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.html': 'text/html',
            '.csv': 'text/csv',
            '.txt': 'text/plain'
        }
        
        return mime_types.get(file_path.suffix.lower(), 'application/octet-stream')

# 使用例
def main():
    client = MarkitdownClient('https://your-domain.com/api', 'your-token')
    
    # 設定確認
    config = client.get_config()
    if config['success']:
        print("サポートされているファイル形式:")
        for format_name, format_config in config['data']['supportedFormats'].items():
            if format_config['enabled']:
                print(f"  - {format_name}: {format_config['description']}")
    
    # 文書アップロード
    result = client.upload_document(
        'document.pdf',
        processing_strategy='markitdown-first',
        project_id='python-test',
        enable_ocr=True,
        quality_threshold=85
    )
    
    if result['success']:
        file_id = result['data']['fileId']
        print(f"アップロード成功: {file_id}")
        
        # 処理完了まで待機
        final_result = client.wait_for_completion(file_id, timeout=300)
        
        if final_result['success']:
            print("処理完了!")
            print(f"処理時間: {final_result['data']['processingTime']}ms")
            print(f"品質スコア: {final_result['data']['qualityScore']}")
        else:
            print(f"処理失敗: {final_result['error']['message']}")
    else:
        print(f"アップロード失敗: {result['error']['message']}")

if __name__ == '__main__':
    main()
```

#### 2. 非同期処理版

```python
import asyncio
import aiohttp
import aiofiles
from typing import List, Dict, Any
from pathlib import Path

class AsyncMarkitdownClient:
    def __init__(self, base_url: str, token: str):
        self.base_url = base_url.rstrip('/')
        self.headers = {'Authorization': f'Bearer {token}'}
    
    async def upload_document(
        self,
        session: aiohttp.ClientSession,
        file_path: str,
        **kwargs
    ) -> Dict[str, Any]:
        """非同期で文書をアップロード"""
        
        file_path = Path(file_path)
        
        async with aiofiles.open(file_path, 'rb') as f:
            file_content = await f.read()
        
        data = aiohttp.FormData()
        data.add_field('file', file_content, filename=file_path.name)
        data.add_field('processingStrategy', kwargs.get('processing_strategy', 'auto'))
        data.add_field('projectId', kwargs.get('project_id', 'default'))
        data.add_field('enableOCR', str(kwargs.get('enable_ocr', True)).lower())
        
        if 'quality_threshold' in kwargs:
            data.add_field('qualityThreshold', str(kwargs['quality_threshold']))
        
        try:
            async with session.post(
                f'{self.base_url}/documents/upload',
                data=data,
                headers=self.headers,
                timeout=aiohttp.ClientTimeout(total=300)
            ) as response:
                return await response.json()
                
        except Exception as e:
            return {
                'success': False,
                'error': {
                    'code': 'NETWORK_ERROR',
                    'message': str(e)
                }
            }
    
    async def process_files_batch(
        self,
        file_paths: List[str],
        max_concurrent: int = 3,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """複数ファイルを並行処理"""
        
        semaphore = asyncio.Semaphore(max_concurrent)
        
        async def process_single_file(file_path: str) -> Dict[str, Any]:
            async with semaphore:
                async with aiohttp.ClientSession() as session:
                    return await self.upload_document(session, file_path, **kwargs)
        
        tasks = [process_single_file(file_path) for file_path in file_paths]
        return await asyncio.gather(*tasks)

# 使用例
async def main():
    client = AsyncMarkitdownClient('https://your-domain.com/api', 'your-token')
    
    file_paths = [
        'document1.pdf',
        'document2.docx',
        'document3.xlsx'
    ]
    
    results = await client.process_files_batch(
        file_paths,
        max_concurrent=2,
        processing_strategy='markitdown-first',
        project_id='async-batch',
        enable_ocr=True
    )
    
    for i, result in enumerate(results):
        if result['success']:
            print(f"ファイル {i+1} 処理成功: {result['data']['fileId']}")
        else:
            print(f"ファイル {i+1} 処理失敗: {result['error']['message']}")

if __name__ == '__main__':
    asyncio.run(main())
```

### Java

#### 1. 基本的なクライアント

```java
import java.io.*;
import java.net.http.*;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.concurrent.CompletableFuture;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;

public class MarkitdownClient {
    private final String baseUrl;
    private final String token;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;
    
    public MarkitdownClient(String baseUrl, String token) {
        this.baseUrl = baseUrl.replaceAll("/$", "");
        this.token = token;
        this.httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(30))
            .build();
        this.objectMapper = new ObjectMapper();
    }
    
    public CompletableFuture<JsonNode> uploadDocument(
        Path filePath,
        String processingStrategy,
        String projectId,
        boolean enableOCR,
        Integer qualityThreshold
    ) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                String boundary = "----WebKitFormBoundary" + System.currentTimeMillis();
                
                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                PrintWriter writer = new PrintWriter(new OutputStreamWriter(baos, "UTF-8"));
                
                // ファイルデータ
                writer.append("--").append(boundary).append("\r\n");
                writer.append("Content-Disposition: form-data; name=\"file\"; filename=\"")
                      .append(filePath.getFileName().toString()).append("\"\r\n");
                writer.append("Content-Type: ").append(getMimeType(filePath)).append("\r\n\r\n");
                writer.flush();
                
                baos.write(Files.readAllBytes(filePath));
                writer.append("\r\n");
                
                // その他のフィールド
                addFormField(writer, boundary, "processingStrategy", processingStrategy);
                addFormField(writer, boundary, "projectId", projectId);
                addFormField(writer, boundary, "enableOCR", String.valueOf(enableOCR));
                
                if (qualityThreshold != null) {
                    addFormField(writer, boundary, "qualityThreshold", qualityThreshold.toString());
                }
                
                writer.append("--").append(boundary).append("--\r\n");
                writer.flush();
                
                HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/documents/upload"))
                    .header("Authorization", "Bearer " + token)
                    .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                    .timeout(Duration.ofMinutes(5))
                    .POST(HttpRequest.BodyPublishers.ofByteArray(baos.toByteArray()))
                    .build();
                
                HttpResponse<String> response = httpClient.send(request, 
                    HttpResponse.BodyHandlers.ofString());
                
                return objectMapper.readTree(response.body());
                
            } catch (Exception e) {
                try {
                    return objectMapper.createObjectNode()
                        .put("success", false)
                        .set("error", objectMapper.createObjectNode()
                            .put("code", "NETWORK_ERROR")
                            .put("message", e.getMessage()));
                } catch (Exception ex) {
                    throw new RuntimeException(ex);
                }
            }
        });
    }
    
    public CompletableFuture<JsonNode> checkStatus(String fileId) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + "/documents/" + fileId + "/status"))
                    .header("Authorization", "Bearer " + token)
                    .GET()
                    .build();
                
                HttpResponse<String> response = httpClient.send(request,
                    HttpResponse.BodyHandlers.ofString());
                
                return objectMapper.readTree(response.body());
                
            } catch (Exception e) {
                try {
                    return objectMapper.createObjectNode()
                        .put("success", false)
                        .set("error", objectMapper.createObjectNode()
                            .put("code", "NETWORK_ERROR")
                            .put("message", e.getMessage()));
                } catch (Exception ex) {
                    throw new RuntimeException(ex);
                }
            }
        });
    }
    
    public CompletableFuture<JsonNode> waitForCompletion(String fileId, int timeoutSeconds) {
        return CompletableFuture.supplyAsync(() -> {
            long startTime = System.currentTimeMillis();
            long timeoutMs = timeoutSeconds * 1000L;
            
            while (System.currentTimeMillis() - startTime < timeoutMs) {
                try {
                    JsonNode status = checkStatus(fileId).get();
                    
                    if (!status.get("success").asBoolean()) {
                        return status;
                    }
                    
                    String statusValue = status.get("data").get("status").asText();
                    
                    if ("completed".equals(statusValue)) {
                        return status;
                    } else if ("failed".equals(statusValue)) {
                        return objectMapper.createObjectNode()
                            .put("success", false)
                            .set("error", objectMapper.createObjectNode()
                                .put("code", "PROCESSING_FAILED")
                                .put("message", "文書処理に失敗しました"));
                    }
                    
                    Thread.sleep(2000); // 2秒待機
                    
                } catch (Exception e) {
                    try {
                        return objectMapper.createObjectNode()
                            .put("success", false)
                            .set("error", objectMapper.createObjectNode()
                                .put("code", "WAIT_ERROR")
                                .put("message", e.getMessage()));
                    } catch (Exception ex) {
                        throw new RuntimeException(ex);
                    }
                }
            }
            
            try {
                return objectMapper.createObjectNode()
                    .put("success", false)
                    .set("error", objectMapper.createObjectNode()
                        .put("code", "TIMEOUT")
                        .put("message", "処理がタイムアウトしました"));
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        });
    }
    
    private void addFormField(PrintWriter writer, String boundary, String name, String value) {
        writer.append("--").append(boundary).append("\r\n");
        writer.append("Content-Disposition: form-data; name=\"").append(name).append("\"\r\n\r\n");
        writer.append(value).append("\r\n");
    }
    
    private String getMimeType(Path filePath) {
        String fileName = filePath.getFileName().toString().toLowerCase();
        
        if (fileName.endsWith(".pdf")) return "application/pdf";
        if (fileName.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        if (fileName.endsWith(".xlsx")) return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        if (fileName.endsWith(".pptx")) return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
        if (fileName.endsWith(".png")) return "image/png";
        if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) return "image/jpeg";
        if (fileName.endsWith(".html")) return "text/html";
        if (fileName.endsWith(".csv")) return "text/csv";
        if (fileName.endsWith(".txt")) return "text/plain";
        
        return "application/octet-stream";
    }
}

// 使用例
public class MarkitdownExample {
    public static void main(String[] args) {
        MarkitdownClient client = new MarkitdownClient(
            "https://your-domain.com/api", 
            "your-token"
        );
        
        Path filePath = Path.of("document.pdf");
        
        client.uploadDocument(
            filePath,
            "markitdown-first",
            "java-test",
            true,
            85
        ).thenCompose(result -> {
            if (result.get("success").asBoolean()) {
                String fileId = result.get("data").get("fileId").asText();
                System.out.println("アップロード成功: " + fileId);
                
                return client.waitForCompletion(fileId, 300);
            } else {
                System.out.println("アップロード失敗: " + 
                    result.get("error").get("message").asText());
                return CompletableFuture.completedFuture(result);
            }
        }).thenAccept(finalResult -> {
            if (finalResult.get("success").asBoolean()) {
                System.out.println("処理完了!");
                System.out.println("処理時間: " + 
                    finalResult.get("data").get("processingTime").asDouble() + "ms");
                System.out.println("品質スコア: " + 
                    finalResult.get("data").get("qualityScore").asDouble());
            } else {
                System.out.println("処理失敗: " + 
                    finalResult.get("error").get("message").asText());
            }
        }).join();
    }
}
```

## 🔧 設定管理の例

### 動的設定更新

```typescript
// 設定管理クラス
class MarkitdownConfigManager {
  private client: MarkitdownClient;
  private adminApiKey: string;

  constructor(client: MarkitdownClient, adminApiKey: string) {
    this.client = client;
    this.adminApiKey = adminApiKey;
  }

  async updateConfig(updates: Record<string, any>): Promise<any> {
    const response = await axios.put(
      `${this.client.baseUrl}/markitdown/config`,
      updates,
      {
        headers: {
          'X-API-Key': this.adminApiKey,
          'Content-Type': 'application/json'
        }
      }
    );

    return response.data;
  }

  async reloadConfig(): Promise<any> {
    const response = await axios.post(
      `${this.client.baseUrl}/markitdown/config/reload`,
      {},
      {
        headers: {
          'X-API-Key': this.adminApiKey
        }
      }
    );

    return response.data;
  }

  async enableFormat(format: string): Promise<any> {
    return this.updateConfig({
      [`supportedFormats.${format}.enabled`]: true
    });
  }

  async disableFormat(format: string): Promise<any> {
    return this.updateConfig({
      [`supportedFormats.${format}.enabled`]: false
    });
  }

  async updatePerformanceSettings(settings: {
    maxConcurrentProcesses?: number;
    parallelProcessing?: boolean;
    maxFileSizeBytes?: number;
  }): Promise<any> {
    const updates: Record<string, any> = {};
    
    if (settings.maxConcurrentProcesses !== undefined) {
      updates['performance.maxConcurrentProcesses'] = settings.maxConcurrentProcesses;
    }
    
    if (settings.parallelProcessing !== undefined) {
      updates['performance.parallelProcessing'] = settings.parallelProcessing;
    }
    
    if (settings.maxFileSizeBytes !== undefined) {
      updates['performance.maxFileSizeBytes'] = settings.maxFileSizeBytes;
    }

    return this.updateConfig(updates);
  }
}

// 使用例
const configManager = new MarkitdownConfigManager(client, 'admin-api-key');

// PDF処理を無効化
await configManager.disableFormat('pdf');

// パフォーマンス設定更新
await configManager.updatePerformanceSettings({
  maxConcurrentProcesses: 5,
  parallelProcessing: true
});

// 設定リロード
await configManager.reloadConfig();
```

## 📊 監視・統計の例

### 統計ダッシュボード

```typescript
class MarkitdownDashboard {
  private client: MarkitdownClient;

  constructor(client: MarkitdownClient) {
    this.client = client;
  }

  async getSystemHealth(): Promise<any> {
    const response = await axios.get(
      `${this.client.baseUrl}/markitdown/health`
    );
    return response.data;
  }

  async getStats(period: string = '24h'): Promise<any> {
    const response = await axios.get(
      `${this.client.baseUrl}/markitdown/stats`,
      {
        params: { period },
        headers: {
          'Authorization': `Bearer ${this.client.token}`
        }
      }
    );
    return response.data;
  }

  async getMetrics(startTime: string, endTime: string): Promise<any> {
    const response = await axios.get(
      `${this.client.baseUrl}/markitdown/metrics`,
      {
        params: { start: startTime, end: endTime },
        headers: {
          'Authorization': `Bearer ${this.client.token}`
        }
      }
    );
    return response.data;
  }

  async generateReport(): Promise<string> {
    const [health, stats, metrics] = await Promise.all([
      this.getSystemHealth(),
      this.getStats('24h'),
      this.getMetrics(
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        new Date().toISOString()
      )
    ]);

    return `
# Markitdown統合機能 日次レポート

## システム健全性
- 状態: ${health.data.status}
- アクティブプロセス: ${health.data.metrics.activeProcesses}
- キューイング中: ${health.data.metrics.queuedJobs}
- メモリ使用率: ${health.data.metrics.memoryUsage}%
- CPU使用率: ${health.data.metrics.cpuUsage}%

## 処理統計（24時間）
- 総処理数: ${stats.data.totalProcessed}
- 成功率: ${stats.data.successRate}%
- 平均処理時間: ${stats.data.averageProcessingTime}ms

## ファイル形式別統計
${Object.entries(stats.data.byFormat).map(([format, data]: [string, any]) => `
- ${format.toUpperCase()}:
  - 処理数: ${data.count}
  - 成功率: ${data.successRate}%
  - 平均時間: ${data.averageTime}ms
  - 平均品質: ${data.averageQuality}
`).join('')}

## パフォーマンスメトリクス
- 平均処理時間: ${metrics.data.metrics.processingTime.average}ms
- 95パーセンタイル: ${metrics.data.metrics.processingTime.p95}ms
- スループット: ${metrics.data.metrics.throughput.requestsPerSecond} req/s
- 平均品質スコア: ${metrics.data.metrics.qualityScores.average}

生成日時: ${new Date().toISOString()}
    `.trim();
  }
}

// 使用例
const dashboard = new MarkitdownDashboard(client);

// 日次レポート生成
const report = await dashboard.generateReport();
console.log(report);

// 定期的な健全性チェック
setInterval(async () => {
  const health = await dashboard.getSystemHealth();
  
  if (health.data.status !== 'healthy') {
    console.warn('⚠️ システム健全性に問題があります:', health.data);
    // アラート送信など
  }
}, 60000); // 1分間隔
```

## 🚨 エラーハンドリングの例

### 包括的エラーハンドリング

```typescript
class MarkitdownErrorHandler {
  static handleError(error: any): {
    shouldRetry: boolean;
    retryDelay: number;
    userMessage: string;
    logMessage: string;
  } {
    const errorCode = error?.error?.code || 'UNKNOWN_ERROR';
    
    switch (errorCode) {
      case 'RATE_LIMIT_EXCEEDED':
        return {
          shouldRetry: true,
          retryDelay: 60000, // 1分後にリトライ
          userMessage: 'リクエスト制限に達しました。しばらく待ってから再試行してください。',
          logMessage: `Rate limit exceeded: ${JSON.stringify(error)}`
        };
      
      case 'FILE_TOO_LARGE':
        return {
          shouldRetry: false,
          retryDelay: 0,
          userMessage: 'ファイルサイズが制限を超えています。より小さなファイルを選択してください。',
          logMessage: `File too large: ${JSON.stringify(error)}`
        };
      
      case 'UNSUPPORTED_FORMAT':
        return {
          shouldRetry: false,
          retryDelay: 0,
          userMessage: 'サポートされていないファイル形式です。対応形式を確認してください。',
          logMessage: `Unsupported format: ${JSON.stringify(error)}`
        };
      
      case 'PROCESSING_FAILED':
        return {
          shouldRetry: true,
          retryDelay: 5000, // 5秒後にリトライ
          userMessage: '文書処理に失敗しました。再試行しています...',
          logMessage: `Processing failed: ${JSON.stringify(error)}`
        };
      
      case 'TIMEOUT_ERROR':
        return {
          shouldRetry: true,
          retryDelay: 10000, // 10秒後にリトライ
          userMessage: '処理がタイムアウトしました。再試行しています...',
          logMessage: `Timeout error: ${JSON.stringify(error)}`
        };
      
      default:
        return {
          shouldRetry: true,
          retryDelay: 5000,
          userMessage: '予期しないエラーが発生しました。再試行しています...',
          logMessage: `Unknown error: ${JSON.stringify(error)}`
        };
    }
  }
}

// リトライ機能付きクライアント
class ResilientMarkitdownClient extends MarkitdownClient {
  async uploadDocumentWithRetry(
    file: File,
    options: any,
    maxRetries: number = 3
  ): Promise<MarkitdownResponse> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.uploadDocument(file, options);
        
        if (result.success) {
          return result;
        }
        
        const errorInfo = MarkitdownErrorHandler.handleError(result);
        lastError = result;
        
        console.log(errorInfo.logMessage);
        
        if (!errorInfo.shouldRetry || attempt === maxRetries) {
          return {
            success: false,
            error: {
              code: result.error?.code || 'MAX_RETRIES_EXCEEDED',
              message: errorInfo.userMessage
            }
          };
        }
        
        // リトライ前の待機
        await new Promise(resolve => setTimeout(resolve, errorInfo.retryDelay));
        
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          return {
            success: false,
            error: {
              code: 'NETWORK_ERROR',
              message: 'ネットワークエラーが発生しました。'
            }
          };
        }
        
        // ネットワークエラーの場合は指数バックオフ
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 30000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    return {
      success: false,
      error: {
        code: 'MAX_RETRIES_EXCEEDED',
        message: '最大リトライ回数に達しました。'
      }
    };
  }
}

// 使用例
const resilientClient = new ResilientMarkitdownClient(
  'https://your-domain.com/api',
  'your-token'
);

const result = await resilientClient.uploadDocumentWithRetry(
  file,
  {
    processingStrategy: 'markitdown-first',
    projectId: 'resilient-test'
  },
  3 // 最大3回リトライ
);

if (result.success) {
  console.log('処理成功:', result.data);
} else {
  console.error('処理失敗:', result.error?.message);
}
```

---

**最終更新**: 2025/01/15  
**対象**: Markitdown統合機能 v1.0  
**言語**: TypeScript, Python, Java  
**メンテナンス**: 開発チーム