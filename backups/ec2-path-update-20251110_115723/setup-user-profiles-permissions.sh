#!/bin/bash

# ユーザープロファイルとアクセス権限設定スクリプト
# 
# 機能:
# - DynamoDBテーブルへのユーザープロファイル登録
# - 権限レベル別アクセス制御設定
# - テストユーザーの詳細権限設定

set -euo pipefail

# =============================================================================
# 設定・定数
# =============================================================================

# 設定ファイルの読み込み（オプション）
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="${SCRIPT_DIR}/development/configs/user-profiles-config.env"

if [[ -f "${CONFIG_FILE}" ]]; then
    echo "📋 設定ファイル読み込み: ${CONFIG_FILE}"
    # shellcheck source=/dev/null
    source "${CONFIG_FILE}"
fi

# 設定（環境変数優先、フォールバック付き）
PROJECT_ROOT="${PROJECT_ROOT:-/home/ubuntu/rag/Permission-aware-RAG-FSxN-CDK-master}"
LOG_FILE="${PROJECT_ROOT}/logs/user-profiles-setup-$(date +%Y%m%d_%H%M%S).log"

# デフォルト設定（環境変数優先）
ENVIRONMENT="${ENVIRONMENT:-prod}"
REGION="${AWS_REGION:-ap-northeast-1}"
PROJECT_NAME="${PROJECT_NAME:-permission-aware-rag}"

# DynamoDBテーブル名
PERMISSION_TABLE="${PERMISSION_TABLE:-TokyoRegion-${PROJECT_NAME}-${ENVIRONMENT}-PermissionConfig}"
AUDIT_TABLE="${AUDIT_TABLE:-TokyoRegion-${PROJECT_NAME}-${ENVIRONMENT}-AuditLogs}"

# カラー設定
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =============================================================================
# ユーティリティ関数
# =============================================================================

log() {
    local level="$1"
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    echo -e "${timestamp} [${level}] ${message}" | tee -a "${LOG_FILE}"
}

log_info() {
    log "INFO" "${BLUE}$*${NC}"
}

log_success() {
    log "SUCCESS" "${GREEN}$*${NC}"
}

log_warning() {
    log "WARNING" "${YELLOW}$*${NC}"
}

log_error() {
    log "ERROR" "${RED}$*${NC}"
}

show_banner() {
    echo -e "${BLUE}"
    echo "=============================================================================="
    echo "👥 ユーザープロファイルとアクセス権限設定スクリプト"
    echo "=============================================================================="
    echo "機能: DynamoDBテーブルへのユーザー・権限データ登録"
    echo "対象: 高度権限制御システム"
    echo "=============================================================================="
    echo -e "${NC}"
}

# =============================================================================
# ユーザープロファイル設定
# =============================================================================

setup_user_profiles() {
    log_info "👥 ユーザープロファイル設定開始..."
    
    # 管理者ユーザー
    create_user_profile "admin001" "admin" "システム管理者" "admin@company.com" "IT部門" "管理者" "emergency,admin,project_alpha,project_beta,project_gamma"
    
    # 緊急アクセスユーザー
    create_user_profile "emergency001" "emergency" "緊急アクセス担当者" "emergency@company.com" "セキュリティ部門" "緊急対応者" "emergency,admin"
    
    # プロジェクトユーザー
    create_user_profile "project_alpha_user" "project" "プロジェクトアルファ担当者" "alpha@company.com" "開発部門" "プロジェクトマネージャー" "project_alpha,basic"
    create_user_profile "project_beta_user" "project" "プロジェクトベータ担当者" "beta@company.com" "開発部門" "開発者" "project_beta,basic"
    create_user_profile "project_gamma_user" "project" "プロジェクトガンマ担当者" "gamma@company.com" "開発部門" "シニア開発者" "project_gamma,basic"
    
    # 一般ユーザー
    create_user_profile "testuser" "basic" "テストユーザー" "test@company.com" "一般部門" "一般ユーザー" "basic"
    create_user_profile "user001" "basic" "一般ユーザー001" "user001@company.com" "営業部門" "営業担当" "basic"
    create_user_profile "user002" "basic" "一般ユーザー002" "user002@company.com" "マーケティング部門" "マーケティング担当" "basic"
    
    # セキュリティ管理者
    create_user_profile "security_admin" "security" "セキュリティ管理者" "security@company.com" "セキュリティ部門" "セキュリティ管理者" "emergency,admin,security"
    
    # システム管理者
    create_user_profile "system_admin" "system" "システム管理者" "system@company.com" "IT部門" "システム管理者" "emergency,admin,system"
    
    log_success "✅ ユーザープロファイル設定完了"
}

