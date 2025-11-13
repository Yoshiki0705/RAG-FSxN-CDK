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
export declare function getProductionResourceIds(): ProductionResourceIds;
/**
 * リソースIDの検証
 */
export declare function validateResourceIds(resourceIds: ProductionResourceIds): void;
