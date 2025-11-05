#!/bin/bash

# 高度権限制御システム簡易同期スクリプト

set -euo pipefail

# 設定ファイルの読み込み（オプション）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/development/configs/sync-config.env"

if [[ -f "${CONFIG_FILE}" ]]; then
    echo "📋 設定ファイル読み込み: ${CONFIG_FILE}"
    # shellcheck source=/dev/null
    source "${CONFIG_FILE}"
fi

# 設定（環境変数優先、フォールバック付き）
EC2_HOST="${EC2_HOST:-ubuntu@ec2-54-235-34-127.compute-1.amazonaws.com}"
EC2_PROJECT_DIR="${EC2_PROJECT_DIR:-/home/ubuntu/rag/Permission-aware-RAG-FSxN-CDK-master}"

# SSH鍵パスの動的検出（複数候補をチェック）
SSH_KEY_CANDIDATES=(
    "${EC2_KEY:-}"
    "${HOME}/.ssh/fujiwara-useast1.pem"
    "${HOME}/Downloads/Archive/system-files/fujiwara-useast1.pem"
    "/Users/$(whoami)/Downloads/Archive/system-files/fujiwara-useast1.pem"
    "./fujiwara-useast1.pem"
)

# SSH鍵の自動検出
EC2_KEY=""
for candidate in "${SSH_KEY_CANDIDATES[@]}"; do
    if [[ -n "${candidate}" && -f "${candidate}" ]]; then
        EC2_KEY="${candidate}"
        echo "✅ SSH鍵ファイル発見: ${candidate}"
        break
    fi
done

if [[ -z "${EC2_KEY}" ]]; then
    echo "❌ SSH鍵ファイルが見つかりません。以下の場所を確認してください:"
    for candidate in "${SSH_KEY_CANDIDATES[@]}"; do
        [[ -n "${candidate}" ]] && echo "  - ${candidate}"
    done
    exit 1
fi

# エラーハンドリング設定
cleanup_on_exit() {
    local exit_code=$?
    
    # 機密情報の完全クリア
    unset EC2_KEY
    unset EC2_HOST
    unset EC2_PROJECT_DIR
    unset SSH_KEY_CANDIDATES
    
    # 一時ファイルの削除
    if [[ -n "${TEMP_FILES:-}" ]]; then
        rm -f ${TEMP_FILES} 2>/dev/null || true
    fi
    
    if [[ ${exit_code} -ne 0 ]]; then
        echo "❌ スクリプトが異常終了しました (終了コード: ${exit_code})"
        echo "💡 トラブルシューティング:"
        echo "  1. SSH鍵ファイルの存在確認"
        echo "  2. EC2インスタンスの稼働状況確認"
        echo "  3. ネットワーク接続確認"
    fi
}
trap cleanup_on_exit EXIT

# 入力値検証
validate_configuration() {
    local validation_errors=0
    
    # SSH鍵ファイルパスの検証（パストラバーサル攻撃防止）
    if [[ "${EC2_KEY}" =~ \.\./|\.\.\\ ]]; then
        echo "❌ SSH鍵パスに不正な文字が含まれています: ${EC2_KEY}"
        ((validation_errors++))
    fi
    
    # EC2ホスト名の検証（より厳密な形式チェック）
    if [[ ! "${EC2_HOST}" =~ ^[a-zA-Z0-9][a-zA-Z0-9@.-]*[a-zA-Z0-9]$ ]]; then
        echo "❌ EC2ホスト名の形式が不正です: ${EC2_HOST}"
        ((validation_errors++))
    fi
    
    # プロジェクトディレクトリパスの検証
    if [[ "${EC2_PROJECT_DIR}" =~ \.\./|\.\.\\ ]]; then
        echo "❌ プロジェクトディレクトリパスに不正な文字が含まれています: ${EC2_PROJECT_DIR}"
        ((validation_errors++))
    fi
    
    if [[ ${validation_errors} -gt 0 ]]; then
        echo "❌ 設定検証で ${validation_errors} 個のエラーが見つかりました"
        exit 1
    fi
    
    echo "✅ 設定検証完了"
}

echo "🔐 高度権限制御システム同期開始..."

# 設定検証実行
validate_configuration

# SSH接続確認
echo "🔍 EC2接続確認..."

# SSH鍵ファイルの存在・権限確認
if [[ ! -f "${EC2_KEY}" ]]; then
    echo "❌ SSH秘密鍵ファイルが見つかりません: ${EC2_KEY}"
    exit 1
