#!/bin/bash

# 完全なドキュメント生成システムの実行スクリプト
# Permission-aware RAG System用

set -euo pipefail

# 設定の外部化と検証
readonly PROJECT_NAME="${PROJECT_NAME:-Permission-aware RAG System}"
readonly PROJECT_VERSION="${PROJECT_VERSION:-1.0.0}"
readonly OUTPUT_DIR="${OUTPUT_DIR:-./generated-docs}"
readonly TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 入力値検証
validate_environment() {
    # プロジェクト名の検証（パストラバーサル攻撃防止）
    if [[ "$PROJECT_NAME" =~ \.\.|/ ]]; then
        log_error "不正なプロジェクト名が検出されました: $PROJECT_NAME"
        exit 1
    fi
    
    # 出力ディレクトリの検証
    if [[ "$OUTPUT_DIR" =~ \.\.|^/ ]]; then
        log_error "不正な出力ディレクトリパスが検出されました: $OUTPUT_DIR"
        exit 1
    fi
    
    # 必要なコマンドの存在確認
    local required_commands=("node" "find" "du" "mkdir" "cp")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" >/dev/null 2>&1; then
            log_error "必要なコマンドが見つかりません: $cmd"
            exit 1
        fi
    done
}

# 色付きログ関数（タイムスタンプ付き）
log_info() {
    echo -e "\033[34m[INFO $(date '+%H:%M:%S')]\033[0m $1" >&2
}

log_success() {
    echo -e "\033[32m[SUCCESS $(date '+%H:%M:%S')]\033[0m $1" >&2
}

log_warning() {
    echo -e "\033[33m[WARNING $(date '+%H:%M:%S')]\033[0m $1" >&2
}

log_error() {
    echo -e "\033[31m[ERROR $(date '+%H:%M:%S')]\033[0m $1" >&2
}

# クリーンアップ関数
cleanup() {
    local exit_code=$?
    if [[ $exit_code -ne 0 ]]; then
        log_error "スクリプト実行中にエラーが発生しました（終了コード: $exit_code）"
        
        # 部分的に生成されたファイルのクリーンアップ
        if [[ -d "$OUTPUT_DIR" && ! -f "$OUTPUT_DIR/.generation_complete" ]]; then
            log_info "不完全な生成ファイルをクリーンアップ中..."
            rm -rf "$OUTPUT_DIR"
        fi
    fi
    
    # 機密情報のクリア
    unset PROJECT_NAME PROJECT_VERSION OUTPUT_DIR
}

# 安全なディレクトリ作成
safe_mkdir() {
    local dir_path="$1"
    
    # パストラバーサル攻撃防止
    if [[ "$dir_path" =~ \.\. ]]; then
        log_error "不正なディレクトリパス: $dir_path"
        return 1
    fi
    
    mkdir -p "$dir_path" && chmod 755 "$dir_path"
}

