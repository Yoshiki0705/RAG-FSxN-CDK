#!/bin/bash
# SQLite UNIQUE制約エラー負荷試験用のユーザーデータスクリプト

set -euo pipefail

# エラートラップ設定
trap 'echo "❌ エラー: 行 $LINENO でスクリプトが失敗しました" >&2; exit 1' ERR

# ログ関数
log_info() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $*"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $*" >&2
}

log_info "SQLite負荷試験環境の初期化を開始します"

# システム更新
log_info "システム更新中..."
dnf update -y

# 必要なパッケージのインストール
log_info "システムパッケージをインストール中..."
if ! dnf install -y \
    sqlite \
    python3 \
    python3-pip \
    git \
    htop \
    iotop \
    nfs-utils \
    stress-ng \
    fio; then
    log_error "システムパッケージのインストールに失敗しました"
    exit 1
fi

# Python依存関係のインストール
log_info "Python依存関係をインストール中..."
# 注意: sqlite3, threading, multiprocessingは標準ライブラリのため不要
if ! pip3 install \
    psutil \
    boto3; then
    log_error "Python依存関係のインストールに失敗しました"
    exit 1
fi

# 作業ディレクトリの作成
log_info "作業ディレクトリを作成中..."
readonly WORK_DIR="/opt/sqlite-load-test"
readonly MOUNT_DIR="/mnt/fsx-sqlite"

if ! mkdir -p "$WORK_DIR" "$MOUNT_DIR"; then
    log_error "作業ディレクトリの作成に失敗しました"
    exit 1
fi

# セキュリティ: 適切な権限設定
chmod 755 "$WORK_DIR"
chmod 755 "$MOUNT_DIR"

# 負荷試験スクリプトの作成
cat > /opt/sqlite-load-test/unique_constraint_test.py << 'EOF'
#!/usr/bin/env python3
"""
SQLite UNIQUE制約エラー負荷試験スクリプト
FSx for ONTAP上でSQLiteデータベースに対して並行書き込みを実行し、
UNIQUE制約エラーを意図的に発生させて性能を測定する
"""

import sqlite3
import threading
import time
import random
import os
import sys
import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
import multiprocessing
import psutil
from pathlib import Path

# ログ設定
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('/opt/sqlite-load-test/test.log')
    ]
)

