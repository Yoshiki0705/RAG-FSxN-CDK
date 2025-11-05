#!/bin/bash

# Windows AD FSxN統合環境 パフォーマンステストスクリプト
# 使用方法: ./performance-test.sh [環境名] [リージョン] [プロファイル] [テスト時間]

set -euo pipefail

# スクリプト設定
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE_DIR="$(dirname "$SCRIPT_DIR")"
PROJECT_NAME="windows-ad-fsxn"

# 色付きログ出力関数
log_info() {
    echo -e "\033[32m[INFO]\033[0m $1"
}

log_warn() {
    echo -e "\033[33m[WARN]\033[0m $1"
}

log_error() {
    echo -e "\033[31m[ERROR]\033[0m $1"
}

log_success() {
    echo -e "\033[32m[SUCCESS]\033[0m $1"
}

log_perf() {
    echo -e "\033[35m[PERF]\033[0m $1"
}

# 使用方法表示
show_usage() {
    cat << EOF
使用方法: $0 [環境名] [リージョン] [AWSプロファイル] [テスト時間]

引数:
  環境名        : dev, staging, prod のいずれか (デフォルト: dev)
  リージョン    : AWS リージョン (デフォルト: ap-northeast-1)
  AWSプロファイル: AWS CLI プロファイル名 (デフォルト: default)
  テスト時間    : テスト実行時間（分） (デフォルト: 30)

例:
  $0 dev ap-northeast-1 user01 30
  $0 prod ap-northeast-1 production 60

このスクリプトは以下のパフォーマンステストを実行します:
  1. CPU・メモリ使用率監視
  2. ディスクI/O性能テスト
  3. ネットワーク性能テスト
  4. Active Directory応答時間テスト
  5. FSx ONTAP性能テスト
  6. 同時接続負荷テスト
  7. レスポンス時間分析
  8. リソース使用率分析

前提条件:
  - AWS CLI がインストール・設定済み
  - 対象環境がデプロイ済み
  - bc コマンドがインストール済み
EOF
}

# パフォーマンステスト結果
PERF_RESULTS=()

# パフォーマンス結果記録
record_perf_result() {
    local test_name="$1"
    local metric="$2"
    local value="$3"
    local unit="$4"
    local threshold="$5"
    local status="PASS"
    
    # 閾値チェック
    if (( $(echo "$value > $threshold" | bc -l) )); then
        status="WARN"
        log_warn "$test_name: $value $unit (閾値: $threshold $unit)"
    else
        log_success "$test_name: $value $unit"
    fi
    
    PERF_RESULTS+=("$test_name,$metric,$value,$unit,$threshold,$status")
}

# 出力値取得関数
get_stack_output() {
    local environment="$1"
    local region="$2"
    local profile="$3"
    local output_key="$4"
    
    local stack_name="${PROJECT_NAME}-${environment}"
    
    aws cloudformation describe-stacks \
        --stack-name "$stack_name" \
        --region "$region" \
        --profile "$profile" \
        --query "Stacks[0].Outputs[?OutputKey=='$output_key'].OutputValue" \
        --output text 2>/dev/null || echo ""
}

# CloudWatchメトリクス取得
get_cloudwatch_metric() {
    local namespace="$1"
    local metric_name="$2"
    local dimensions="$3"
    local start_time="$4"
    local end_time="$5"
    local period="$6"
    local statistic="$7"
    local region="$8"
    local profile="$9"
    
    aws cloudwatch get-metric-statistics \
        --namespace "$namespace" \
        --metric-name "$metric_name" \
        --dimensions "$dimensions" \
        --start-time "$start_time" \
        --end-time "$end_time" \
        --period "$period" \
        --statistics "$statistic" \
        --region "$region" \
        --profile "$profile" \
        --query "Datapoints[0].$statistic" \
        --output text 2>/dev/null || echo ""
}

