'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useChatStore, ChatMessage, ChatSession } from '../../store/useChatStore';
import { ModelSelector } from '../../components/bedrock/ModelSelector';
import { RegionSelector } from '../../components/bedrock/RegionSelector';
import { DEFAULT_MODEL_ID, getModelById } from '../../config/bedrock-models';

// Markdownライクなテキストをレンダリングするコンポーネント
function MessageContent({ text }: { text: string }) {
  // **text** を <strong>text</strong> に変換
  const formatText = (text: string) => {
    return text
      .split(/(\*\*[^*]+\*\*)/g)
      .map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          const content = part.slice(2, -2);
          return <strong key={index} className="font-semibold text-gray-900">{content}</strong>;
        }
        return part;
      });
  };

  return (
    <div className="space-y-1">
      {text.split('\n').map((line, lineIndex) => {
        const trimmedLine = line.trim();

        if (trimmedLine === '') {
          return <div key={lineIndex} className="h-2" />;
        }

        // リスト項目の処理
        if (trimmedLine.startsWith('• ')) {
          return (
            <div key={lineIndex} className="flex items-start space-x-2 ml-2">
              <span className="text-blue-600 font-bold mt-0.5">•</span>
              <span className="flex-1">{formatText(trimmedLine.slice(2))}</span>
            </div>
          );
        }

        // セクションヘッダー（**で囲まれた行）の処理
        if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**') && trimmedLine.length > 4) {
          const content = trimmedLine.slice(2, -2);
          return (
            <div key={lineIndex} className="font-semibold text-gray-900 mt-3 mb-1">
              {content}
            </div>
          );
        }

        return (
          <div key={lineIndex}>
            {formatText(trimmedLine)}
          </div>
        );
      })}
    </div>
  );
}

