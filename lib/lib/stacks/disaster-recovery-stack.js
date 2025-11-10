"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisasterRecoveryStack = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const disaster_recovery_manager_1 = require("../disaster-recovery/disaster-recovery-manager");
const data_replication_manager_1 = require("../disaster-recovery/data-replication-manager");
/**
 * 災害復旧システム統合スタック
 *
 * 機能:
 * - 東京 ⇔ 大阪間災害復旧システム
 * - データレプリケーション管理
 * - 自動フェイルオーバー機能
 * - RTO: 4時間以内、RPO: 1時間以内の目標達成
 */
class DisasterRecoveryStack extends aws_cdk_lib_1.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // 災害復旧設定
        const drConfig = {
            rtoMinutes: 240, // 4時間
            rpoMinutes: 60, // 1時間
            primaryRegion: props.primaryRegion,
            secondaryRegion: props.secondaryRegion,
            healthCheckIntervalMinutes: 5,
            failoverThreshold: 3
        };
        // データレプリケーション設定
        const replicationConfig = {
            primaryRegion: props.primaryRegion,
            secondaryRegion: props.secondaryRegion,
            replicationIntervalMinutes: 15,
            backupRetentionDays: 30,
            encryptionEnabled: true
        };
        // 災害復旧管理システム
        this.disasterRecoveryManager = new disaster_recovery_manager_1.DisasterRecoveryManager(this, 'DisasterRecoveryManager', {
            globalConfig: props.globalConfig,
            drConfig
        });
        // データレプリケーション管理システム
        this.dataReplicationManager = new data_replication_manager_1.DataReplicationManager(this, 'DataReplicationManager', {
            globalConfig: props.globalConfig,
            replicationConfig
        });
        // 権限設定
        this.setupPermissions();
        // タグ設定
        this.setupTags(props.globalConfig);
    }
    /**
     * 権限設定
     */
    setupPermissions() {
        this.disasterRecoveryManager.grantPermissions();
        this.dataReplicationManager.grantPermissions();
    }
    /**
     * タグ設定
     */
    setupTags(config) {
        aws_cdk_lib_1.Tags.of(this).add('Project', config.projectName);
        aws_cdk_lib_1.Tags.of(this).add('Environment', config.environment);
        aws_cdk_lib_1.Tags.of(this).add('Component', 'DisasterRecovery');
        aws_cdk_lib_1.Tags.of(this).add('Region', config.region);
        aws_cdk_lib_1.Tags.of(this).add('CostCenter', 'Infrastructure');
        aws_cdk_lib_1.Tags.of(this).add('Owner', 'NetApp-Japan-Tech-Team');
        aws_cdk_lib_1.Tags.of(this).add('Purpose', 'Business-Continuity');
    }
    /**
     * 出力値の定義
     */
    getOutputs() {
        return {
            disasterRecoveryStatusTableName: this.disasterRecoveryManager.statusTable.tableName,
            replicationStatusTableName: this.dataReplicationManager.getReplicationStatus().tableName,
            healthCheckFunctionArn: this.disasterRecoveryManager.healthCheckFunction.functionArn,
            failoverFunctionArn: this.disasterRecoveryManager.failoverFunction.functionArn,
            alertTopicArn: this.disasterRecoveryManager.alertTopic.topicArn
        };
    }
}
exports.DisasterRecoveryStack = DisasterRecoveryStack;