create_user_profile() {
    local user_id="$1"
    local permission_level="$2"
    local display_name="$3"
    local email="$4"
    local department="$5"
    local role="$6"
    local permissions="$7"
    
    # 入力値検証
    if [[ -z "${user_id}" || -z "${permission_level}" || -z "${display_name}" ]]; then
        log_error "必須パラメータが不足しています: user_id=${user_id}, permission_level=${permission_level}, display_name=${display_name}"
        return 1
    fi
    
    # メールアドレス形式検証
    if [[ -n "${email}" && ! "${email}" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
        log_warning "⚠️ 無効なメールアドレス形式: ${email}"
    fi
    
    log_info "ユーザープロファイル作成: ${user_id}"
    
    # ユーザープロファイルをDynamoDBに登録（リトライ機能付き）
    local retry_count=0
    local max_retries=3
    
    while [[ ${retry_count} -lt ${max_retries} ]]; do
        if aws dynamodb put-item \
            --table-name "${PERMISSION_TABLE}" \
            --item "{
                \"userId\": {\"S\": \"${user_id}\"},
                \"resourceType\": {\"S\": \"user-profile\"},
                \"permissionLevel\": {\"S\": \"${permission_level}\"},
                \"displayName\": {\"S\": \"${display_name}\"},
                \"email\": {\"S\": \"${email}\"},
                \"department\": {\"S\": \"${department}\"},
                \"role\": {\"S\": \"${role}\"},
                \"permissions\": {\"S\": \"${permissions}\"},
                \"isActive\": {\"BOOL\": true},
                \"createdAt\": {\"S\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"},
                \"updatedAt\": {\"S\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"},
                \"lastLoginAt\": {\"S\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}
            }" --region "${REGION}" &> /dev/null; then
            
            log_success "✅ ユーザープロファイル作成完了: ${user_id} (${permission_level})"
            return 0
        else
            ((retry_count++))
            if [[ ${retry_count} -lt ${max_retries} ]]; then
                log_warning "⚠️ ユーザープロファイル作成失敗 (${retry_count}/${max_retries}): ${user_id} - リトライ中..."
                sleep $((retry_count * 2))
            else
                log_error "❌ ユーザープロファイル作成失敗 (最大リトライ回数到達): ${user_id}"
                return 1
            fi
        fi
    done
}

# =============================================================================
# リソース別権限設定
# =============================================================================

setup_resource_permissions() {
    log_info "🔒 リソース別権限設定開始..."
    
    # Bedrockチャット権限
    setup_bedrock_permissions
    
    # 文書アクセス権限
    setup_document_permissions
    
    # システム管理権限
    setup_system_permissions
    
    log_success "✅ リソース別権限設定完了"
}