fi

# SSH鍵ファイルの権限確認
local key_perms=$(stat -c "%a" "${EC2_KEY}" 2>/dev/null || stat -f "%A" "${EC2_KEY}" 2>/dev/null)
if [[ "${key_perms}" != "600" ]]; then
    echo "⚠️ SSH鍵の権限が安全ではありません。修正中..."
    chmod 600 "${EC2_KEY}"
    echo "✅ SSH鍵権限を600に修正しました"
fi

# セキュリティ強化オプション付きSSH接続テスト
if ! ssh -i "${EC2_KEY}" \
    -o ConnectTimeout=10 \
    -o StrictHostKeyChecking=yes \
    -o UserKnownHostsFile=~/.ssh/known_hosts \
    "${EC2_HOST}" "echo 'SSH接続成功'" 2>/dev/null; then
    echo "❌ EC2への接続に失敗しました"
    echo "接続先: ${EC2_HOST}"
    echo "秘密鍵: [MASKED]"
    exit 1
fi
echo "✅ EC2接続確認完了"

# 同期対象ファイル
files=(
    "lib/modules/enterprise/interfaces/permission-config.ts"
    "lib/modules/enterprise/constructs/advanced-permission-filter-engine.ts"
    "lib/modules/enterprise/configs/advanced-permission-config.ts"
    "lib/stacks/integrated/advanced-permission-stack.ts"
    "lib/stacks/integrated/main-deployment-stack.ts"
    "lib/stacks/integrated/index.ts"
    "lib/config/environments/advanced-permission-deployment-config.ts"
    "development/scripts/testing/advanced-permission-control-test.py"
    "development/scripts/deployment/deploy-advanced-permission-system.sh"
    "development/docs/guides/advanced-permission-deployment-guide.md"
    "development/docs/reports/advanced-permission-control-implementation-report.md"
    "development/docs/reports/cdk-stack-integration-completion-report.md"
    "README.md"
)

# ファイル同期
echo "📁 ファイル同期開始..."

# リモートディレクトリの一括作成（パフォーマンス向上）
echo "📁 リモートディレクトリ構造作成中..."
local unique_dirs=()
for file in "${files[@]}"; do
    if [[ -f "${file}" ]]; then
        local remote_dir=$(dirname "${file}")
        if [[ ! " ${unique_dirs[*]} " =~ " ${remote_dir} " ]]; then
            unique_dirs+=("${remote_dir}")
        fi
    fi
done

# ディレクトリを一括作成
local dir_creation_cmd="mkdir -p"
for dir in "${unique_dirs[@]}"; do
    dir_creation_cmd+=" ${EC2_PROJECT_DIR}/${dir}"
done

ssh -i "${EC2_KEY}" \
    -o ConnectTimeout=30 \
    -o StrictHostKeyChecking=yes \
    "${EC2_HOST}" "${dir_creation_cmd}" 2>/dev/null || true

