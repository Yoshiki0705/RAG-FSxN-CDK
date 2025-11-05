/**
 * 本番環境リソースID設定
 * 
 * 注意: このファイルは環境固有の情報を含むため、
 * 実際の本番環境では環境変数やAWS Systems Manager Parameter Storeから取得することを推奨
 */

export interface ProductionResourceIds {
  readonly vpcId: string;
  readonly availabilityZones: readonly string[];
  readonly privateSubnetIds: readonly string[];
  readonly publicSubnetIds: readonly string[];
  readonly documentsBucketName: string;
  readonly embeddingsBucketName: string;
  readonly sessionTableName: string;
  readonly kmsKeyArn: string;
}

/**
 * 環境変数から本番リソースIDを取得
 */
export function getProductionResourceIds(): ProductionResourceIds {
  return {
    vpcId: process.env.EXISTING_VPC_ID || 'vpc-09aa251d6db52b1fc',
    availabilityZones: (process.env.AVAILABILITY_ZONES?.split(',') || [
      'ap-northeast-1a', 
      'ap-northeast-1c', 
      'ap-northeast-1d'
    ]) as const,
    privateSubnetIds: (process.env.EXISTING_PRIVATE_SUBNET_IDS?.split(',') || [
      'subnet-0a84a16a1641e970f',
      'subnet-0c4599b4863ff4d33', 
      'subnet-0c9ad18a58c06e7c5'
    ]) as const,
    publicSubnetIds: (process.env.EXISTING_PUBLIC_SUBNET_IDS?.split(',') || [
      'subnet-06a00a8866d09b912',
      'subnet-0d7c7e43c1325cd3b',
      'subnet-06df589d2ed2a5fc0'
    ]) as const,
    documentsBucketName: process.env.EXISTING_DOCUMENTS_BUCKET || 'tokyoregion-permission-aw-storageconstructdocument-tavuxtzodhgz',
    embeddingsBucketName: process.env.EXISTING_EMBEDDINGS_BUCKET || 'tokyoregion-permission-aw-storageconstructembeddin-mp6fwdzbirdv',
    sessionTableName: process.env.EXISTING_SESSION_TABLE || 'TokyoRegion-permission-aware-rag-prod-Data-DatabaseConstructSessionTableB7A378FC-MAR9Z6MWLWDC',
    kmsKeyArn: process.env.EXISTING_KMS_KEY_ARN || 'arn:aws:kms:ap-northeast-1:178625946981:key/781ad5cd-8b6b-4d11-9146-dab63a2147d6'
  };
}

/**
 * リソースIDの検証
 */
export function validateResourceIds(resourceIds: ProductionResourceIds): void {
  const requiredFields: (keyof ProductionResourceIds)[] = [
    'vpcId', 'documentsBucketName', 'embeddingsBucketName', 
    'sessionTableName', 'kmsKeyArn'
  ];

  for (const field of requiredFields) {
    if (!resourceIds[field]) {
      throw new Error(`必須リソースID が設定されていません: ${field}`);
    }
  }

  // VPC IDの形式チェック
  if (!resourceIds.vpcId.match(/^vpc-[a-f0-9]{8,17}$/)) {
    throw new Error(`無効なVPC ID形式: ${resourceIds.vpcId}`);
  }

  // KMS ARNの形式チェック
  if (!resourceIds.kmsKeyArn.match(/^arn:aws:kms:[a-z0-9-]+:[0-9]{12}:key\/[a-f0-9-]{36}$/)) {
    throw new Error(`無効なKMS ARN形式: ${resourceIds.kmsKeyArn}`);
  }

  console.log('✅ リソースID検証完了');
}