setup_bedrock_permissions() {
    log_info "🤖 Bedrockチャット権限設定..."
    
    local users=(
        "admin001:admin:all_models"
        "emergency001:emergency:all_models"
        "security_admin:security:all_models"
        "system_admin:system:all_models"
        "project_alpha_user:project:standard_models"
        "project_beta_user:project:standard_models"
        "project_gamma_user:project:advanced_models"
        "testuser:basic:basic_models"
        "user001:basic:basic_models"
        "user002:basic:basic_models"
    )
    
    # バッチ処理用の一時ファイル作成
    local batch_file=$(mktemp)
    local batch_count=0
    local max_batch_size=25  # DynamoDB BatchWriteItem制限
    
    for user_config in "${users[@]}"; do
        local user_id="${user_config%%:*}"
        local temp="${user_config#*:}"
        local permission_level="${temp%%:*}"
        local model_access="${temp##*:}"
        
        # 個別処理（エラーハンドリング重視）
        if aws dynamodb put-item \
            --table-name "${PERMISSION_TABLE}" \
            --item "{
                \"userId\": {\"S\": \"${user_id}\"},
                \"resourceType\": {\"S\": \"bedrock-chat\"},
                \"permissionLevel\": {\"S\": \"${permission_level}\"},
                \"modelAccess\": {\"S\": \"${model_access}\"},
                \"maxTokens\": {\"N\": \"$(get_max_tokens ${permission_level})\"},
                \"rateLimitPerHour\": {\"N\": \"$(get_rate_limit ${permission_level})\"},
                \"isActive\": {\"BOOL\": true},
                \"createdAt\": {\"S\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"},
                \"updatedAt\": {\"S\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}
            }" --region "${REGION}" &> /dev/null; then
            
            log_success "✅ Bedrockチャット権限設定: ${user_id} (${model_access})"
        else
            log_error "❌ Bedrockチャット権限設定失敗: ${user_id}"
        fi
    done
    
    # 一時ファイルのクリーンアップ
    rm -f "${batch_file}"
}

get_max_tokens() {
    local permission_level="$1"
    case "${permission_level}" in
        "admin"|"emergency"|"security"|"system") echo "4000" ;;
        "project") echo "2000" ;;
        *) echo "1000" ;;
    esac
}

get_rate_limit() {
    local permission_level="$1"
    case "${permission_level}" in
        "admin"|"emergency"|"security"|"system") echo "1000" ;;
        "project") echo "100" ;;
        *) echo "50" ;;
    esac
}

setup_document_permissions() {
    log_info "📄 文書アクセス権限設定..."
    
    local document_configs=(
        "admin001:admin:/,/shared,/public,/confidential,/restricted"
        "emergency001:emergency:/,/shared,/public,/confidential"
        "security_admin:security:/,/shared,/public,/confidential,/security"
        "system_admin:system:/,/shared,/public,/system"
        "project_alpha_user:project:/shared,/public,/projects/alpha"
        "project_beta_user:project:/shared,/public,/projects/beta"
        "project_gamma_user:project:/shared,/public,/projects/gamma,/confidential"
        "testuser:basic:/shared,/public"
        "user001:basic:/shared,/public,/departments/sales"
        "user002:basic:/shared,/public,/departments/marketing"
    )
    
    for config in "${document_configs[@]}"; do
        local user_id="${config%%:*}"
        local temp="${config#*:}"
        local permission_level="${temp%%:*}"
        local accessible_paths="${temp##*:}"
        
        aws dynamodb put-item \
            --table-name "${PERMISSION_TABLE}" \
            --item "{
                \"userId\": {\"S\": \"${user_id}\"},
                \"resourceType\": {\"S\": \"document-access\"},
                \"permissionLevel\": {\"S\": \"${permission_level}\"},
                \"accessiblePaths\": {\"S\": \"${accessible_paths}\"},
                \"canUpload\": {\"BOOL\": $(get_upload_permission ${permission_level})},
                \"canDelete\": {\"BOOL\": $(get_delete_permission ${permission_level})},
                \"isActive\": {\"BOOL\": true},
                \"createdAt\": {\"S\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"},
                \"updatedAt\": {\"S\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}
            }" --region "${REGION}" > /dev/null
        
        log_success "✅ 文書アクセス権限設定: ${user_id} (${accessible_paths})"
    done
}

get_upload_permission() {
    local permission_level="$1"
    case "${permission_level}" in
        "admin"|"emergency"|"security"|"system"|"project") echo "true" ;;
        *) echo "false" ;;
    esac
}

get_delete_permission() {
    local permission_level="$1"
    case "${permission_level}" in
        "admin"|"emergency"|"security"|"system") echo "true" ;;
        *) echo "false" ;;
    esac
}

