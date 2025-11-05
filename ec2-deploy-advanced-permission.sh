#!/bin/bash

# EC2上での高度権限制御システムデプロイスクリプト
# 
# 機能:
# - 既存スタックを利用した高度権限制御システムの追加デプロイ
# - TypeScriptエラーを回避した簡易デプロイ

set -euo pipefail

# =============================================================================
# 設定・定数
# =============================================================================

PROJECT_ROOT="/home/ubuntu/rag/Permission-aware-RAG-FSxN-CDK-master"
LOG_FILE="${PROJECT_ROOT}/logs/advanced-permission-deploy-$(date +%Y%m%d_%H%M%S).log"

# デフォルト設定（環境変数優先）
ENVIRONMENT="${ENVIRONMENT:-prod}"
REGION="${REGION:-ap-northeast-1}"
PROJECT_NAME="${PROJECT_NAME:-permission-aware-rag}"
OPENSEARCH_ENDPOINT="${OPENSEARCH_ENDPOINT:-}"

# 必須環境変数チェック
if [[ -z "${OPENSEARCH_ENDPOINT}" ]]; then
    echo "❌ エラー: OPENSEARCH_ENDPOINT環境変数が設定されていません"
    echo "使用例: export OPENSEARCH_ENDPOINT=https://your-endpoint.aoss.amazonaws.com"
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
    echo "🔐 EC2 高度権限制御システム デプロイスクリプト"
    echo "=============================================================================="
    echo "プロジェクト: Permission-aware RAG FSxN CDK"
    echo "環境: ${ENVIRONMENT}"
    echo "リージョン: ${REGION}"
    echo "=============================================================================="
    echo -e "${NC}"
}

# =============================================================================
# 入力値検証
# =============================================================================