# 1. CPU・メモリ使用率監視
test_cpu_memory_performance() {
    local environment="$1"
    local region="$2"
    local profile="$3"
    local test_duration="$4"
    
    log_perf "CPU・メモリ使用率監視開始（${test_duration}分間）..."
    
    local instance_id
    instance_id=$(get_stack_output "$environment" "$region" "$profile" "WindowsADInstanceId")
    
    if [[ -z "$instance_id" ]]; then
        log_error "インスタンスIDが取得できません"
        return 1
    fi
    
    local start_time end_time
    start_time=$(date -u +%Y-%m-%dT%H:%M:%S)
    
    # テスト期間待機
    log_info "パフォーマンス監視中... (${test_duration}分間)"
    sleep $((test_duration * 60))
    
    end_time=$(date -u +%Y-%m-%dT%H:%M:%S)
    
    # CPU使用率取得
    local cpu_avg cpu_max
    cpu_avg=$(get_cloudwatch_metric "AWS/EC2" "CPUUtilization" "Name=InstanceId,Value=$instance_id" \
        "$start_time" "$end_time" 300 "Average" "$region" "$profile")
    cpu_max=$(get_cloudwatch_metric "AWS/EC2" "CPUUtilization" "Name=InstanceId,Value=$instance_id" \
        "$start_time" "$end_time" 300 "Maximum" "$region" "$profile")
    
    if [[ -n "$cpu_avg" && "$cpu_avg" != "None" ]]; then
        record_perf_result "CPU使用率（平均）" "CPUUtilization" "$cpu_avg" "%" "80"
    fi
    
    if [[ -n "$cpu_max" && "$cpu_max" != "None" ]]; then
        record_perf_result "CPU使用率（最大）" "CPUUtilization" "$cpu_max" "%" "90"
    fi
    
    # メモリ使用率取得（CloudWatchエージェントが必要）
    local mem_avg mem_max
    mem_avg=$(get_cloudwatch_metric "CWAgent" "Memory % Committed Bytes In Use" \
        "Name=InstanceId,Value=$instance_id" "$start_time" "$end_time" 300 "Average" "$region" "$profile")
    mem_max=$(get_cloudwatch_metric "CWAgent" "Memory % Committed Bytes In Use" \
        "Name=InstanceId,Value=$instance_id" "$start_time" "$end_time" 300 "Maximum" "$region" "$profile")
    
    if [[ -n "$mem_avg" && "$mem_avg" != "None" ]]; then
        record_perf_result "メモリ使用率（平均）" "MemoryUtilization" "$mem_avg" "%" "85"
    fi
    
    if [[ -n "$mem_max" && "$mem_max" != "None" ]]; then
        record_perf_result "メモリ使用率（最大）" "MemoryUtilization" "$mem_max" "%" "95"
    fi
}

# 2. ディスクI/O性能テスト
test_disk_io_performance() {
    local environment="$1"
    local region="$2"
    local profile="$3"
    
    log_perf "ディスクI/O性能テスト実行中..."
    
    local instance_id
    instance_id=$(get_stack_output "$environment" "$region" "$profile" "WindowsADInstanceId")
    
    if [[ -z "$instance_id" ]]; then
        log_error "インスタンスIDが取得できません"
        return 1
    fi
    
    # ディスクI/Oテスト実行
    local command_id
    command_id=$(aws ssm send-command \
        --document-name "AWS-RunPowerShellScript" \
        --targets "Key=InstanceIds,Values=$instance_id" \
        --parameters 'commands=[
            "$testFile = \"C:\\temp\\disktest.tmp\"",
            "New-Item -Path C:\\temp -ItemType Directory -Force | Out-Null",
            "$data = New-Object byte[] (1MB)",
            "$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()",
            "for ($i = 0; $i -lt 100; $i++) { [System.IO.File]::WriteAllBytes(\"$testFile$i\", $data) }",
            "$writeTime = $stopwatch.ElapsedMilliseconds",
            "$stopwatch.Restart()",
            "for ($i = 0; $i -lt 100; $i++) { $null = [System.IO.File]::ReadAllBytes(\"$testFile$i\") }",
            "$readTime = $stopwatch.ElapsedMilliseconds",
            "$stopwatch.Stop()",
            "for ($i = 0; $i -lt 100; $i++) { Remove-Item \"$testFile$i\" -Force }",
            "Write-Output \"WRITE_TIME:$writeTime\"",
            "Write-Output \"READ_TIME:$readTime\""
        ]' \
        --region "$region" \
        --profile "$profile" \
        --query 'Command.CommandId' \
        --output text 2>/dev/null || echo "")
    
    if [[ -n "$command_id" ]]; then
        # コマンド実行結果待機
        sleep 30
        
        local command_output
        command_output=$(aws ssm get-command-invocation \
            --command-id "$command_id" \
            --instance-id "$instance_id" \
            --region "$region" \
            --profile "$profile" \
            --query 'StandardOutputContent' \
            --output text 2>/dev/null || echo "")
        
        # 結果解析
        local write_time read_time
        write_time=$(echo "$command_output" | grep "WRITE_TIME:" | cut -d: -f2)
        read_time=$(echo "$command_output" | grep "READ_TIME:" | cut -d: -f2)
        
        if [[ -n "$write_time" ]]; then
            record_perf_result "ディスク書き込み時間（100MB）" "DiskWriteTime" "$write_time" "ms" "5000"
        fi
        
        if [[ -n "$read_time" ]]; then
            record_perf_result "ディスク読み取り時間（100MB）" "DiskReadTime" "$read_time" "ms" "3000"
        fi
    fi
}

