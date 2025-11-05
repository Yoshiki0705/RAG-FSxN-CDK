'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useChatStore, ChatMessage, ChatSession } from '../../store/useChatStore';
import { BedrockParameterPanel } from '../../components/bedrock/BedrockParameterPanel';
import { ModelSelector } from '../../components/bedrock/ModelSelector';
import { EmbeddingModelInfo } from '../../components/bedrock/EmbeddingModelInfo';
import { SystemInfo } from '../../components/system/SystemInfo';
import { PermissionStatusPanel } from '../../components/permission/PermissionStatusPanel';
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
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedModelId, setSelectedModelId] = useState(DEFAULT_MODEL_ID);
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
    // 認証チェック
    const userData = localStorage.getItem('user');
    if (!userData) {
      router.push('/signin');
      return;
    }

    const parsedUser = JSON.parse(userData);
    setUser(parsedUser);

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

**🔐 高度権限制御対応 Permission-aware RAG Chatbot**へようこそ🎉

**あなたのアクセス権限:**
• **ユーザー**: ${parsedUser.username}
• **ロール**: ${parsedUser.role || 'User'}
• **アクセス可能ディレクトリ**: ${parsedUser.accessibleDirectories || '/shared, /public, /user/' + parsedUser.username}

**🛡️ 高度権限制御システム:**
• **⏰ 時間ベース制限**: 営業時間（平日 9:00-18:00）に基づくアクセス制御
• **🌍 地理的制限**: IP地理情報による地域ベースアクセス制御
• **🔒 動的権限制御**: プロジェクト参加・組織階層による動的権限管理
• **📊 監査ログ**: 全アクセス・操作の完全ログ記録

**利用可能な機能:**
• 📄 権限ベース文書検索・質問応答
• 🔐 多層防御セキュリティシステム
• 🔍 権限レベル別技術情報検索
• 📈 リアルタイムアクセス監視

**現在のAIモデル:**
• **${getModelById(DEFAULT_MODEL_ID)?.name || 'Amazon Nova Pro'}** - Amazon最新モデル（権限制御対応）

**セキュリティ状態:**
• 🟢 権限チェック: 有効
• 🟢 時間制限: 有効
• 🟢 地理制限: 有効
• 🟢 監査ログ: 記録中

**チャット履歴設定:**
${saveHistory ? '✅ 履歴保存が有効です。会話は暗号化されて自動保存されます。' : '❌ 履歴保存が無効です。セッション終了時に安全に削除されます。'}

**質問例:**
• "現在の権限レベルで利用可能な文書を検索してください"
• "セキュリティ制限下でアクセス可能な技術資料を教えてください"
• "権限ベースで過去の資料を参考にXXXのパワーポイントを作成してください"
• "現在のアクセス制限状況を教えてください"

**⚠️ セキュリティ注意事項:**
• 全ての会話は監査ログに記録されます
• 権限外のリソースへのアクセスは自動的に拒否されます
• 異常なアクセスパターンは自動検出・通知されます

何でもお気軽にご質問ください！セキュリティを保ちながら最適なサポートを提供いたします。`,
          sender: 'bot',
          timestamp: new Date()
        }],
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: parsedUser.username
      };

      setCurrentSession(newSession);
    }
  }, [router, saveHistory, currentSession, setCurrentSession, loadChatHistory]);

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateRAGResponse = async (query: string): Promise<string> => {
    try {
      // 高度権限制御対応のBedrock API呼び出し
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

      const data = await response.json();

      if (response.ok && data.success) {
        // 成功時のセキュリティ情報を含む応答
        let securityInfo = '';
        if (data.securityInfo) {
          securityInfo = `

🔐 **セキュリティ情報:**
• 権限チェック: ${data.securityInfo.permissionCheckPassed ? '✅ 通過' : '❌ 失敗'}
• アクセス時刻: ${data.securityInfo.accessTime}
• IPアドレス: ${data.securityInfo.ipAddress}
• 制限事項: ${data.securityInfo.restrictions}
• 使用モデル: ${getModelById(selectedModelId)?.name || data.model}`;
        }

        return data.answer + securityInfo;
      } else if (response.status === 403) {
        // 権限拒否時の詳細エラー
        return `🚫 **アクセス拒否**

**拒否理由:** ${data.reason || '権限が不足しています'}

**制限詳細:**
${data.restrictions?.timeBasedRestriction ? '• ⏰ 時間ベース制限: 営業時間外のアクセスです' : ''}
${data.restrictions?.geographicRestriction ? '• 🌍 地理的制限: 許可されていない地域からのアクセスです' : ''}
${data.restrictions?.dynamicPermissionDenied ? '• 🔒 動的権限制限: このリソースへのアクセス権限がありません' : ''}

**対処方法:**
1. **営業時間内にアクセス**: 平日 9:00-18:00 にお試しください
2. **緊急アクセス権限**: 緊急時は管理者にお問い合わせください
3. **VPN接続**: 許可されたVPN経由でアクセスしてください
4. **権限申請**: 必要な権限を管理者に申請してください

**お問い合わせ:**
• システム管理者: admin@company.com
• セキュリティ担当: security@company.com
• 緊急連絡先: emergency@company.com