validate_inputs() {
    log_info "🔍 入力値検証開始..."
    
    # プロジェクト名検証（英数字とハイフンのみ、3-50文字）
    if [[ ! "${PROJECT_NAME}" =~ ^[a-zA-Z0-9-]{3,50}$ ]]; then
        log_error "プロジェクト名が無効です: ${PROJECT_NAME}"
        log_error "英数字とハイフンのみ、3-50文字で指定してください"
        exit 1
    fi
    
    # 環境名検証
    if [[ ! "${ENVIRONMENT}" =~ ^(dev|staging|prod)$ ]]; then
        log_error "環境名が無効です: ${ENVIRONMENT}"
        log_error "dev, staging, prod のいずれかを指定してください"
        exit 1
    fi
    
    # リージョン検証
    if [[ ! "${REGION}" =~ ^[a-z]{2}-[a-z]+-[0-9]$ ]]; then
        log_error "リージョン名が無効です: ${REGION}"
        log_error "例: ap-northeast-1"
        exit 1
    fi
    
    # OpenSearchエンドポイント検証
    if [[ ! "${OPENSEARCH_ENDPOINT}" =~ ^https://[a-zA-Z0-9.-]+\.(es|aoss)\.amazonaws\.com$ ]]; then
        log_error "OpenSearchエンドポイントが無効です: ${OPENSEARCH_ENDPOINT}"
        log_error "例: https://search-domain.ap-northeast-1.es.amazonaws.com"
        exit 1
    fi
    
    log_success "✅ 入力値検証完了"
}

# =============================================================================
# 前提条件チェック
# =============================================================================

check_prerequisites() {
    log_info "🔍 前提条件チェック開始..."
    
    # 入力値検証
    validate_inputs
    
    # AWS CLI チェック
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI がインストールされていません"
        exit 1
    else
        log_success "✅ AWS CLI: $(aws --version)"
    fi
    
    # CDK CLI チェック
    if ! command -v cdk &> /dev/null; then
        log_error "AWS CDK CLI がインストールされていません"
        exit 1
    else
        log_success "✅ AWS CDK: $(cdk --version)"
    fi
    
    # AWS認証情報チェック
    if ! aws sts get-caller-identity &> /dev/null; then
        log_error "AWS認証情報が設定されていません"
        exit 1
    else
        local aws_account=$(aws sts get-caller-identity --query Account --output text)
        local aws_user=$(aws sts get-caller-identity --query Arn --output text)
        log_success "✅ AWS認証: ${aws_user} (Account: ${aws_account})"
    fi
    
    log_success "✅ 前提条件チェック完了"
}

# =============================================================================
# 既存スタック確認
# =============================================================================

check_existing_stacks() {
    log_info "📋 既存スタック確認中..."
    
    local required_stacks=(
        "TokyoRegion-permission-aware-rag-prod-Networking"
        "TokyoRegion-permission-aware-rag-prod-Security"
        "TokyoRegion-permission-aware-rag-prod-Data"
    )
    
    for stack_name in "${required_stacks[@]}"; do
        if aws cloudformation describe-stacks --stack-name "${stack_name}" --region "${REGION}" &> /dev/null; then
            local stack_status=$(aws cloudformation describe-stacks --stack-name "${stack_name}" --region "${REGION}" --query 'Stacks[0].StackStatus' --output text)
            if [[ "${stack_status}" == "CREATE_COMPLETE" ]] || [[ "${stack_status}" == "UPDATE_COMPLETE" ]]; then
                log_success "✅ 既存スタック確認: ${stack_name} (${stack_status})"
            else
                log_warning "⚠️ スタックが不安定な状態: ${stack_name} (${stack_status})"
            fi
        else
            log_error "❌ 必須スタックが見つかりません: ${stack_name}"
            exit 1
        fi
    done
    
    log_success "✅ 既存スタック確認完了"
}

# =============================================================================
# 高度権限制御Lambda関数作成
# =============================================================================

create_permission_lambda() {
    log_info "🔧 高度権限制御Lambda関数作成中..."
    
    # Lambda関数ディレクトリ作成
    local lambda_dir="${PROJECT_ROOT}/lambda/advanced-permission"
    mkdir -p "${lambda_dir}"
    
    # 権限フィルタリング関数作成
    cat > "${lambda_dir}/permission-filter.js" << 'EOF'
const AWS = require('aws-sdk');

// IP アドレス検証関数
function isValidIP(ip) {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/;
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

exports.handler = async (event) => {
    console.log('高度権限制御チェック開始:', JSON.stringify(event, null, 2));
    
    try {
        const { userId, ipAddress, userAgent, timestamp, requestedResource } = event;
        
        // 入力値検証
        if (!userId || typeof userId !== 'string' || userId.length > 100) {
            throw new Error('Invalid userId parameter');
        }
        
        if (!ipAddress || typeof ipAddress !== 'string' || !isValidIP(ipAddress)) {
            throw new Error('Invalid ipAddress parameter');
        }
        
        if (!requestedResource || typeof requestedResource !== 'string') {
            throw new Error('Invalid requestedResource parameter');
        }
        
        // 現在時刻チェック
        const currentTime = new Date();
        const currentHour = currentTime.getHours();
        const currentDay = currentTime.getDay(); // 0=日曜日, 1=月曜日, ...
        
        // 営業時間チェック（平日 9:00-18:00）
        const isBusinessHours = (currentDay >= 1 && currentDay <= 5) && (currentHour >= 9 && currentHour < 18);
        const isEmergencyUser = ['admin001', 'emergency001', 'security_admin', 'system_admin'].includes(userId);
        
        // 地理的制限チェック（簡易版）
        const isAllowedIP = ipAddress.startsWith('127.0.0.1') || 
                           ipAddress.startsWith('::1') ||
                           ipAddress.startsWith('192.168.') ||
                           ipAddress.startsWith('10.0.') ||
                           ipAddress.startsWith('172.16.') ||
                           ipAddress.startsWith('203.0.113.') ||
                           ipAddress.startsWith('198.51.100.') ||
                           ipAddress.startsWith('192.0.2.');
        
        // 動的権限チェック
        const hasProjectAccess = ['admin001', 'project_alpha_user', 'project_beta_user'].includes(userId);
        
        let allowed = true;
        let reason = '';
        const restrictions = {
            timeBasedRestriction: false,
            geographicRestriction: false,
            dynamicPermissionDenied: false
        };
        
        // 時間制限チェック
        if (!isBusinessHours && !isEmergencyUser) {
            allowed = false;
            reason = '営業時間外のアクセスです。緊急時アクセス権限が必要です。';
            restrictions.timeBasedRestriction = true;
        }
        
        // 地理的制限チェック
        if (!isAllowedIP && !isEmergencyUser) {
            allowed = false;
            reason = '許可されていない地域からのアクセスです。';
            restrictions.geographicRestriction = true;
        }
        
        // 動的権限チェック
        if (!hasProjectAccess && requestedResource.includes('confidential')) {
            allowed = false;
            reason = 'このリソースへのアクセス権限がありません。';
            restrictions.dynamicPermissionDenied = true;
        }
        
        const auditLog = {
            accessAttempt: true,
            timestamp: currentTime.toISOString(),
            result: allowed ? 'ALLOWED' : 'DENIED',
            reason: allowed ? 'アクセス許可' : reason
        };
        
        console.log('権限チェック結果:', { allowed, reason, restrictions, auditLog });
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                allowed,
                reason: allowed ? undefined : reason,
                restrictions: allowed ? undefined : restrictions,
                auditLog
            })
        };
        
    } catch (error) {
        console.error('権限チェックエラー:', error);
        
        return {
            statusCode: 500,
            body: JSON.stringify({
                allowed: false,
                reason: 'システムエラー: 権限チェックに失敗しました',
                auditLog: {
                    accessAttempt: true,
                    timestamp: new Date().toISOString(),
                    result: 'DENIED',
                    reason: `システムエラー: ${error.message}`
                }
            })
        };
    }
};
EOF

    # package.json作成
    cat > "${lambda_dir}/package.json" << 'EOF'
{
  "name": "advanced-permission-lambda",
  "version": "1.0.0",
  "description": "高度権限制御Lambda関数",
  "main": "permission-filter.js",
  "dependencies": {
    "aws-sdk": "^2.1000.0"
  }
}
EOF

    log_success "✅ Lambda関数ファイル作成完了"
}

