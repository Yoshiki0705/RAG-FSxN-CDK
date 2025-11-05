#!/bin/bash

# シンプルなOpenSearchドメイン作成スクリプト

set -euo pipefail

# エラートラップの設定
trap 'echo "❌ エラーが発生しました。行番号: $LINENO" >&2; cleanup_on_error' ERR

# 機密情報のクリア関数
cleanup_on_error() {
    unset MASTER_PASSWORD 2>/dev/null || true
    exit 1
}

# 設定値の外部化
DOMAIN_NAME="${OPENSEARCH_DOMAIN_NAME:-embedding-vector-search}"
REGION="${AWS_REGION:-ap-northeast-1}"

# パスワード生成（ハードコード回避）
generate_secure_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-16
}

MASTER_PASSWORD="${OPENSEARCH_PASSWORD:-$(generate_secure_password)}"

# 入力値検証
validate_inputs() {
    if [[ ! "${DOMAIN_NAME}" =~ ^[a-z][a-z0-9\-]{2,27}$ ]]; then
        echo "❌ エラー: ドメイン名が無効です。小文字、数字、ハイフンのみ使用可能（3-28文字）" >&2
        return 1
    fi
    
    if [[ ! "${REGION}" =~ ^[a-z0-9\-]+$ ]]; then
        echo "❌ エラー: リージョン名が無効です" >&2
        return 1
    fi
    
    if [[ ${#MASTER_PASSWORD} -lt 8 ]]; then
        echo "❌ エラー: パスワードは8文字以上である必要があります" >&2
        return 1
    fi
}

# 入力値検証の実行
validate_inputs

echo "🔍 OpenSearchドメインを作成中: ${DOMAIN_NAME}"

# 既存ドメインの確認
check_existing_domain() {
    if aws opensearch describe-domain --domain-name "${DOMAIN_NAME}" --region "${REGION}" >/dev/null 2>&1; then
        echo "⚠️ ドメインが既に存在します"
        DOMAIN_ENDPOINT=$(aws opensearch describe-domain --domain-name "${DOMAIN_NAME}" --region "${REGION}" --query 'DomainStatus.Endpoint' --output text)
        echo "✅ エンドポイント: https://${DOMAIN_ENDPOINT}"
        return 0
    else
        return 1
    fi
}

# VPC情報の取得
get_vpc_info() {
    local stack_name="TokyoRegion-permission-aware-rag-prod-Networking"
    
    VPC_ID=$(aws cloudformation describe-stack-resources \
        --stack-name "${stack_name}" \
        --query 'StackResources[?ResourceType==`AWS::EC2::VPC`].PhysicalResourceId' \
        --output text --region "${REGION}")
    
    SUBNET_ID=$(aws cloudformation describe-stack-resources \
        --stack-name "${stack_name}" \
        --query 'StackResources[?ResourceType==`AWS::EC2::Subnet` && contains(LogicalResourceId, `Private`)].PhysicalResourceId' \
        --output text --region "${REGION}" | cut -f1)
    
    if [[ -z "${VPC_ID}" || -z "${SUBNET_ID}" ]]; then
        echo "❌ エラー: VPCまたはサブネット情報を取得できませんでした" >&2
        return 1
    fi
    
    echo "📋 VPC: ${VPC_ID}, サブネット: ${SUBNET_ID}"
}

# セキュリティグループの作成
create_security_group() {
    local sg_name="${DOMAIN_NAME}-sg"
    
    SG_ID=$(aws ec2 create-security-group \
        --group-name "${sg_name}" \
        --description "OpenSearch Security Group" \
        --vpc-id "${VPC_ID}" \
        --region "${REGION}" \
        --query 'GroupId' \
        --output text 2>/dev/null || \
    aws ec2 describe-security-groups \
        --filters "Name=group-name,Values=${sg_name}" \
        --query 'SecurityGroups[0].GroupId' \
        --output text --region "${REGION}")
    
    # HTTPS許可（エラーを無視）
    aws ec2 authorize-security-group-ingress \
        --group-id "${SG_ID}" \
        --protocol tcp \
        --port 443 \
        --cidr 10.0.0.0/8 \
        --region "${REGION}" 2>/dev/null || true
    
    echo "🔒 セキュリティグループ作成完了: ${SG_ID}"
}

# OpenSearchドメインの作成
create_opensearch_domain() {
    echo "🚀 OpenSearchドメインを作成中..."
    
    aws opensearch create-domain \
        --domain-name "${DOMAIN_NAME}" \
        --engine-version "OpenSearch_2.5" \
        --cluster-config "InstanceType=t3.small.search,InstanceCount=1,DedicatedMasterEnabled=false" \
        --ebs-options "EBSEnabled=true,VolumeType=gp3,VolumeSize=20" \
        --vpc-options "SubnetIds=${SUBNET_ID},SecurityGroupIds=${SG_ID}" \
        --encryption-at-rest-options "Enabled=true" \
        --node-to-node-encryption-options "Enabled=true" \
        --domain-endpoint-options "EnforceHTTPS=true" \
        --advanced-security-options "Enabled=true,InternalUserDatabaseEnabled=true,MasterUserOptions={MasterUserName=embedding_admin,MasterUserPassword=${MASTER_PASSWORD}}" \
        --region "${REGION}"
    
    echo "⏳ ドメイン作成を開始しました。完了まで10-15分かかります。"
    
    # エンドポイントを取得（作成中でも取得可能）
    sleep 30
    DOMAIN_ENDPOINT=$(aws opensearch describe-domain \
        --domain-name "${DOMAIN_NAME}" \
        --region "${REGION}" \
        --query 'DomainStatus.Endpoint' \
        --output text 2>/dev/null || echo "creating")
}

# メイン処理
if ! check_existing_domain; then
    get_vpc_info
    create_security_group
    create_opensearch_domain
fi

# アカウント情報の取得
get_account_info() {
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
    if [[ -z "${ACCOUNT_ID}" ]]; then
        echo "❌ エラー: AWSアカウント情報を取得できませんでした" >&2
        return 1
    fi
}

# Secrets Managerへの安全な保存
store_password_securely() {
    local secret_name="opensearch-master-password"
    
    echo "🔐 パスワードをSecrets Managerに保存中..."
    
    # 既存シークレットの確認と作成/更新
    if aws secretsmanager describe-secret --secret-id "${secret_name}" --region "${REGION}" >/dev/null 2>&1; then
        aws secretsmanager update-secret \
            --secret-id "${secret_name}" \
            --secret-string "${MASTER_PASSWORD}" \
            --region "${REGION}" >/dev/null
        echo "✅ 既存のシークレットを更新しました"
    else
        aws secretsmanager create-secret \
            --name "${secret_name}" \
            --description "OpenSearch管理者パスワード" \
            --secret-string "${MASTER_PASSWORD}" \
            --region "${REGION}" >/dev/null
        echo "✅ 新しいシークレットを作成しました"
    fi
    
    # パスワード変数をクリア
    unset MASTER_PASSWORD
}

get_account_info
store_password_securely

# FSxファイルシステム情報の取得
get_fsx_info() {
    FSX_ID=$(aws fsx describe-file-systems \
        --query 'FileSystems[?Tags[?Key==`Name` && contains(Value, `permission-aware-rag`)]].FileSystemId' \
        --output text 2>/dev/null || echo "fs-placeholder")
    
    if [[ "${FSX_ID}" == "fs-placeholder" ]]; then
        echo "⚠️ 警告: FSxファイルシステムが見つかりませんでした。プレースホルダーを使用します"
    else
        echo "📁 FSxファイルシステム: ${FSX_ID}"
    fi
}

# 設定ファイルの生成
generate_config_file() {
    local config_dir="templates/embedding-batch-workload-template/config"
    local config_file="${config_dir}/opensearch-external-config.json"
    
    echo "📝 設定ファイルを生成中..."
    
    # ディレクトリの作成（権限設定付き）
    mkdir -p "${config_dir}"
    chmod 755 "${config_dir}"

cat > templates/embedding-batch-workload-template/config/opensearch-external-config.json << EOF
{
  "projectName": "embedding-opensearch-test",
  "environment": "dev",
  "region": "ap-northeast-1",
  "version": "1.0.0",
  "aws": {
    "account": "${ACCOUNT_ID}",
    "profile": "default"
  },
  "stackNaming": {
    "useAgentSteeringRules": true,
    "regionPrefix": "TokyoRegion",
    "stackPrefix": "embedding-opensearch"
  },
  "bedrock": {
    "embeddingModel": {
      "modelId": "amazon.titan-embed-text-v1",
      "dimensions": 1536,
      "maxTokens": 8192
    },
    "textModel": {
      "modelId": "amazon.nova-pro-v1:0",
      "maxTokens": 4096,
      "temperature": 0.1
    },
    "region": "us-east-1"
  },
  "vpc": {
    "mode": "existing",
    "existing": {
      "vpcId": "${VPC_ID:-vpc-placeholder}",
      "privateSubnetIds": ["${SUBNET_ID:-subnet-placeholder}"]
    }
  },
  "fsx": {
    "mode": "existing",
    "existing": {
      "fileSystemId": "${FSX_ID}",
      "volumePath": "/rag-data",
      "mountPoint": "/mnt/fsx-rag-data"
    }
  },
  "batch": {
    "computeEnvironment": {
      "maxvCpus": 100,
      "minvCpus": 0,
      "desiredvCpus": 5,
      "instanceTypes": ["m5.large"],
      "useSpotInstances": true,
      "spotBidPercentage": 50
    },
    "jobQueue": {
      "priority": 100
    },
    "jobDefinitions": {
      "documentProcessing": {
        "vcpus": 2,
        "memoryMiB": 4096,
        "timeoutSeconds": 3600,
        "retryAttempts": 2
      },
      "embeddingGeneration": {
        "vcpus": 4,
        "memoryMiB": 8192,
        "timeoutSeconds": 7200,
        "retryAttempts": 3
      },
      "ragQueryProcessing": {
        "vcpus": 4,
        "memoryMiB": 8192,
        "timeoutSeconds": 3600,
        "retryAttempts": 2
      }
    }
  },
  "storage": {
    "s3": {
      "enableVersioning": true,
      "enableEncryption": true
    },
    "dynamodb": {
      "billingMode": "PAY_PER_REQUEST",
      "enablePointInTimeRecovery": true,
      "enableEncryption": true
    }
  },
  "vectorDatabases": {
    "opensearch": {
      "enabled": true,
      "mode": "external",
      "external": {
        "domainEndpoint": "https://${DOMAIN_ENDPOINT}",
        "domainName": "${DOMAIN_NAME}",
        "indexName": "embeddings",
        "authentication": {
          "type": "basic",
          "username": "embedding_admin",
          "passwordSecretArn": "arn:aws:secretsmanager:${REGION}:${ACCOUNT_ID}:secret:opensearch-master-password"
        }
      }
    }
  },
  "monitoring": {
    "cloudWatch": {
      "enableDetailedMonitoring": true,
      "createDashboard": false,
      "logRetentionDays": 30,
      "enableInsights": false
    },
    "alerting": {
      "enableAlerts": false,
      "emailEndpoints": []
    },
    "xray": {
      "enableTracing": false,
      "samplingRate": 0.1
    }
  },
  "security": {
    "iam": {
      "enableMFA": false
    },
    "network": {
      "enableWAF": false,
      "allowedCIDRs": ["10.0.0.0/8"],
      "enableVPCFlowLogs": false
    },
    "encryption": {
      "enableKMSEncryption": true,
      "enableS3Encryption": true,
      "enableDynamoDBEncryption": true
    },
    "compliance": {
      "enableGuardDuty": false,
      "enableSecurityHub": false,
      "enableConfig": false,
      "enableCloudTrail": false
    }
  },
  "costOptimization": {
    "autoScaling": {
      "enableAutoScaling": false
    },
    "resourceTagging": {
      "costCenter": "ai-research",
      "project": "embedding-opensearch-test",
      "owner": "data-engineering-team",
      "environment": "dev"
    },
    "budgets": {
      "enableBudgetAlerts": false
    }
  },
  "development": {
    "debugging": {
      "enableDebugLogs": true,
      "enableVerboseOutput": true,
      "enablePerformanceMetrics": true
    },
    "testing": {
      "enableTestMode": true,
      "mockExternalServices": false
    },
    "deployment": {
      "enableHotswap": false,
      "enableRollback": true,
      "deploymentTimeout": 45
    }
  },
  "features": {
    "enableDocumentProcessing": true,
    "enableEmbeddingGeneration": true,
    "enableRagQueryProcessing": true,
    "enablePermissionFiltering": true,
    "enableMultiLanguageSupport": false,
    "enableAdvancedAnalytics": false
  }
}
EOF

    # ファイル権限の設定（機密情報を含むため）
    chmod 600 "${config_file}"
    
    echo "✅ 設定ファイルが作成されました: ${config_file}"
}

# 最終結果の表示
show_results() {
    echo ""
    echo "🎉 OpenSearchドメイン設定完了"
    echo "================================"
    echo "ドメイン名: ${DOMAIN_NAME}"
    echo "エンドポイント: https://${DOMAIN_ENDPOINT}"
    echo "ユーザー名: embedding_admin"
    echo "パスワード: Secrets Managerに保存済み"
    echo "設定ファイル: templates/embedding-batch-workload-template/config/opensearch-external-config.json"
    echo ""
    echo "次のステップ:"
    echo "  ./scripts/unified-deploy.sh --config config/opensearch-external-config.json"
    echo ""
}

# メイン実行フロー
get_fsx_info
generate_config_file
show_results

# 最終クリーンアップ
trap - ERR
echo "✅ スクリプト実行完了"