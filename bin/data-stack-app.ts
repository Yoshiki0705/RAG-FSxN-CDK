#!/usr/bin/env node
/**
 * DataStack専用エントリーポイント
 * 
 * 機能:
 * - ストレージ・データベースリソースの管理
 * - FSx for NetApp ONTAP設定管理
 * - S3・DynamoDB・OpenSearch統合
 * 
 * 使用方法:
 *   export PROJECT_NAME=permission-aware-rag
 *   export ENVIRONMENT=prod
 *   export CDK_DEFAULT_ACCOUNT=533267025162
 *   export CDK_DEFAULT_REGION=ap-northeast-1
 *   npx cdk deploy DataStack --app "npx ts-node bin/data-stack-app.ts"
 */

import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { DataStack } from '../lib/stacks/integrated/data-stack';
import { tokyoProductionConfig } from '../lib/config/environments/tokyo-production-config';
import { TaggingStrategy, PermissionAwareRAGTags } from '../lib/config/tagging-config';

const app = new cdk.App();

// プロジェクト設定の取得と検証
const projectName = process.env.PROJECT_NAME || tokyoProductionConfig.project.name;
const environment = process.env.ENVIRONMENT || tokyoProductionConfig.environment;
const region = process.env.CDK_DEFAULT_REGION || tokyoProductionConfig.region;
const account = process.env.CDK_DEFAULT_ACCOUNT;

// 必須環境変数の検証
if (!account) {
  console.error('❌ エラー: CDK_DEFAULT_ACCOUNT環境変数が設定されていません');
  process.exit(1);
}

console.log(`🚀 DataStackデプロイ設定:`);
console.log(`   プロジェクト名: ${projectName}`);
console.log(`   環境: ${environment}`);
console.log(`   リージョン: ${region}`);
console.log(`   アカウント: ${account}`);

// アプリケーションレベルでのタグ設定
const taggingConfig = PermissionAwareRAGTags.getStandardConfig(projectName, environment);
const environmentConfig = PermissionAwareRAGTags.getEnvironmentConfig(environment);

// 全体タグの適用
Object.entries(taggingConfig.customTags || {}).forEach(([key, value]) => {
  cdk.Tags.of(app).add(key, value);
});

Object.entries(environmentConfig.customTags || {}).forEach(([key, value]) => {
  cdk.Tags.of(app).add(key, value);
});

// コスト配布タグの適用
cdk.Tags.of(app).add('cost', projectName);
cdk.Tags.of(app).add('Environment', environment);
cdk.Tags.of(app).add('Project', projectName);
cdk.Tags.of(app).add('CDK-Application', 'Permission-aware-RAG-FSxN-DataStack');
cdk.Tags.of(app).add('Management-Method', 'AWS-CDK');

// DataStack設定の準備
const dataStackConfig = {
  storage: {
    s3: {
      documents: {
        enabled: true,
        bucketName: `${projectName}-${environment}-documents-${account}`,
        versioning: tokyoProductionConfig.storage.s3.enableVersioning,
        encryption: {
          enabled: true,
        },
        lifecycle: {
          enabled: tokyoProductionConfig.storage.s3.enableLifecyclePolicy,
          transitionToIADays: tokyoProductionConfig.storage.s3.transitionToIADays,
          transitionToGlacierDays: tokyoProductionConfig.storage.s3.transitionToGlacierDays,
          expirationDays: tokyoProductionConfig.storage.s3.expirationDays,
        },
      },
      backup: {
        enabled: true,
        bucketName: `${projectName}-${environment}-backup-${account}`,
        versioning: true,
        encryption: {
          enabled: true,
        },
        lifecycle: {
          enabled: true,
          transitionToIADays: 30,
          transitionToGlacierDays: 90,
          expirationDays: 365,
        },
      },
      embeddings: {
        enabled: true,
        bucketName: `${projectName}-${environment}-embeddings-${account}`,
        versioning: false,
        encryption: {
          enabled: true,
        },
        lifecycle: {
          enabled: true,
          transitionToIADays: 30,
          transitionToGlacierDays: 90,
          expirationDays: 180,
        },
      },
    },
    fsxOntap: {
      enabled: false, // 既存のFSxリソースを使用するため無効化
      storageCapacity: tokyoProductionConfig.storage.fsxOntap.storageCapacity,
      throughputCapacity: tokyoProductionConfig.storage.fsxOntap.throughputCapacity,
      deploymentType: tokyoProductionConfig.storage.fsxOntap.deploymentType,
      automaticBackupRetentionDays: tokyoProductionConfig.storage.fsxOntap.automaticBackupRetentionDays,
      disableBackupConfirmed: tokyoProductionConfig.storage.fsxOntap.disableBackupConfirmed,
      dailyAutomaticBackupStartTime: tokyoProductionConfig.storage.fsxOntap.automaticBackupRetentionDays > 0 ? '01:00' : undefined,
      weeklyMaintenanceStartTime: '1:01:00',
      preferredSubnetId: undefined,
      routeTableIds: [],
      diskIopsConfiguration: {
        mode: 'AUTOMATIC',
      },
      svm: {
        name: `${projectName}-${environment}-svm`,
        rootVolumeSecurityStyle: 'UNIX',
      },
      volumes: {
        data: {
          enabled: true,
          name: `${projectName.replace(/-/g, '_')}_${environment}_data`,
          junctionPath: '/data',
          sizeInMegabytes: 102400,
          storageEfficiencyEnabled: true,
          securityStyle: 'UNIX',
        },
        database: {
          enabled: true,
          name: `${projectName.replace(/-/g, '_')}_${environment}_database`,
          junctionPath: '/database',
          sizeInMegabytes: 51200,
          storageEfficiencyEnabled: true,
          securityStyle: 'UNIX',
        },
      },
    },
    efs: {
      enabled: false,
      performanceMode: 'generalPurpose',
      throughputMode: 'bursting',
      encrypted: true,
    },
    tags: {
      StorageType: 'S3+FSx+EFS',
      BackupEnabled: true,
      EncryptionEnabled: true,
      DataClassification: 'Confidential',
      RetentionPeriod: '7years',
    },
  },
  database: {
    dynamodb: {
      enabled: false, // 既存のDynamoDBテーブルを使用
      tables: {
        session: {
          enabled: false,
        },
        user: {
          enabled: false,
        },
        document: {
          enabled: false,
        },
      },
    },
    openSearch: {
      enabled: false, // 既存のOpenSearchを使用
      collectionName: `${projectName}-${environment}-collection`,
      standbyReplicas: 'DISABLED',
      indexName: 'documents',
    },
    rds: {
      enabled: false,
    },
  },
};

// DataStackのデプロイ
try {
  const dataStack = new DataStack(app, 'DataStack', {
    config: dataStackConfig as any,
    projectName,
    environment,
    env: {
      account,
      region,
    },
  });

  console.log(`✅ スタック "${dataStack.stackName}" を正常に初期化しました`);
  console.log(`📝 FSx設定:`);
  console.log(`   - automaticBackupRetentionDays: ${tokyoProductionConfig.storage.fsxOntap.automaticBackupRetentionDays}`);
  console.log(`   - disableBackupConfirmed: ${tokyoProductionConfig.storage.fsxOntap.disableBackupConfirmed}`);
  
} catch (error) {
  console.error('❌ スタック初期化エラー:', error);
  process.exit(1);
}

// CDK合成実行
try {
  console.log('🔄 CloudFormationテンプレート合成中...');
  app.synth();
  console.log('✅ CloudFormationテンプレート合成完了');
} catch (error) {
  console.error('❌ CDK合成エラー:', error);
  process.exit(1);
}
