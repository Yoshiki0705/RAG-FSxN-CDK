#!/usr/bin/env node
/**
 * 本番環境デプロイメント統合アプリケーション（修正版）
 * 既存の東京リージョンスタックと高度権限制御システムを統合
 */

require('source-map-support/register');
const cdk = require('aws-cdk-lib');
const { AdvancedPermissionStack } = require('../lib/stacks/integrated/advanced-permission-stack');

const app = new cdk.App();

// 環境設定
const environment = app.node.tryGetContext('environment') || 'prod';
const projectName = app.node.tryGetContext('projectName') || 'permission-aware-rag';
const region = app.node.tryGetContext('region') || 'ap-northeast-1';

console.log('🚀 本番環境デプロイメント開始...');
console.log('📝 プロジェクト名:', projectName);
console.log('🌍 環境:', environment);
console.log('🗾 リージョン:', region);

// 東京リージョン設定（簡略化）
const config = {
  region: {
    code: 'ap-northeast-1',
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

// 命名ジェネレーター（簡略化）
const namingGenerator = {
  generateStackName: (component) => {
    return `TokyoRegion-${projectName}-${environment}-${component}`;
  }
};

// 既存スタックからの出力値を参照（実際に存在する出力値を使用）
const existingStackOutputs = {
  // 既存のNetworkingスタックから（実際に存在する出力値）
  vpcId: cdk.Fn.importValue('TokyoRegion-permission-aware-rag-prod-Networking:ExportsOutputRefVpcConstructVpcId3239CBDB'),
  
  // 既存のSecurityスタックから
  kmsKeyArn: cdk.Fn.importValue('TokyoRegion-permission-aware-rag-prod-Security-KmsKeyArn'),
  
  // OpenSearchEndpointは存在しないため、ダミー値を使用
  opensearchEndpoint: 'https://dummy-opensearch-endpoint.ap-northeast-1.es.amazonaws.com',
  
  // 既存のComputeスタックから（存在する場合）
  lambdaExecutionRoleArn: 'arn:aws:iam::178625946981:role/dummy-lambda-execution-role'
};

// 高度権限制御スタックのデプロイ
const advancedPermissionStack = new AdvancedPermissionStack(
  app, 
  namingGenerator.generateStackName('AdvancedPermission'), 
  {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT || '178625946981',
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

// タグ設定
cdk.Tags.of(app).add('Project', projectName);
cdk.Tags.of(app).add('Environment', environment);
cdk.Tags.of(app).add('Region', region);
cdk.Tags.of(app).add('DeploymentType', 'Production');
cdk.Tags.of(app).add('IntegrationType', 'ExistingStack');
cdk.Tags.of(app).add('ManagedBy', 'CDK');
cdk.Tags.of(app).add('Architecture', 'Modular');

console.log('✅ 本番環境デプロイメント設定完了');
console.log('📦 デプロイ対象スタック:', namingGenerator.generateStackName('AdvancedPermission'));

app.synth();