export default function ChatbotPage() {
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedModelId, setSelectedModelId] = useState(DEFAULT_MODEL_ID);
  const [selectedModelName, setSelectedModelName] = useState('Amazon Nova Pro');
  const [userDirectories, setUserDirectories] = useState<any>(null);
  const [isLoadingDirectories, setIsLoadingDirectories] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // チャットストアの使用
  const {
    currentSession,
    setCurrentSession,
    addMessage,
    saveHistory,
    saveChatHistory,
    loadChatHistory,
    chatSessions,
    addChatSession
  } = useChatStore();

  useEffect(() => {
    // クライアントサイドでのみ実行
    setIsClient(true);
    
    if (typeof window === 'undefined') return;
    
    // 認証チェック
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/signin');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);

    // FSxディレクトリ情報の取得
    const fetchUserDirectories = async () => {
      setIsLoadingDirectories(true);
      try {
        const response = await fetch(`/api/fsx/directories?username=${parsedUser.username}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setUserDirectories(data.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user directories:', error);
      } finally {
        setIsLoadingDirectories(false);
      }
    };

    fetchUserDirectories();

    // チャット履歴の読み込み（設定が有効な場合のみ）
    if (saveHistory) {
      loadChatHistory(parsedUser.username);
    }

      // 新しいセッションの作成（既存セッションがない場合）
      if (!currentSession) {
        const newSession: ChatSession = {
          id: `session_${Date.now()}`,
          title: `チャット - ${new Date().toLocaleDateString('ja-JP')}`,
          messages: [{
            id: '1',
            text: `こんにちは、${parsedUser.username}さん！

**Permission-aware RAG Chatbot**へようこそ🎉

**あなたのアクセス権限:**
• **ユーザー**: ${parsedUser.username}
• **ロール**: ${parsedUser.role || 'User'}
• **アクセス可能ディレクトリ**: 取得中...

*FSx for ONTAPから実際のディレクトリ権限を確認しています*

**利用可能な機能:**
• 📄 文書検索・質問応答
• 🔐 権限ベースアクセス制御

**現在のAIモデル:**
• **${getModelById(DEFAULT_MODEL_ID)?.name || 'Amazon Nova Pro'}** - Amazon提供モデル

**チャット履歴設定:**
${saveHistory ? '✅ 履歴保存が有効です。会話は自動保存されます。' : '❌ 履歴保存が無効です。セッション終了時に削除されます。'}

**質問例:**
• "アクセス可能な文書を検索してください"
• "過去の資料を参考にXXXのパワーポイントを作成してください。元ファイルのパスも教えてください"

何でもお気軽にご質問ください！`,
            sender: 'bot',
            timestamp: new Date()
          }],
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: parsedUser.username
        };

        setCurrentSession(newSession);
      }
    } catch (error) {
      console.error('Failed to parse user data:', error);
      router.push('/signin');
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages]);

  // モデル選択時にヘッダー表示を更新するためのuseEffect
  useEffect(() => {
    // モデル変更時の処理（必要に応じて追加の処理を行う）
    console.log('Selected model changed to:', selectedModelId);
    
    // モデル情報を動的に取得してキャッシュを更新
    const updateModelInfo = async () => {
      try {
        const response = await fetch('/api/bedrock/region-info');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            // 利用可能なモデルと利用不可能なモデルを統合
            const allModels = [
              ...(data.data.availableModels || []),
              ...(data.data.unavailableModels || [])
            ];
            
            console.log('All models from API:', allModels.length);
            console.log('Available models:', data.data.availableModels?.length || 0);
            console.log('Unavailable models:', data.data.unavailableModels?.length || 0);
            console.log('Looking for model:', selectedModelId);
            
            // 選択されたモデルの情報をログ出力
            const selectedModel = allModels.find(m => m.modelId === selectedModelId);
            if (selectedModel) {
              console.log('Found selected model info:', selectedModel);
              setSelectedModelName(selectedModel.modelName);
            } else {
              console.log('Model not found in API, using fallback');
              // フォールバック: getModelByIdを使用
              const fallbackModel = getModelById(selectedModelId);
              if (fallbackModel) {
                console.log('Using fallback model:', fallbackModel);
                setSelectedModelName(fallbackModel.name);
              } else {
                console.log('No fallback model found, using model ID as name');
                setSelectedModelName(selectedModelId);
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to update model info:', error);
      }
    };
    
    updateModelInfo();
  }, [selectedModelId]);

  // ディレクトリ情報が取得されたら初期メッセージを更新
  useEffect(() => {
    if (userDirectories && currentSession && user && currentSession.messages.length > 0) {
      // 初期メッセージのみを更新（無限ループを防ぐ）
      const firstMessage = currentSession.messages[0];
      if (firstMessage && firstMessage.id === '1' && firstMessage.sender === 'bot' && !firstMessage.text.includes('FSx for ONTAP実環境')) {
        // ディレクトリ情報の表示形式を決定
        let directoryDisplay = '';
        let directoryNote = '';
        
        switch (userDirectories.directoryType) {
          case 'actual':
            directoryDisplay = userDirectories.accessibleDirectories.join(', ');
            directoryNote = `✅ **FSx for ONTAP実環境**: ${userDirectories.fsxFileSystemId}から取得`;
            break;
          case 'test':
            directoryDisplay = userDirectories.accessibleDirectories.join(', ');
            directoryNote = `🧪 **テストユーザー**: シミュレートされた権限`;
            break;
          case 'simulated':
            directoryDisplay = userDirectories.accessibleDirectories.join(', ');
            directoryNote = `⚠️ **シミュレーション**: FSxは利用可能ですが権限情報を取得できませんでした`;
            break;
          case 'unavailable':
            directoryDisplay = userDirectories.accessibleDirectories.join(', ');
            directoryNote = `❌ **FSx利用不可**: フォールバックディレクトリを表示`;
            break;
          default:
            directoryDisplay = '/shared, /public, /user/' + user.username;
            directoryNote = `❓ **不明**: デフォルトディレクトリを表示`;
        }

        const updatedText = `こんにちは、${user.username}さん！

**Permission-aware RAG Chatbot**へようこそ🎉

**あなたのアクセス権限:**
• **ユーザー**: ${user.username}
• **ロール**: ${user.role || 'User'}
• **アクセス可能ディレクトリ**: ${directoryDisplay}

${directoryNote}

**権限詳細:**
• **読み取り**: ${userDirectories.permissions.read ? '✅ 可能' : '❌ 不可'}
• **書き込み**: ${userDirectories.permissions.write ? '✅ 可能' : '❌ 不可'}
• **実行**: ${userDirectories.permissions.execute ? '✅ 可能' : '❌ 不可'}

**利用可能な機能:**
• � 文書検索ス・質問応答
• 🔐 権限ベースアクセス制御

**現在のAIモデル:**
• **${getModelById(DEFAULT_MODEL_ID)?.name || 'Amazon Nova Pro'}** - Amazon提供モデル

**チャット履歴設定:**
${saveHistory ? '✅ 履歴保存が有効です。会話は自動保存されます。' : '❌ 履歴保存が無効です。セッション終了時に削除されます。'}

**質問例:**
• "アクセス可能な文書を検索してください"
• "過去の資料を参考にXXXのパワーポイントを作成してください。元ファイルのパスも教えてください"

何でもお気軽にご質問ください！`;

        const updatedMessages = [...currentSession.messages];
        updatedMessages[0] = { ...firstMessage, text: updatedText };
        setCurrentSession({ ...currentSession, messages: updatedMessages });
      }
    }
  }, [userDirectories]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateRAGResponse = async (query: string): Promise<string> => {
    try {
      console.log('Sending request to Bedrock API:', { query: query.substring(0, 100), user: user.username, modelId: selectedModelId });
      
      // 実際のBedrock API呼び出し
      const response = await fetch('/api/bedrock/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query,
          userId: user.username,
          permissions: user.permissions || ['基本機能'],
          modelId: selectedModelId
        }),
      });

      console.log('Bedrock API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Bedrock API error response:', errorText);
        throw new Error(`API Error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Bedrock API response data:', { success: data.success, answerLength: data.answer?.length });

      if (data.success) {
        return data.answer;
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Bedrock API Error:', error);

      // エラーの詳細をログ出力
      if (error instanceof Error) {
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
      }

      // 実際のエラーメッセージを返す（デバッグ用）
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      return `**Bedrock API エラーが発生しました**

**エラー詳細:**
• エラーメッセージ: ${errorMessage}
• 使用モデル: ${getModelById(selectedModelId)?.name || 'Unknown'} (${selectedModelId})
• ユーザー: ${user.username}
• 時刻: ${new Date().toLocaleString('ja-JP')}

**デバッグ情報:**
• API URL: /api/bedrock/chat
• リクエスト送信: 成功
• レスポンス受信: ${error instanceof Error && error.message.includes('API Error') ? 'エラー' : '不明'}

**対処方法:**
1. **ブラウザのコンソールログを確認してください**
2. **別のモデルを選択してみてください**
3. **問題が続く場合は、システム管理者にお問い合わせください**

このエラー情報をシステム管理者に報告してください。`;
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading || !currentSession) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date(),
      sessionId: currentSession.id
    };

    addMessage(userMessage);
    const currentInput = inputText;
    setInputText('');
    setIsLoading(true);

    try {
      // 実際のRAG処理（Bedrock API呼び出し）
      const responseText = await generateRAGResponse(currentInput);

      const botResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'bot',
        timestamp: new Date(),
        sessionId: currentSession.id
      };

      addMessage(botResponse);

      // 履歴保存が有効な場合のみ保存
      if (saveHistory) {
        await saveChatHistory();
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: '申し訳ございません。システムエラーが発生しました。\n\n**エラー詳細:**\n• システムへの接続タイムアウト\n• 再試行回数: 3回\n• エラーコード: RAG-500\n\nしばらくしてから再度お試しください。',
        sender: 'bot',
        timestamp: new Date(),
        sessionId: currentSession.id
      };
      addMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('user');
    router.push('/signin');
  };

  if (!isClient || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* サイドバー */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden bg-white border-r border-gray-200 flex-shrink-0`}>
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-gray-200 flex-shrink-0">
            <h2 className="text-lg font-semibold text-gray-900">設定パネル</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {/* 新しいチャット */}
            <div className="p-3 border-b border-gray-200">
              <button
                onClick={() => {
                  if (!user) return;
                  const newSession: ChatSession = {
                    id: `session_${Date.now()}`,
                    title: `新しいチャット - ${new Date().toLocaleDateString('ja-JP')}`,
                    messages: [],
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    userId: user.username
                  };
                  setCurrentSession(newSession);
                  if (saveHistory) {
                    addChatSession(newSession);
                  }
                }}
                className="w-full px-2 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700 transition-colors"
              >
                + 新しいチャット
              </button>
            </div>

            {/* チャット履歴セクション */}
            {saveHistory && chatSessions.length > 0 && (
              <div className="p-2 border-b border-gray-200">
                <h3 className="text-xs font-medium text-gray-700 mb-2">チャット履歴</h3>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {chatSessions.slice(0, 3).map((session: ChatSession) => (
                    <button
                      key={session.id}
                      onClick={() => setCurrentSession(session)}
                      className={`w-full text-left p-1 rounded-md text-xs transition-colors ${currentSession?.id === session.id
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                      <div className="font-medium truncate text-xs">{session.title}</div>
                      <div className="text-gray-500 text-xs">
                        {session.updatedAt.toLocaleDateString('ja-JP')}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ユーザー情報セクション */}
            <div className="p-2 border-b border-gray-200">
              <h3 className="text-xs font-medium text-gray-700 mb-1">ユーザー情報</h3>
              <div className="text-xs text-gray-600">
                {user.username} ({user.role || 'User'})
              </div>
            </div>

            {/* FSxディレクトリ情報セクション */}
            <div className="p-2 border-b border-gray-200">
              <h3 className="text-xs font-medium text-gray-700 mb-1">アクセス権限</h3>
              {isLoadingDirectories ? (
                <div className="flex items-center space-x-2 text-xs text-gray-600">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                  <span>権限確認中...</span>
                </div>
              ) : userDirectories ? (
                <div className="space-y-1">
                  <div className="text-xs">
                    <div className="flex items-center space-x-1">
                      {userDirectories.directoryType === 'actual' && <span className="text-green-600">✅</span>}
                      {userDirectories.directoryType === 'test' && <span className="text-blue-600">🧪</span>}
                      {userDirectories.directoryType === 'simulated' && <span className="text-yellow-600">⚠️</span>}
                      {userDirectories.directoryType === 'unavailable' && <span className="text-red-600">❌</span>}
                      <span className="font-medium text-gray-700">
                        {userDirectories.directoryType === 'actual' && 'FSx実環境'}
                        {userDirectories.directoryType === 'test' && 'テスト環境'}
                        {userDirectories.directoryType === 'simulated' && 'シミュレーション'}
                        {userDirectories.directoryType === 'unavailable' && 'FSx利用不可'}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">
                    <div>📁 {userDirectories.accessibleDirectories.length}個のディレクトリ</div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={userDirectories.permissions.read ? 'text-green-600' : 'text-red-600'}>
                        {userDirectories.permissions.read ? '✅' : '❌'} 読取
                      </span>
                      <span className={userDirectories.permissions.write ? 'text-green-600' : 'text-red-600'}>
                        {userDirectories.permissions.write ? '✅' : '❌'} 書込
                      </span>
                    </div>
                  </div>
                  {userDirectories.fsxFileSystemId && (
                    <div className="text-xs text-gray-500 mt-1">
                      FSx: {userDirectories.fsxFileSystemId.substring(0, 12)}...
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs text-gray-600">
                  権限情報を取得できませんでした
                </div>
              )}
            </div>

            {/* Bedrockリージョン選択セクション */}
            <div className="p-2 border-b border-gray-200">
              <RegionSelector />
            </div>

            {/* AIモデル選択セクション */}
            <div className="p-2 border-b border-gray-200">
              <ModelSelector
                selectedModelId={selectedModelId}
                onModelChange={setSelectedModelId}
                showAdvancedFilters={true}
              />
            </div>

            {/* 権限制御状態セクション */}
            <div className="p-2 border-b border-gray-200">
              <h3 className="text-xs font-medium text-gray-700 mb-1">権限制御状態</h3>
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-green-600">✅</span>
                  <span className="text-xs text-gray-600">基本機能利用可能</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-blue-600">🔐</span>
                  <span className="text-xs text-gray-600">高度権限制御適用中</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  制限されたモデルは管理者に申請可能
                </div>
              </div>
            </div>

            {/* システム情報セクション */}
            <div className="p-2 border-b border-gray-200">
              <h3 className="text-xs font-medium text-gray-700 mb-1">システム</h3>
              <div className="text-xs text-gray-600">
                <div>✅ HEALTHY</div>
                <div>🌍 {process.env.NEXT_PUBLIC_BEDROCK_REGION || 'ap-northeast-1'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* ヘッダー */}
        <header className="bg-white shadow-sm border-b flex-shrink-0">
          <div className="px-3 sm:px-4 lg:px-6">
            <div className="flex justify-between items-center h-14">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 mr-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <div className="flex items-center space-x-2">
                  <h1 className="text-lg font-semibold text-gray-900">RAG Chatbot</h1>
                  <div className="flex items-center space-x-2">
                    {saveHistory && (
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                        履歴保存中
                      </span>
                    )}
                    <span className="px-2 py-1 text-sm bg-blue-100 text-blue-900 rounded-full font-medium">
                      {selectedModelName}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">
                  ようこそ、{user?.username}さん
                </span>
                <button
                  onClick={handleSignOut}
                  className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                >
                  サインアウト
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* チャットエリア */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* メッセージリスト */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-4">
            {currentSession?.messages?.map((message: ChatMessage) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-sm md:max-w-md lg:max-w-lg xl:max-w-2xl px-4 py-3 rounded-lg ${message.sender === 'user'
                    ? 'bg-blue-600 text-white mr-2'
                    : 'bg-white text-gray-900 shadow-sm border ml-2'
                    }`}
                >
                  <div className="text-sm whitespace-pre-wrap leading-relaxed">
                    <MessageContent text={message.text} />
                  </div>
                  <p className={`text-xs mt-2 ${message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                    {message.timestamp.toLocaleTimeString('ja-JP')}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-900 shadow-sm border rounded-lg px-4 py-3 ml-2">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <div className="text-sm">
                      <div>🔍 文書を検索中...</div>
                      <div className="text-xs text-gray-500 mt-1">AIで回答を生成中...</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 入力エリア */}
          <div className="border-t bg-white p-4 flex-shrink-0">
            <form onSubmit={handleSendMessage} className="flex space-x-3 max-w-4xl mx-auto">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="メッセージを入力してください..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500 text-sm"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !inputText.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                送信
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