class SQLiteLoadTester:
    def __init__(self, db_path, num_threads=10, num_operations=1000):
        self.db_path = db_path
        self.num_threads = num_threads
        self.num_operations = num_operations
        self.success_count = 0
        self.error_count = 0
        self.unique_error_count = 0
        self.lock = threading.Lock()
        
    def setup_database(self):
        """データベースとテーブルの初期化"""
        try:
            # ディレクトリが存在しない場合は作成
            Path(self.db_path).parent.mkdir(parents=True, exist_ok=True)
            
            with sqlite3.connect(self.db_path, timeout=30.0) as conn:
                cursor = conn.cursor()
                
                # WALモードの設定（並行性向上）
                cursor.execute('PRAGMA journal_mode=WAL')
                cursor.execute('PRAGMA synchronous=NORMAL')
                cursor.execute('PRAGMA cache_size=10000')
                cursor.execute('PRAGMA temp_store=memory')
                
                # テストテーブルの作成（UNIQUE制約付き）
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS test_table (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        unique_value INTEGER UNIQUE,
                        data TEXT NOT NULL,
                        timestamp REAL NOT NULL,
                        thread_id INTEGER NOT NULL
                    )
                ''')
                
                # インデックスの作成
                cursor.execute('CREATE INDEX IF NOT EXISTS idx_timestamp ON test_table(timestamp)')
                cursor.execute('CREATE INDEX IF NOT EXISTS idx_thread_id ON test_table(thread_id)')
                
                conn.commit()
                logging.info(f"データベース初期化完了: {self.db_path}")
                
        except Exception as e:
            logging.error(f"データベース初期化エラー: {e}")
            raise
        
    def worker_thread(self, thread_id, operations_per_thread):
        """ワーカースレッドの処理"""
        local_success = 0
        local_error = 0
        local_unique_error = 0
        
        # スレッドごとに独立したDB接続を作成
        try:
            conn = sqlite3.connect(self.db_path, timeout=30.0)
            conn.execute('PRAGMA journal_mode=WAL')  # WALモードで並行性を向上
            conn.execute('PRAGMA synchronous=NORMAL')
            conn.execute('PRAGMA cache_size=5000')
            conn.execute('PRAGMA temp_store=memory')
        except Exception as e:
            logging.error(f"Thread {thread_id}: DB接続エラー: {e}")
            return
        
        try:
            for i in range(operations_per_thread):
                try:
                    cursor = conn.cursor()
                    
                    # 意図的にUNIQUE制約エラーを発生させるため、
                    # 限定された範囲の値を使用
                    unique_value = random.randint(1, operations_per_thread // 2)
                    data = f"Thread-{thread_id}-Operation-{i}-Data-{random.randint(1000, 9999)}"
                    timestamp = time.time()
                    
                    cursor.execute('''
                        INSERT INTO test_table (unique_value, data, timestamp, thread_id)
                        VALUES (?, ?, ?, ?)
                    ''', (unique_value, data, timestamp, thread_id))
                    
                    conn.commit()
                    local_success += 1
                    
                except sqlite3.IntegrityError as e:
                    if "UNIQUE constraint failed" in str(e):
                        local_unique_error += 1
                    else:
                        local_error += 1
                        
                except Exception as e:
                    local_error += 1
                    print(f"Thread {thread_id}: Unexpected error: {e}")
                    
        finally:
            conn.close()
            
        # 結果を集計
        with self.lock:
            self.success_count += local_success
            self.error_count += local_error
            self.unique_error_count += local_unique_error
            
        print(f"Thread {thread_id} completed: Success={local_success}, "
              f"UniqueErrors={local_unique_error}, OtherErrors={local_error}")
    
    def run_load_test(self):
        """負荷試験の実行"""
        print(f"Starting SQLite load test...")
        print(f"Database: {self.db_path}")
        print(f"Threads: {self.num_threads}")
        print(f"Total operations: {self.num_operations}")
        print(f"Operations per thread: {self.num_operations // self.num_threads}")
        
        # データベースの初期化
        self.setup_database()
        
        # システム情報の表示
        print(f"CPU cores: {multiprocessing.cpu_count()}")
        print(f"Memory: {psutil.virtual_memory().total / (1024**3):.1f} GB")
        
        start_time = time.time()
        
        # スレッドプールで並行実行
        operations_per_thread = self.num_operations // self.num_threads
        
        with ThreadPoolExecutor(max_workers=self.num_threads) as executor:
            futures = []
            for thread_id in range(self.num_threads):
                future = executor.submit(self.worker_thread, thread_id, operations_per_thread)
                futures.append(future)
            
            # 全スレッドの完了を待機
            for future in as_completed(futures):
                try:
                    future.result()
                except Exception as e:
                    print(f"Thread execution error: {e}")
        
        end_time = time.time()
        duration = end_time - start_time
        
        # 結果の表示
        total_operations = self.success_count + self.error_count + self.unique_error_count
        
        print("\n" + "="*60)
        print("SQLite UNIQUE制約エラー負荷試験結果")
        print("="*60)
        print(f"実行時間: {duration:.2f} 秒")
        print(f"総操作数: {total_operations}")
        print(f"成功: {self.success_count} ({self.success_count/total_operations*100:.1f}%)")
        print(f"UNIQUE制約エラー: {self.unique_error_count} ({self.unique_error_count/total_operations*100:.1f}%)")
        print(f"その他エラー: {self.error_count} ({self.error_count/total_operations*100:.1f}%)")
        print(f"スループット: {total_operations/duration:.1f} ops/sec")
        print("="*60)
        
        # データベースサイズの確認
        if os.path.exists(self.db_path):
            db_size = os.path.getsize(self.db_path)
            print(f"データベースサイズ: {db_size / (1024*1024):.2f} MB")
        
        return {
            'duration': duration,
            'total_operations': total_operations,
            'success_count': self.success_count,
            'unique_error_count': self.unique_error_count,
            'error_count': self.error_count,
            'throughput': total_operations / duration
        }

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 unique_constraint_test.py <db_path> [threads] [operations]")
        print("Example: python3 unique_constraint_test.py /mnt/fsx-sqlite/test.db 20 5000")
        sys.exit(1)
    
    db_path = sys.argv[1]
    num_threads = int(sys.argv[2]) if len(sys.argv) > 2 else 10
    num_operations = int(sys.argv[3]) if len(sys.argv) > 3 else 1000
    
    # ディレクトリが存在しない場合は作成
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    
    tester = SQLiteLoadTester(db_path, num_threads, num_operations)
    results = tester.run_load_test()
    
    # 結果をファイルに保存
    result_file = f"{db_path}.results.txt"
    with open(result_file, 'w') as f:
        f.write(f"SQLite Load Test Results\n")
        f.write(f"========================\n")
        f.write(f"Database: {db_path}\n")
        f.write(f"Threads: {num_threads}\n")
        f.write(f"Duration: {results['duration']:.2f} seconds\n")
        f.write(f"Total Operations: {results['total_operations']}\n")
        f.write(f"Success: {results['success_count']}\n")
        f.write(f"UNIQUE Errors: {results['unique_error_count']}\n")
        f.write(f"Other Errors: {results['error_count']}\n")
        f.write(f"Throughput: {results['throughput']:.1f} ops/sec\n")
    
    print(f"\n結果を {result_file} に保存しました")

if __name__ == "__main__":
    main()
EOF

chmod +x /opt/sqlite-load-test/unique_constraint_test.py

# FSxマウント用のスクリプト作成
cat > /opt/sqlite-load-test/mount_fsx.sh << 'EOF'
#!/bin/bash
# FSx for ONTAP SQLite負荷試験ボリュームのマウント

set -euo pipefail

# 環境変数から設定を読み込み（デフォルト値付き）
FSX_DNS="${FSX_DNS:-svm-example.fs-example.fsx.ap-northeast-1.amazonaws.com}"
MOUNT_PATH="${MOUNT_PATH:-/sqlite-load-test}"
LOCAL_MOUNT="${LOCAL_MOUNT:-/mnt/fsx-sqlite}"

# 入力値検証
if [[ ! "$FSX_DNS" =~ ^svm-[a-f0-9]+\.fs-[a-f0-9]+\.fsx\.[a-z0-9-]+\.amazonaws\.com$ ]]; then
    echo "❌ エラー: 無効なFSX_DNS形式: $FSX_DNS" >&2
    exit 1
fi

echo "FSx for ONTAP SQLite負荷試験ボリュームをマウント中..."
echo "DNS: $FSX_DNS"
echo "パス: $MOUNT_PATH"
echo "ローカルマウント: $LOCAL_MOUNT"

# マウントポイントの存在確認
if [[ ! -d "$LOCAL_MOUNT" ]]; then
    echo "マウントポイントを作成中: $LOCAL_MOUNT"
    sudo mkdir -p "$LOCAL_MOUNT"
fi

# 既にマウントされているかチェック
if mountpoint -q "$LOCAL_MOUNT"; then
    echo "既にマウントされています: $LOCAL_MOUNT"
    df -h "$LOCAL_MOUNT"
    exit 0
fi

# NFSマウント（セキュリティ強化オプション）
echo "NFSマウント実行中..."
if sudo mount -t nfs -o nfsvers=3,rsize=1048576,wsize=1048576,hard,intr,timeo=600,nodev,nosuid \
    "$FSX_DNS:$MOUNT_PATH" "$LOCAL_MOUNT"; then
    echo "✅ マウント成功!"
    echo "マウント状況:"
    df -h "$LOCAL_MOUNT"
    
    # セキュリティ: 適切な権限設定（777は危険）
    sudo chmod 755 "$LOCAL_MOUNT"
    
    # テスト用ディレクトリ作成
    sudo mkdir -p "$LOCAL_MOUNT/sqlite-tests"
    sudo chmod 755 "$LOCAL_MOUNT/sqlite-tests"
    
    echo "SQLite負荷試験の準備完了"
    echo "実行例:"
    echo "python3 /opt/sqlite-load-test/unique_constraint_test.py /mnt/fsx-sqlite/test.db 20 5000"
else
    echo "マウント失敗"
    exit 1
fi
EOF

chmod +x /opt/sqlite-load-test/mount_fsx.sh

# 簡単な負荷試験実行スクリプト
cat > /opt/sqlite-load-test/run_quick_test.sh << 'EOF'
#!/bin/bash
# 簡単なSQLite負荷試験の実行

echo "SQLite UNIQUE制約エラー負荷試験を開始します..."

# FSxマウントの確認
if ! mountpoint -q /mnt/fsx-sqlite; then
    echo "FSxボリュームをマウント中..."
    /opt/sqlite-load-test/mount_fsx.sh
fi

# 軽い負荷試験（10スレッド、1000操作）
echo "軽い負荷試験を実行中..."
python3 /opt/sqlite-load-test/unique_constraint_test.py /mnt/fsx-sqlite/quick_test.db 10 1000

echo "負荷試験完了"
EOF

chmod +x /opt/sqlite-load-test/run_quick_test.sh

# 初期化完了の記録
readonly INIT_LOG="/opt/sqlite-load-test/init_complete.log"

log_info "初期化完了ログを作成中..."
{
    echo "SQLite負荷試験環境の初期化完了 - $(date)"
    echo "スクリプトバージョン: 1.0.0"
    echo "初期化実行者: $(whoami)"
    echo ""
    echo "=== システム情報 ==="
    echo "OS情報: $(uname -a)"
    echo "CPU情報: $(grep "model name" /proc/cpuinfo | head -1 | cut -d: -f2 | xargs)"
    echo "メモリ情報: $(grep MemTotal /proc/meminfo | awk '{print $2 " " $3}')"
    echo "ディスク情報:"
    df -h
    echo ""
    echo "=== インストール済みパッケージ ==="
    echo "Python: $(python3 --version 2>&1)"
    echo "SQLite: $(sqlite3 --version 2>&1)"
    echo "pip packages:"
    pip3 list | grep -E "(psutil|boto3)" || echo "パッケージ情報取得エラー"
    echo ""
    echo "=== 作成されたファイル ==="
    ls -la /opt/sqlite-load-test/
} > "$INIT_LOG"

log_info "SQLite負荷試験環境の初期化が完了しました"
log_info "ログファイル: $INIT_LOG"
log_info "使用方法:"
log_info "  1. FSxマウント: /opt/sqlite-load-test/mount_fsx.sh"
log_info "  2. 簡単テスト: /opt/sqlite-load-test/run_quick_test.sh"
log_info "  3. カスタムテスト: python3 /opt/sqlite-load-test/unique_constraint_test.py <db_path> [threads] [operations]"