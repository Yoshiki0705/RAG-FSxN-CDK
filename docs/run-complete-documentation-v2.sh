#!/bin/bash

# 完全ドキュメント生成システム v2.0 実行スクリプト
# Permission-aware RAG System with FSx for NetApp ONTAP

set -euo pipefail

# スクリプトの場所を取得
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# ログ設定
LOG_FILE="${SCRIPT_DIR}/documentation-generation-v2.log"
exec 1> >(tee -a "${LOG_FILE}")
exec 2> >(tee -a "${LOG_FILE}" >&2)

echo "📚 完全ドキュメント生成システム v2.0 開始"
echo "実行時刻: $(date '+%Y-%m-%d %H:%M:%S')"
echo "プロジェクトルート: ${PROJECT_ROOT}"
echo ""

# 環境変数の設定
export PROJECT_NAME="Permission-aware RAG System"
export PROJECT_VERSION="2.0.0"
export OUTPUT_DIR="${PROJECT_ROOT}/generated-docs-v2"
export GENERATE_API_DOCS="true"
export GENERATE_ARCH_DIAGRAMS="true"
export GENERATE_TEST_REPORTS="true"
export GENERATE_OPS_GUIDES="true"
export INCLUDE_CODE_EXAMPLES="true"
export INCLUDE_SCREENSHOTS="false"
export OUTPUT_FORMATS="markdown,html"
export LANGUAGES="ja,en"

echo "🔧 環境変数設定:"
echo "   PROJECT_NAME: ${PROJECT_NAME}"
echo "   PROJECT_VERSION: ${PROJECT_VERSION}"
echo "   OUTPUT_DIR: ${OUTPUT_DIR}"
echo "   LANGUAGES: ${LANGUAGES}"
echo "   OUTPUT_FORMATS: ${OUTPUT_FORMATS}"
echo ""

# 作業ディレクトリの移動
cd "${PROJECT_ROOT}"

# Node.jsバージョンの確認
echo "📋 環境確認中..."
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    echo "   Node.js: ${NODE_VERSION}"
else
    echo "❌ Node.jsがインストールされていません"
    exit 1
fi

# TypeScriptコンパイラの確認
if command -v npx >/dev/null 2>&1; then
    echo "   npx: 利用可能"
else
    echo "❌ npxが利用できません"
    exit 1
fi

echo ""

# 既存の出力ディレクトリをクリーンアップ
if [ -d "${OUTPUT_DIR}" ]; then
    echo "🧹 既存の出力ディレクトリをクリーンアップ中..."
    rm -rf "${OUTPUT_DIR}"
    echo "   ✅ クリーンアップ完了"
fi

echo ""

# TypeScriptファイルのコンパイルと実行
echo "🚀 ドキュメント生成実行中..."
echo ""

# TypeScriptファイルを直接実行
if npx ts-node "${SCRIPT_DIR}/generators/complete-documentation-generator-v2.ts"; then
    echo ""
    echo "✅ ドキュメント生成完了"
    
    # 生成結果の確認
    if [ -f "${OUTPUT_DIR}/generation-report.json" ]; then
        echo ""
        echo "📊 生成レポート:"
        cat "${OUTPUT_DIR}/generation-report.json" | jq '.' 2>/dev/null || cat "${OUTPUT_DIR}/generation-report.json"
    fi
    
    # 生成されたファイルの一覧表示
    echo ""
    echo "📁 生成されたファイル一覧:"
    if [ -d "${OUTPUT_DIR}" ]; then
        find "${OUTPUT_DIR}" -type f -name "*.md" -o -name "*.html" -o -name "*.json" | sort | while read -r file; do
            relative_path="${file#${OUTPUT_DIR}/}"
            file_size=$(du -h "${file}" | cut -f1)
            echo "   ${relative_path} (${file_size})"
        done
    fi
    
    echo ""
    echo "🎯 次のステップ:"
    echo "   1. 生成されたドキュメントを確認:"
    echo "      open ${OUTPUT_DIR}/README.md"
    echo "   2. HTMLバージョンをブラウザで確認:"
    echo "      open ${OUTPUT_DIR}/ja/api/index.html"
    echo "   3. 必要に応じて手動調整"
    echo "   4. チームメンバーへの共有"
    echo ""
    
else
    echo ""
    echo "❌ ドキュメント生成に失敗しました"
    echo ""
    echo "🔧 トラブルシューティング:"
    echo "   1. ログファイルを確認: ${LOG_FILE}"
    echo "   2. TypeScriptの依存関係を確認: npm install"
    echo "   3. 権限を確認: ls -la ${SCRIPT_DIR}/generators/"
    echo "   4. Node.jsバージョンを確認: node --version"
    echo ""
    exit 1
fi

echo ""
echo "📝 ログファイル: ${LOG_FILE}"
echo "完了時刻: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""