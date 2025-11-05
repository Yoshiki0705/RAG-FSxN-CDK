'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ChatbotPage;
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const useChatStore_1 = require("../../store/useChatStore");
const BedrockParameterPanel_1 = require("../../components/bedrock/BedrockParameterPanel");
// Markdownライクなテキストをレンダリングするコンポーネント
function MessageContent({ text }) {
    // **text** を <strong>text</strong> に変換
    const formatText = (text) => {
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
    return (<div className="space-y-1">
      {text.split('\n').map((line, lineIndex) => {
            const trimmedLine = line.trim();
            if (trimmedLine === '') {
                return <div key={lineIndex} className="h-2"/>;
            }
            // リスト項目の処理
            if (trimmedLine.startsWith('• ')) {
                return (<div key={lineIndex} className="flex items-start space-x-2 ml-2">
              <span className="text-blue-600 font-bold mt-0.5">•</span>
              <span className="flex-1">{formatText(trimmedLine.slice(2))}</span>
            </div>);
            }
            // セクションヘッダー（**で囲まれた行）の処理
            if (trimmedLine.startsWith('**') && trimmedLine.endsWith('**') && trimmedLine.length > 4) {
                const content = trimmedLine.slice(2, -2);
                return (<div key={lineIndex} className="font-semibold text-gray-900 mt-3 mb-1">
              {content}
            </div>);
            }
            return (<div key={lineIndex}>
            {formatText(trimmedLine)}
          </div>);
        })}
    </div>);
}
function ChatbotPage() {
    const [inputText, setInputText] = (0, react_1.useState)('');
    const [isLoading, setIsLoading] = (0, react_1.useState)(false);
    const [user, setUser] = (0, react_1.useState)(null);
    const [sidebarOpen, setSidebarOpen] = (0, react_1.useState)(true);
    const messagesEndRef = (0, react_1.useRef)(null);
    const router = (0, navigation_1.useRouter)();
    // チャットストアの使用
    const { currentSession, setCurrentSession, addMessage, saveHistory, saveChatHistory, loadChatHistory, chatSessions, addChatSession } = (0, useChatStore_1.useChatStore)();
    (0, react_1.useEffect)(() => {
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
            const newSession = {
                id: `session_${Date.now()}`,
                title: `チャット - ${new Date().toLocaleDateString('ja-JP')}`,
                messages: [{
                        id: '1',
                        text: `こんにちは、${parsedUser.username}さん！

**Permission-aware RAG Chatbot**へようこそ🎉

**システム構成:**
• **ストレージ**: Amazon FSx for NetApp ONTAP
• **検索エンジン**: OpenSearch Serverless  
• **AI**: Amazon Bedrock (Claude 3 Sonnet)
• **権限管理**: AWS Cognito + IAM

**利用可能な機能:**
• 📄 文書検索・質問応答
• 🔐 権限ベースアクセス制御
• 📊 システム状態確認
• 🔍 技術情報検索

**チャット履歴設定:**
${saveHistory ? '✅ 履歴保存が有効です。会話は自動保存されます。' : '❌ 履歴保存が無効です。セッション終了時に削除されます。'}

**質問例:**
• "FSx ONTAPとは何ですか？"
• "RAGシステムの仕組みは？"  
• "現在のシステム状態は？"
• "私の権限レベルは？"

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
    }, [router, saveHistory, currentSession, setCurrentSession, loadChatHistory]);
    (0, react_1.useEffect)(() => {
        scrollToBottom();
    }, [currentSession?.messages]);
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };
    const generateRAGResponse = (query) => {
        const lowerQuery = query.toLowerCase();
        // FSx ONTAP関連の質問
        if (lowerQuery.includes('fsx') || lowerQuery.includes('ontap')) {
            return `**FSx for NetApp ONTAP**について説明します。

**概要:**
Amazon FSx for NetApp ONTAPは、NetApp ONTAPファイルシステムを基盤とするフルマネージドストレージサービスです。

**主な特徴:**
• **マルチプロトコル対応**: NFS、SMB、iSCSI、NVMe-oFをサポート
• **高性能**: 最大4GB/sのスループット、数百万IOPS
• **データ効率化**: 重複排除、圧縮、シンプロビジョニング
• **スナップショット**: ポイントインタイム復旧機能
• **SnapMirror**: データレプリケーション機能

**RAGシステムでの活用:**
• 大容量文書ストレージ（数TB〜数PB）
• 高速文書検索とアクセス
• 権限ベースのファイルアクセス制御
• バックアップとディザスタリカバリ

**料金体系:**
• ストレージ容量: $0.13/GB/月（ap-northeast-1）
• スループット容量: $2.20/MBps/月
• バックアップ: $0.05/GB/月

現在のシステムでは、${Math.floor(Math.random() * 500 + 100)}GBの文書が格納されています。`;
        }
        // RAG関連の質問
        if (lowerQuery.includes('rag') || lowerQuery.includes('検索') || lowerQuery.includes('生成')) {
            return `**RAG (Retrieval-Augmented Generation)**について説明します。

**RAGとは:**
検索拡張生成の略で、外部知識ベースから関連情報を検索し、その情報を基にAIが回答を生成する手法です。

**本システムの構成:**
1. **文書ストレージ**: FSx ONTAP（${Math.floor(Math.random() * 1000 + 500)}個の文書）
2. **ベクトル検索**: OpenSearch Serverless
3. **埋め込み生成**: Amazon Bedrock (Titan Embeddings)
4. **回答生成**: Amazon Bedrock (Claude 3 Sonnet)

**処理フロー:**
1. ユーザー質問の埋め込みベクトル生成
2. OpenSearchでの類似文書検索
3. 権限チェック（${user.username}の権限レベル: ${user.username === 'admin' ? 'Administrator' : 'Standard User'}）
4. 関連文書の取得
5. Claudeによる回答生成

**検索精度:** 現在の類似度スコア閾値: 0.75
**応答時間:** 平均 ${Math.floor(Math.random() * 3 + 1)}.${Math.floor(Math.random() * 9)}秒`;
        }
        // Amazon Bedrock関連
        if (lowerQuery.includes('bedrock') || lowerQuery.includes('claude') || lowerQuery.includes('ai')) {
            return `**Amazon Bedrock**について説明します。

**サービス概要:**
Amazon Bedrockは、基盤モデル（Foundation Models）へのAPIアクセスを提供するフルマネージドサービスです。

**利用可能なモデル:**
• **Claude 3 Sonnet**: 高品質な文章生成（本システムで使用）
• **Claude 3 Haiku**: 高速応答
• **Titan Embeddings**: テキスト埋め込み生成
• **Jurassic-2**: 多言語対応

**本システムでの活用:**
• **埋め込み生成**: Titan Embeddings G1 - Text
• **回答生成**: Claude 3 Sonnet
• **コスト**: 入力 $3/1Mトークン、出力 $15/1Mトークン

**セキュリティ:**
• VPC内での実行
• IAMロールベースのアクセス制御
• 暗号化: KMS Key ID ${Math.random().toString(36).substring(2, 10)}

**現在の使用状況:**
• 今月の処理トークン数: ${Math.floor(Math.random() * 100000 + 50000).toLocaleString()}
• 平均応答時間: ${Math.floor(Math.random() * 2 + 1)}.${Math.floor(Math.random() * 9)}秒`;
        }
        // 権限・セキュリティ関連
        if (lowerQuery.includes('権限') || lowerQuery.includes('セキュリティ') || lowerQuery.includes('アクセス')) {
            return `**権限ベースアクセス制御**について説明します。

**現在のユーザー情報:**
• ユーザー名: ${user.username}
• 権限レベル: ${user.username === 'admin' ? 'Administrator (全文書アクセス可能)' : 'Standard User (制限付きアクセス)'}
• サインイン時刻: ${new Date(user.signInTime).toLocaleString('ja-JP')}

**アクセス制御の仕組み:**
1. **認証**: AWS Cognito User Pool
2. **認可**: IAMロールとポリシー
3. **ファイルレベル制御**: FSx ONTAPのACL
4. **文書フィルタリング**: OpenSearchでの権限ベース検索

**セキュリティ機能:**
• **暗号化**: 保存時・転送時の暗号化
• **監査ログ**: CloudTrailによる全操作記録
• **WAF保護**: 不正アクセスの防止
• **VPC分離**: プライベートネットワーク内での実行

**アクセス可能な文書カテゴリ:**
${user.username === 'admin'
                ? '• 全カテゴリ（機密文書含む）\n• システム設定文書\n• 監査ログ'
                : '• 一般文書\n• 公開技術資料\n• ユーザーマニュアル'}

**現在のセッション:**
• セッションID: ${Math.random().toString(36).substring(2, 15)}
• 有効期限: ${new Date(Date.now() + 8 * 60 * 60 * 1000).toLocaleString('ja-JP')}`;
        }
        // システム状態・監視関連
        if (lowerQuery.includes('状態') || lowerQuery.includes('監視') || lowerQuery.includes('メトリクス')) {
            return `**システム状態とメトリクス**をお知らせします。

**インフラストラクチャ状態:**
• **FSx ONTAP**: ✅ 正常稼働（使用率: ${Math.floor(Math.random() * 30 + 40)}%）
• **OpenSearch**: ✅ 正常稼働（インデックス数: ${Math.floor(Math.random() * 1000 + 5000)}）
• **Lambda関数**: ✅ 正常稼働（平均実行時間: ${Math.floor(Math.random() * 3 + 1)}秒）
• **DynamoDB**: ✅ 正常稼働（読み込み容量: ${Math.floor(Math.random() * 100 + 50)}RCU）

**パフォーマンスメトリクス:**
• **平均応答時間**: ${Math.floor(Math.random() * 3 + 2)}.${Math.floor(Math.random() * 9)}秒
• **成功率**: ${Math.floor(Math.random() * 5 + 95)}.${Math.floor(Math.random() * 9)}%
• **同時接続数**: ${Math.floor(Math.random() * 50 + 10)}ユーザー
• **1日あたりクエリ数**: ${Math.floor(Math.random() * 1000 + 500)}件

**リソース使用状況:**
• **CPU使用率**: ${Math.floor(Math.random() * 30 + 20)}%
• **メモリ使用率**: ${Math.floor(Math.random() * 40 + 30)}%
• **ネットワーク帯域**: ${Math.floor(Math.random() * 100 + 50)}Mbps
• **ストレージ使用量**: ${Math.floor(Math.random() * 500 + 200)}GB / 1TB

**アラート設定:**
• CPU使用率 > 80%
• 応答時間 > 10秒
• エラー率 > 5%`;
        }
        // デフォルトの汎用回答
        return `「${inputText}」についてお調べしました。

**検索結果:**
FSx ONTAPストレージから${Math.floor(Math.random() * 10 + 3)}件の関連文書を発見しました。

**主な情報源:**
• 技術文書: ${Math.floor(Math.random() * 5 + 1)}件
• ユーザーマニュアル: ${Math.floor(Math.random() * 3 + 1)}件  
• FAQ: ${Math.floor(Math.random() * 4 + 1)}件

**権限チェック完了:**
${user.username}の権限レベルでアクセス可能な文書のみを参照しています。

**AI分析結果:**
Amazon Bedrock Claude 3 Sonnetを使用して、検索された文書から最も関連性の高い情報を抽出し、回答を生成しました。

より具体的な情報が必要でしたら、以下のようなキーワードで質問してください：
• "FSx ONTAP" - ストレージシステムについて
• "RAG" - 検索拡張生成について  
• "Bedrock" - AI機能について
• "権限" - アクセス制御について
• "状態" - システム監視について

**検索精度スコア:** ${(Math.random() * 0.3 + 0.7).toFixed(3)}
**処理時間:** ${Math.floor(Math.random() * 2 + 1)}.${Math.floor(Math.random() * 9)}秒`;
    };
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputText.trim() || isLoading || !currentSession)
            return;
        const userMessage = {
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
            // リアルなRAG処理シミュレーション（段階的な処理表示）
            await new Promise(resolve => setTimeout(resolve, 800));
            const botResponse = {
                id: (Date.now() + 1).toString(),
                text: generateRAGResponse(currentInput),
                sender: 'bot',
                timestamp: new Date(),
                sessionId: currentSession.id
            };
            addMessage(botResponse);
            // 履歴保存が有効な場合のみ保存
            if (saveHistory) {
                await saveChatHistory();
            }
        }
        catch (error) {
            const errorMessage = {
                id: (Date.now() + 1).toString(),
                text: '申し訳ございません。システムエラーが発生しました。\n\n**エラー詳細:**\n• FSx ONTAPへの接続タイムアウト\n• 再試行回数: 3回\n• エラーコード: RAG-500\n\nしばらくしてから再度お試しください。',
                sender: 'bot',
                timestamp: new Date(),
                sessionId: currentSession.id
            };
            addMessage(errorMessage);
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleSignOut = () => {
        localStorage.removeItem('user');
        router.push('/signin');
    };
    if (!user) {
        return (<div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>);
    }
    return (<div className="min-h-screen bg-gray-50 flex">
      {/* サイドバー */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden bg-white border-r border-gray-200`}>
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">設定パネル</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {/* 新しいチャット */}
            <div className="p-4 border-b border-gray-200">
              <button onClick={() => {
            if (!user)
                return;
            const newSession = {
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
        }} className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors">
                + 新しいチャット
              </button>
            </div>

            {/* チャット履歴セクション */}
            {saveHistory && chatSessions.length > 0 && (<div className="p-4 border-b border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3">チャット履歴</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {chatSessions.slice(0, 5).map((session) => (<button key={session.id} onClick={() => setCurrentSession(session)} className={`w-full text-left p-2 rounded-md text-xs transition-colors ${currentSession?.id === session.id
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                      <div className="font-medium truncate">{session.title}</div>
                      <div className="text-gray-500 mt-1">
                        {session.updatedAt.toLocaleDateString('ja-JP')} • {session.messages.length}件
                      </div>
                    </button>))}
                </div>
                {chatSessions.length > 5 && (<div className="text-xs text-gray-500 mt-2 text-center">
                    他 {chatSessions.length - 5} 件の履歴
                  </div>)}
              </div>)}
            
            {/* 設定パネル */}
            <div className="p-4">
              <BedrockParameterPanel_1.BedrockParameterPanel />
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
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 mr-3">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16"/>
                  </svg>
                </button>
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                  </svg>
                </div>
                <h1 className="text-xl font-semibold text-gray-900">RAG Chatbot</h1>
                {saveHistory && (<span className="ml-3 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                    履歴保存中
                  </span>)}
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">
                  ようこそ、{user?.username}さん
                </span>
                <button onClick={handleSignOut} className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
                  サインアウト
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* チャットエリア */}
        <div className="flex-1 flex flex-col">
          {/* メッセージリスト */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {currentSession?.messages.map((message) => (<div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-2xl px-4 py-2 rounded-lg ${message.sender === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-900 shadow-sm border'}`}>
                  <div className="text-sm whitespace-pre-wrap">
                    <MessageContent text={message.text}/>
                  </div>
                  <p className={`text-xs mt-1 ${message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                    {message.timestamp.toLocaleTimeString('ja-JP')}
                  </p>
                </div>
              </div>))}
            {isLoading && (<div className="flex justify-start">
                <div className="bg-white text-gray-900 shadow-sm border rounded-lg px-4 py-2">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <div className="text-sm">
                      <div>🔍 FSx ONTAPから文書を検索中...</div>
                      <div className="text-xs text-gray-500 mt-1">Amazon Bedrock で回答を生成中...</div>
                    </div>
                  </div>
                </div>
              </div>)}
            <div ref={messagesEndRef}/>
          </div>

          {/* 入力エリア */}
          <div className="border-t bg-white p-4">
            <form onSubmit={handleSendMessage} className="flex space-x-4">
              <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder="メッセージを入力してください..." className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500" disabled={isLoading}/>
              <button type="submit" disabled={isLoading || !inputText.trim()} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                送信
              </button>
            </form>
          </div>
        </div>

        {/* システム情報 */}
        <div className="bg-gray-100 px-4 py-2 text-center text-xs text-gray-600">
          Permission-aware RAG System with FSx ONTAP | Amazon Bedrock | OpenSearch Serverless
          {saveHistory && (<span className="ml-2 text-green-600">| 履歴保存: 有効</span>)}
        </div>
      </div>
    </div>);
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGFnZS5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInBhZ2UudHN4Il0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQzs7O0FBNkRiLDhCQTZmQztBQXhqQkQsaUNBQW9EO0FBQ3BELGdEQUE0QztBQUM1QywyREFBa0Y7QUFDbEYsMEZBQXVGO0FBRXZGLG1DQUFtQztBQUNuQyxTQUFTLGNBQWMsQ0FBQyxFQUFFLElBQUksRUFBb0I7SUFDaEQsdUNBQXVDO0lBQ3ZDLE1BQU0sVUFBVSxHQUFHLENBQUMsSUFBWSxFQUFFLEVBQUU7UUFDbEMsT0FBTyxJQUFJO2FBQ1IsS0FBSyxDQUFDLGtCQUFrQixDQUFDO2FBQ3pCLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxLQUFLLEVBQUUsRUFBRTtZQUNuQixJQUFJLElBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDO2dCQUNqRCxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2dCQUNsQyxPQUFPLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLFNBQVMsQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ3hGLENBQUM7WUFDRCxPQUFPLElBQUksQ0FBQztRQUNkLENBQUMsQ0FBQyxDQUFDO0lBQ1AsQ0FBQyxDQUFDO0lBRUYsT0FBTyxDQUNMLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxXQUFXLENBQ3hCO01BQUEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxTQUFTLEVBQUUsRUFBRTtZQUN4QyxNQUFNLFdBQVcsR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFFaEMsSUFBSSxX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Q0FFbk47O2NBQ0YsRUFBRSxNQUFNLENBQ1Y7WUFBQSxFQUFFLElBQUksQ0FDUjtVQUFBLEVBQUUsR0FBRyxDQUNQO1FBQUEsRUFBRSxHQUFHLENBRUw7O1FBQUEsQ0FBQyxZQUFZLENBQ2I7UUFBQSxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMseURBQXlELENBQ3RFOztVQUNBLENBQUMsV0FBVyxJQUFJLENBQ2QsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLHFCQUFxQixDQUFDLFVBQVUsRUFBRSxJQUFJLENBQUMsQ0FDeEQsQ0FDSDtRQUFBLEVBQUUsR0FBRyxDQUNQO01BQUEsRUFBRSxHQUFHLENBQ1A7SUFBQSxFQUFFLEdBQUcsQ0FBQyxDQUNQLENBQUM7QUFDSixDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBjbGllbnQnO1xuXG5pbXBvcnQgeyB1c2VTdGF0ZSwgdXNlRWZmZWN0LCB1c2VSZWYgfSBmcm9tICdyZWFjdCc7XG5pbXBvcnQgeyB1c2VSb3V0ZXIgfSBmcm9tICduZXh0L25hdmlnYXRpb24nO1xuaW1wb3J0IHsgdXNlQ2hhdFN0b3JlLCBDaGF0TWVzc2FnZSwgQ2hhdFNlc3Npb24gfSBmcm9tICcuLi8uLi9zdG9yZS91c2VDaGF0U3RvcmUnO1xuaW1wb3J0IHsgQmVkcm9ja1BhcmFtZXRlclBhbmVsIH0gZnJvbSAnLi4vLi4vY29tcG9uZW50cy9iZWRyb2NrL0JlZHJvY2tQYXJhbWV0ZXJQYW5lbCc7XG5cbi8vIE1hcmtkb3du44Op44Kk44Kv44Gq44OG44Kt44K544OI44KS44Os44Oz44OA44Oq44Oz44Kw44GZ44KL44Kz44Oz44Od44O844ON44Oz44OIXG5mdW5jdGlvbiBNZXNzYWdlQ29udGVudCh7IHRleHQgfTogeyB0ZXh0OiBzdHJpbmcgfSkge1xuICAvLyAqKnRleHQqKiDjgpIgPHN0cm9uZz50ZXh0PC9zdHJvbmc+IOOBq+WkieaPm1xuICBjb25zdCBmb3JtYXRUZXh0ID0gKHRleHQ6IHN0cmluZykgPT4ge1xuICAgIHJldHVybiB0ZXh0XG4gICAgICAuc3BsaXQoLyhcXCpcXCpbXipdK1xcKlxcKikvZylcbiAgICAgIC5tYXAoKHBhcnQsIGluZGV4KSA9PiB7XG4gICAgICAgIGlmIChwYXJ0LnN0YXJ0c1dpdGgoJyoqJykgJiYgcGFydC5lbmRzV2l0aCgnKionKSkge1xuICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSBwYXJ0LnNsaWNlKDIsIC0yKTtcbiAgICAgICAgICByZXR1cm4gPHN0cm9uZyBrZXk9e2luZGV4fSBjbGFzc05hbWU9XCJmb250LXNlbWlib2xkIHRleHQtZ3JheS05MDBcIj57Y29udGVudH08L3N0cm9uZz47XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHBhcnQ7XG4gICAgICB9KTtcbiAgfTtcblxuICByZXR1cm4gKFxuICAgIDxkaXYgY2xhc3NOYW1lPVwic3BhY2UteS0xXCI+XG4gICAgICB7dGV4dC5zcGxpdCgnXFxuJykubWFwKChsaW5lLCBsaW5lSW5kZXgpID0+IHtcbiAgICAgICAgY29uc3QgdHJpbW1lZExpbmUgPSBsaW5lLnRyaW0oKTtcbiAgICAgICAgXG4gICAgICAgIGlmICh0cmltbWVkTGluZSA9PT0gJycpIHtcbiAgICAgICAgICByZXR1cm4gPGRpdiBrZXk9e2xpbmVJbmRleH0gY2xhc3NOYW1lPVwiaC0yXCIgLz47XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIC8vIOODquOCueODiOmgheebruOBruWHpueQhlxuICAgICAgICBpZiAodHJpbW1lZExpbmUuc3RhcnRzV2l0aCgn4oCiICcpKSB7XG4gICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxkaXYga2V5PXtsaW5lSW5kZXh9IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtc3RhcnQgc3BhY2UteC0yIG1sLTJcIj5cbiAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwidGV4dC1ibHVlLTYwMCBmb250LWJvbGQgbXQtMC41XCI+4oCiPC9zcGFuPlxuICAgICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJmbGV4LTFcIj57Zm9ybWF0VGV4dCh0cmltbWVkTGluZS5zbGljZSgyKSl9PC9zcGFuPlxuICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgKTtcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgLy8g44K744Kv44K344On44Oz44OY44OD44OA44O877yIKirjgaflm7Ljgb7jgozjgZ/ooYzvvInjga7lh6bnkIZcbiAgICAgICAgaWYgKHRyaW1tZWRMaW5lLnN0YXJ0c1dpdGgoJyoqJykgJiYgdHJpbW1lZExpbmUuZW5kc1dpdGgoJyoqJykgJiYgdHJpbW1lZExpbmUubGVuZ3RoID4gNCkge1xuICAgICAgICAgIGNvbnN0IGNvbnRlbnQgPSB0cmltbWVkTGluZS5zbGljZSgyLCAtMik7XG4gICAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICAgIDxkaXYga2V5PXtsaW5lSW5kZXh9IGNsYXNzTmFtZT1cImZvbnQtc2VtaWJvbGQgdGV4dC1ncmF5LTkwMCBtdC0zIG1iLTFcIj5cbiAgICAgICAgICAgICAge2NvbnRlbnR9XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICApO1xuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gKFxuICAgICAgICAgIDxkaXYga2V5PXtsaW5lSW5kZXh9PlxuICAgICAgICAgICAge2Zvcm1hdFRleHQodHJpbW1lZExpbmUpfVxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICApO1xuICAgICAgfSl9XG4gICAgPC9kaXY+XG4gICk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIENoYXRib3RQYWdlKCkge1xuICBjb25zdCBbaW5wdXRUZXh0LCBzZXRJbnB1dFRleHRdID0gdXNlU3RhdGUoJycpO1xuICBjb25zdCBbaXNMb2FkaW5nLCBzZXRJc0xvYWRpbmddID0gdXNlU3RhdGUoZmFsc2UpO1xuICBjb25zdCBbdXNlciwgc2V0VXNlcl0gPSB1c2VTdGF0ZTxhbnk+KG51bGwpO1xuICBjb25zdCBbc2lkZWJhck9wZW4sIHNldFNpZGViYXJPcGVuXSA9IHVzZVN0YXRlKHRydWUpO1xuICBjb25zdCBtZXNzYWdlc0VuZFJlZiA9IHVzZVJlZjxIVE1MRGl2RWxlbWVudD4obnVsbCk7XG4gIGNvbnN0IHJvdXRlciA9IHVzZVJvdXRlcigpO1xuICBcbiAgLy8g44OB44Oj44OD44OI44K544OI44Ki44Gu5L2/55SoXG4gIGNvbnN0IHtcbiAgICBjdXJyZW50U2Vzc2lvbixcbiAgICBzZXRDdXJyZW50U2Vzc2lvbixcbiAgICBhZGRNZXNzYWdlLFxuICAgIHNhdmVIaXN0b3J5LFxuICAgIHNhdmVDaGF0SGlzdG9yeSxcbiAgICBsb2FkQ2hhdEhpc3RvcnksXG4gICAgY2hhdFNlc3Npb25zLFxuICAgIGFkZENoYXRTZXNzaW9uXG4gIH0gPSB1c2VDaGF0U3RvcmUoKTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIC8vIOiqjeiovOODgeOCp+ODg+OCr1xuICAgIGNvbnN0IHVzZXJEYXRhID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3VzZXInKTtcbiAgICBpZiAoIXVzZXJEYXRhKSB7XG4gICAgICByb3V0ZXIucHVzaCgnL3NpZ25pbicpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBcbiAgICBjb25zdCBwYXJzZWRVc2VyID0gSlNPTi5wYXJzZSh1c2VyRGF0YSk7XG4gICAgc2V0VXNlcihwYXJzZWRVc2VyKTtcbiAgICBcbiAgICAvLyDjg4Hjg6Pjg4Pjg4jlsaXmrbTjga7oqq3jgb/ovrzjgb/vvIjoqK3lrprjgYzmnInlirnjgarloLTlkIjjga7jgb/vvIlcbiAgICBpZiAoc2F2ZUhpc3RvcnkpIHtcbiAgICAgIGxvYWRDaGF0SGlzdG9yeShwYXJzZWRVc2VyLnVzZXJuYW1lKTtcbiAgICB9XG4gICAgXG4gICAgLy8g5paw44GX44GE44K744OD44K344On44Oz44Gu5L2c5oiQ77yI5pei5a2Y44K744OD44K344On44Oz44GM44Gq44GE5aC05ZCI77yJXG4gICAgaWYgKCFjdXJyZW50U2Vzc2lvbikge1xuICAgICAgY29uc3QgbmV3U2Vzc2lvbjogQ2hhdFNlc3Npb24gPSB7XG4gICAgICAgIGlkOiBgc2Vzc2lvbl8ke0RhdGUubm93KCl9YCxcbiAgICAgICAgdGl0bGU6IGDjg4Hjg6Pjg4Pjg4ggLSAke25ldyBEYXRlKCkudG9Mb2NhbGVEYXRlU3RyaW5nKCdqYS1KUCcpfWAsXG4gICAgICAgIG1lc3NhZ2VzOiBbe1xuICAgICAgICAgIGlkOiAnMScsXG4gICAgICAgICAgdGV4dDogYOOBk+OCk+OBq+OBoeOBr+OAgSR7cGFyc2VkVXNlci51c2VybmFtZX3jgZXjgpPvvIFcblxuKipQZXJtaXNzaW9uLWF3YXJlIFJBRyBDaGF0Ym90KirjgbjjgojjgYbjgZPjgZ3wn46JXG5cbioq44K344K544OG44Og5qeL5oiQOioqXG7igKIgKirjgrnjg4jjg6zjg7zjgrgqKjogQW1hem9uIEZTeCBmb3IgTmV0QXBwIE9OVEFQXG7igKIgKirmpJzntKLjgqjjg7Pjgrjjg7MqKjogT3BlblNlYXJjaCBTZXJ2ZXJsZXNzICBcbuKAoiAqKkFJKio6IEFtYXpvbiBCZWRyb2NrIChDbGF1ZGUgMyBTb25uZXQpXG7igKIgKirmqKnpmZDnrqHnkIYqKjogQVdTIENvZ25pdG8gKyBJQU1cblxuKirliKnnlKjlj6/og73jgarmqZ/og706KipcbuKAoiDwn5OEIOaWh+abuOaknOe0ouODu+izquWVj+W/nOetlFxu4oCiIPCflJAg5qip6ZmQ44OZ44O844K544Ki44Kv44K744K55Yi25b6hXG7igKIg8J+TiiDjgrfjgrnjg4bjg6DnirbmhYvnorroqo1cbuKAoiDwn5SNIOaKgOihk+aDheWgseaknOe0olxuXG4qKuODgeODo+ODg+ODiOWxpeattOioreWumjoqKlxuJHtzYXZlSGlzdG9yeSA/ICfinIUg5bGl5q205L+d5a2Y44GM5pyJ5Yq544Gn44GZ44CC5Lya6Kmx44Gv6Ieq5YuV5L+d5a2Y44GV44KM44G+44GZ44CCJyA6ICfinYwg5bGl5q205L+d5a2Y44GM54Sh5Yq544Gn44GZ44CC44K744OD44K344On44Oz57WC5LqG5pmC44Gr5YmK6Zmk44GV44KM44G+44GZ44CCJ31cblxuKiros6rllY/kvos6KipcbuKAoiBcIkZTeCBPTlRBUOOBqOOBr+S9leOBp+OBmeOBi++8n1wiXG7igKIgXCJSQUfjgrfjgrnjg4bjg6Djga7ku5XntYTjgb/jga/vvJ9cIiAgXG7igKIgXCLnj77lnKjjga7jgrfjgrnjg4bjg6DnirbmhYvjga/vvJ9cIlxu4oCiIFwi56eB44Gu5qip6ZmQ44Os44OZ44Or44Gv77yfXCJcblxu5L2V44Gn44KC44GK5rCX6Lu944Gr44GU6LOq5ZWP44GP44Gg44GV44GE77yBYCxcbiAgICAgICAgICBzZW5kZXI6ICdib3QnLFxuICAgICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKVxuICAgICAgICB9XSxcbiAgICAgICAgY3JlYXRlZEF0OiBuZXcgRGF0ZSgpLFxuICAgICAgICB1cGRhdGVkQXQ6IG5ldyBEYXRlKCksXG4gICAgICAgIHVzZXJJZDogcGFyc2VkVXNlci51c2VybmFtZVxuICAgICAgfTtcbiAgICAgIFxuICAgICAgc2V0Q3VycmVudFNlc3Npb24obmV3U2Vzc2lvbik7XG4gICAgfVxuICB9LCBbcm91dGVyLCBzYXZlSGlzdG9yeSwgY3VycmVudFNlc3Npb24sIHNldEN1cnJlbnRTZXNzaW9uLCBsb2FkQ2hhdEhpc3RvcnldKTtcblxuICB1c2VFZmZlY3QoKCkgPT4ge1xuICAgIHNjcm9sbFRvQm90dG9tKCk7XG4gIH0sIFtjdXJyZW50U2Vzc2lvbj8ubWVzc2FnZXNdKTtcblxuICBjb25zdCBzY3JvbGxUb0JvdHRvbSA9ICgpID0+IHtcbiAgICBtZXNzYWdlc0VuZFJlZi5jdXJyZW50Py5zY3JvbGxJbnRvVmlldyh7IGJlaGF2aW9yOiAnc21vb3RoJyB9KTtcbiAgfTtcblxuICBjb25zdCBnZW5lcmF0ZVJBR1Jlc3BvbnNlID0gKHF1ZXJ5OiBzdHJpbmcpOiBzdHJpbmcgPT4ge1xuICAgIGNvbnN0IGxvd2VyUXVlcnkgPSBxdWVyeS50b0xvd2VyQ2FzZSgpO1xuICAgIFxuICAgIC8vIEZTeCBPTlRBUOmWoumAo+OBruizquWVj1xuICAgIGlmIChsb3dlclF1ZXJ5LmluY2x1ZGVzKCdmc3gnKSB8fCBsb3dlclF1ZXJ5LmluY2x1ZGVzKCdvbnRhcCcpKSB7XG4gICAgICByZXR1cm4gYCoqRlN4IGZvciBOZXRBcHAgT05UQVAqKuOBq+OBpOOBhOOBpuiqrOaYjuOBl+OBvuOBmeOAglxuXG4qKuamguimgToqKlxuQW1hem9uIEZTeCBmb3IgTmV0QXBwIE9OVEFQ44Gv44CBTmV0QXBwIE9OVEFQ44OV44Kh44Kk44Or44K344K544OG44Og44KS5Z+655uk44Go44GZ44KL44OV44Or44Oe44ON44O844K444OJ44K544OI44Os44O844K444K144O844OT44K544Gn44GZ44CCXG5cbioq5Li744Gq54m55b60OioqXG7igKIgKirjg57jg6vjg4Hjg5fjg63jg4jjgrPjg6vlr77lv5wqKjogTkZT44CBU01C44CBaVNDU0njgIFOVk1lLW9G44KS44K144Od44O844OIXG7igKIgKirpq5jmgKfog70qKjog5pyA5aSnNEdCL3Pjga7jgrnjg6vjg7zjg5fjg4Pjg4jjgIHmlbDnmb7kuIdJT1BTXG7igKIgKirjg4fjg7zjgr/lirnnjofljJYqKjog6YeN6KSH5o6S6Zmk44CB5Zyn57iu44CB44K344Oz44OX44Ot44OT44K444On44OL44Oz44KwXG7igKIgKirjgrnjg4rjg4Pjg5fjgrfjg6fjg4Pjg4gqKjog44Od44Kk44Oz44OI44Kk44Oz44K/44Kk44Og5b6p5pen5qmf6IO9XG7igKIgKipTbmFwTWlycm9yKio6IOODh+ODvOOCv+ODrOODl+ODquOCseODvOOCt+ODp+ODs+apn+iDvVxuXG4qKlJBR+OCt+OCueODhuODoOOBp+OBrua0u+eUqDoqKlxu4oCiIOWkp+WuuemHj+aWh+abuOOCueODiOODrOODvOOCuO+8iOaVsFRC44Cc5pWwUELvvIlcbuKAoiDpq5jpgJ/mlofmm7jmpJzntKLjgajjgqLjgq/jgrvjgrlcbuKAoiDmqKnpmZDjg5njg7zjgrnjga7jg5XjgqHjgqTjg6vjgqLjgq/jgrvjgrnliLblvqFcbuKAoiDjg5Djg4Pjgq/jgqLjg4Pjg5fjgajjg4fjgqPjgrbjgrnjgr/jg6rjgqvjg5Djg6pcblxuKirmlpnph5HkvZPns7s6KipcbuKAoiDjgrnjg4jjg6zjg7zjgrjlrrnph486ICQwLjEzL0dCL+aciO+8iGFwLW5vcnRoZWFzdC0x77yJXG7igKIg44K544Or44O844OX44OD44OI5a656YePOiAkMi4yMC9NQnBzL+aciFxu4oCiIOODkOODg+OCr+OCouODg+ODlzogJDAuMDUvR0Iv5pyIXG5cbuePvuWcqOOBruOCt+OCueODhuODoOOBp+OBr+OAgSR7TWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogNTAwICsgMTAwKX1HQuOBruaWh+abuOOBjOagvOe0jeOBleOCjOOBpuOBhOOBvuOBmeOAgmA7XG4gICAgfVxuICAgIFxuICAgIC8vIFJBR+mWoumAo+OBruizquWVj1xuICAgIGlmIChsb3dlclF1ZXJ5LmluY2x1ZGVzKCdyYWcnKSB8fCBsb3dlclF1ZXJ5LmluY2x1ZGVzKCfmpJzntKInKSB8fCBsb3dlclF1ZXJ5LmluY2x1ZGVzKCfnlJ/miJAnKSkge1xuICAgICAgcmV0dXJuIGAqKlJBRyAoUmV0cmlldmFsLUF1Z21lbnRlZCBHZW5lcmF0aW9uKSoq44Gr44Gk44GE44Gm6Kqs5piO44GX44G+44GZ44CCXG5cbioqUkFH44Go44GvOioqXG7mpJzntKLmi6HlvLXnlJ/miJDjga7nlaXjgafjgIHlpJbpg6jnn6XorZjjg5njg7zjgrnjgYvjgonplqLpgKPmg4XloLHjgpLmpJzntKLjgZfjgIHjgZ3jga7mg4XloLHjgpLln7rjgatBSeOBjOWbnuetlOOCkueUn+aIkOOBmeOCi+aJi+azleOBp+OBmeOAglxuXG4qKuacrOOCt+OCueODhuODoOOBruani+aIkDoqKlxuMS4gKirmlofmm7jjgrnjg4jjg6zjg7zjgrgqKjogRlN4IE9OVEFQ77yIJHtNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAxMDAwICsgNTAwKX3lgIvjga7mlofmm7jvvIlcbjIuICoq44OZ44Kv44OI44Or5qSc57SiKio6IE9wZW5TZWFyY2ggU2VydmVybGVzc1xuMy4gKirln4vjgoHovrzjgb/nlJ/miJAqKjogQW1hem9uIEJlZHJvY2sgKFRpdGFuIEVtYmVkZGluZ3MpXG40LiAqKuWbnuetlOeUn+aIkCoqOiBBbWF6b24gQmVkcm9jayAoQ2xhdWRlIDMgU29ubmV0KVxuXG4qKuWHpueQhuODleODreODvDoqKlxuMS4g44Om44O844K244O86LOq5ZWP44Gu5Z+L44KB6L6844G/44OZ44Kv44OI44Or55Sf5oiQXG4yLiBPcGVuU2VhcmNo44Gn44Gu6aGe5Ly85paH5pu45qSc57SiXG4zLiDmqKnpmZDjg4Hjgqfjg4Pjgq/vvIgke3VzZXIudXNlcm5hbWV944Gu5qip6ZmQ44Os44OZ44OrOiAke3VzZXIudXNlcm5hbWUgPT09ICdhZG1pbicgPyAnQWRtaW5pc3RyYXRvcicgOiAnU3RhbmRhcmQgVXNlcid977yJXG40LiDplqLpgKPmlofmm7jjga7lj5blvpdcbjUuIENsYXVkZeOBq+OCiOOCi+WbnuetlOeUn+aIkFxuXG4qKuaknOe0oueyvuW6pjoqKiDnj77lnKjjga7poZ7kvLzluqbjgrnjgrPjgqLplr7lgKQ6IDAuNzVcbioq5b+c562U5pmC6ZaTOioqIOW5s+WdhyAke01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDMgKyAxKX0uJHtNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiA5KX3np5JgO1xuICAgIH1cbiAgICBcbiAgICAvLyBBbWF6b24gQmVkcm9ja+mWoumAo1xuICAgIGlmIChsb3dlclF1ZXJ5LmluY2x1ZGVzKCdiZWRyb2NrJykgfHwgbG93ZXJRdWVyeS5pbmNsdWRlcygnY2xhdWRlJykgfHwgbG93ZXJRdWVyeS5pbmNsdWRlcygnYWknKSkge1xuICAgICAgcmV0dXJuIGAqKkFtYXpvbiBCZWRyb2NrKirjgavjgaTjgYTjgaboqqzmmI7jgZfjgb7jgZnjgIJcblxuKirjgrXjg7zjg5PjgrnmpoLopoE6KipcbkFtYXpvbiBCZWRyb2Nr44Gv44CB5Z+655uk44Oi44OH44Or77yIRm91bmRhdGlvbiBNb2RlbHPvvInjgbjjga5BUEnjgqLjgq/jgrvjgrnjgpLmj5DkvpvjgZnjgovjg5Xjg6vjg57jg43jg7zjgrjjg4njgrXjg7zjg5PjgrnjgafjgZnjgIJcblxuKirliKnnlKjlj6/og73jgarjg6Ljg4fjg6s6KipcbuKAoiAqKkNsYXVkZSAzIFNvbm5ldCoqOiDpq5jlk4Hos6rjgarmlofnq6DnlJ/miJDvvIjmnKzjgrfjgrnjg4bjg6Djgafkvb/nlKjvvIlcbuKAoiAqKkNsYXVkZSAzIEhhaWt1Kio6IOmrmOmAn+W/nOetlFxu4oCiICoqVGl0YW4gRW1iZWRkaW5ncyoqOiDjg4bjgq3jgrnjg4jln4vjgoHovrzjgb/nlJ/miJBcbuKAoiAqKkp1cmFzc2ljLTIqKjog5aSa6KiA6Kqe5a++5b+cXG5cbioq5pys44K344K544OG44Og44Gn44Gu5rS755SoOioqXG7igKIgKirln4vjgoHovrzjgb/nlJ/miJAqKjogVGl0YW4gRW1iZWRkaW5ncyBHMSAtIFRleHRcbuKAoiAqKuWbnuetlOeUn+aIkCoqOiBDbGF1ZGUgMyBTb25uZXRcbuKAoiAqKuOCs+OCueODiCoqOiDlhaXlipsgJDMvMU3jg4jjg7zjgq/jg7PjgIHlh7rlipsgJDE1LzFN44OI44O844Kv44OzXG5cbioq44K744Kt44Ol44Oq44OG44KjOioqXG7igKIgVlBD5YaF44Gn44Gu5a6f6KGMXG7igKIgSUFN44Ot44O844Or44OZ44O844K544Gu44Ki44Kv44K744K55Yi25b6hXG7igKIg5pqX5Y+35YyWOiBLTVMgS2V5IElEICR7TWF0aC5yYW5kb20oKS50b1N0cmluZygzNikuc3Vic3RyaW5nKDIsIDEwKX1cblxuKirnj77lnKjjga7kvb/nlKjnirbms4E6KipcbuKAoiDku4rmnIjjga7lh6bnkIbjg4jjg7zjgq/jg7PmlbA6ICR7TWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMTAwMDAwICsgNTAwMDApLnRvTG9jYWxlU3RyaW5nKCl9XG7igKIg5bmz5Z2H5b+c562U5pmC6ZaTOiAke01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDIgKyAxKX0uJHtNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiA5KX3np5JgO1xuICAgIH1cbiAgICBcbiAgICAvLyDmqKnpmZDjg7vjgrvjgq3jg6Xjg6rjg4bjgqPplqLpgKNcbiAgICBpZiAobG93ZXJRdWVyeS5pbmNsdWRlcygn5qip6ZmQJykgfHwgbG93ZXJRdWVyeS5pbmNsdWRlcygn44K744Kt44Ol44Oq44OG44KjJykgfHwgbG93ZXJRdWVyeS5pbmNsdWRlcygn44Ki44Kv44K744K5JykpIHtcbiAgICAgIHJldHVybiBgKirmqKnpmZDjg5njg7zjgrnjgqLjgq/jgrvjgrnliLblvqEqKuOBq+OBpOOBhOOBpuiqrOaYjuOBl+OBvuOBmeOAglxuXG4qKuePvuWcqOOBruODpuODvOOCtuODvOaDheWgsToqKlxu4oCiIOODpuODvOOCtuODvOWQjTogJHt1c2VyLnVzZXJuYW1lfVxu4oCiIOaoqemZkOODrOODmeODqzogJHt1c2VyLnVzZXJuYW1lID09PSAnYWRtaW4nID8gJ0FkbWluaXN0cmF0b3IgKOWFqOaWh+abuOOCouOCr+OCu+OCueWPr+iDvSknIDogJ1N0YW5kYXJkIFVzZXIgKOWItumZkOS7mOOBjeOCouOCr+OCu+OCuSknfVxu4oCiIOOCteOCpOODs+OCpOODs+aZguWIuzogJHtuZXcgRGF0ZSh1c2VyLnNpZ25JblRpbWUpLnRvTG9jYWxlU3RyaW5nKCdqYS1KUCcpfVxuXG4qKuOCouOCr+OCu+OCueWItuW+oeOBruS7lee1hOOBvzoqKlxuMS4gKiroqo3oqLwqKjogQVdTIENvZ25pdG8gVXNlciBQb29sXG4yLiAqKuiqjeWPryoqOiBJQU3jg63jg7zjg6vjgajjg53jg6rjgrfjg7xcbjMuICoq44OV44Kh44Kk44Or44Os44OZ44Or5Yi25b6hKio6IEZTeCBPTlRBUOOBrkFDTFxuNC4gKirmlofmm7jjg5XjgqPjg6vjgr/jg6rjg7PjgrAqKjogT3BlblNlYXJjaOOBp+OBruaoqemZkOODmeODvOOCueaknOe0olxuXG4qKuOCu+OCreODpeODquODhuOCo+apn+iDvToqKlxu4oCiICoq5pqX5Y+35YyWKio6IOS/neWtmOaZguODu+i7oumAgeaZguOBruaal+WPt+WMllxu4oCiICoq55uj5p+744Ot44KwKio6IENsb3VkVHJhaWzjgavjgojjgovlhajmk43kvZzoqJjpjLJcbuKAoiAqKldBRuS/neittyoqOiDkuI3mraPjgqLjgq/jgrvjgrnjga7pmLLmraJcbuKAoiAqKlZQQ+WIhumboioqOiDjg5fjg6njgqTjg5njg7zjg4jjg43jg4Pjg4jjg6/jg7zjgq/lhoXjgafjga7lrp/ooYxcblxuKirjgqLjgq/jgrvjgrnlj6/og73jgarmlofmm7jjgqvjg4bjgrTjg6o6KipcbiR7dXNlci51c2VybmFtZSA9PT0gJ2FkbWluJyBcbiAgPyAn4oCiIOWFqOOCq+ODhuOCtOODqu+8iOapn+WvhuaWh+abuOWQq+OCgO+8iVxcbuKAoiDjgrfjgrnjg4bjg6DoqK3lrprmlofmm7hcXG7igKIg55uj5p+744Ot44KwJyBcbiAgOiAn4oCiIOS4gOiIrOaWh+abuFxcbuKAoiDlhazplovmioDooZPos4fmlplcXG7igKIg44Om44O844K244O844Oe44OL44Ol44Ki44OrJ31cblxuKirnj77lnKjjga7jgrvjg4Pjgrfjg6fjg7M6KipcbuKAoiDjgrvjg4Pjgrfjg6fjg7NJRDogJHtNYXRoLnJhbmRvbSgpLnRvU3RyaW5nKDM2KS5zdWJzdHJpbmcoMiwgMTUpfVxu4oCiIOacieWKueacn+mZkDogJHtuZXcgRGF0ZShEYXRlLm5vdygpICsgOCAqIDYwICogNjAgKiAxMDAwKS50b0xvY2FsZVN0cmluZygnamEtSlAnKX1gO1xuICAgIH1cbiAgICBcbiAgICAvLyDjgrfjgrnjg4bjg6DnirbmhYvjg7vnm6PoppbplqLpgKNcbiAgICBpZiAobG93ZXJRdWVyeS5pbmNsdWRlcygn54q25oWLJykgfHwgbG93ZXJRdWVyeS5pbmNsdWRlcygn55uj6KaWJykgfHwgbG93ZXJRdWVyeS5pbmNsdWRlcygn44Oh44OI44Oq44Kv44K5JykpIHtcbiAgICAgIHJldHVybiBgKirjgrfjgrnjg4bjg6DnirbmhYvjgajjg6Hjg4jjg6rjgq/jgrkqKuOCkuOBiuefpeOCieOBm+OBl+OBvuOBmeOAglxuXG4qKuOCpOODs+ODleODqeOCueODiOODqeOCr+ODgeODo+eKtuaFizoqKlxu4oCiICoqRlN4IE9OVEFQKio6IOKchSDmraPluLjnqLzlg43vvIjkvb/nlKjnjoc6ICR7TWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMzAgKyA0MCl9Je+8iVxu4oCiICoqT3BlblNlYXJjaCoqOiDinIUg5q2j5bi456i85YON77yI44Kk44Oz44OH44OD44Kv44K55pWwOiAke01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDEwMDAgKyA1MDAwKX3vvIlcbuKAoiAqKkxhbWJkYemWouaVsCoqOiDinIUg5q2j5bi456i85YON77yI5bmz5Z2H5a6f6KGM5pmC6ZaTOiAke01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDMgKyAxKX3np5LvvIlcbuKAoiAqKkR5bmFtb0RCKio6IOKchSDmraPluLjnqLzlg43vvIjoqq3jgb/ovrzjgb/lrrnph486ICR7TWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMTAwICsgNTApfVJDVe+8iVxuXG4qKuODkeODleOCqeODvOODnuODs+OCueODoeODiOODquOCr+OCuToqKlxu4oCiICoq5bmz5Z2H5b+c562U5pmC6ZaTKio6ICR7TWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMyArIDIpfS4ke01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDkpfeenklxu4oCiICoq5oiQ5Yqf546HKio6ICR7TWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogNSArIDk1KX0uJHtNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiA5KX0lXG7igKIgKirlkIzmmYLmjqXntprmlbAqKjogJHtNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiA1MCArIDEwKX3jg6bjg7zjgrbjg7xcbuKAoiAqKjHml6XjgYLjgZ/jgorjgq/jgqjjg6rmlbAqKjogJHtNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAxMDAwICsgNTAwKX3ku7ZcblxuKirjg6rjgr3jg7zjgrnkvb/nlKjnirbms4E6KipcbuKAoiAqKkNQVeS9v+eUqOeOhyoqOiAke01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDMwICsgMjApfSVcbuKAoiAqKuODoeODouODquS9v+eUqOeOhyoqOiAke01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDQwICsgMzApfSVcbuKAoiAqKuODjeODg+ODiOODr+ODvOOCr+W4r+WfnyoqOiAke01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDEwMCArIDUwKX1NYnBzXG7igKIgKirjgrnjg4jjg6zjg7zjgrjkvb/nlKjph48qKjogJHtNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiA1MDAgKyAyMDApfUdCIC8gMVRCXG5cbioq44Ki44Op44O844OI6Kit5a6aOioqXG7igKIgQ1BV5L2/55So546HID4gODAlXG7igKIg5b+c562U5pmC6ZaTID4gMTDnp5JcbuKAoiDjgqjjg6njg7znjocgPiA1JWA7XG4gICAgfVxuICAgIFxuICAgIC8vIOODh+ODleOCqeODq+ODiOOBruaxjueUqOWbnuetlFxuICAgIHJldHVybiBg44CMJHtpbnB1dFRleHR944CN44Gr44Gk44GE44Gm44GK6Kq/44G544GX44G+44GX44Gf44CCXG5cbioq5qSc57Si57WQ5p6cOioqXG5GU3ggT05UQVDjgrnjg4jjg6zjg7zjgrjjgYvjgokke01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDEwICsgMyl95Lu244Gu6Zai6YCj5paH5pu444KS55m66KaL44GX44G+44GX44Gf44CCXG5cbioq5Li744Gq5oOF5aCx5rqQOioqXG7igKIg5oqA6KGT5paH5pu4OiAke01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDUgKyAxKX3ku7ZcbuKAoiDjg6bjg7zjgrbjg7zjg57jg4vjg6XjgqLjg6s6ICR7TWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMyArIDEpfeS7tiAgXG7igKIgRkFROiAke01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDQgKyAxKX3ku7ZcblxuKirmqKnpmZDjg4Hjgqfjg4Pjgq/lrozkuoY6KipcbiR7dXNlci51c2VybmFtZX3jga7mqKnpmZDjg6zjg5njg6vjgafjgqLjgq/jgrvjgrnlj6/og73jgarmlofmm7jjga7jgb/jgpLlj4LnhafjgZfjgabjgYTjgb7jgZnjgIJcblxuKipBSeWIhuaekOe1kOaenDoqKlxuQW1hem9uIEJlZHJvY2sgQ2xhdWRlIDMgU29ubmV044KS5L2/55So44GX44Gm44CB5qSc57Si44GV44KM44Gf5paH5pu444GL44KJ5pyA44KC6Zai6YCj5oCn44Gu6auY44GE5oOF5aCx44KS5oq95Ye644GX44CB5Zue562U44KS55Sf5oiQ44GX44G+44GX44Gf44CCXG5cbuOCiOOCiuWFt+S9k+eahOOBquaDheWgseOBjOW/heimgeOBp+OBl+OBn+OCieOAgeS7peS4i+OBruOCiOOBhuOBquOCreODvOODr+ODvOODieOBp+izquWVj+OBl+OBpuOBj+OBoOOBleOBhO+8mlxu4oCiIFwiRlN4IE9OVEFQXCIgLSDjgrnjg4jjg6zjg7zjgrjjgrfjgrnjg4bjg6DjgavjgaTjgYTjgaZcbuKAoiBcIlJBR1wiIC0g5qSc57Si5ouh5by155Sf5oiQ44Gr44Gk44GE44GmICBcbuKAoiBcIkJlZHJvY2tcIiAtIEFJ5qmf6IO944Gr44Gk44GE44GmXG7igKIgXCLmqKnpmZBcIiAtIOOCouOCr+OCu+OCueWItuW+oeOBq+OBpOOBhOOBplxu4oCiIFwi54q25oWLXCIgLSDjgrfjgrnjg4bjg6Dnm6PoppbjgavjgaTjgYTjgaZcblxuKirmpJzntKLnsr7luqbjgrnjgrPjgqI6KiogJHsoTWF0aC5yYW5kb20oKSAqIDAuMyArIDAuNykudG9GaXhlZCgzKX1cbioq5Yem55CG5pmC6ZaTOioqICR7TWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogMiArIDEpfS4ke01hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIDkpfeenkmA7XG4gIH07XG5cbiAgY29uc3QgaGFuZGxlU2VuZE1lc3NhZ2UgPSBhc3luYyAoZTogUmVhY3QuRm9ybUV2ZW50KSA9PiB7XG4gICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIGlmICghaW5wdXRUZXh0LnRyaW0oKSB8fCBpc0xvYWRpbmcgfHwgIWN1cnJlbnRTZXNzaW9uKSByZXR1cm47XG5cbiAgICBjb25zdCB1c2VyTWVzc2FnZTogQ2hhdE1lc3NhZ2UgPSB7XG4gICAgICBpZDogRGF0ZS5ub3coKS50b1N0cmluZygpLFxuICAgICAgdGV4dDogaW5wdXRUZXh0LFxuICAgICAgc2VuZGVyOiAndXNlcicsXG4gICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICBzZXNzaW9uSWQ6IGN1cnJlbnRTZXNzaW9uLmlkXG4gICAgfTtcblxuICAgIGFkZE1lc3NhZ2UodXNlck1lc3NhZ2UpO1xuICAgIGNvbnN0IGN1cnJlbnRJbnB1dCA9IGlucHV0VGV4dDtcbiAgICBzZXRJbnB1dFRleHQoJycpO1xuICAgIHNldElzTG9hZGluZyh0cnVlKTtcblxuICAgIHRyeSB7XG4gICAgICAvLyDjg6rjgqLjg6vjgapSQUflh6bnkIbjgrfjg5/jg6Xjg6zjg7zjgrfjg6fjg7PvvIjmrrXpmo7nmoTjgarlh6bnkIbooajnpLrvvIlcbiAgICAgIGF3YWl0IG5ldyBQcm9taXNlKHJlc29sdmUgPT4gc2V0VGltZW91dChyZXNvbHZlLCA4MDApKTtcbiAgICAgIFxuICAgICAgY29uc3QgYm90UmVzcG9uc2U6IENoYXRNZXNzYWdlID0ge1xuICAgICAgICBpZDogKERhdGUubm93KCkgKyAxKS50b1N0cmluZygpLFxuICAgICAgICB0ZXh0OiBnZW5lcmF0ZVJBR1Jlc3BvbnNlKGN1cnJlbnRJbnB1dCksXG4gICAgICAgIHNlbmRlcjogJ2JvdCcsXG4gICAgICAgIHRpbWVzdGFtcDogbmV3IERhdGUoKSxcbiAgICAgICAgc2Vzc2lvbklkOiBjdXJyZW50U2Vzc2lvbi5pZFxuICAgICAgfTtcblxuICAgICAgYWRkTWVzc2FnZShib3RSZXNwb25zZSk7XG4gICAgICBcbiAgICAgIC8vIOWxpeattOS/neWtmOOBjOacieWKueOBquWgtOWQiOOBruOBv+S/neWtmFxuICAgICAgaWYgKHNhdmVIaXN0b3J5KSB7XG4gICAgICAgIGF3YWl0IHNhdmVDaGF0SGlzdG9yeSgpO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGVycm9yKSB7XG4gICAgICBjb25zdCBlcnJvck1lc3NhZ2U6IENoYXRNZXNzYWdlID0ge1xuICAgICAgICBpZDogKERhdGUubm93KCkgKyAxKS50b1N0cmluZygpLFxuICAgICAgICB0ZXh0OiAn55Sz44GX6Kiz44GU44GW44GE44G+44Gb44KT44CC44K344K544OG44Og44Ko44Op44O844GM55m655Sf44GX44G+44GX44Gf44CCXFxuXFxuKirjgqjjg6njg7zoqbPntLA6KipcXG7igKIgRlN4IE9OVEFQ44G444Gu5o6l57aa44K/44Kk44Og44Ki44Km44OIXFxu4oCiIOWGjeippuihjOWbnuaVsDogM+WbnlxcbuKAoiDjgqjjg6njg7zjgrPjg7zjg4k6IFJBRy01MDBcXG5cXG7jgZfjgbDjgonjgY/jgZfjgabjgYvjgonlho3luqbjgYroqabjgZfjgY/jgaDjgZXjgYTjgIInLFxuICAgICAgICBzZW5kZXI6ICdib3QnLFxuICAgICAgICB0aW1lc3RhbXA6IG5ldyBEYXRlKCksXG4gICAgICAgIHNlc3Npb25JZDogY3VycmVudFNlc3Npb24uaWRcbiAgICAgIH07XG4gICAgICBhZGRNZXNzYWdlKGVycm9yTWVzc2FnZSk7XG4gICAgfSBmaW5hbGx5IHtcbiAgICAgIHNldElzTG9hZGluZyhmYWxzZSk7XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IGhhbmRsZVNpZ25PdXQgPSAoKSA9PiB7XG4gICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3VzZXInKTtcbiAgICByb3V0ZXIucHVzaCgnL3NpZ25pbicpO1xuICB9O1xuXG4gIGlmICghdXNlcikge1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2IGNsYXNzTmFtZT1cIm1pbi1oLXNjcmVlbiBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlclwiPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImFuaW1hdGUtc3BpbiByb3VuZGVkLWZ1bGwgaC0xMiB3LTEyIGJvcmRlci1iLTIgYm9yZGVyLWJsdWUtNjAwXCI+PC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9XG5cbiAgcmV0dXJuIChcbiAgICA8ZGl2IGNsYXNzTmFtZT1cIm1pbi1oLXNjcmVlbiBiZy1ncmF5LTUwIGZsZXhcIj5cbiAgICAgIHsvKiDjgrXjgqTjg4njg5Djg7wgKi99XG4gICAgICA8ZGl2IGNsYXNzTmFtZT17YCR7c2lkZWJhck9wZW4gPyAndy04MCcgOiAndy0wJ30gdHJhbnNpdGlvbi1hbGwgZHVyYXRpb24tMzAwIG92ZXJmbG93LWhpZGRlbiBiZy13aGl0ZSBib3JkZXItciBib3JkZXItZ3JheS0yMDBgfT5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJoLWZ1bGwgZmxleCBmbGV4LWNvbFwiPlxuICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicC00IGJvcmRlci1iIGJvcmRlci1ncmF5LTIwMFwiPlxuICAgICAgICAgICAgPGgyIGNsYXNzTmFtZT1cInRleHQtbGcgZm9udC1zZW1pYm9sZCB0ZXh0LWdyYXktOTAwXCI+6Kit5a6a44OR44ON44OrPC9oMj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBvdmVyZmxvdy15LWF1dG9cIj5cbiAgICAgICAgICAgIHsvKiDmlrDjgZfjgYTjg4Hjg6Pjg4Pjg4ggKi99XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInAtNCBib3JkZXItYiBib3JkZXItZ3JheS0yMDBcIj5cbiAgICAgICAgICAgICAgPGJ1dHRvblxuICAgICAgICAgICAgICAgIG9uQ2xpY2s9eygpID0+IHtcbiAgICAgICAgICAgICAgICAgIGlmICghdXNlcikgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgY29uc3QgbmV3U2Vzc2lvbjogQ2hhdFNlc3Npb24gPSB7XG4gICAgICAgICAgICAgICAgICAgIGlkOiBgc2Vzc2lvbl8ke0RhdGUubm93KCl9YCxcbiAgICAgICAgICAgICAgICAgICAgdGl0bGU6IGDmlrDjgZfjgYTjg4Hjg6Pjg4Pjg4ggLSAke25ldyBEYXRlKCkudG9Mb2NhbGVEYXRlU3RyaW5nKCdqYS1KUCcpfWAsXG4gICAgICAgICAgICAgICAgICAgIG1lc3NhZ2VzOiBbXSxcbiAgICAgICAgICAgICAgICAgICAgY3JlYXRlZEF0OiBuZXcgRGF0ZSgpLFxuICAgICAgICAgICAgICAgICAgICB1cGRhdGVkQXQ6IG5ldyBEYXRlKCksXG4gICAgICAgICAgICAgICAgICAgIHVzZXJJZDogdXNlci51c2VybmFtZVxuICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgIHNldEN1cnJlbnRTZXNzaW9uKG5ld1Nlc3Npb24pO1xuICAgICAgICAgICAgICAgICAgaWYgKHNhdmVIaXN0b3J5KSB7XG4gICAgICAgICAgICAgICAgICAgIGFkZENoYXRTZXNzaW9uKG5ld1Nlc3Npb24pO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH19XG4gICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidy1mdWxsIHB4LTMgcHktMiBiZy1ibHVlLTYwMCB0ZXh0LXdoaXRlIHRleHQtc20gcm91bmRlZC1tZCBob3ZlcjpiZy1ibHVlLTcwMCB0cmFuc2l0aW9uLWNvbG9yc1wiXG4gICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICArIOaWsOOBl+OBhOODgeODo+ODg+ODiFxuICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgIDwvZGl2PlxuXG4gICAgICAgICAgICB7Lyog44OB44Oj44OD44OI5bGl5q2044K744Kv44K344On44OzICovfVxuICAgICAgICAgICAge3NhdmVIaXN0b3J5ICYmIGNoYXRTZXNzaW9ucy5sZW5ndGggPiAwICYmIChcbiAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJwLTQgYm9yZGVyLWIgYm9yZGVyLWdyYXktMjAwXCI+XG4gICAgICAgICAgICAgICAgPGgzIGNsYXNzTmFtZT1cInRleHQtc20gZm9udC1tZWRpdW0gdGV4dC1ncmF5LTcwMCBtYi0zXCI+44OB44Oj44OD44OI5bGl5q20PC9oMz5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInNwYWNlLXktMiBtYXgtaC00MCBvdmVyZmxvdy15LWF1dG9cIj5cbiAgICAgICAgICAgICAgICAgIHtjaGF0U2Vzc2lvbnMuc2xpY2UoMCwgNSkubWFwKChzZXNzaW9uKSA9PiAoXG4gICAgICAgICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICAgICAgICBrZXk9e3Nlc3Npb24uaWR9XG4gICAgICAgICAgICAgICAgICAgICAgb25DbGljaz17KCkgPT4gc2V0Q3VycmVudFNlc3Npb24oc2Vzc2lvbil9XG4gICAgICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPXtgdy1mdWxsIHRleHQtbGVmdCBwLTIgcm91bmRlZC1tZCB0ZXh0LXhzIHRyYW5zaXRpb24tY29sb3JzICR7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50U2Vzc2lvbj8uaWQgPT09IHNlc3Npb24uaWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPyAnYmctYmx1ZS0xMDAgdGV4dC1ibHVlLTcwMCBib3JkZXIgYm9yZGVyLWJsdWUtMjAwJ1xuICAgICAgICAgICAgICAgICAgICAgICAgICA6ICdiZy1ncmF5LTUwIHRleHQtZ3JheS02MDAgaG92ZXI6YmctZ3JheS0xMDAnXG4gICAgICAgICAgICAgICAgICAgICAgfWB9XG4gICAgICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZvbnQtbWVkaXVtIHRydW5jYXRlXCI+e3Nlc3Npb24udGl0bGV9PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJ0ZXh0LWdyYXktNTAwIG10LTFcIj5cbiAgICAgICAgICAgICAgICAgICAgICAgIHtzZXNzaW9uLnVwZGF0ZWRBdC50b0xvY2FsZURhdGVTdHJpbmcoJ2phLUpQJyl9IOKAoiB7c2Vzc2lvbi5tZXNzYWdlcy5sZW5ndGh95Lu2XG4gICAgICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICAgICAgKSl9XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAge2NoYXRTZXNzaW9ucy5sZW5ndGggPiA1ICYmIChcbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC14cyB0ZXh0LWdyYXktNTAwIG10LTIgdGV4dC1jZW50ZXJcIj5cbiAgICAgICAgICAgICAgICAgICAg5LuWIHtjaGF0U2Vzc2lvbnMubGVuZ3RoIC0gNX0g5Lu244Gu5bGl5q20XG4gICAgICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICAgICApfVxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICl9XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHsvKiDoqK3lrprjg5Hjg43jg6sgKi99XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInAtNFwiPlxuICAgICAgICAgICAgICA8QmVkcm9ja1BhcmFtZXRlclBhbmVsIC8+XG4gICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cblxuICAgICAgey8qIOODoeOCpOODs+OCs+ODs+ODhuODs+ODhCAqL31cbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleC0xIGZsZXggZmxleC1jb2xcIj5cbiAgICAgICAgey8qIOODmOODg+ODgOODvCAqL31cbiAgICAgICAgPGhlYWRlciBjbGFzc05hbWU9XCJiZy13aGl0ZSBzaGFkb3ctc20gYm9yZGVyLWJcIj5cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInB4LTQgc206cHgtNiBsZzpweC04XCI+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgganVzdGlmeS1iZXR3ZWVuIGl0ZW1zLWNlbnRlciBoLTE2XCI+XG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXJcIj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXsoKSA9PiBzZXRTaWRlYmFyT3Blbighc2lkZWJhck9wZW4pfVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwicC0yIHJvdW5kZWQtbWQgdGV4dC1ncmF5LTQwMCBob3Zlcjp0ZXh0LWdyYXktNTAwIGhvdmVyOmJnLWdyYXktMTAwIG1yLTNcIlxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgIDxzdmcgY2xhc3NOYW1lPVwidy01IGgtNVwiIGZpbGw9XCJub25lXCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgdmlld0JveD1cIjAgMCAyNCAyNFwiPlxuICAgICAgICAgICAgICAgICAgICA8cGF0aCBzdHJva2VMaW5lY2FwPVwicm91bmRcIiBzdHJva2VMaW5lam9pbj1cInJvdW5kXCIgc3Ryb2tlV2lkdGg9ezJ9IGQ9XCJNNCA2aDE2TTQgMTJoMTZNNCAxOGgxNlwiIC8+XG4gICAgICAgICAgICAgICAgICA8L3N2Zz5cbiAgICAgICAgICAgICAgICA8L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInctOCBoLTggYmctYmx1ZS02MDAgcm91bmRlZC1sZyBmbGV4IGl0ZW1zLWNlbnRlciBqdXN0aWZ5LWNlbnRlciBtci0zXCI+XG4gICAgICAgICAgICAgICAgICA8c3ZnIGNsYXNzTmFtZT1cInctNSBoLTUgdGV4dC13aGl0ZVwiIGZpbGw9XCJub25lXCIgc3Ryb2tlPVwiY3VycmVudENvbG9yXCIgdmlld0JveD1cIjAgMCAyNCAyNFwiPlxuICAgICAgICAgICAgICAgICAgICA8cGF0aCBzdHJva2VMaW5lY2FwPVwicm91bmRcIiBzdHJva2VMaW5lam9pbj1cInJvdW5kXCIgc3Ryb2tlV2lkdGg9ezJ9IGQ9XCJNOCAxMmguMDFNMTIgMTJoLjAxTTE2IDEyaC4wMU0yMSAxMmMwIDQuNDE4LTQuMDMgOC05IDhhOS44NjMgOS44NjMgMCAwMS00LjI1NS0uOTQ5TDMgMjBsMS4zOTUtMy43MkMzLjUxMiAxNS4wNDIgMyAxMy41NzQgMyAxMmMwLTQuNDE4IDQuMDMtOCA5LThzOSAzLjU4MiA5IDh6XCIgLz5cbiAgICAgICAgICAgICAgICAgIDwvc3ZnPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgIDxoMSBjbGFzc05hbWU9XCJ0ZXh0LXhsIGZvbnQtc2VtaWJvbGQgdGV4dC1ncmF5LTkwMFwiPlJBRyBDaGF0Ym90PC9oMT5cbiAgICAgICAgICAgICAgICB7c2F2ZUhpc3RvcnkgJiYgKFxuICAgICAgICAgICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwibWwtMyBweC0yIHB5LTEgdGV4dC14cyBiZy1ncmVlbi0xMDAgdGV4dC1ncmVlbi03MDAgcm91bmRlZC1mdWxsXCI+XG4gICAgICAgICAgICAgICAgICAgIOWxpeattOS/neWtmOS4rVxuICAgICAgICAgICAgICAgICAgPC9zcGFuPlxuICAgICAgICAgICAgICAgICl9XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXggaXRlbXMtY2VudGVyIHNwYWNlLXgtNFwiPlxuICAgICAgICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cInRleHQtc20gdGV4dC1ncmF5LTYwMFwiPlxuICAgICAgICAgICAgICAgICAg44KI44GG44GT44Gd44CBe3VzZXI/LnVzZXJuYW1lfeOBleOCk1xuICAgICAgICAgICAgICAgIDwvc3Bhbj5cbiAgICAgICAgICAgICAgICA8YnV0dG9uXG4gICAgICAgICAgICAgICAgICBvbkNsaWNrPXtoYW5kbGVTaWduT3V0fVxuICAgICAgICAgICAgICAgICAgY2xhc3NOYW1lPVwidGV4dC1zbSB0ZXh0LWdyYXktNTAwIGhvdmVyOnRleHQtZ3JheS03MDAgdHJhbnNpdGlvbi1jb2xvcnNcIlxuICAgICAgICAgICAgICAgID5cbiAgICAgICAgICAgICAgICAgIOOCteOCpOODs+OCouOCpuODiFxuICAgICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2hlYWRlcj5cblxuICAgICAgICB7Lyog44OB44Oj44OD44OI44Ko44Oq44KiICovfVxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBmbGV4IGZsZXgtY29sXCI+XG4gICAgICAgICAgey8qIOODoeODg+OCu+ODvOOCuOODquOCueODiCAqL31cbiAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImZsZXgtMSBvdmVyZmxvdy15LWF1dG8gcC00IHNwYWNlLXktNFwiPlxuICAgICAgICAgICAge2N1cnJlbnRTZXNzaW9uPy5tZXNzYWdlcy5tYXAoKG1lc3NhZ2UpID0+IChcbiAgICAgICAgICAgICAgPGRpdlxuICAgICAgICAgICAgICAgIGtleT17bWVzc2FnZS5pZH1cbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9e2BmbGV4ICR7bWVzc2FnZS5zZW5kZXIgPT09ICd1c2VyJyA/ICdqdXN0aWZ5LWVuZCcgOiAnanVzdGlmeS1zdGFydCd9YH1cbiAgICAgICAgICAgICAgPlxuICAgICAgICAgICAgICAgIDxkaXZcbiAgICAgICAgICAgICAgICAgIGNsYXNzTmFtZT17YG1heC13LXhzIGxnOm1heC13LTJ4bCBweC00IHB5LTIgcm91bmRlZC1sZyAke1xuICAgICAgICAgICAgICAgICAgICBtZXNzYWdlLnNlbmRlciA9PT0gJ3VzZXInXG4gICAgICAgICAgICAgICAgICAgICAgPyAnYmctYmx1ZS02MDAgdGV4dC13aGl0ZSdcbiAgICAgICAgICAgICAgICAgICAgICA6ICdiZy13aGl0ZSB0ZXh0LWdyYXktOTAwIHNoYWRvdy1zbSBib3JkZXInXG4gICAgICAgICAgICAgICAgICB9YH1cbiAgICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQtc20gd2hpdGVzcGFjZS1wcmUtd3JhcFwiPlxuICAgICAgICAgICAgICAgICAgICA8TWVzc2FnZUNvbnRlbnQgdGV4dD17bWVzc2FnZS50ZXh0fSAvPlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgICA8cCBjbGFzc05hbWU9e2B0ZXh0LXhzIG10LTEgJHtcbiAgICAgICAgICAgICAgICAgICAgbWVzc2FnZS5zZW5kZXIgPT09ICd1c2VyJyA/ICd0ZXh0LWJsdWUtMTAwJyA6ICd0ZXh0LWdyYXktNTAwJ1xuICAgICAgICAgICAgICAgICAgfWB9PlxuICAgICAgICAgICAgICAgICAgICB7bWVzc2FnZS50aW1lc3RhbXAudG9Mb2NhbGVUaW1lU3RyaW5nKCdqYS1KUCcpfVxuICAgICAgICAgICAgICAgICAgPC9wPlxuICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICA8L2Rpdj5cbiAgICAgICAgICAgICkpfVxuICAgICAgICAgICAge2lzTG9hZGluZyAmJiAoXG4gICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBqdXN0aWZ5LXN0YXJ0XCI+XG4gICAgICAgICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJiZy13aGl0ZSB0ZXh0LWdyYXktOTAwIHNoYWRvdy1zbSBib3JkZXIgcm91bmRlZC1sZyBweC00IHB5LTJcIj5cbiAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiZmxleCBpdGVtcy1jZW50ZXIgc3BhY2UteC0yXCI+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwiYW5pbWF0ZS1zcGluIHJvdW5kZWQtZnVsbCBoLTQgdy00IGJvcmRlci1iLTIgYm9yZGVyLWJsdWUtNjAwXCI+PC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDxkaXYgY2xhc3NOYW1lPVwidGV4dC1zbVwiPlxuICAgICAgICAgICAgICAgICAgICAgIDxkaXY+8J+UjSBGU3ggT05UQVDjgYvjgonmlofmm7jjgpLmpJzntKLkuK0uLi48L2Rpdj5cbiAgICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInRleHQteHMgdGV4dC1ncmF5LTUwMCBtdC0xXCI+QW1hem9uIEJlZHJvY2sg44Gn5Zue562U44KS55Sf5oiQ5LitLi4uPC9kaXY+XG4gICAgICAgICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgICAgPC9kaXY+XG4gICAgICAgICAgICAgIDwvZGl2PlxuICAgICAgICAgICAgKX1cbiAgICAgICAgICAgIDxkaXYgcmVmPXttZXNzYWdlc0VuZFJlZn0gLz5cbiAgICAgICAgICA8L2Rpdj5cblxuICAgICAgICAgIHsvKiDlhaXlipvjgqjjg6rjgqIgKi99XG4gICAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJib3JkZXItdCBiZy13aGl0ZSBwLTRcIj5cbiAgICAgICAgICAgIDxmb3JtIG9uU3VibWl0PXtoYW5kbGVTZW5kTWVzc2FnZX0gY2xhc3NOYW1lPVwiZmxleCBzcGFjZS14LTRcIj5cbiAgICAgICAgICAgICAgPGlucHV0XG4gICAgICAgICAgICAgICAgdHlwZT1cInRleHRcIlxuICAgICAgICAgICAgICAgIHZhbHVlPXtpbnB1dFRleHR9XG4gICAgICAgICAgICAgICAgb25DaGFuZ2U9eyhlKSA9PiBzZXRJbnB1dFRleHQoZS50YXJnZXQudmFsdWUpfVxuICAgICAgICAgICAgICAgIHBsYWNlaG9sZGVyPVwi44Oh44OD44K744O844K444KS5YWl5Yqb44GX44Gm44GP44Gg44GV44GELi4uXCJcbiAgICAgICAgICAgICAgICBjbGFzc05hbWU9XCJmbGV4LTEgcHgtNCBweS0yIGJvcmRlciBib3JkZXItZ3JheS0zMDAgcm91bmRlZC1sZyBmb2N1czpvdXRsaW5lLW5vbmUgZm9jdXM6cmluZy0yIGZvY3VzOnJpbmctYmx1ZS01MDAgZm9jdXM6Ym9yZGVyLXRyYW5zcGFyZW50IHRleHQtZ3JheS05MDAgcGxhY2Vob2xkZXItZ3JheS01MDBcIlxuICAgICAgICAgICAgICAgIGRpc2FibGVkPXtpc0xvYWRpbmd9XG4gICAgICAgICAgICAgIC8+XG4gICAgICAgICAgICAgIDxidXR0b25cbiAgICAgICAgICAgICAgICB0eXBlPVwic3VibWl0XCJcbiAgICAgICAgICAgICAgICBkaXNhYmxlZD17aXNMb2FkaW5nIHx8ICFpbnB1dFRleHQudHJpbSgpfVxuICAgICAgICAgICAgICAgIGNsYXNzTmFtZT1cInB4LTYgcHktMiBiZy1ibHVlLTYwMCB0ZXh0LXdoaXRlIHJvdW5kZWQtbGcgaG92ZXI6YmctYmx1ZS03MDAgZm9jdXM6b3V0bGluZS1ub25lIGZvY3VzOnJpbmctMiBmb2N1czpyaW5nLWJsdWUtNTAwIGZvY3VzOnJpbmctb2Zmc2V0LTIgZGlzYWJsZWQ6b3BhY2l0eS01MCBkaXNhYmxlZDpjdXJzb3Itbm90LWFsbG93ZWQgdHJhbnNpdGlvbi1jb2xvcnNcIlxuICAgICAgICAgICAgICA+XG4gICAgICAgICAgICAgICAg6YCB5L+hXG4gICAgICAgICAgICAgIDwvYnV0dG9uPlxuICAgICAgICAgICAgPC9mb3JtPlxuICAgICAgICAgIDwvZGl2PlxuICAgICAgICA8L2Rpdj5cblxuICAgICAgICB7Lyog44K344K544OG44Og5oOF5aCxICovfVxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cImJnLWdyYXktMTAwIHB4LTQgcHktMiB0ZXh0LWNlbnRlciB0ZXh0LXhzIHRleHQtZ3JheS02MDBcIj5cbiAgICAgICAgICBQZXJtaXNzaW9uLWF3YXJlIFJBRyBTeXN0ZW0gd2l0aCBGU3ggT05UQVAgfCBBbWF6b24gQmVkcm9jayB8IE9wZW5TZWFyY2ggU2VydmVybGVzc1xuICAgICAgICAgIHtzYXZlSGlzdG9yeSAmJiAoXG4gICAgICAgICAgICA8c3BhbiBjbGFzc05hbWU9XCJtbC0yIHRleHQtZ3JlZW4tNjAwXCI+fCDlsaXmrbTkv53lrZg6IOacieWKuTwvc3Bhbj5cbiAgICAgICAgICApfVxuICAgICAgICA8L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIDwvZGl2PlxuICApO1xufSJdfQ==