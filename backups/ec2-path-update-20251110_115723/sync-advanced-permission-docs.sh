#!/bin/bash

# 高度権限制御システムドキュメント同期スクリプト
# 
# 機能:
# - README.md更新内容の同期
# - デプロイメントガイド更新の同期
# - 実装レポートの同期
# - EC2とローカル間の双方向同期

set -euo pipefail

# =============================================================================
# 設定・定数
# =============================================================================

LOCAL_PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 設定ファイルの読み込み（オプション）
CONFIG_FILE="${LOCAL_PROJECT_ROOT}/development/configs/sync-config.env"
if [[ -f "${CONFIG_FILE}" ]]; then
    echo "📋 設定ファイル読み込み: ${CONFIG_FILE}"
    # shellcheck source=/dev/null
    source "${CONFIG_FILE}"
fi

# 設定（環境変数優先、フォールバック付き）
EC2_HOST="${EC2_HOST:-ubuntu@ec2-54-235-34-127.compute-1.amazonaws.com}"
EC2_PROJECT_ROOT="${EC2_PROJECT_ROOT:-/home/ubuntu/rag/Permission-aware-RAG-FSxN-CDK-master}"

# SSH鍵パスの動的検出（複数候補をチェック）
SSH_KEY_CANDIDATES=(
    "${EC2_KEY:-}"
    "${HOME}/.ssh/fujiwara-useast1.pem"
    "${HOME}/Downloads/Archive/system-files/fujiwara-useast1.pem"
    "/Users/$(whoami)/Downloads/Archive/system-files/fujiwara-useast1.pem"
    "./fujiwara-useast1.pem"
)

# SSH鍵の自動検出
SSH_KEY=""
for candidate in "${SSH_KEY_CANDIDATES[@]}"; do
    if [[ -n "${candidate}" && -f "${candidate}" ]]; then
        SSH_KEY="${candidate}"
        echo "✅ SSH鍵ファイル発見: ${candidate}"
        break
    fi
done

if [[ -z "${SSH_KEY}" ]]; then
    echo "❌ SSH鍵ファイルが見つかりません。以下の場所を確認してください:"
    for candidate in "${SSH_KEY_CANDIDATES[@]}"; do
        [[ -n "${candidate}" ]] && echo "  - ${candidate}"
    done
    exit 1
fi

# カラー設定
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =============================================================================
# ユーティリティ関数
# =============================================================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $*"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $*"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $*"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $*"
}

show_banner() {
    echo -e "${BLUE}"
    echo "=============================================================================="
    echo "📚 高度権限制御システム ドキュメント同期スクリプト"
    echo "=============================================================================="
    echo "機能: README.md・デプロイメントガイド・実装レポートの同期"
    echo "対象: EC2 ⇔ ローカル 双方向同期"
    echo "=============================================================================="
    echo -e "${NC}"
}

# =============================================================================
# 入力値検証
# =============================================================================

validate_configuration() {
    local validation_errors=0
    
    # SSH鍵ファイルパスの検証（パストラバーサル攻撃防止）
    if [[ "${SSH_KEY}" =~ \.\./|\.\.\\ ]]; then
        log_error "SSH鍵パスに不正な文字が含まれています: ${SSH_KEY}"
        ((validation_errors++))
    fi
    
    # EC2ホスト名の検証
    if [[ ! "${EC2_HOST}" =~ ^[a-zA-Z0-9][a-zA-Z0-9@.-]*[a-zA-Z0-9]$ ]]; then
        log_error "EC2ホスト名の形式が不正です: ${EC2_HOST}"
        ((validation_errors++))
    fi
    
    # SSH鍵ファイルの権限確認
    if [[ -f "${SSH_KEY}" ]]; then
        local key_perms=$(stat -c "%a" "${SSH_KEY}" 2>/dev/null || stat -f "%A" "${SSH_KEY}" 2>/dev/null)
        if [[ "${key_perms}" != "600" ]]; then
            log_warning "⚠️ SSH鍵の権限が安全ではありません。修正中..."
            chmod 600 "${SSH_KEY}"
            log_success "✅ SSH鍵権限を600に修正しました"
        fi
    fi
    
    if [[ ${validation_errors} -gt 0 ]]; then
        log_error "設定検証で ${validation_errors} 個のエラーが見つかりました"
        exit 1
    fi
    
    log_success "✅ 設定検証完了"
}

