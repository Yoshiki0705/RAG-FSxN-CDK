/**
 * DataStack - 統合データスタック（モジュラーアーキテクチャ対応）
 * 
 * 機能:
 * - 統合ストレージ・データベースコンストラクトによる一元管理
 * - S3・FSx・DynamoDB・OpenSearchの統合
 * - Agent Steering準拠命名規則対応
 * - 個別スタックデプロイ完全対応
 */

import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

// 統合ストレージコンストラクト（モジュラーアーキテクチャ）
import { StorageConstruct } from '../../modules/storage/constructs/storage-construct';

// 統合データベースコンストラクト（モジュラーアーキテクチャ）
import { DatabaseConstruct } from '../../modules/database/constructs/database-construct';

// インターフェース
import { StorageConfig } from '../../modules/storage/interfaces/storage-config';
import { DatabaseConfig } from '../../modules/database/interfaces/database-config';

// 他スタックからの依存関係
import { SecurityStack } from './security-stack';

// タグ設定
import { TaggingStrategy, PermissionAwareRAGTags } from '../../config/tagging-config';

export interface DataStackConfig {
  readonly storage: StorageConfig;
  readonly database: DatabaseConfig;
}

export interface DataStackProps extends cdk.StackProps {
  readonly config: DataStackConfig; // 型安全な統合設定オブジェクト
  readonly securityStack?: SecurityStack; // セキュリティスタック（オプション）
  readonly namingGenerator?: any; // Agent Steering準拠命名ジェネレーター（オプション）
  readonly projectName: string; // プロジェクト名（コスト配布用）
  readonly environment: string; // 環境名（コスト配布用）
}

/**
 * 統合データスタック（モジュラーアーキテクチャ対応）
 * 
 * 統合ストレージ・データベースコンストラクトによる一元管理
 * 個別スタックデプロイ完全対応
 */
export class DataStack extends cdk.Stack {
  /** 統合ストレージコンストラクト */
  public readonly storage: StorageConstruct;
  
  /** 統合データベースコンストラクト */
  public readonly database: DatabaseConstruct;
  
  /** S3バケット名（他スタックからの参照用） */
  public readonly s3BucketNames: { [key: string]: string } = {};
  
  /** DynamoDBテーブル名（他スタックからの参照用） */
  public readonly dynamoDbTableNames: { [key: string]: string } = {};
  
  /** OpenSearchドメインエンドポイント（他スタックからの参照用） */
  public readonly openSearchEndpoint?: string;

  /** プロジェクト名（内部参照用） */
  private readonly projectName: string;
  
  /** 環境名（内部参照用） */
  private readonly environment: string;

  constructor(scope: Construct, id: string, props: DataStackProps) {
    super(scope, id, props);

    // プロパティの初期化
    this.projectName = props.projectName;
    this.environment = props.environment;

    console.log('💾 DataStack初期化開始...');
    console.log('📝 スタック名:', id);
    console.log('🏷️ Agent Steering準拠:', props.namingGenerator ? 'Yes' : 'No');

    // コスト配布タグの適用（FSx for ONTAP専用タグを含む）
    const taggingConfig = PermissionAwareRAGTags.getStandardConfig(
      props.projectName,
      props.environment
    );
    TaggingStrategy.applyTagsToStack(this, taggingConfig);

    // 注意: 依存関係は main-deployment-stack.ts で一元管理されます
    // セキュリティスタックとの依存関係は親スタックで設定済み

    // 統合ストレージコンストラクト作成
    this.storage = new StorageConstruct(this, 'Storage', {
      config: props.config.storage,
      projectName: props.projectName,
      environment: props.environment,
      kmsKey: props.securityStack?.kmsKey,
      namingGenerator: props.namingGenerator,
    });

    // 統合データベースコンストラクト作成
    this.database = new DatabaseConstruct(this, 'Database', {
      config: props.config.database,
      projectName: props.projectName,
      environment: props.environment,
      kmsKey: props.securityStack?.kmsKey,
      namingGenerator: props.namingGenerator,
    });

    // 他スタックからの参照用プロパティ設定
    this.setupCrossStackReferences();

    // スタック出力
    this.createOutputs();

    // タグ設定
    this.addStackTags();

    console.log('✅ DataStack初期化完了');
  }

  /**
   * S3バケットの型ガード
   */
  private isValidS3Bucket(bucket: unknown): bucket is { bucketName: string } {
    return typeof bucket === 'object' && 
           bucket !== null && 
           'bucketName' in bucket && 
           typeof (bucket as any).bucketName === 'string';
  }

  /**
   * DynamoDBテーブルの型ガード
   */
  private isValidDynamoDbTable(table: unknown): table is { tableName: string } {
    return typeof table === 'object' && 
           table !== null && 
           'tableName' in table && 
           typeof (table as any).tableName === 'string';
  }