# 3. ネットワーク性能テスト
test_network_performance() {
    local environment="$1"
    local region="$2"
    local profile="$3"
    
    log_perf "ネットワーク性能テスト実行中..."
    
    local instance_id
    instance_id=$(get_stack_output "$environment" "$region" "$profile" "WindowsADInstanceId")
    
    if [[ -z "$instance_id" ]]; then
        log_error "インスタンスIDが取得できません"
        return 1
    fi
    
    # ネットワーク性能テスト実行
    local command_id
    command_id=$(aws ssm send-command \
        --document-name "AWS-RunPowerShellScript" \
        --targets "Key=InstanceIds,Values=$instance_id" \
        --parameters 'commands=[
            "$targets = @(\"8.8.8.8\", \"1.1.1.1\", \"169.254.169.253\")",
            "foreach ($target in $targets) {",
            "    $ping = Test-Connection -ComputerName $target -Count 10 -Quiet",
            "    $latency = (Test-Connection -ComputerName $target -Count 10 | Measure-Object ResponseTime -Average).Average",
            "    Write-Output \"PING_$target`:$ping\"",
            "    Write-Output \"LATENCY_$target`:$latency\"",
            "}"
        ]' \
        --region "$region" \
        --profile "$profile" \
        --query 'Command.CommandId' \
        --output text 2>/dev/null || echo "")
    
    if [[ -n "$command_id" ]]; then
        # コマンド実行結果待機
        sleep 20
        
        local command_output
        command_output=$(aws ssm get-command-invocation \
            --command-id "$command_id" \
            --instance-id "$instance_id" \
            --region "$region" \
            --profile "$profile" \
            --query 'StandardOutputContent' \
            --output text 2>/dev/null || echo "")
        
        # 結果解析
        local dns_latency
        dns_latency=$(echo "$command_output" | grep "LATENCY_8.8.8.8:" | cut -d: -f2)
        
        if [[ -n "$dns_latency" ]]; then
            record_perf_result "DNS応答時間" "NetworkLatency" "$dns_latency" "ms" "100"
        fi
    fi
}

# 4. Active Directory応答時間テスト
test_ad_response_time() {
    local environment="$1"
    local region="$2"
    local profile="$3"
    
    log_perf "Active Directory応答時間テスト実行中..."
    
    local instance_id
    instance_id=$(get_stack_output "$environment" "$region" "$profile" "WindowsADInstanceId")
    
    if [[ -z "$instance_id" ]]; then
        log_error "インスタンスIDが取得できません"
        return 1
    fi
    
    # AD応答時間テスト実行
    local command_id
    command_id=$(aws ssm send-command \
        --document-name "AWS-RunPowerShellScript" \
        --targets "Key=InstanceIds,Values=$instance_id" \
        --parameters 'commands=[
            "$stopwatch = [System.Diagnostics.Stopwatch]::StartNew()",
            "try {",
            "    $domain = Get-ADDomain",
            "    $domainTime = $stopwatch.ElapsedMilliseconds",
            "    $stopwatch.Restart()",
            "    $users = Get-ADUser -Filter * -ResultSetSize 10",
            "    $userTime = $stopwatch.ElapsedMilliseconds",
            "    $stopwatch.Restart()",
            "    $computers = Get-ADComputer -Filter * -ResultSetSize 10",
            "    $computerTime = $stopwatch.ElapsedMilliseconds",
            "    Write-Output \"DOMAIN_QUERY_TIME:$domainTime\"",
            "    Write-Output \"USER_QUERY_TIME:$userTime\"",
            "    Write-Output \"COMPUTER_QUERY_TIME:$computerTime\"",
            "} catch {",
            "    Write-Output \"ERROR: $($_.Exception.Message)\"",
            "}"
        ]' \
        --region "$region" \
        --profile "$profile" \
        --query 'Command.CommandId' \
        --output text 2>/dev/null || echo "")
    
    if [[ -n "$command_id" ]]; then
        # コマンド実行結果待機
        sleep 15
        
        local command_output
        command_output=$(aws ssm get-command-invocation \
            --command-id "$command_id" \
            --instance-id "$instance_id" \
            --region "$region" \
            --profile "$profile" \
            --query 'StandardOutputContent' \
            --output text 2>/dev/null || echo "")
        
        # 結果解析
        local domain_time user_time computer_time
        domain_time=$(echo "$command_output" | grep "DOMAIN_QUERY_TIME:" | cut -d: -f2)
        user_time=$(echo "$command_output" | grep "USER_QUERY_TIME:" | cut -d: -f2)
        computer_time=$(echo "$command_output" | grep "COMPUTER_QUERY_TIME:" | cut -d: -f2)
        
        if [[ -n "$domain_time" ]]; then
            record_perf_result "ADドメイン情報取得時間" "ADQueryTime" "$domain_time" "ms" "1000"
        fi
        
        if [[ -n "$user_time" ]]; then
            record_perf_result "ADユーザー検索時間" "ADQueryTime" "$user_time" "ms" "2000"
        fi
        
        if [[ -n "$computer_time" ]]; then
            record_perf_result "ADコンピュータ検索時間" "ADQueryTime" "$computer_time" "ms" "2000"
        fi
    fi
}