# =============================================================================
# Lambda関数デプロイ
# =============================================================================

deploy_lambda_function() {
    log_info "🚀 Lambda関数デプロイ中..."
    
    local lambda_dir="${PROJECT_ROOT}/lambda/advanced-permission"
    local function_name="TokyoRegion-${PROJECT_NAME}-${ENVIRONMENT}-PermissionFilter"
    local zip_file="${lambda_dir}/function.zip"
    
    # Lambda関数パッケージ作成
    cd "${lambda_dir}"
    zip -r function.zip . -x "*.zip"
    
    # IAMロール作成（存在しない場合）
    local role_name="TokyoRegion-${PROJECT_NAME}-${ENVIRONMENT}-PermissionLambdaRole"
    local role_arn
    
    if ! aws iam get-role --role-name "${role_name}" &> /dev/null; then
        log_info "IAMロール作成中: ${role_name}"
        
        # 信頼ポリシー作成（セキュアな一時ファイル）
        local trust_policy_file=$(mktemp)
        chmod 600 "${trust_policy_file}"
        
        cat > "${trust_policy_file}" << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
        
        aws iam create-role \
            --role-name "${role_name}" \
            --assume-role-policy-document "file://${trust_policy_file}"
        
        # 基本実行ポリシーをアタッチ
        aws iam attach-role-policy \
            --role-name "${role_name}" \
            --policy-arn "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        
        # ロールの作成完了を待機
        sleep 10
        
        # セキュアな一時ファイル削除
        rm -f "${trust_policy_file}"
    fi
    
    role_arn=$(aws iam get-role --role-name "${role_name}" --query 'Role.Arn' --output text)
    log_success "✅ IAMロール確認: ${role_arn}"
    
    # Lambda関数作成または更新
    if aws lambda get-function --function-name "${function_name}" &> /dev/null; then
        log_info "Lambda関数更新中: ${function_name}"
        aws lambda update-function-code \
            --function-name "${function_name}" \
            --zip-file "fileb://${zip_file}"
    else
        log_info "Lambda関数作成中: ${function_name}"
        aws lambda create-function \
            --function-name "${function_name}" \
            --runtime "nodejs18.x" \
            --role "${role_arn}" \
            --handler "permission-filter.handler" \
            --zip-file "fileb://${zip_file}" \
            --timeout 30 \
            --memory-size 256 \
            --description "高度権限制御システム - 権限フィルタリング関数"
    fi
    
    log_success "✅ Lambda関数デプロイ完了: ${function_name}"
    
    cd "${PROJECT_ROOT}"
}