setup_system_permissions() {
    log_info "⚙️ システム管理権限設定..."
    
    local system_configs=(
        "admin001:admin:full_access"
        "emergency001:emergency:emergency_access"
        "security_admin:security:security_access"
        "system_admin:system:system_access"
    )
    
    for config in "${system_configs[@]}"; do
        local user_id="${config%%:*}"
        local temp="${config#*:}"
        local permission_level="${temp%%:*}"
        local system_access="${temp##*:}"
        
        aws dynamodb put-item \
            --table-name "${PERMISSION_TABLE}" \
            --item "{
                \"userId\": {\"S\": \"${user_id}\"},
                \"resourceType\": {\"S\": \"system-management\"},
                \"permissionLevel\": {\"S\": \"${permission_level}\"},
                \"systemAccess\": {\"S\": \"${system_access}\"},
                \"canViewLogs\": {\"BOOL\": true},
                \"canManageUsers\": {\"BOOL\": $(get_user_management_permission ${permission_level})},
                \"canModifyPermissions\": {\"BOOL\": $(get_permission_management ${permission_level})},
                \"isActive\": {\"BOOL\": true},
                \"createdAt\": {\"S\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"},
                \"updatedAt\": {\"S\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}
            }" --region "${REGION}" > /dev/null
        
        log_success "✅ システム管理権限設定: ${user_id} (${system_access})"
    done
}

get_user_management_permission() {
    local permission_level="$1"
    case "${permission_level}" in
        "admin"|"security"|"system") echo "true" ;;
        *) echo "false" ;;
    esac
}

get_permission_management() {
    local permission_level="$1"
    case "${permission_level}" in
        "admin"|"security") echo "true" ;;
        *) echo "false" ;;
    esac
}

# =============================================================================
# 権限テスト
# =============================================================================

test_permissions() {
    log_info "🧪 権限テスト開始..."
    
    local function_name="TokyoRegion-${PROJECT_NAME}-${ENVIRONMENT}-PermissionFilter"
    
    # テストケース1: 管理者ユーザー
    test_user_permission "admin001" "管理者ユーザー"
    
    # テストケース2: 一般ユーザー
    test_user_permission "testuser" "一般ユーザー"
    
    # テストケース3: プロジェクトユーザー
    test_user_permission "project_alpha_user" "プロジェクトユーザー"
    
    # テストケース4: 緊急アクセスユーザー
    test_user_permission "emergency001" "緊急アクセスユーザー"
    
    log_success "✅ 権限テスト完了"
}

test_user_permission() {
    local user_id="$1"
    local user_type="$2"
    
    log_info "テスト実行: ${user_type} (${user_id})"
    
    local test_payload="{
        \"userId\": \"${user_id}\",
        \"ipAddress\": \"192.168.1.100\",
        \"userAgent\": \"Mozilla/5.0 Test\",
        \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
        \"requestedResource\": \"bedrock-chat-test\"
    }"
    
    local result=$(aws lambda invoke \
        --function-name "TokyoRegion-${PROJECT_NAME}-${ENVIRONMENT}-PermissionFilter" \
        --payload "${test_payload}" \
        --output text \
        --query 'StatusCode' \
        response.json 2>/dev/null)
    
    if [[ "${result}" == "200" ]]; then
        local allowed=$(cat response.json | jq -r '.body' | jq -r '.allowed' 2>/dev/null || echo "unknown")
        if [[ "${allowed}" == "true" ]]; then
            log_success "✅ ${user_type}: アクセス許可"
        else
            log_warning "⚠️ ${user_type}: アクセス拒否"
        fi
    else
        log_error "❌ ${user_type}: テスト実行エラー"
    fi
    
    rm -f response.json
}

# =============================================================================
# 情報表示
# =============================================================================