# =============================================================================
# ローカル → EC2 同期
# =============================================================================

sync_local_to_ec2() {
    log_info "📤 ローカル → EC2 同期開始..."
    
    # SSH接続テスト
    if ! ssh -i "${SSH_KEY}" \
        -o ConnectTimeout=10 \
        -o StrictHostKeyChecking=yes \
        -o UserKnownHostsFile=~/.ssh/known_hosts \
        "${EC2_HOST}" "echo 'SSH接続成功'" 2>/dev/null; then
        log_error "EC2への接続に失敗しました"
        exit 1
    fi
    
    # リモートディレクトリ作成
    ssh -i "${SSH_KEY}" "${EC2_HOST}" "mkdir -p ${EC2_PROJECT_ROOT}/development/docs/guides ${EC2_PROJECT_ROOT}/development/docs/reports ${EC2_PROJECT_ROOT}/docker/nextjs/src/app/api/bedrock/chat ${EC2_PROJECT_ROOT}/docker/nextjs/src/app/api/permission/status ${EC2_PROJECT_ROOT}/docker/nextjs/src/components/permission ${EC2_PROJECT_ROOT}/docker/nextjs/src/app/chatbot ${EC2_PROJECT_ROOT}/development/scripts/testing"
    
    # README.md同期（エラーハンドリング付き）
    log_info "README.md同期中..."
    if scp -i "${SSH_KEY}" \
        -o ConnectTimeout=30 \
        -o StrictHostKeyChecking=yes \
        "${LOCAL_PROJECT_ROOT}/README.md" "${EC2_HOST}:${EC2_PROJECT_ROOT}/"; then
        log_success "✅ README.md同期完了"
    else
        log_error "❌ README.md同期失敗"
        return 1
    fi
    
    # 同期対象ファイル配列
    local files_to_sync=(
        "development/docs/guides/advanced-permission-deployment-guide.md"
        "development/docs/reports/advanced-permission-control-implementation-report.md"
        "development/docs/reports/frontend-permission-integration-completion-report.md"
        "development/docs/reports/cdk-stack-integration-completion-report.md"
        "ec2-deploy-advanced-permission.sh"
        "docker/nextjs/src/app/api/bedrock/chat/route.ts"
        "docker/nextjs/src/app/api/permission/status/route.ts"
        "docker/nextjs/src/components/permission/PermissionStatusPanel.tsx"
        "docker/nextjs/src/app/chatbot/page.tsx"
        "development/scripts/testing/frontend-permission-integration-test.py"
    )
    
    # ファイル同期（リトライ機能付き）
    local failed_files=()
    for file in "${files_to_sync[@]}"; do
        if [[ ! -f "${LOCAL_PROJECT_ROOT}/${file}" ]]; then
            log_warning "⚠️ ファイルが見つかりません: ${file}"
            failed_files+=("${file}")
            continue
        fi
        
        log_info "同期中: ${file}"
        
        local retry_count=0
        local max_retries=3
        local transfer_success=false
        
        while [[ ${retry_count} -lt ${max_retries} ]]; do
            if scp -i "${SSH_KEY}" \
                -o ConnectTimeout=30 \
                -o StrictHostKeyChecking=yes \
                -o Compression=yes \
                "${LOCAL_PROJECT_ROOT}/${file}" "${EC2_HOST}:${EC2_PROJECT_ROOT}/${file}"; then
                log_success "✅ 同期完了: ${file}"
                transfer_success=true
                break
            else
                ((retry_count++))
                if [[ ${retry_count} -lt ${max_retries} ]]; then
                    log_warning "⚠️ 同期失敗 (${retry_count}/${max_retries}): ${file} - リトライ中..."
                    sleep $((retry_count * 2))
                else
                    log_error "❌ 同期失敗 (最大リトライ回数到達): ${file}"
                    failed_files+=("${file}")
                fi
            fi
        done
    done
    
    # 実行権限設定
    ssh -i "${SSH_KEY}" "${EC2_HOST}" "chmod +x ${EC2_PROJECT_ROOT}/ec2-deploy-advanced-permission.sh ${EC2_PROJECT_ROOT}/development/scripts/testing/frontend-permission-integration-test.py" 2>/dev/null || true
    
    # 失敗ファイルの報告
    if [[ ${#failed_files[@]} -gt 0 ]]; then
        log_warning "⚠️ ${#failed_files[@]} 個のファイル転送に失敗しました:"
        for failed_file in "${failed_files[@]}"; do
            log_warning "  - ${failed_file}"
        done
    fi
    
    log_success "📤 ローカル → EC2 同期完了"
}

# =============================================================================
# EC2 → ローカル 同期
# =============================================================================

sync_ec2_to_local() {
    log_info "📥 EC2 → ローカル 同期開始..."
    
    # ログファイル同期
    log_info "ログファイル同期中..."
    mkdir -p "${LOCAL_PROJECT_ROOT}/development/logs"
    scp -i "${SSH_KEY}" "${EC2_HOST}:${EC2_PROJECT_ROOT}/logs/advanced-permission-deploy-*.log" "${LOCAL_PROJECT_ROOT}/development/logs/" 2>/dev/null || log_warning "⚠️ ログファイルが見つかりません"
    
    # Lambda関数コード同期
    log_info "Lambda関数コード同期中..."
    mkdir -p "${LOCAL_PROJECT_ROOT}/lambda/advanced-permission"
    scp -i "${SSH_KEY}" -r "${EC2_HOST}:${EC2_PROJECT_ROOT}/lambda/advanced-permission/*" "${LOCAL_PROJECT_ROOT}/lambda/advanced-permission/" 2>/dev/null || log_warning "⚠️ Lambda関数コードが見つかりません"
    
    log_success "📥 EC2 → ローカル 同期完了"
}

# =============================================================================
# 同期状況確認
# =============================================================================

verify_sync() {
    log_info "🔍 同期状況確認中..."
    
    # EC2上のファイル存在確認
    log_info "EC2上のファイル存在確認..."
    
    local files_to_check=(
        "README.md"
        "development/docs/guides/advanced-permission-deployment-guide.md"
        "development/docs/reports/advanced-permission-control-implementation-report.md"
        "development/docs/reports/frontend-permission-integration-completion-report.md"
        "ec2-deploy-advanced-permission.sh"
        "docker/nextjs/src/app/api/bedrock/chat/route.ts"
        "docker/nextjs/src/app/api/permission/status/route.ts"
        "docker/nextjs/src/components/permission/PermissionStatusPanel.tsx"
    )
    
    for file in "${files_to_check[@]}"; do
        if ssh -i "${SSH_KEY}" "${EC2_HOST}" "test -f ${EC2_PROJECT_ROOT}/${file}"; then
            log_success "✅ ${file}"
        else
            log_error "❌ ${file}"
        fi
    done
    
    # ローカルファイル存在確認
    log_info "ローカルファイル存在確認..."
    
    for file in "${files_to_check[@]}"; do
        if [[ -f "${LOCAL_PROJECT_ROOT}/${file}" ]]; then
            log_success "✅ ${file}"
        else
            log_error "❌ ${file}"
        fi
    done
    
    log_success "🔍 同期状況確認完了"
}

# =============================================================================
# AWS リソース確認
# =============================================================================

check_aws_resources() {
    log_info "☁️ AWS リソース確認中..."
    
    # Lambda関数確認
    log_info "Lambda関数確認..."
    if ssh -i "${SSH_KEY}" "${EC2_HOST}" "aws lambda get-function --function-name TokyoRegion-permission-aware-rag-prod-PermissionFilter --region ap-northeast-1" &> /dev/null; then
        log_success "✅ Lambda関数: TokyoRegion-permission-aware-rag-prod-PermissionFilter"
    else
        log_warning "⚠️ Lambda関数が見つかりません"
    fi
    
    # DynamoDBテーブル確認
    log_info "DynamoDBテーブル確認..."
    local tables=(
        "TokyoRegion-permission-aware-rag-prod-PermissionConfig"
        "TokyoRegion-permission-aware-rag-prod-AuditLogs"
    )
    
    for table in "${tables[@]}"; do
        if ssh -i "${SSH_KEY}" "${EC2_HOST}" "aws dynamodb describe-table --table-name ${table} --region ap-northeast-1" &> /dev/null; then
            log_success "✅ DynamoDBテーブル: ${table}"
        else
            log_warning "⚠️ DynamoDBテーブルが見つかりません: ${table}"
        fi
    done
    
    # CloudWatchダッシュボード確認
    log_info "CloudWatchダッシュボード確認..."
    if ssh -i "${SSH_KEY}" "${EC2_HOST}" "aws cloudwatch get-dashboard --dashboard-name permission-aware-rag-prod-permission-control --region ap-northeast-1" &> /dev/null; then
        log_success "✅ CloudWatchダッシュボード: permission-aware-rag-prod-permission-control"
    else
        log_warning "⚠️ CloudWatchダッシュボードが見つかりません"
    fi
    
    log_success "☁️ AWS リソース確認完了"
}

# =============================================================================
# 情報表示
# =============================================================================

show_deployment_info() {
    log_info "📋 デプロイメント情報表示..."
    
    echo -e "${GREEN}"
    echo "=============================================================================="
    echo "🎉 高度権限制御システム ドキュメント同期完了"
    echo "=============================================================================="
    echo -e "${NC}"
    
    echo "📊 同期されたファイル:"
    echo "  • README.md - 高度権限制御システム情報追加"
    echo "  • デプロイメントガイド - 実装完了状況更新"
    echo "  • 実装レポート - 詳細実装内容"
    echo "  • フロントエンド統合レポート - Next.js統合完了"
    echo "  • CDKスタック統合レポート - スタック統合完了"
    echo ""
    
    echo "🔗 重要なリンク:"
    echo "  • CloudWatchダッシュボード:"
    echo "    https://ap-northeast-1.console.aws.amazon.com/cloudwatch/home?region=ap-northeast-1#dashboards:name=permission-aware-rag-prod-permission-control"
    echo "  • Lambda関数:"
    echo "    https://ap-northeast-1.console.aws.amazon.com/lambda/home?region=ap-northeast-1#/functions/TokyoRegion-permission-aware-rag-prod-PermissionFilter"
    echo "  • DynamoDBテーブル:"
    echo "    https://ap-northeast-1.console.aws.amazon.com/dynamodbv2/home?region=ap-northeast-1#tables"
    echo ""
    
    echo "📚 次のステップ:"
    echo "  1. ユーザープロファイルとアクセス権限の設定"
    echo "  2. Next.jsアプリケーションとの統合テスト"
    echo "  3. 本番運用の準備"
    echo "  4. セキュリティ監視の設定"
    echo ""
}

# =============================================================================
# エラーハンドリング・クリーンアップ
# =============================================================================

cleanup_on_exit() {
    local exit_code=$?
    
    # 機密情報の完全クリア
    unset SSH_KEY
    unset EC2_HOST
    unset EC2_PROJECT_ROOT
    unset SSH_KEY_CANDIDATES
    
    # 一時ファイルの削除
    if [[ -n "${TEMP_FILES:-}" ]]; then
        rm -f ${TEMP_FILES} 2>/dev/null || true
    fi
    
    if [[ ${exit_code} -ne 0 ]]; then
        log_error "スクリプトが異常終了しました (終了コード: ${exit_code})"
        log_info "💡 トラブルシューティング:"
        log_info "  1. SSH鍵ファイルの存在確認"
        log_info "  2. EC2インスタンスの稼働状況確認"
        log_info "  3. ネットワーク接続確認"
    fi
}

# 終了時のクリーンアップ設定
trap cleanup_on_exit EXIT

# =============================================================================
# メイン処理
# =============================================================================

main() {
    show_banner
    
    log_info "🚀 高度権限制御システム ドキュメント同期開始"
    
    # 設定検証
    validate_configuration
    
    # 同期実行
    sync_local_to_ec2
    sync_ec2_to_local
    verify_sync
    check_aws_resources
    show_deployment_info
    
    log_success "🎉 高度権限制御システム ドキュメント同期完了！"
}

# スクリプト実行
main "$@"