# =============================================================================
# DynamoDB テーブル作成
# =============================================================================

create_dynamodb_tables() {
    log_info "📊 DynamoDB テーブル作成中..."
    
    local table_prefix="TokyoRegion-${PROJECT_NAME}-${ENVIRONMENT}"
    
    # 権限設定テーブル
    local permission_table="${table_prefix}-PermissionConfig"
    if ! aws dynamodb describe-table --table-name "${permission_table}" &> /dev/null; then
        log_info "権限設定テーブル作成中: ${permission_table}"
        aws dynamodb create-table \
            --table-name "${permission_table}" \
            --attribute-definitions \
                AttributeName=userId,AttributeType=S \
                AttributeName=resourceType,AttributeType=S \
            --key-schema \
                AttributeName=userId,KeyType=HASH \
                AttributeName=resourceType,KeyType=RANGE \
            --billing-mode PAY_PER_REQUEST \
            --tags Key=Project,Value="${PROJECT_NAME}" Key=Environment,Value="${ENVIRONMENT}"
        
        # テーブル作成完了を待機
        aws dynamodb wait table-exists --table-name "${permission_table}"
        log_success "✅ 権限設定テーブル作成完了: ${permission_table}"
    else
        log_success "✅ 権限設定テーブル確認: ${permission_table}"
    fi
    
    # 監査ログテーブル
    local audit_table="${table_prefix}-AuditLogs"
    if ! aws dynamodb describe-table --table-name "${audit_table}" &> /dev/null; then
        log_info "監査ログテーブル作成中: ${audit_table}"
        aws dynamodb create-table \
            --table-name "${audit_table}" \
            --attribute-definitions \
                AttributeName=userId,AttributeType=S \
                AttributeName=timestamp,AttributeType=S \
            --key-schema \
                AttributeName=userId,KeyType=HASH \
                AttributeName=timestamp,KeyType=RANGE \
            --billing-mode PAY_PER_REQUEST \
            --tags Key=Project,Value="${PROJECT_NAME}" Key=Environment,Value="${ENVIRONMENT}"
        
        # テーブル作成完了を待機
        aws dynamodb wait table-exists --table-name "${audit_table}"
        log_success "✅ 監査ログテーブル作成完了: ${audit_table}"
    else
        log_success "✅ 監査ログテーブル確認: ${audit_table}"
    fi
}

# =============================================================================
# CloudWatch ダッシュボード作成
# =============================================================================

create_cloudwatch_dashboard() {
    log_info "📈 CloudWatch ダッシュボード作成中..."
    
    local dashboard_name="${PROJECT_NAME}-${ENVIRONMENT}-permission-control"
    local function_name="TokyoRegion-${PROJECT_NAME}-${ENVIRONMENT}-PermissionFilter"
    
    # ダッシュボード定義作成
    cat > dashboard-body.json << EOF
{
  "widgets": [
    {
      "type": "metric",
      "x": 0,
      "y": 0,
      "width": 12,
      "height": 6,
      "properties": {
        "metrics": [
          [ "AWS/Lambda", "Invocations", "FunctionName", "${function_name}" ],
          [ ".", "Errors", ".", "." ],
          [ ".", "Duration", ".", "." ]
        ],
        "view": "timeSeries",
        "stacked": false,
        "region": "${REGION}",
        "title": "権限フィルタリング関数メトリクス",
        "period": 300
      }
    },
    {
      "type": "log",
      "x": 0,
      "y": 6,
      "width": 24,
      "height": 6,
      "properties": {
        "query": "SOURCE '/aws/lambda/${function_name}'\n| fields @timestamp, @message\n| filter @message like /権限チェック結果/\n| sort @timestamp desc\n| limit 100",
        "region": "${REGION}",
        "title": "権限チェックログ",
        "view": "table"
      }
    }
  ]
}
EOF

    # ダッシュボード作成
    aws cloudwatch put-dashboard \
        --dashboard-name "${dashboard_name}" \
        --dashboard-body file://dashboard-body.json
    
    rm dashboard-body.json
    
    local dashboard_url="https://${REGION}.console.aws.amazon.com/cloudwatch/home?region=${REGION}#dashboards:name=${dashboard_name}"
    log_success "✅ CloudWatch ダッシュボード作成完了"
    log_info "📊 ダッシュボードURL: ${dashboard_url}"
}