show_setup_info() {
    log_info "📋 設定情報表示..."
    
    echo -e "${GREEN}"
    echo "=============================================================================="
    echo "🎉 ユーザープロファイルとアクセス権限設定完了"
    echo "=============================================================================="
    echo -e "${NC}"
    
    echo "👥 設定されたユーザー:"
    echo "  • admin001 - システム管理者 (全権限)"
    echo "  • emergency001 - 緊急アクセス担当者 (緊急権限)"
    echo "  • security_admin - セキュリティ管理者 (セキュリティ権限)"
    echo "  • system_admin - システム管理者 (システム権限)"
    echo "  • project_alpha_user - プロジェクトアルファ担当者 (プロジェクト権限)"
    echo "  • project_beta_user - プロジェクトベータ担当者 (プロジェクト権限)"
    echo "  • project_gamma_user - プロジェクトガンマ担当者 (プロジェクト権限)"
    echo "  • testuser - テストユーザー (基本権限)"
    echo "  • user001 - 営業担当 (基本権限)"
    echo "  • user002 - マーケティング担当 (基本権限)"
    echo ""
    
    echo "🔒 権限レベル:"
    echo "  • admin: 全システムアクセス・全モデル利用・4000トークン・1000回/時"
    echo "  • emergency: 緊急時アクセス・全モデル利用・4000トークン・1000回/時"
    echo "  • security: セキュリティ管理・全モデル利用・4000トークン・1000回/時"
    echo "  • system: システム管理・全モデル利用・4000トークン・1000回/時"
    echo "  • project: プロジェクト権限・標準モデル・2000トークン・100回/時"
    echo "  • basic: 基本権限・基本モデル・1000トークン・50回/時"
    echo ""
    
    echo "📄 文書アクセス権限:"
    echo "  • 管理者: 全ディレクトリアクセス"
    echo "  • プロジェクトユーザー: プロジェクト固有ディレクトリ"
    echo "  • 一般ユーザー: 共有・公開ディレクトリのみ"
    echo ""
    
    echo "🔗 確認方法:"
    echo "  • DynamoDBテーブル: ${PERMISSION_TABLE}"
    echo "  • 監査ログテーブル: ${AUDIT_TABLE}"
    echo "  • CloudWatchダッシュボード: permission-aware-rag-prod-permission-control"
    echo ""
    
    echo "📚 次のステップ:"
    echo "  1. Next.jsアプリケーションでのユーザー認証テスト"
    echo "  2. 権限レベル別機能テスト"
    echo "  3. 監査ログの確認"
    echo "  4. 本番運用の開始"
    echo ""
    
    echo "📄 ログファイル: ${LOG_FILE}"
    echo ""
}

# =============================================================================
# 入力値検証・セキュリティチェック
# =============================================================================

validate_environment() {
    log_info "🔍 環境検証開始..."
    
    local validation_errors=0
    
    # AWS CLI認証確認
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS認証情報が設定されていません"
        ((validation_errors++))
    fi
    
    # 必須環境変数チェック
    local required_vars=("AWS_REGION" "AWS_PROFILE")
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            log_error "必須環境変数が未設定: ${var}"
            ((validation_errors++))
        fi
    done
    
    # DynamoDBテーブル存在確認
    if ! aws dynamodb describe-table --table-name "${PERMISSION_TABLE}" --region "${REGION}" &> /dev/null; then
        log_error "権限設定テーブルが存在しません: ${PERMISSION_TABLE}"
        ((validation_errors++))
    fi
    
    if [[ ${validation_errors} -gt 0 ]]; then
        log_error "環境検証で ${validation_errors} 個のエラーが見つかりました"
        exit 1
    fi
    
    log_success "✅ 環境検証完了"
}

# =============================================================================
# クリーンアップ・セキュリティ
# =============================================================================

cleanup_on_exit() {
    local exit_code=$?
    
    # 機密情報のクリア
    unset AWS_ACCESS_KEY_ID
    unset AWS_SECRET_ACCESS_KEY
    unset AWS_SESSION_TOKEN
    
    # 一時ファイルの削除
    rm -f response.json 2>/dev/null || true
    
    if [[ ${exit_code} -ne 0 ]]; then
        log_error "スクリプトが異常終了しました (終了コード: ${exit_code})"
        log_info "ログファイルを確認してください: ${LOG_FILE}"
    fi
    
    log_info "クリーンアップ処理完了"
}

# 終了時のクリーンアップ設定
trap cleanup_on_exit EXIT

# =============================================================================
# メイン処理
# =============================================================================

main() {
    show_banner
    
    # ログディレクトリ作成
    mkdir -p "$(dirname "${LOG_FILE}")"
    
    log_info "🚀 ユーザープロファイルとアクセス権限設定開始"
    
    # 環境検証
    validate_environment
    
    # 設定実行
    setup_user_profiles
    setup_resource_permissions
    test_permissions
    show_setup_info
    
    log_success "🎉 ユーザープロファイルとアクセス権限設定完了！"
}

# スクリプト実行
main "$@"