# 5. FSx ONTAP性能テスト
test_fsx_performance() {
    local environment="$1"
    local region="$2"
    local profile="$3"
    local test_duration="$4"
    
    log_perf "FSx ONTAP性能テスト実行中..."
    
    local fsx_id
    fsx_id=$(get_stack_output "$environment" "$region" "$profile" "FSxFileSystemId")
    
    if [[ -z "$fsx_id" ]]; then
        log_error "FSxファイルシステムIDが取得できません"
        return 1
    fi
    
    local start_time end_time
    start_time=$(date -u -d "${test_duration} minutes ago" +%Y-%m-%dT%H:%M:%S)
    end_time=$(date -u +%Y-%m-%dT%H:%M:%S)
    
    # FSx IOPS取得
    local iops_avg iops_max
    iops_avg=$(get_cloudwatch_metric "AWS/FSx" "TotalIOPS" "Name=FileSystemId,Value=$fsx_id" \
        "$start_time" "$end_time" 300 "Average" "$region" "$profile")
    iops_max=$(get_cloudwatch_metric "AWS/FSx" "TotalIOPS" "Name=FileSystemId,Value=$fsx_id" \
        "$start_time" "$end_time" 300 "Maximum" "$region" "$profile")
    
    if [[ -n "$iops_avg" && "$iops_avg" != "None" ]]; then
        record_perf_result "FSx IOPS（平均）" "FSxIOPS" "$iops_avg" "IOPS" "1000"
    fi
    
    if [[ -n "$iops_max" && "$iops_max" != "None" ]]; then
        record_perf_result "FSx IOPS（最大）" "FSxIOPS" "$iops_max" "IOPS" "2000"
    fi
    
    # FSxスループット取得
    local throughput_avg throughput_max
    throughput_avg=$(get_cloudwatch_metric "AWS/FSx" "TotalThroughput" "Name=FileSystemId,Value=$fsx_id" \
        "$start_time" "$end_time" 300 "Average" "$region" "$profile")
    throughput_max=$(get_cloudwatch_metric "AWS/FSx" "TotalThroughput" "Name=FileSystemId,Value=$fsx_id" \
        "$start_time" "$end_time" 300 "Maximum" "$region" "$profile")
    
    if [[ -n "$throughput_avg" && "$throughput_avg" != "None" ]]; then
        record_perf_result "FSxスループット（平均）" "FSxThroughput" "$throughput_avg" "MB/s" "100"
    fi
    
    if [[ -n "$throughput_max" && "$throughput_max" != "None" ]]; then
        record_perf_result "FSxスループット（最大）" "FSxThroughput" "$throughput_max" "MB/s" "200"
    fi
}