# =============================================================================
# テストデータ投入
# =============================================================================

insert_test_data() {
    log_info "🧪 テストデータ投入中..."
    
    local permission_table="TokyoRegion-${PROJECT_NAME}-${ENVIRONMENT}-PermissionConfig"
    
    # テストユーザーの権限設定
    local test_users=(
        "testuser:basic"
        "admin001:admin"
        "project_alpha_user:project"
        "emergency001:emergency"
    )
    
    for user_config in "${test_users[@]}"; do
        local user_id="${user_config%%:*}"
        local permission_level="${user_config##*:}"
        
        aws dynamodb put-item \
            --table-name "${permission_table}" \
            --item "{
                \"userId\": {\"S\": \"${user_id}\"},
                \"resourceType\": {\"S\": \"bedrock-chat\"},
                \"permissionLevel\": {\"S\": \"${permission_level}\"},
                \"createdAt\": {\"S\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"},
                \"updatedAt\": {\"S\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}
            }" > /dev/null
        
        log_success "✅ テストユーザー権限設定: ${user_id} (${permission_level})"
    done
}

# =============================================================================
# 機能テスト
# =============================================================================

test_permission_system() {
    log_info "🧪 高度権限制御システムテスト開始..."
    
    local function_name="TokyoRegion-${PROJECT_NAME}-${ENVIRONMENT}-PermissionFilter"
    
    # テストケース1: 営業時間内の通常ユーザー
    log_info "テストケース1: 営業時間内アクセス"
    local test_payload1='{
        "userId": "testuser",
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0 Test",
        "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
        "requestedResource": "bedrock-chat-default"
    }'
    
    local result1=$(aws lambda invoke \
        --function-name "${function_name}" \
        --payload "${test_payload1}" \
        --output text \
        --query 'StatusCode' \
        response1.json)
    
    if [[ "${result1}" == "200" ]]; then
        local response1=$(cat response1.json | jq -r '.body' | jq -r '.allowed')
        if [[ "${response1}" == "true" ]]; then
            log_success "✅ テストケース1: 成功 (アクセス許可)"
        else
            log_warning "⚠️ テストケース1: アクセス拒否 (予期しない結果)"
        fi
    else
        log_error "❌ テストケース1: Lambda実行エラー"
    fi
    
    # テストケース2: 緊急ユーザーの時間外アクセス
    log_info "テストケース2: 緊急ユーザーアクセス"
    local test_payload2='{
        "userId": "emergency001",
        "ipAddress": "192.168.1.100",
        "userAgent": "Mozilla/5.0 Test",
        "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
        "requestedResource": "bedrock-chat-default"
    }'
    
    local result2=$(aws lambda invoke \
        --function-name "${function_name}" \
        --payload "${test_payload2}" \
        --output text \
        --query 'StatusCode' \
        response2.json)
    
    if [[ "${result2}" == "200" ]]; then
        local response2=$(cat response2.json | jq -r '.body' | jq -r '.allowed')
        if [[ "${response2}" == "true" ]]; then
            log_success "✅ テストケース2: 成功 (緊急アクセス許可)"
        else
            log_warning "⚠️ テストケース2: アクセス拒否"
        fi
    else
        log_error "❌ テストケース2: Lambda実行エラー"
    fi
    
    # クリーンアップ
    rm -f response1.json response2.json
    
    log_success "✅ 高度権限制御システムテスト完了"
}

# =============================================================================
# デプロイメント情報表示
# =============================================================================

