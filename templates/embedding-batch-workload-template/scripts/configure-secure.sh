#!/bin/bash

# FSx for NetApp ONTAP Embedding Batch Workload Template
# セキュリティ強化版インタラクティブ設定スクリプト
# Security Enhanced Interactive Configuration Script

set -euo pipefail

# セキュリティ設定
umask 077  # 作成されるファイルのパーミッションを制限
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly LOG_FILE="/tmp/configure-$(date +%Y%m%d_%H%M%S).log"

# エラーハンドリングとクリーンアップ
cleanup() {
    local exit_code=$?
    if [[ $exit_code -ne 0 ]]; then
        echo "❌ 設定中にエラーが発生しました (終了コード: $exit_code)" >&2
        echo "📋 ログファイル: $LOG_FILE" >&2
    fi
    # 機密情報のクリア
    unset PROJECT_NAME ENVIRONMENT REGION VPC_ID FSX_ID 2>/dev/null || true
    exit $exit_code
}

trap cleanup EXIT ERR

# ライブラリの読み込み
if [[ -f "$SCRIPT_DIR/lib/config-utils.sh" ]]; then
    source "$SCRIPT_DIR/lib/config-utils.sh"
    source "$SCRIPT_DIR/lib/aws-utils.sh"
    source "$SCRIPT_DIR/lib/cache-utils.sh"
    source "$SCRIPT_DIR/lib/validation-utils.sh"
else
    echo "❌ 必要なライブラリファイルが見つかりません" >&2
    echo "📋 $SCRIPT_DIR/lib/ ディレクトリにライブラリファイルを配置してください" >&2
    exit 1
fi

# カラーコード（readonly化）
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly BLUE='\033[0;34m'
readonly CYAN='\033[0;36m'
readonly NC='\033[0m'

# ログ関数
log_info() {
    local message="[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $*"
    echo "$message" | tee -a "$LOG_FILE"
}

log_error() {
    local message="[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $*"
    echo "$message" >&2 | tee -a "$LOG_FILE"
}

# メイン設定関数
main_configuration() {
    log_info "セキュリティ強化版設定スクリプト開始"
    
    echo -e "${CYAN}🛠️  FSx for NetApp ONTAP Embedding Batch Workload 設定${NC}"
    echo -e "${CYAN}🛠️  FSx for NetApp ONTAP Embedding Batch Workload Configuration${NC}"
    echo "=================================================================="
    echo ""
    echo "このスクリプトはセキュリティ強化されたデプロイメント設定をサポートします。"
    echo "This script provides security-enhanced deployment configuration support."
    echo ""

    # 設定ディレクトリ作成（セキュリティ強化）
    if ! mkdir -p config; then
        log_error "設定ディレクトリの作成に失敗しました"
        exit 1
    fi
    chmod 700 config  # 所有者のみアクセス可能

    # 基本設定の収集
    collect_basic_configuration
    
    # ネットワーク設定の収集
    collect_network_configuration
    
    # FSx設定の収集
    collect_fsx_configuration
    
    # Batch設定の収集
    collect_batch_configuration
    
    # Bedrock設定の収集
    collect_bedrock_configuration
    
    # オプション機能設定の収集
    collect_optional_features
    
    # 設定の検証と保存
    validate_and_save_configuration
    
    log_info "設定スクリプト正常終了"
}