# メイン処理
main() {
    # 環境検証
    validate_environment
    
    log_info "📚 ドキュメント生成システムを開始します..."
    echo "======================================================="
    echo ""
    
    log_info "🔧 設定情報:"
    echo "   プロジェクト名: $PROJECT_NAME"
    echo "   バージョン: $PROJECT_VERSION"
    echo "   出力ディレクトリ: $OUTPUT_DIR"
    echo "   実行時刻: $(date)"
    echo "   スクリプトディレクトリ: $SCRIPT_DIR"
    echo ""
    
    # 前回の出力をバックアップ（安全性向上）
    if [[ -d "$OUTPUT_DIR" ]]; then
        log_info "📦 既存の出力をバックアップ中..."
        local backup_dir="${OUTPUT_DIR}_backup_${TIMESTAMP}"
        
        if mv "$OUTPUT_DIR" "$backup_dir"; then
            log_success "バックアップ完了: $backup_dir"
        else
            log_error "バックアップに失敗しました"
            exit 1
        fi
    fi
    
    # 出力ディレクトリの作成（安全性向上）
    log_info "📁 出力ディレクトリを準備中..."
    local subdirs=("api" "architecture" "tests" "operations" "assets")
    
    if safe_mkdir "$OUTPUT_DIR"; then
        for subdir in "${subdirs[@]}"; do
            safe_mkdir "$OUTPUT_DIR/$subdir" || {
                log_error "サブディレクトリ作成に失敗: $subdir"
                exit 1
            }
        done
        log_success "ディレクトリ準備完了"
    else
        log_error "出力ディレクトリの作成に失敗しました"
        exit 1
    fi
    
    # 環境変数の設定
    export PROJECT_NAME_ENV="$PROJECT_NAME"
    export PROJECT_VERSION_ENV="$PROJECT_VERSION"
    export OUTPUT_DIR_ENV="$OUTPUT_DIR"
    
    # シンプル版の実行（エラーハンドリング強化）
    log_info "📖 基本運用ガイドを生成中..."
    
    # Node.jsスクリプトの存在確認
    local simple_script="$SCRIPT_DIR/simple-generation-test.js"
    if [[ ! -f "$simple_script" ]]; then
        log_error "基本生成スクリプトが見つかりません: $simple_script"
        exit 1
    fi
    
    if timeout 300 node "$simple_script"; then
        log_success "基本運用ガイド生成完了"
        
        # 生成されたファイルを安全に移動
        local temp_docs="./test-simple-docs/operations"
        if [[ -d "$temp_docs" ]]; then
            if cp -r "$temp_docs"/* "$OUTPUT_DIR/operations/" 2>/dev/null; then
                rm -rf "./test-simple-docs"
                log_success "運用ガイドを正しい場所に配置完了"
            else
                log_warning "ファイル移動で一部エラーが発生しましたが、継続します"
            fi
        else
            log_warning "期待される出力ディレクトリが見つかりません: $temp_docs"
        fi
    else
        log_error "基本運用ガイド生成に失敗しました（タイムアウト: 300秒）"
        exit 1
    fi
    
    # TypeScript版の実行を試行（タイムアウト付き）
    log_info "🔄 高度なドキュメント生成を試行中..."
    
    if command -v npx >/dev/null 2>&1; then
        local ts_script="$SCRIPT_DIR/generate-documentation.ts"
        if [[ -f "$ts_script" ]]; then
            if timeout 600 npx ts-node "$ts_script" 2>/dev/null; then
                log_success "高度なドキュメント生成完了"
            else
                log_warning "高度なドキュメント生成をスキップ（エラーまたはタイムアウト）"
            fi
        else
            log_warning "TypeScriptスクリプトが見つかりません: $ts_script"
        fi
    else
        log_warning "npxが見つかりません。基本版のみで継続します。"
    fi
    
    # 追加ドキュメントの生成
    log_info "📋 追加ドキュメントを生成中..."
    
    # README.mdの生成
    cat > "$OUTPUT_DIR/README.md" << 'EOF'
# Permission-aware RAG System ドキュメント

## 📚 ドキュメント構成

### 🔗 API ドキュメント
- [API リファレンス](./api/README.md)
- [エンドポイント仕様](./api/endpoints.md)
- [認証・認可](./api/authentication.md)

### 🏗️ アーキテクチャ
- [システム概要](./architecture/overview.md)
- [コンポーネント図](./architecture/components.md)
- [データフロー](./architecture/data-flow.md)

### 📊 テスト
- [テスト戦略](./tests/strategy.md)
- [テストレポート](./tests/reports.md)
- [カバレッジ](./tests/coverage.md)

### 📖 運用ガイド
- [トラブルシューティング](./operations/troubleshooting.md)
- [運用チェックリスト](./operations/checklist.md)
- [監視・アラート](./operations/monitoring.md)

## 🚀 クイックスタート

1. [開発者セットアップガイド](../DEVELOPER_SETUP_GUIDE.md)を参照
2. [デプロイメントガイド](../DEPLOYMENT_GUIDE.md)を参照
3. 運用ガイドで日常的な運用手順を確認

## 📞 サポート

- 技術的な問題: 開発チーム
- 運用に関する問題: 運用チーム
- 緊急時: エスカレーション手順を参照

---
生成日時: $(date)
バージョン: $PROJECT_VERSION
EOF
    
    log_success "README.md生成完了"
    
    # 生成完了マーカーの作成
    touch "$OUTPUT_DIR/.generation_complete"
    
    # 生成統計の表示（エラーハンドリング付き）
    log_info "📊 生成結果:"
    if [[ -d "$OUTPUT_DIR" ]]; then
        local file_count dir_count total_size
        
        file_count=$(find "$OUTPUT_DIR" -type f 2>/dev/null | wc -l || echo "0")
        dir_count=$(find "$OUTPUT_DIR" -type d 2>/dev/null | wc -l || echo "0")
        total_size=$(du -sh "$OUTPUT_DIR" 2>/dev/null | cut -f1 || echo "不明")
        
        echo "   📄 総ファイル数: $file_count"
        echo "   📁 総ディレクトリ数: $dir_count"
        echo "   💾 総サイズ: $total_size"
        echo ""
        
        log_info "📋 生成されたファイル一覧:"
        if find "$OUTPUT_DIR" -type f -name "*.md" 2>/dev/null | sort | while IFS= read -r file; do
            echo "   - ${file#$OUTPUT_DIR/}"
        done; then
            :  # 成功時は何もしない
        else
            log_warning "ファイル一覧の取得で問題が発生しました"
        fi
    else
        log_error "出力ディレクトリが存在しません: $OUTPUT_DIR"
        exit 1
    fi
    
    echo ""
    log_success "🎉 ドキュメント生成が完了しました！"
    echo "======================================================="
    echo ""
    log_info "📁 生成されたドキュメント: $(realpath "$OUTPUT_DIR")"
    echo ""
    log_info "🎯 次のステップ:"
    echo "   1. 生成されたドキュメントの内容を確認"
    echo "   2. 必要に応じて手動で内容を調整"
    echo "   3. ドキュメントをWebサーバーまたはWikiに配置"
    echo "   4. チームメンバーに共有"
    echo ""
}

# エラーハンドリングとクリーンアップ
trap cleanup EXIT
trap 'cleanup; exit 130' INT  # Ctrl+C
trap 'cleanup; exit 143' TERM # SIGTERM

# メイン処理の実行
main "$@"