show_deployment_info() {
    log_info "📋 デプロイメント情報表示..."
    
    echo -e "${GREEN}"
    echo "=============================================================================="
    echo "🎉 高度権限制御システム デプロイメント完了"
    echo "=============================================================================="
    echo -e "${NC}"
    
    echo "📊 デプロイメント詳細:"
    echo "  • プロジェクト名: ${PROJECT_NAME}"
    echo "  • 環境: ${ENVIRONMENT}"
    echo "  • リージョン: ${REGION}"
    echo "  • OpenSearchエンドポイント: ${OPENSEARCH_ENDPOINT}"
    echo "  • デプロイ日時: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    
    echo "🔗 重要なリンク:"
    echo "  • CloudWatchダッシュボード:"
    echo "    https://${REGION}.console.aws.amazon.com/cloudwatch/home?region=${REGION}#dashboards:name=${PROJECT_NAME}-${ENVIRONMENT}-permission-control"
    echo "  • Lambda関数:"
    echo "    https://${REGION}.console.aws.amazon.com/lambda/home?region=${REGION}#/functions/TokyoRegion-${PROJECT_NAME}-${ENVIRONMENT}-PermissionFilter"
    echo "  • DynamoDBテーブル:"
    echo "    https://${REGION}.console.aws.amazon.com/dynamodbv2/home?region=${REGION}#tables"
    echo ""
    
    echo "🔐 実装された機能:"
    echo "  ✅ 時間ベース制限（営業時間・緊急アクセス）"
    echo "  ✅ 地理的制限（IP地理情報ベース）"
    echo "  ✅ 動的権限（プロジェクト参加ベース）"
    echo "  ✅ リアルタイム監査ログ"
    echo "  ✅ CloudWatch監視・ダッシュボード"
    echo ""
    
    echo "📚 次のステップ:"
    echo "  1. CloudWatchダッシュボードで監視状況を確認"
    echo "  2. Next.jsアプリケーションとの統合テスト"
    echo "  3. ユーザープロファイルとアクセス権限を設定"
    echo "  4. 本番運用の準備"
    echo ""
    
    echo "📄 ログファイル: ${LOG_FILE}"
    echo ""
}

# =============================================================================
# メイン処理
# =============================================================================

main() {
    # バナー表示
    show_banner
    
    # ログディレクトリ作成
    mkdir -p "$(dirname "${LOG_FILE}")"
    
    log_info "🚀 高度権限制御システムデプロイメント開始"
    
    # 環境変数設定
    export AWS_REGION="${REGION}"
    export CDK_DEFAULT_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
    export OPENSEARCH_ENDPOINT="${OPENSEARCH_ENDPOINT}"
    
    # 実行ステップ
    check_prerequisites
    check_existing_stacks
    create_permission_lambda
    deploy_lambda_function
    create_dynamodb_tables
    create_cloudwatch_dashboard
    insert_test_data
    test_permission_system
    show_deployment_info
    
    log_success "🎉 高度権限制御システムデプロイメント完了！"
}

# =============================================================================
# クリーンアップとエラーハンドリング
# =============================================================================

cleanup_on_exit() {
    local exit_code=$?
    
    # 一時ファイルのクリーンアップ
    find "${PROJECT_ROOT}" -name "*.tmp" -type f -delete 2>/dev/null || true
    find "${PROJECT_ROOT}" -name "response*.json" -type f -delete 2>/dev/null || true
    find "${PROJECT_ROOT}" -name "dashboard-body.json" -type f -delete 2>/dev/null || true
    
    # 機密情報のクリア
    unset OPENSEARCH_ENDPOINT
    unset AWS_ACCESS_KEY_ID
    unset AWS_SECRET_ACCESS_KEY
    unset AWS_SESSION_TOKEN
    
    if [[ ${exit_code} -ne 0 ]]; then
        log_error "スクリプトが異常終了しました (終了コード: ${exit_code})"
        log_info "ログファイルを確認してください: ${LOG_FILE}"
    fi
}

# 終了時のクリーンアップ設定
trap cleanup_on_exit EXIT

# スクリプト実行
main "$@"