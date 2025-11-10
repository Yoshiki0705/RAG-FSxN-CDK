#!/bin/bash

# 基本同期スクリプト

EC2_HOST="ubuntu@ec2-54-235-34-127.compute-1.amazonaws.com"
EC2_KEY="/Users/yoshiki/Downloads/Archive/system-files/fujiwara-useast1.pem"
EC2_DIR="/home/ubuntu/rag/Permission-aware-RAG-FSxN-CDK-master"

echo "🔐 高度権限制御システム同期開始..."

# SSH接続テスト
echo "🔍 EC2接続確認..."
ssh -i "${EC2_KEY}" "${EC2_HOST}" "echo 'SSH接続成功'" || exit 1
echo "✅ EC2接続確認完了"

# ファイル同期
echo "📁 ファイル同期開始..."

# ディレクトリ作成
ssh -i "${EC2_KEY}" "${EC2_HOST}" "mkdir -p ${EC2_DIR}/lib/modules/enterprise/{interfaces,constructs,configs}"
ssh -i "${EC2_KEY}" "${EC2_HOST}" "mkdir -p ${EC2_DIR}/lib/stacks/integrated"
ssh -i "${EC2_KEY}" "${EC2_HOST}" "mkdir -p ${EC2_DIR}/lib/config/environments"
ssh -i "${EC2_KEY}" "${EC2_HOST}" "mkdir -p ${EC2_DIR}/development/scripts/{testing,deployment}"
ssh -i "${EC2_KEY}" "${EC2_HOST}" "mkdir -p ${EC2_DIR}/development/docs/{guides,reports}"

# ファイル転送
scp -i "${EC2_KEY}" "lib/modules/enterprise/interfaces/permission-config.ts" "${EC2_HOST}:${EC2_DIR}/lib/modules/enterprise/interfaces/"
scp -i "${EC2_KEY}" "lib/modules/enterprise/constructs/advanced-permission-filter-engine.ts" "${EC2_HOST}:${EC2_DIR}/lib/modules/enterprise/constructs/"
scp -i "${EC2_KEY}" "lib/modules/enterprise/configs/advanced-permission-config.ts" "${EC2_HOST}:${EC2_DIR}/lib/modules/enterprise/configs/"
scp -i "${EC2_KEY}" "lib/stacks/integrated/advanced-permission-stack.ts" "${EC2_HOST}:${EC2_DIR}/lib/stacks/integrated/"
scp -i "${EC2_KEY}" "lib/stacks/integrated/main-deployment-stack.ts" "${EC2_HOST}:${EC2_DIR}/lib/stacks/integrated/"
scp -i "${EC2_KEY}" "lib/stacks/integrated/index.ts" "${EC2_HOST}:${EC2_DIR}/lib/stacks/integrated/"
scp -i "${EC2_KEY}" "lib/config/environments/advanced-permission-deployment-config.ts" "${EC2_HOST}:${EC2_DIR}/lib/config/environments/"
scp -i "${EC2_KEY}" "development/scripts/testing/advanced-permission-control-test.py" "${EC2_HOST}:${EC2_DIR}/development/scripts/testing/"
scp -i "${EC2_KEY}" "development/scripts/deployment/deploy-advanced-permission-system.sh" "${EC2_HOST}:${EC2_DIR}/development/scripts/deployment/"
scp -i "${EC2_KEY}" "development/docs/guides/advanced-permission-deployment-guide.md" "${EC2_HOST}:${EC2_DIR}/development/docs/guides/"
scp -i "${EC2_KEY}" "README.md" "${EC2_HOST}:${EC2_DIR}/"

echo "✅ ファイル同期完了"

# 権限設定
ssh -i "${EC2_KEY}" "${EC2_HOST}" "chmod +x ${EC2_DIR}/development/scripts/deployment/deploy-advanced-permission-system.sh"

# 確認
echo "🔍 EC2環境確認..."
ssh -i "${EC2_KEY}" "${EC2_HOST}" "
    cd ${EC2_DIR}
    echo '✅ プロジェクトディレクトリ: $(pwd)'
    
    if [[ -f 'lib/stacks/integrated/advanced-permission-stack.ts' ]]; then
        echo '✅ AdvancedPermissionStack: 存在'
    fi
    
    if [[ -f 'development/scripts/deployment/deploy-advanced-permission-system.sh' ]]; then
        echo '✅ デプロイメントスクリプト: 存在・実行可能'
    fi
"

echo ""
echo "🎉 高度権限制御システム同期完了！"
echo ""
echo "🚀 次のステップ:"
echo "  1. フロントエンド統合 - Next.jsアプリケーションとの連携"
echo "  2. EC2でのデプロイメント実行:"
echo "     ssh -i ${EC2_KEY} ${EC2_HOST}"
echo "     cd ${EC2_DIR}"
echo "     ./development/scripts/deployment/deploy-advanced-permission-system.sh -e dev -o https://search-example.ap-northeast-1.es.amazonaws.com"
echo ""