  /**
   * 他スタックからの参照用プロパティ設定（型安全性強化版）
   */
  private setupCrossStackReferences(): void {
    try {
      // S3バケット名の設定（型安全性強化）
      if (this.storage.outputs?.s3Buckets) {
        Object.entries(this.storage.outputs.s3Buckets).forEach(([name, bucket]) => {
          if (this.isValidS3Bucket(bucket)) {
            this.s3BucketNames[name] = bucket.bucketName;
          } else {
            console.warn(`⚠️ 無効なS3バケット設定をスキップ: ${name}`);
          }
        });
      }

      // DynamoDBテーブル名の設定（型安全性強化）
      if (this.database.outputs?.dynamoDbTables) {
        Object.entries(this.database.outputs.dynamoDbTables).forEach(([name, table]) => {
          if (this.isValidDynamoDbTable(table)) {
            this.dynamoDbTableNames[name] = table.tableName;
          } else {
            console.warn(`⚠️ 無効なDynamoDBテーブル設定をスキップ: ${name}`);
          }
        });
      }

      // OpenSearchエンドポイントの設定（型安全性強化）
      if (this.database.outputs?.openSearchEndpoint && 
          typeof this.database.outputs.openSearchEndpoint === 'string') {
        this.openSearchEndpoint = this.database.outputs.openSearchEndpoint;
      }

      console.log('🔗 他スタック参照用プロパティ設定完了');
    } catch (error) {
      console.error('❌ 他スタック参照用プロパティ設定エラー:', error);
      throw new Error(`DataStack参照設定に失敗しました: ${error}`);
    }
  }

  /**
   * スタック出力作成（個別デプロイ対応）
   */
  private createOutputs(): void {
    // S3バケット名出力（他スタックからの参照用）
    Object.entries(this.s3BucketNames).forEach(([name, bucketName]) => {
      new cdk.CfnOutput(this, `S3Bucket${name}Name`, {
        value: bucketName,
        description: `S3 ${name} Bucket Name`,
        exportName: `${this.stackName}-S3Bucket${name}Name`,
      });
    });

    // DynamoDBテーブル名出力（他スタックからの参照用）
    Object.entries(this.dynamoDbTableNames).forEach(([name, tableName]) => {
      new cdk.CfnOutput(this, `DynamoDb${name}TableName`, {
        value: tableName,
        description: `DynamoDB ${name} Table Name`,
        exportName: `${this.stackName}-DynamoDb${name}TableName`,
      });
    });

    // OpenSearchエンドポイント出力（存在する場合のみ）
    if (this.openSearchEndpoint) {
      new cdk.CfnOutput(this, 'OpenSearchEndpoint', {
        value: this.openSearchEndpoint,
        description: 'OpenSearch Domain Endpoint',
        exportName: `${this.stackName}-OpenSearchEndpoint`,
      });
    }

    // ストレージ統合出力（存在する場合のみ）
    if (this.storage.outputs) {
      // FSx File System ID
      if (this.storage.outputs.fsxFileSystemId) {
        new cdk.CfnOutput(this, 'FsxFileSystemId', {
          value: this.storage.outputs.fsxFileSystemId,
          description: 'FSx for NetApp ONTAP File System ID',
          exportName: `${this.stackName}-FsxFileSystemId`,
        });
      }

      // EFS File System ID
      if (this.storage.outputs.efsFileSystemId) {
        new cdk.CfnOutput(this, 'EfsFileSystemId', {
          value: this.storage.outputs.efsFileSystemId,
          description: 'EFS File System ID',
          exportName: `${this.stackName}-EfsFileSystemId`,
        });
      }
    }

    console.log('📤 DataStack出力値作成完了');
  }

  /**
   * スタックタグ設定（統一タグ戦略準拠）
   */
  private addStackTags(): void {
    try {
      // プロジェクト標準タグ設定を取得（propsから取得）
      const taggingConfig = PermissionAwareRAGTags.getStandardConfig(
        this.projectName || 'permission-aware-rag',
        this.environment || 'dev'
      );
      
      // 環境別タグ設定をマージ
      const envConfig = PermissionAwareRAGTags.getEnvironmentConfig(this.environment || 'dev');
      const mergedConfig = { ...taggingConfig, ...envConfig };
      
      // セキュリティ要件タグをマージ
      const securityConfig = PermissionAwareRAGTags.getSecurityConfig(this.environment as any || 'dev');
      const finalConfig = { ...mergedConfig, ...securityConfig };
      
      // データスタック固有のカスタムタグを追加
      finalConfig.customTags = {
        ...finalConfig.customTags,
        'Module': 'Storage+Database',
        'StackType': 'Integrated',
        'Architecture': 'Modular',
        'StorageTypes': 'S3+FSx+EFS',
        'DatabaseTypes': 'DynamoDB+OpenSearch',
        'IndividualDeploySupport': 'Yes',
        'Data-Classification': 'Sensitive',
        'Backup-Required': 'true',
        'Encryption-Required': 'true',
      };
      
      // 統一タグ戦略を適用
      TaggingStrategy.applyTagsToStack(this, finalConfig);
      
      console.log('🏷️ DataStack統一タグ設定完了');
    } catch (error) {
      console.error('❌ DataStackタグ設定エラー:', error);
      
      // フォールバック: 基本タグのみ設定
      cdk.Tags.of(this).add('Module', 'Storage+Database');
      cdk.Tags.of(this).add('StackType', 'Integrated');
      cdk.Tags.of(this).add('ManagedBy', 'CDK');
      
      console.log('⚠️ DataStackフォールバックタグ設定完了');
    }
  }
  

}