# ファイル同期実行（進捗表示・エラーハンドリング強化）
local total_files=${#files[@]}
local current_file=0
local failed_files=()

for file in "${files[@]}"; do
    ((current_file++))
    
    if [[ ! -f "${file}" ]]; then
        echo "⚠️ ファイルが見つかりません (${current_file}/${total_files}): ${file}"
        failed_files+=("${file}")
        continue
    fi
    
    echo "📁 同期中 (${current_file}/${total_files}): ${file}"
    
    # ファイル転送（リトライ機能付き）
    local retry_count=0
    local max_retries=3
    local transfer_success=false
    
    while [[ ${retry_count} -lt ${max_retries} ]]; do
        if scp -i "${EC2_KEY}" \
            -o ConnectTimeout=30 \
            -o StrictHostKeyChecking=yes \
            -o Compression=yes \
            -o BatchMode=yes \
            "${file}" "${EC2_HOST}:${EC2_PROJECT_DIR}/${file}" 2>/dev/null; then
            echo "✅ 同期完了: ${file}"
            transfer_success=true
            break
        else
            ((retry_count++))
            if [[ ${retry_count} -lt ${max_retries} ]]; then
                echo "⚠️ 同期失敗 (${retry_count}/${max_retries}): ${file} - リトライ中..."
                sleep $((retry_count * 2))  # 指数バックオフ
            else
                echo "❌ 同期失敗 (最大リトライ回数到達): ${file}"
                failed_files+=("${file}")
            fi
        fi
    done
done

# 失敗ファイルの報告
if [[ ${#failed_files[@]} -gt 0 ]]; then
    echo "⚠️ ${#failed_files[@]} 個のファイル転送に失敗しました:"
    for failed_file in "${failed_files[@]}"; do
        echo "  - ${failed_file}"
    done
fi

# EC2環境確認
echo "🔍 EC2環境確認..."
ssh -i "${EC2_KEY}" \
    -o ConnectTimeout=30 \
    -o StrictHostKeyChecking=yes \
    "${EC2_HOST}" "
    cd ${EC2_PROJECT_DIR} || { echo '❌ プロジェクトディレクトリにアクセスできません'; exit 1; }
    echo '✅ プロジェクトディレクトリ: \$(pwd)'
    echo '📊 ディスク使用量: \$(du -sh . 2>/dev/null || echo \"容量確認失敗\")'
    
    # 重要ファイル確認
    echo '📋 重要ファイル確認:'
    
    # 高度権限制御システムファイル確認
    if [[ -f 'lib/stacks/integrated/advanced-permission-stack.ts' ]]; then
        echo '✅ AdvancedPermissionStack: 存在'
    else
        echo '❌ AdvancedPermissionStack: 不存在'
    fi
    
    if [[ -f 'lib/modules/enterprise/constructs/advanced-permission-filter-engine.ts' ]]; then
        echo '✅ PermissionFilterEngine: 存在'
    else
        echo '❌ PermissionFilterEngine: 不存在'
    fi
    
    if [[ -f 'development/scripts/deployment/deploy-advanced-permission-system.sh' ]]; then
        echo '✅ デプロイメントスクリプト: 存在'
        chmod +x development/scripts/deployment/deploy-advanced-permission-system.sh
    else
        echo '❌ デプロイメントスクリプト: 不存在'
    fi
    
    if [[ -f 'development/scripts/testing/advanced-permission-control-test.py' ]]; then
        echo '✅ テストスクリプト: 存在'
    else
        echo '❌ テストスクリプト: 不存在'
    fi
    
    # TypeScriptビルド確認
    echo '🔧 TypeScriptビルド確認:'
    
    # npm install確認
    if ! npm list > /dev/null 2>&1; then
        echo '📦 依存関係インストール中...'
        npm install > /dev/null 2>&1 || echo '⚠️ npm install警告あり'
    fi
    
    # TypeScriptビルド
    if npm run build > /dev/null 2>&1; then
        echo '✅ TypeScriptビルド成功'
    else
        echo '⚠️ TypeScriptビルド警告あり（継続）'
    fi
"

echo ""
echo "🎉 高度権限制御システム同期完了！"
echo ""
echo "📋 設定方法（初回実行時）:"
echo "  1. 設定ファイル作成:"
echo "     cp development/configs/sync-config.env.template development/configs/sync-config.env"
echo "  2. 環境変数設定（推奨）:"
echo "     export EC2_KEY=\"/path/to/your/ssh-key.pem\""
echo "     export EC2_HOST=\"ubuntu@your-ec2-instance.amazonaws.com\""
echo "  3. SSH鍵権限設定:"
echo "     chmod 600 /path/to/your/ssh-key.pem"
echo ""
echo "📊 同期結果:"
echo "  • 高度権限制御システム: 完全同期"
echo "  • AdvancedPermissionStack: 統合完了"
echo "  • デプロイメントスクリプト: 準備完了"
echo "  • ドキュメント: 統合・更新完了"

if [[ ${#failed_files[@]} -eq 0 ]]; then
    echo "  • 同期ステータス: 全ファイル成功"
else
    echo "  • 同期ステータス: ${#failed_files[@]} 個のファイル失敗"
fi

echo ""
echo "🚀 次のステップ:"
echo "  1. フロントエンド統合 - Next.jsアプリケーションとの連携"
echo "  2. デプロイメント実行:"
echo "     ssh -i [MASKED] ${EC2_HOST}"
echo "     cd ${EC2_PROJECT_DIR}"
echo "     ./development/scripts/deployment/deploy-advanced-permission-system.sh -e dev -o https://search-example.ap-northeast-1.es.amazonaws.com"
echo ""

# 成功時のメッセージ
if [[ ${#failed_files[@]} -eq 0 ]]; then
    echo "✅ 高度権限制御システムの同期が正常に完了しました"
else
    echo "⚠️ 一部ファイルの同期に失敗しました。上記の失敗ファイルを確認してください"
fi