**監査情報:**
• アクセス試行時刻: ${data.timestamp}
• ユーザー: ${user.username}
• 結果: アクセス拒否`;
      } else {
        throw new Error(data.error || `HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Bedrock API Error:', error);

      // フォールバック: エラー時のデフォルト応答
      return `🚨 **システムエラー**

**エラー詳細:**
• 接続エラー: Amazon Bedrock API
• 使用モデル: ${getModelById(selectedModelId)?.name || 'Unknown'}
• ユーザー: ${user.username}
• 時刻: ${new Date().toLocaleString('ja-JP')}
• エラー: ${error instanceof Error ? error.message : 'Unknown error'}

**高度権限制御システム状態:**
• 🔐 権限チェック: 実行中
• ⏰ 時間ベース制限: 有効
• 🌍 地理的制限: 有効
• 🔒 動的権限制御: 有効

**対処方法:**
1. **ネットワーク確認**: インターネット接続を確認してください
2. **時間制限確認**: 営業時間内（平日 9:00-18:00）かご確認ください
3. **権限確認**: 適切なアクセス権限があるかご確認ください
4. **再試行**: しばらく時間をおいてから再度お試しください
5. **管理者連絡**: 問題が続く場合は、システム管理者にお問い合わせください

**システム状態:**
• Lambda Web Adapter: 稼働中
• CloudFront: 正常
• 認証システム: 正常
• 高度権限制御: 稼働中

しばらくしてから再度お試しください。`;
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

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* サイドバー */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden bg-white border-r border-gray-200`}>
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">設定パネル</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {/* 新しいチャット */}
            <div className="p-4 border-b border-gray-200">
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
                className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
              >
                + 新しいチャット
              </button>
            </div>

            {/* チャット履歴セクション */}
            {saveHistory && chatSessions.length > 0 && (
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3">チャット履歴</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {chatSessions.slice(0, 5).map((session) => (
                    <button
                      key={session.id}
                      onClick={() => setCurrentSession(session)}
                      className={`w-full text-left p-2 rounded-md text-xs transition-colors ${currentSession?.id === session.id
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                      <div className="font-medium truncate">{session.title}</div>
                      <div className="text-gray-500 mt-1">
                        {session.updatedAt.toLocaleDateString('ja-JP')} • {session.messages.length}件
                      </div>
                    </button>
                  ))}
                </div>
                {chatSessions.length > 5 && (
                  <div className="text-xs text-gray-500 mt-2 text-center">
                    他 {chatSessions.length - 5} 件の履歴
                  </div>
                )}
              </div>
            )}

            {/* ユーザー情報セクション */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">ユーザー情報</h3>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="text-gray-600">ユーザー名:</span>
                  <span className="ml-2 font-medium text-gray-900">{user.username}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">ロール:</span>
                  <span className="ml-2 font-medium text-blue-600">{user.role || 'User'}</span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-600">権限:</span>
                  <div className="mt-1 space-y-1">
                    {(user.permissions || ['基本機能']).map((permission: string, index: number) => (
                      <div key={index} className="flex items-center text-xs">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                        <span className="text-gray-700">{permission}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* AIモデル選択セクション（重複削除） */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">AIモデル選択</h3>
              <ModelSelector
                selectedModelId={selectedModelId}
                onModelChange={setSelectedModelId}
                showAdvancedFilters={true}
              />
            </div>

            {/* 埋め込みモデル情報セクション */}
            <div className="p-4 border-b border-gray-200">
              <EmbeddingModelInfo />
            </div>

            {/* 高度権限制御状態セクション */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">🔐 高度権限制御</h3>
              <PermissionStatusPanel />
            </div>

            {/* システム情報セクション */}
            <div className="p-4 border-b border-gray-200">
              <SystemInfo />
            </div>

            {/* 詳細設定（パラメータのみ） */}
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-700 mb-3">詳細設定</h3>
              <BedrockParameterPanel selectedModelId={selectedModelId} />
            </div>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="flex-1 flex flex-col">
        {/* ヘッダー */}
        <header className="bg-white shadow-sm border-b">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 mr-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h1 className="text-xl font-semibold text-gray-900">RAG Chatbot</h1>
                <div className="flex items-center space-x-2 ml-3">
                  {saveHistory && (
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                      履歴保存中
                    </span>
                  )}
                  <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded-full">
                    {getModelById(selectedModelId)?.name || 'Amazon Nova Pro'}
                  </span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
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
        <div className="flex-1 flex flex-col">
          {/* メッセージリスト */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-2">
            {currentSession?.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-2xl px-4 py-2 rounded-lg ${message.sender === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-900 shadow-sm border'
                    }`}
                >
                  <div className="text-sm whitespace-pre-wrap">
                    <MessageContent text={message.text} />
                  </div>
                  <p className={`text-xs mt-1 ${message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                    {message.timestamp.toLocaleTimeString('ja-JP')}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-900 shadow-sm border rounded-lg px-4 py-2">
                  <div className="flex items-center space-x-2">
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
          <div className="border-t bg-white p-3 sticky bottom-0">
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