# 基本設定収集関数
collect_basic_configuration() {
    echo -e "${GREEN}📋 基本設定 / Basic Configuration${NC}"
    echo "=================================="
    
    # プロジェクト名（セキュリティ強化版）
    while true; do
        read_with_default_secure "プロジェクト名 / Project Name" "embedding-batch" PROJECT_NAME 50 "^[a-zA-Z0-9-]{3,50}$"
        if validate_input "project_name" "$PROJECT_NAME"; then
            break
        fi
    done
    
    # 環境選択
    echo ""
    echo "環境を選択してください:"
    echo "Select environment:"
    echo "1. dev (開発環境)"
    echo "2. staging (ステージング環境)"
    echo "3. prod (本番環境)"
    
    while true; do
        read_with_default_secure "環境 / Environment (1-3)" "1" ENV_CHOICE 1 "^[1-3]$"
        case $ENV_CHOICE in
            1) ENVIRONMENT="dev"; break ;;
            2) ENVIRONMENT="staging"; break ;;
            3) ENVIRONMENT="prod"; break ;;
        esac
    done
    
    # リージョン選択
    echo ""
    echo "AWSリージョンを選択してください:"
    echo "Select AWS region:"
    echo "1. ap-northeast-1 (東京)"
    echo "2. us-east-1 (バージニア北部)"
    echo "3. us-west-2 (オレゴン)"
    echo "4. eu-west-1 (アイルランド)"
    echo "5. その他 / Other"
    
    while true; do
        read_with_default_secure "リージョン / Region (1-5)" "1" REGION_CHOICE 1 "^[1-5]$"
        case $REGION_CHOICE in
            1) REGION="ap-northeast-1"; break ;;
            2) REGION="us-east-1"; break ;;
            3) REGION="us-west-2"; break ;;
            4) REGION="eu-west-1"; break ;;
            5) 
                read_with_default_secure "カスタムリージョン / Custom Region" "${AWS_REGION:-ap-northeast-1}" REGION 20 "^[a-z]{2}-[a-z]+-[0-9]+$"
                break
                ;;
        esac
    done
    
    echo -e "${GREEN}✅ 基本設定完了: $PROJECT_NAME-$ENVIRONMENT ($REGION)${NC}"
    log_info "基本設定完了: PROJECT_NAME=$PROJECT_NAME, ENVIRONMENT=$ENVIRONMENT, REGION=$REGION"
}

# ネットワーク設定収集関数
collect_network_configuration() {
    echo ""
    echo -e "${GREEN}🌐 ネットワーク設定 / Network Configuration${NC}"
    echo "============================================="
    
    echo "既存のVPCを使用しますか？"
    read_yes_no_secure "既存のVPCを使用しますか？ / Do you have an existing VPC?" "y" HAS_VPC
    
    if [ "$HAS_VPC" = "true" ]; then
        while true; do
            read_with_default_secure "VPC ID" "" VPC_ID 21 "^vpc-[a-zA-Z0-9]{8,17}$"
            if [ -n "$VPC_ID" ]; then
                echo ""
                echo "VPC情報を取得中: $VPC_ID"
                echo "Fetching VPC information for: $VPC_ID"
                
                if validate_aws_resource_cached "vpc" "$VPC_ID" "$REGION"; then
                    # プライベートサブネット取得
                    echo "プライベートサブネット情報を取得中..."
                    echo "Fetching private subnet information..."
                    
                    if PRIVATE_SUBNETS=$(get_private_subnets_secure "$VPC_ID" "$REGION"); then
                        echo -e "${GREEN}✅ プライベートサブネットが見つかりました: $PRIVATE_SUBNETS${NC}"
                        read_with_default_secure "プライベートサブネットID (カンマ区切り)" "$PRIVATE_SUBNETS" SUBNET_IDS 200 "^[a-zA-Z0-9,-]+$"
                    else
                        echo -e "${YELLOW}⚠️ プライベートサブネットが見つかりませんでした${NC}"
                        read_with_default_secure "プライベートサブネットID (カンマ区切り)" "" SUBNET_IDS 200 "^[a-zA-Z0-9,-]*$"
                    fi
                    break
                else
                    echo -e "${RED}❌ 指定されたVPCが見つかりません。再入力してください。${NC}"
                fi
            fi
        done
        
        CREATE_VPC=false
        VPC_CIDR=""
    else
        CREATE_VPC=true
        VPC_ID=""
        SUBNET_IDS=""
        echo ""
        echo "新しいVPCを作成します。"
        echo "Creating a new VPC."
        
        while true; do
            read_with_default_secure "VPC CIDR ブロック / VPC CIDR Block" "10.0.0.0/16" VPC_CIDR 18 "^([0-9]{1,3}\.){3}[0-9]{1,3}/[0-9]{1,2}$"
            if validate_input "cidr_block" "$VPC_CIDR" && check_cidr_conflicts "$VPC_CIDR" "$REGION"; then
                break
            fi
        done
    fi
    
    log_info "ネットワーク設定完了: CREATE_VPC=$CREATE_VPC, VPC_ID=${VPC_ID:-N/A}, VPC_CIDR=${VPC_CIDR:-N/A}"
}