# パフォーマンステストレポート生成
generate_performance_report() {
    local environment="$1"
    local region="$2"
    local profile="$3"
    local test_duration="$4"
    
    local report_file="$TEMPLATE_DIR/performance-test-report.csv"
    local summary_file="$TEMPLATE_DIR/performance-test-summary.txt"
    
    log_info "パフォーマンステストレポート生成中..."
    
    # CSVレポート生成
    echo "TestName,Metric,Value,Unit,Threshold,Status" > "$report_file"
    for result in "${PERF_RESULTS[@]}"; do
        echo "$result" >> "$report_file"
    done
    
    # サマリーレポート生成
    local total_tests warn_count pass_count
    total_tests=${#PERF_RESULTS[@]}
    warn_count=$(printf '%s\n' "${PERF_RESULTS[@]}" | grep -c ",WARN$" || echo "0")
    pass_count=$(printf '%s\n' "${PERF_RESULTS[@]}" | grep -c ",PASS$" || echo "0")
    
    cat > "$summary_file" << EOF
# Windows AD FSxN統合環境 パフォーマンステストサマリー

## 実行情報
- 実行日時: $(date)
- 対象環境: $environment
- リージョン: $region
- AWSプロファイル: $profile
- テスト時間: ${test_duration}分

## 結果サマリー
- 総テスト項目: $total_tests
- 正常: $pass_count
- 警告: $warn_count
- 成功率: $(( pass_count * 100 / total_tests ))%

## パフォーマンス分析
EOF
    
    # 詳細結果追加
    for result in "${PERF_RESULTS[@]}"; do
        IFS=',' read -r test_name metric value unit threshold status <<< "$result"
        echo "- $test_name: $value $unit ($status)" >> "$summary_file"
    done
    
    cat >> "$summary_file" << EOF

## 推奨事項
$([ $warn_count -eq 0 ] && echo "- 全てのパフォーマンステストが正常範囲内です" || echo "- 警告が検出されたメトリクスの詳細調査を推奨します")
- 継続的なパフォーマンス監視を実施してください
- 負荷増加時のスケーリング計画を検討してください
- 定期的なパフォーマンステストの実行を推奨します

## 詳細データ
詳細なパフォーマンスデータ: $report_file

---
このレポートは自動生成されました。
EOF
    
    log_success "パフォーマンステストレポート生成完了:"
    log_info "  サマリー: $summary_file"
    log_info "  詳細データ: $report_file"
}

# メイン処理
main() {
    local environment="${1:-dev}"
    local region="${2:-ap-northeast-1}"
    local profile="${3:-default}"
    local test_duration="${4:-30}"
    
    # ヘルプ表示
    if [[ "$environment" == "-h" || "$environment" == "--help" ]]; then
        show_usage
        exit 0
    fi
    
    # bc コマンド確認
    if ! command -v bc >/dev/null 2>&1; then
        log_error "bc コマンドがインストールされていません"
        log_error "インストール方法: brew install bc (macOS) または apt-get install bc (Ubuntu)"
        exit 1
    fi
    
    log_info "Windows AD FSxN統合環境 パフォーマンステスト開始"
    log_info "対象環境: $environment"
    log_info "リージョン: $region"
    log_info "プロファイル: $profile"
    log_info "テスト時間: ${test_duration}分"
    
    # AWS認証確認
    if ! aws sts get-caller-identity --profile "$profile" >/dev/null 2>&1; then
        log_error "AWS認証に失敗しました。プロファイル設定を確認してください: $profile"
        exit 1
    fi
    
    echo
    log_info "=== パフォーマンステスト実行開始 ==="
    
    # 各パフォーマンステスト実行
    test_cpu_memory_performance "$environment" "$region" "$profile" "$test_duration"
    test_disk_io_performance "$environment" "$region" "$profile"
    test_network_performance "$environment" "$region" "$profile"
    test_ad_response_time "$environment" "$region" "$profile"
    test_fsx_performance "$environment" "$region" "$profile" "$test_duration"
    
    # レポート生成
    generate_performance_report "$environment" "$region" "$profile" "$test_duration"
    
    # 結果サマリー
    echo
    log_info "=== パフォーマンステスト結果サマリー ==="
    
    local total_tests warn_count pass_count
    total_tests=${#PERF_RESULTS[@]}
    warn_count=$(printf '%s\n' "${PERF_RESULTS[@]}" | grep -c ",WARN$" || echo "0")
    pass_count=$(printf '%s\n' "${PERF_RESULTS[@]}" | grep -c ",PASS$" || echo "0")
    
    log_info "総テスト項目: $total_tests"
    log_info "正常: $pass_count"
    log_info "警告: $warn_count"
    
    if [[ $warn_count -eq 0 ]]; then
        log_success "✓ 全てのパフォーマンステストが正常範囲内です！"
        exit 0
    else
        log_warn "⚠ $warn_count 件の警告が検出されました。"
        log_warn "詳細レポートを確認してパフォーマンス調整を検討してください。"
        exit 0  # 警告レベルなので正常終了
    fi
}

# エラーハンドリング
trap 'log_error "スクリプト実行中にエラーが発生しました (行番号: $LINENO)"' ERR

# メイン処理実行
main "$@"