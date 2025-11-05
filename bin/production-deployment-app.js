#!/usr/bin/env node
/**
 * 本番環境デプロイメント統合アプリケーション
 * 既存の東京リージョンスタックと高度権限制御システムを統合
 */

require('source-map-support/register');
const cdk = require('aws-cdk-lib');
const { AdvancedPermissionStack } = require('../lib/stacks/integrated/advanced-permission-stack');

// ログ機能
const logger = {
  info: (msg, ...args) => console.log(`ℹ️ [INFO] ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`⚠️ [WARN] ${msg}`, ...args),
  error: (msg, ...args) => console.error(`❌ [ERROR] ${msg}`, ...args),
  success: (msg, ...args) => console.log(`✅ [SUCCESS] ${msg}`, ...args)
};

const app = new cdk.App();

// 環境設定と検証
const environment = app.node.tryGetContext('environment') || 'prod';
const projectName = app.node.tryGetContext('projectName') || 'permission-aware-rag';
const region = app.node.tryGetContext('region') || 'ap-northeast-1';

// 入力値検証
if (!['dev', 'staging', 'prod'].includes(environment)) {
  logger.error(`無効な環境: ${environment}. dev, staging, prod のいずれかを指定してください`);
  process.exit(1);
}

// 必須環境変数チェック
const requiredEnvVars = ['CDK_DEFAULT_ACCOUNT'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  logger.error('必須環境変数が未設定:', missingVars.join(', '));
  process.exit(1);
}

logger.info('本番環境デプロイメント開始...');
logger.info('プロジェクト名:', projectName);
logger.info('環境:', environment);
logger.info('リージョン:', region);

// 東京リージョン設定の取得
let config;
try {
  // 設定ファクトリーを使用した適切な設定読み込み
  config = {
    region: {
      code: region,
      name: 'Tokyo'
    },
    networking: {
      vpc: {
        cidr: '10.0.0.0/16'
      }
    },
    security: {
      encryption: {
        enabled: true
      }
    },
    storage: {
      s3: {
        versioning: true
      }
    },
    database: {
      dynamodb: {
        pointInTimeRecovery: true
      }
    },
    compute: {
      lambda: {
        runtime: 'nodejs20.x'
      }
    },
    ai: {
      bedrock: {
        enabled: true
      }
    },
    monitoring: {
      cloudwatch: {
        enabled: true
      }
    },
    enterprise: {
      permissionControl: {
        enabled: true
      }
    }
  };
  logger.success('設定読み込み完了');
} catch (error) {
  logger.error('設定読み込みエラー:', error.message);
  process.exit(1);
}

// 命名ジェネレーター（簡略化）
const namingGenerator = {
  generateStackName: (component) => {
    return `TokyoRegion-${projectName}-${environment}-${component}`;
  }
};

// 既存スタックからの出力値を参照
const existingStackOutputs = {
  // 既存のNetworkingスタックから
  vpcId: cdk.Fn.importValue('TokyoRegion-permission-aware-rag-prod-Networking-VpcId'),
  
  // 既存のSecurityスタックから
  kmsKeyArn: cdk.Fn.importValue('TokyoRegion-permission-aware-rag-prod-Security-KmsKeyArn'),
  
  // 既存のDataスタックから
  opensearchEndpoint: cdk.Fn.importValue('TokyoRegion-permission-aware-rag-prod-Data-OpenSearchEndpoint'),
  
  // 既存のComputeスタックから
  lambdaExecutionRoleArn: cdk.Fn.importValue('TokyoRegion-permission-aware-rag-prod-Compute-LambdaExecutionRoleArn')
};

// スタック出力値の検証
const validateStackOutputs = (outputs) => {
  const requiredOutputs = ['vpcId', 'kmsKeyArn', 'opensearchEndpoint'];
  const missingOutputs = requiredOutputs.filter(key => !outputs[key]);
  
  if (missingOutputs.length > 0) {
    logger.error('必須スタック出力値が不足:', missingOutputs.join(', '));
    logger.error('依存スタックが正しくデプロイされているか確認してください');
    return false;
  }
  return true;
};

if (!validateStackOutputs(existingStackOutputs)) {
  process.exit(1);
}

// 高度権限制御スタックのデプロイ
let advancedPermissionStack;
try {
  advancedPermissionStack = new AdvancedPermissionStack(
    app, 
    namingGenerator.generateStackName('AdvancedPermission'), 
    {
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: region,
      },
    config: {
      project: {
        name: projectName
      },
      region: config.region,
      networking: config.networking,
      security: config.security,
      storage: config.storage,
      database: config.database,
      compute: config.compute,
      ai: config.ai,
      monitoring: config.monitoring,
      enterprise: config.enterprise
    },
    environment,
    opensearchEndpoint: existingStackOutputs.opensearchEndpoint,
    kmsKeyArn: existingStackOutputs.kmsKeyArn,
    vpcId: existingStackOutputs.vpcId,
    namingGenerator
  }
);
  logger.success('高度権限制御スタック作成完了');
} catch (error) {
  logger.error('高度権限制御スタック作成エラー:', error.message);
  process.exit(1);
}

// タグ設定
cdk.Tags.of(app).add('Project', projectName);
cdk.Tags.of(app).add('Environment', environment);
cdk.Tags.of(app).add('Region', region);
cdk.Tags.of(app).add('DeploymentType', 'Production');
cdk.Tags.of(app).add('IntegrationType', 'ExistingStack');
cdk.Tags.of(app).add('ManagedBy', 'CDK');
cdk.Tags.of(app).add('Architecture', 'Modular');

logger.success('本番環境デプロイメント設定完了');
logger.info('デプロイ対象スタック:', namingGenerator.generateStackName('AdvancedPermission'));
logger.info('次のステップ: npx cdk deploy --all を実行してください');

app.synth();