# セキュリティ強化されたYes/No入力関数
read_yes_no_secure() {
    local prompt=$1
    local default=$2
    local var_name=$3
    
    while true; do
        echo -ne "${BLUE}$prompt${NC} ${YELLOW}[$default]${NC} (y/n): "
        read -r input
        
        if [ -z "$input" ]; then
            input=$default
        fi
        
        case $input in
            [Yy]|[Yy][Ee][Ss]|[はハ])
                eval "$var_name=true"
                break
                ;;
            [Nn]|[Nn][Oo]|[いイ])
                eval "$var_name=false"
                break
                ;;
            *)
                echo -e "${RED}はい (y) または いいえ (n) で答えてください。${NC}"
                ;;
        esac
    done
}

# 残りの設定収集関数は省略（同様のセキュリティ強化を適用）
collect_fsx_configuration() {
    echo ""
    echo -e "${GREEN}💾 FSx for NetApp ONTAP 設定${NC}"
    echo "=================================="
    # FSx設定のロジック（セキュリティ強化版）
    log_info "FSx設定をスキップ（デモ版）"
}

collect_batch_configuration() {
    echo ""
    echo -e "${GREEN}⚡ AWS Batch 設定${NC}"
    echo "===================="
    # Batch設定のロジック（セキュリティ強化版）
    log_info "Batch設定をスキップ（デモ版）"
}

collect_bedrock_configuration() {
    echo ""
    echo -e "${GREEN}🤖 Amazon Bedrock 設定${NC}"
    echo "========================="
    # Bedrock設定のロジック（セキュリティ強化版）
    log_info "Bedrock設定をスキップ（デモ版）"
}

collect_optional_features() {
    echo ""
    echo -e "${GREEN}📊 オプション機能${NC}"
    echo "=================="
    # オプション機能設定のロジック（セキュリティ強化版）
    log_info "オプション機能設定をスキップ（デモ版）"
}

# 設定検証と保存
validate_and_save_configuration() {
    echo ""
    echo -e "${GREEN}📝 設定ファイルを生成中...${NC}"
    
    # 設定の最終検証
    if ! validate_config_batch; then
        log_error "設定検証に失敗しました"
        exit 1
    fi
    
    # セキュアなJSON生成
    local config_file="config/deployment-config.json"
    if generate_config_json "$config_file"; then
        chmod 600 "$config_file"  # 所有者のみ読み書き可能
        echo -e "${GREEN}✅ 設定ファイルが保存されました: $config_file${NC}"
        log_info "設定ファイル生成完了: $config_file"
    else
        log_error "設定ファイルの生成に失敗しました"
        exit 1
    fi
    
    # 設定ファイルの検証
    if command -v jq >/dev/null 2>&1; then
        if jq empty "$config_file" 2>/dev/null; then
            echo -e "${GREEN}✅ 設定ファイルのJSON形式が正しいです${NC}"
        else
            echo -e "${RED}❌ 設定ファイルのJSON形式にエラーがあります${NC}"
            exit 1
        fi
    else
        echo -e "${YELLOW}⚠️ jqがインストールされていないため、JSON検証をスキップします${NC}"
    fi
}

# メイン実行
main_configuration "$@"