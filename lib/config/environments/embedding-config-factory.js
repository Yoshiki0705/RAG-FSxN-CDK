"use strict";
/**
 * Embedding設定ファクトリー
 *
 * Agent Steeringルール準拠:
 * - 設定外部化とフラグ制御システム
 * - CDKコンテキストによる設定制御機能
 * - 各モジュールの独立した有効化/無効化フラグ機能
 *
 * Requirements: 4.4, 4.5
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbeddingConfigFactory = void 0;
/**
 * Embedding設定ファクトリー
 */
class EmbeddingConfigFactory {
    /**
     * CDKコンテキストから設定を生成
     */
    static createFromContext(app, environment) {
        const projectName = app.node.tryGetContext('projectName') || 'permission-aware-rag';
        const region = app.node.tryGetContext('region') || 'ap-northeast-1';
        const flags = EmbeddingConfigFactory.getFeatureFlags(app);
        const envConfig = EmbeddingConfigFactory.getEnvironmentConfig(app, environment);
        return {
            projectName,
            environment,
            awsBatch: EmbeddingConfigFactory.createBatchConfig(app, flags, envConfig),
            ecsOnEC2: EmbeddingConfigFactory.createEcsConfig(app, flags, envConfig),
            spotFleet: EmbeddingConfigFactory.createSpotFleetConfig(app, flags, envConfig),
            commonResources: EmbeddingConfigFactory.createCommonResourcesConfig(app, envConfig),
            monitoring: EmbeddingConfigFactory.createMonitoringConfig(app, envConfig),
            jobDefinition: EmbeddingConfigFactory.createJobDefinitionConfig(app, envConfig),
            fsxIntegration: EmbeddingConfigFactory.createFsxIntegrationConfig(app),
            activeDirectory: EmbeddingConfigFactory.createActiveDirectoryConfig(app),
            bedrock: EmbeddingConfigFactory.createBedrockConfig(app),
            openSearch: EmbeddingConfigFactory.createOpenSearchIntegrationConfig(app),
            rds: EmbeddingConfigFactory.createRdsConfig(app),
        };
    }
    /**
     * 機能フラグを取得
     */
    static getFeatureFlags(app) {
        return {
            enableAwsBatch: app.node.tryGetContext('embedding:enableAwsBatch') ?? true,
            enableEcsOnEC2: app.node.tryGetContext('embedding:enableEcsOnEC2') ?? false,
            enableSpotFleet: app.node.tryGetContext('embedding:enableSpotFleet') ?? false,
            enableMonitoring: app.node.tryGetContext('embedding:enableMonitoring') ?? true,
            enableAutoScaling: app.node.tryGetContext('embedding:enableAutoScaling') ?? true,
        };
    }
    /**
     * 環境別設定を取得
     */
    static getEnvironmentConfig(app, environment) {
        const baseConfig = {
            instanceTypes: app.node.tryGetContext('embedding:instanceTypes') || ['m5.large', 'm5.xlarge'],
            maxvCpus: app.node.tryGetContext('embedding:maxvCpus') || 1000,
            minvCpus: app.node.tryGetContext('embedding:minvCpus') || 0,
            multiAz: app.node.tryGetContext('embedding:multiAz') ?? true,
        };
        switch (environment) {
            case 'prod':
            case 'production':
                return {
                    ...baseConfig,
                    maxvCpus: app.node.tryGetContext('embedding:prod:maxvCpus') || 2000,
                    multiAz: true,
                };
            case 'dev':
            case 'development':
                return {
                    ...baseConfig,
                    maxvCpus: app.node.tryGetContext('embedding:dev:maxvCpus') || 500,
                    instanceTypes: ['m5.large'],
                };
            default:
                return baseConfig;
        }
    }
    /**
     * Job Definition設定を作成
     */
    static createJobDefinitionConfig(app, envConfig) {
        return {
            jobDefinitionName: app.node.tryGetContext('embedding:jobDefinition:name') || 'embedding-job-definition',
            cpu: app.node.tryGetContext('embedding:jobDefinition:cpu') || 2,
            memoryMiB: app.node.tryGetContext('embedding:jobDefinition:memoryMiB') || 4096,
            timeoutHours: app.node.tryGetContext('embedding:jobDefinition:timeoutHours') || 1,
            retryAttempts: app.node.tryGetContext('embedding:jobDefinition:retryAttempts') || 3,
            platformCapabilities: app.node.tryGetContext('embedding:jobDefinition:platformCapabilities') || ['EC2'],
        };
    }
    /**
     * FSx統合設定を作成
     */
    static createFsxIntegrationConfig(app) {
        return {
            fileSystemId: app.node.tryGetContext('embedding:fsx:fileSystemId') || process.env.FSX_ID,
            svmRef: app.node.tryGetContext('embedding:fsx:svmRef') || process.env.SVM_REF,
            svmId: app.node.tryGetContext('embedding:fsx:svmId') || process.env.SVM_ID,
            cifsdataVolName: app.node.tryGetContext('embedding:fsx:cifsdataVolName') || process.env.CIFSDATA_VOL_NAME || 'smb_share',
            ragdbVolPath: app.node.tryGetContext('embedding:fsx:ragdbVolPath') || process.env.RAGDB_VOL_PATH || '/smb_share/ragdb',
        };
    }
    /**
     * Active Directory設定を作成
     */
    static createActiveDirectoryConfig(app) {
        return {
            domain: app.node.tryGetContext('embedding:ad:domain') || 'example.com',
            username: app.node.tryGetContext('embedding:ad:username') || 'admin',
            passwordSecretArn: app.node.tryGetContext('embedding:ad:passwordSecretArn') || '',
        };
    }
    /**
     * Bedrock設定を作成
     */
    static createBedrockConfig(app) {
        return {
            region: app.node.tryGetContext('embedding:bedrock:region') || app.node.tryGetContext('region') || 'us-east-1',
            modelId: app.node.tryGetContext('embedding:bedrock:modelId') || 'amazon.titan-embed-text-v1',
        };
    }
    /**
     * OpenSearch統合設定を作成
     */
    static createOpenSearchIntegrationConfig(app) {
        return {
            collectionName: app.node.tryGetContext('embedding:openSearch:collectionName'),
            indexName: app.node.tryGetContext('embedding:openSearch:indexName') || 'documents',
        };
    }
    /**
     * RDS設定を作成
     */
    static createRdsConfig(app) {
        const secretName = app.node.tryGetContext('embedding:rds:secretName');
        if (!secretName) {
            return undefined;
        }
        return {
            secretName,
            secretArn: app.node.tryGetContext('embedding:rds:secretArn') || '',
            clusterArn: app.node.tryGetContext('embedding:rds:clusterArn') || '',
        };
    }
    // 他のメソッドは簡略化のため省略
    static createBatchConfig(app, flags, envConfig) {
        return {};
    }
    static createEcsConfig(app, flags, envConfig) {
        return {};
    }
    static createSpotFleetConfig(app, flags, envConfig) {
        return {};
    }
    static createCommonResourcesConfig(app, envConfig) {
        return {};
    }
    static createMonitoringConfig(app, envConfig) {
        return {};
    }
}
exports.EmbeddingConfigFactory = EmbeddingConfigFactory;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW1iZWRkaW5nLWNvbmZpZy1mYWN0b3J5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZW1iZWRkaW5nLWNvbmZpZy1mYWN0b3J5LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7Ozs7Ozs7O0dBU0c7OztBQWtCSDs7R0FFRztBQUNILE1BQWEsc0JBQXNCO0lBQ2pDOztPQUVHO0lBQ0gsTUFBTSxDQUFDLGlCQUFpQixDQUFDLEdBQVksRUFBRSxXQUFtQjtRQUN4RCxNQUFNLFdBQVcsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxhQUFhLENBQUMsSUFBSSxzQkFBc0IsQ0FBQztRQUNwRixNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsSUFBSSxnQkFBZ0IsQ0FBQztRQUVwRSxNQUFNLEtBQUssR0FBRyxzQkFBc0IsQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDLENBQUM7UUFDMUQsTUFBTSxTQUFTLEdBQUcsc0JBQXNCLENBQUMsb0JBQW9CLENBQUMsR0FBRyxFQUFFLFdBQVcsQ0FBQyxDQUFDO1FBRWhGLE9BQU87WUFDTCxXQUFXO1lBQ1gsV0FBVztZQUNYLFFBQVEsRUFBRSxzQkFBc0IsQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLFNBQVMsQ0FBQztZQUN6RSxRQUFRLEVBQUUsc0JBQXNCLENBQUMsZUFBZSxDQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUUsU0FBUyxDQUFDO1lBQ3ZFLFNBQVMsRUFBRSxzQkFBc0IsQ0FBQyxxQkFBcUIsQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLFNBQVMsQ0FBQztZQUM5RSxlQUFlLEVBQUUsc0JBQXNCLENBQUMsMkJBQTJCLENBQUMsR0FBRyxFQUFFLFNBQVMsQ0FBQztZQUNuRixVQUFVLEVBQUUsc0JBQXNCLENBQUMsc0JBQXNCLENBQUMsR0FBRyxFQUFFLFNBQVMsQ0FBQztZQUN6RSxhQUFhLEVBQUUsc0JBQXNCLENBQUMseUJBQXlCLENBQUMsR0FBRyxFQUFFLFNBQVMsQ0FBQztZQUMvRSxjQUFjLEVBQUUsc0JBQXNCLENBQUMsMEJBQTBCLENBQUMsR0FBRyxDQUFDO1lBQ3RFLGVBQWUsRUFBRSxzQkFBc0IsQ0FBQywyQkFBMkIsQ0FBQyxHQUFHLENBQUM7WUFDeEUsT0FBTyxFQUFFLHNCQUFzQixDQUFDLG1CQUFtQixDQUFDLEdBQUcsQ0FBQztZQUN4RCxVQUFVLEVBQUUsc0JBQXNCLENBQUMsaUNBQWlDLENBQUMsR0FBRyxDQUFDO1lBQ3pFLEdBQUcsRUFBRSxzQkFBc0IsQ0FBQyxlQUFlLENBQUMsR0FBRyxDQUFDO1NBQ2pELENBQUM7SUFDSixDQUFDO0lBRUQ7O09BRUc7SUFDSyxNQUFNLENBQUMsZUFBZSxDQUFDLEdBQVk7UUFDekMsT0FBTztZQUNMLGNBQWMsRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQywwQkFBMEIsQ0FBQyxJQUFJLElBQUk7WUFDMUUsY0FBYyxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLDBCQUEwQixDQUFDLElBQUksS0FBSztZQUMzRSxlQUFlLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsMkJBQTJCLENBQUMsSUFBSSxLQUFLO1lBQzdFLGdCQUFnQixFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLDRCQUE0QixDQUFDLElBQUksSUFBSTtZQUM5RSxpQkFBaUIsRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyw2QkFBNkIsQ0FBQyxJQUFJLElBQUk7U0FDakYsQ0FBQztJQUNKLENBQUM7SUFFRDs7T0FFRztJQUNLLE1BQU0sQ0FBQyxvQkFBb0IsQ0FBQyxHQUFZLEVBQUUsV0FBbUI7UUFDbkUsTUFBTSxVQUFVLEdBQUc7WUFDakIsYUFBYSxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLHlCQUF5QixDQUFDLElBQUksQ0FBQyxVQUFVLEVBQUUsV0FBVyxDQUFDO1lBQzdGLFFBQVEsRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxvQkFBb0IsQ0FBQyxJQUFJLElBQUk7WUFDOUQsUUFBUSxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLG9CQUFvQixDQUFDLElBQUksQ0FBQztZQUMzRCxPQUFPLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsbUJBQW1CLENBQUMsSUFBSSxJQUFJO1NBQzdELENBQUM7UUFFRixRQUFRLFdBQVcsRUFBRSxDQUFDO1lBQ3BCLEtBQUssTUFBTSxDQUFDO1lBQ1osS0FBSyxZQUFZO2dCQUNmLE9BQU87b0JBQ0wsR0FBRyxVQUFVO29CQUNiLFFBQVEsRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyx5QkFBeUIsQ0FBQyxJQUFJLElBQUk7b0JBQ25FLE9BQU8sRUFBRSxJQUFJO2lCQUNkLENBQUM7WUFFSixLQUFLLEtBQUssQ0FBQztZQUNYLEtBQUssYUFBYTtnQkFDaEIsT0FBTztvQkFDTCxHQUFHLFVBQVU7b0JBQ2IsUUFBUSxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLHdCQUF3QixDQUFDLElBQUksR0FBRztvQkFDakUsYUFBYSxFQUFFLENBQUMsVUFBVSxDQUFDO2lCQUM1QixDQUFDO1lBRUo7Z0JBQ0UsT0FBTyxVQUFVLENBQUM7UUFDdEIsQ0FBQztJQUNILENBQUM7SUFFRDs7T0FFRztJQUNLLE1BQU0sQ0FBQyx5QkFBeUIsQ0FDdEMsR0FBWSxFQUNaLFNBQXFDO1FBRXJDLE9BQU87WUFDTCxpQkFBaUIsRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyw4QkFBOEIsQ0FBQyxJQUFJLDBCQUEwQjtZQUN2RyxHQUFHLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsNkJBQTZCLENBQUMsSUFBSSxDQUFDO1lBQy9ELFNBQVMsRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxtQ0FBbUMsQ0FBQyxJQUFJLElBQUk7WUFDOUUsWUFBWSxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLHNDQUFzQyxDQUFDLElBQUksQ0FBQztZQUNqRixhQUFhLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsdUNBQXVDLENBQUMsSUFBSSxDQUFDO1lBQ25GLG9CQUFvQixFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLDhDQUE4QyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUM7U0FDeEcsQ0FBQztJQUNKLENBQUM7SUFFRDs7T0FFRztJQUNLLE1BQU0sQ0FBQywwQkFBMEIsQ0FBQyxHQUFZO1FBQ3BELE9BQU87WUFDTCxZQUFZLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsNEJBQTRCLENBQUMsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLE1BQU07WUFDeEYsTUFBTSxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLHNCQUFzQixDQUFDLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxPQUFPO1lBQzdFLEtBQUssRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxxQkFBcUIsQ0FBQyxJQUFJLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTTtZQUMxRSxlQUFlLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsK0JBQStCLENBQUMsSUFBSSxPQUFPLENBQUMsR0FBRyxDQUFDLGlCQUFpQixJQUFJLFdBQVc7WUFDeEgsWUFBWSxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLDRCQUE0QixDQUFDLElBQUksT0FBTyxDQUFDLEdBQUcsQ0FBQyxjQUFjLElBQUksa0JBQWtCO1NBQ3ZILENBQUM7SUFDSixDQUFDO0lBRUQ7O09BRUc7SUFDSyxNQUFNLENBQUMsMkJBQTJCLENBQUMsR0FBWTtRQUNyRCxPQUFPO1lBQ0wsTUFBTSxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLHFCQUFxQixDQUFDLElBQUksYUFBYTtZQUN0RSxRQUFRLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsdUJBQXVCLENBQUMsSUFBSSxPQUFPO1lBQ3BFLGlCQUFpQixFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLGdDQUFnQyxDQUFDLElBQUksRUFBRTtTQUNsRixDQUFDO0lBQ0osQ0FBQztJQUVEOztPQUVHO0lBQ0ssTUFBTSxDQUFDLG1CQUFtQixDQUFDLEdBQVk7UUFDN0MsT0FBTztZQUNMLE1BQU0sRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQywwQkFBMEIsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFFBQVEsQ0FBQyxJQUFJLFdBQVc7WUFDN0csT0FBTyxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLDJCQUEyQixDQUFDLElBQUksNEJBQTRCO1NBQzdGLENBQUM7SUFDSixDQUFDO0lBRUQ7O09BRUc7SUFDSyxNQUFNLENBQUMsaUNBQWlDLENBQUMsR0FBWTtRQUMzRCxPQUFPO1lBQ0wsY0FBYyxFQUFFLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLHFDQUFxQyxDQUFDO1lBQzdFLFNBQVMsRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxnQ0FBZ0MsQ0FBQyxJQUFJLFdBQVc7U0FDbkYsQ0FBQztJQUNKLENBQUM7SUFFRDs7T0FFRztJQUNLLE1BQU0sQ0FBQyxlQUFlLENBQUMsR0FBWTtRQUN6QyxNQUFNLFVBQVUsR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO1FBQ3RFLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUNoQixPQUFPLFNBQVMsQ0FBQztRQUNuQixDQUFDO1FBRUQsT0FBTztZQUNMLFVBQVU7WUFDVixTQUFTLEVBQUUsR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMseUJBQXlCLENBQUMsSUFBSSxFQUFFO1lBQ2xFLFVBQVUsRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQywwQkFBMEIsQ0FBQyxJQUFJLEVBQUU7U0FDckUsQ0FBQztJQUNKLENBQUM7SUFFRCxrQkFBa0I7SUFDVixNQUFNLENBQUMsaUJBQWlCLENBQUMsR0FBWSxFQUFFLEtBQVUsRUFBRSxTQUFjO1FBQ3ZFLE9BQU8sRUFBMEIsQ0FBQztJQUNwQyxDQUFDO0lBRU8sTUFBTSxDQUFDLGVBQWUsQ0FBQyxHQUFZLEVBQUUsS0FBVSxFQUFFLFNBQWM7UUFDckUsT0FBTyxFQUF3QixDQUFDO0lBQ2xDLENBQUM7SUFFTyxNQUFNLENBQUMscUJBQXFCLENBQUMsR0FBWSxFQUFFLEtBQVUsRUFBRSxTQUFjO1FBQzNFLE9BQU8sRUFBOEIsQ0FBQztJQUN4QyxDQUFDO0lBRU8sTUFBTSxDQUFDLDJCQUEyQixDQUFDLEdBQVksRUFBRSxTQUFjO1FBQ3JFLE9BQU8sRUFBb0MsQ0FBQztJQUM5QyxDQUFDO0lBRU8sTUFBTSxDQUFDLHNCQUFzQixDQUFDLEdBQVksRUFBRSxTQUFjO1FBQ2hFLE9BQU8sRUFBK0IsQ0FBQztJQUN6QyxDQUFDO0NBQ0Y7QUEzS0Qsd0RBMktDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBFbWJlZGRpbmfoqK3lrprjg5XjgqHjgq/jg4jjg6rjg7xcbiAqIFxuICogQWdlbnQgU3RlZXJpbmfjg6vjg7zjg6vmupbmi6A6XG4gKiAtIOioreWumuWklumDqOWMluOBqOODleODqeOCsOWItuW+oeOCt+OCueODhuODoFxuICogLSBDREvjgrPjg7Pjg4bjgq3jgrnjg4jjgavjgojjgovoqK3lrprliLblvqHmqZ/og71cbiAqIC0g5ZCE44Oi44K444Ol44O844Or44Gu54us56uL44GX44Gf5pyJ5Yq55YyWL+eEoeWKueWMluODleODqeOCsOapn+iDvVxuICogXG4gKiBSZXF1aXJlbWVudHM6IDQuNCwgNC41XG4gKi9cblxuaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7XG4gIEVtYmVkZGluZ0NvbmZpZyxcbiAgRW1iZWRkaW5nQmF0Y2hDb25maWcsXG4gIEVtYmVkZGluZ0Vjc0NvbmZpZyxcbiAgRW1iZWRkaW5nU3BvdEZsZWV0Q29uZmlnLFxuICBFbWJlZGRpbmdDb21tb25SZXNvdXJjZXNDb25maWcsXG4gIEVtYmVkZGluZ01vbml0b3JpbmdDb25maWcsXG4gIEVtYmVkZGluZ0pvYkRlZmluaXRpb25Db25maWcsXG4gIEVtYmVkZGluZ0ZzeEludGVncmF0aW9uQ29uZmlnLFxuICBFbWJlZGRpbmdBY3RpdmVEaXJlY3RvcnlDb25maWcsXG4gIEVtYmVkZGluZ0JlZHJvY2tDb25maWcsXG4gIEVtYmVkZGluZ09wZW5TZWFyY2hJbnRlZ3JhdGlvbkNvbmZpZyxcbiAgRW1iZWRkaW5nUmRzQ29uZmlnXG59IGZyb20gJy4uLy4uL21vZHVsZXMvYWkvaW50ZXJmYWNlcy9lbWJlZGRpbmctY29uZmlnJztcblxuLyoqXG4gKiBFbWJlZGRpbmfoqK3lrprjg5XjgqHjgq/jg4jjg6rjg7xcbiAqL1xuZXhwb3J0IGNsYXNzIEVtYmVkZGluZ0NvbmZpZ0ZhY3Rvcnkge1xuICAvKipcbiAgICogQ0RL44Kz44Oz44OG44Kt44K544OI44GL44KJ6Kit5a6a44KS55Sf5oiQXG4gICAqL1xuICBzdGF0aWMgY3JlYXRlRnJvbUNvbnRleHQoYXBwOiBjZGsuQXBwLCBlbnZpcm9ubWVudDogc3RyaW5nKTogRW1iZWRkaW5nQ29uZmlnIHtcbiAgICBjb25zdCBwcm9qZWN0TmFtZSA9IGFwcC5ub2RlLnRyeUdldENvbnRleHQoJ3Byb2plY3ROYW1lJykgfHwgJ3Blcm1pc3Npb24tYXdhcmUtcmFnJztcbiAgICBjb25zdCByZWdpb24gPSBhcHAubm9kZS50cnlHZXRDb250ZXh0KCdyZWdpb24nKSB8fCAnYXAtbm9ydGhlYXN0LTEnO1xuXG4gICAgY29uc3QgZmxhZ3MgPSBFbWJlZGRpbmdDb25maWdGYWN0b3J5LmdldEZlYXR1cmVGbGFncyhhcHApO1xuICAgIGNvbnN0IGVudkNvbmZpZyA9IEVtYmVkZGluZ0NvbmZpZ0ZhY3RvcnkuZ2V0RW52aXJvbm1lbnRDb25maWcoYXBwLCBlbnZpcm9ubWVudCk7XG5cbiAgICByZXR1cm4ge1xuICAgICAgcHJvamVjdE5hbWUsXG4gICAgICBlbnZpcm9ubWVudCxcbiAgICAgIGF3c0JhdGNoOiBFbWJlZGRpbmdDb25maWdGYWN0b3J5LmNyZWF0ZUJhdGNoQ29uZmlnKGFwcCwgZmxhZ3MsIGVudkNvbmZpZyksXG4gICAgICBlY3NPbkVDMjogRW1iZWRkaW5nQ29uZmlnRmFjdG9yeS5jcmVhdGVFY3NDb25maWcoYXBwLCBmbGFncywgZW52Q29uZmlnKSxcbiAgICAgIHNwb3RGbGVldDogRW1iZWRkaW5nQ29uZmlnRmFjdG9yeS5jcmVhdGVTcG90RmxlZXRDb25maWcoYXBwLCBmbGFncywgZW52Q29uZmlnKSxcbiAgICAgIGNvbW1vblJlc291cmNlczogRW1iZWRkaW5nQ29uZmlnRmFjdG9yeS5jcmVhdGVDb21tb25SZXNvdXJjZXNDb25maWcoYXBwLCBlbnZDb25maWcpLFxuICAgICAgbW9uaXRvcmluZzogRW1iZWRkaW5nQ29uZmlnRmFjdG9yeS5jcmVhdGVNb25pdG9yaW5nQ29uZmlnKGFwcCwgZW52Q29uZmlnKSxcbiAgICAgIGpvYkRlZmluaXRpb246IEVtYmVkZGluZ0NvbmZpZ0ZhY3RvcnkuY3JlYXRlSm9iRGVmaW5pdGlvbkNvbmZpZyhhcHAsIGVudkNvbmZpZyksXG4gICAgICBmc3hJbnRlZ3JhdGlvbjogRW1iZWRkaW5nQ29uZmlnRmFjdG9yeS5jcmVhdGVGc3hJbnRlZ3JhdGlvbkNvbmZpZyhhcHApLFxuICAgICAgYWN0aXZlRGlyZWN0b3J5OiBFbWJlZGRpbmdDb25maWdGYWN0b3J5LmNyZWF0ZUFjdGl2ZURpcmVjdG9yeUNvbmZpZyhhcHApLFxuICAgICAgYmVkcm9jazogRW1iZWRkaW5nQ29uZmlnRmFjdG9yeS5jcmVhdGVCZWRyb2NrQ29uZmlnKGFwcCksXG4gICAgICBvcGVuU2VhcmNoOiBFbWJlZGRpbmdDb25maWdGYWN0b3J5LmNyZWF0ZU9wZW5TZWFyY2hJbnRlZ3JhdGlvbkNvbmZpZyhhcHApLFxuICAgICAgcmRzOiBFbWJlZGRpbmdDb25maWdGYWN0b3J5LmNyZWF0ZVJkc0NvbmZpZyhhcHApLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICog5qmf6IO944OV44Op44Kw44KS5Y+W5b6XXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBnZXRGZWF0dXJlRmxhZ3MoYXBwOiBjZGsuQXBwKTogRW1iZWRkaW5nRmVhdHVyZUZsYWdzIHtcbiAgICByZXR1cm4ge1xuICAgICAgZW5hYmxlQXdzQmF0Y2g6IGFwcC5ub2RlLnRyeUdldENvbnRleHQoJ2VtYmVkZGluZzplbmFibGVBd3NCYXRjaCcpID8/IHRydWUsXG4gICAgICBlbmFibGVFY3NPbkVDMjogYXBwLm5vZGUudHJ5R2V0Q29udGV4dCgnZW1iZWRkaW5nOmVuYWJsZUVjc09uRUMyJykgPz8gZmFsc2UsXG4gICAgICBlbmFibGVTcG90RmxlZXQ6IGFwcC5ub2RlLnRyeUdldENvbnRleHQoJ2VtYmVkZGluZzplbmFibGVTcG90RmxlZXQnKSA/PyBmYWxzZSxcbiAgICAgIGVuYWJsZU1vbml0b3Jpbmc6IGFwcC5ub2RlLnRyeUdldENvbnRleHQoJ2VtYmVkZGluZzplbmFibGVNb25pdG9yaW5nJykgPz8gdHJ1ZSxcbiAgICAgIGVuYWJsZUF1dG9TY2FsaW5nOiBhcHAubm9kZS50cnlHZXRDb250ZXh0KCdlbWJlZGRpbmc6ZW5hYmxlQXV0b1NjYWxpbmcnKSA/PyB0cnVlLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICog55Kw5aKD5Yil6Kit5a6a44KS5Y+W5b6XXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBnZXRFbnZpcm9ubWVudENvbmZpZyhhcHA6IGNkay5BcHAsIGVudmlyb25tZW50OiBzdHJpbmcpOiBFbWJlZGRpbmdFbnZpcm9ubWVudENvbmZpZyB7XG4gICAgY29uc3QgYmFzZUNvbmZpZyA9IHtcbiAgICAgIGluc3RhbmNlVHlwZXM6IGFwcC5ub2RlLnRyeUdldENvbnRleHQoJ2VtYmVkZGluZzppbnN0YW5jZVR5cGVzJykgfHwgWydtNS5sYXJnZScsICdtNS54bGFyZ2UnXSxcbiAgICAgIG1heHZDcHVzOiBhcHAubm9kZS50cnlHZXRDb250ZXh0KCdlbWJlZGRpbmc6bWF4dkNwdXMnKSB8fCAxMDAwLFxuICAgICAgbWludkNwdXM6IGFwcC5ub2RlLnRyeUdldENvbnRleHQoJ2VtYmVkZGluZzptaW52Q3B1cycpIHx8IDAsXG4gICAgICBtdWx0aUF6OiBhcHAubm9kZS50cnlHZXRDb250ZXh0KCdlbWJlZGRpbmc6bXVsdGlBeicpID8/IHRydWUsXG4gICAgfTtcblxuICAgIHN3aXRjaCAoZW52aXJvbm1lbnQpIHtcbiAgICAgIGNhc2UgJ3Byb2QnOlxuICAgICAgY2FzZSAncHJvZHVjdGlvbic6XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgLi4uYmFzZUNvbmZpZyxcbiAgICAgICAgICBtYXh2Q3B1czogYXBwLm5vZGUudHJ5R2V0Q29udGV4dCgnZW1iZWRkaW5nOnByb2Q6bWF4dkNwdXMnKSB8fCAyMDAwLFxuICAgICAgICAgIG11bHRpQXo6IHRydWUsXG4gICAgICAgIH07XG5cbiAgICAgIGNhc2UgJ2Rldic6XG4gICAgICBjYXNlICdkZXZlbG9wbWVudCc6XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgLi4uYmFzZUNvbmZpZyxcbiAgICAgICAgICBtYXh2Q3B1czogYXBwLm5vZGUudHJ5R2V0Q29udGV4dCgnZW1iZWRkaW5nOmRldjptYXh2Q3B1cycpIHx8IDUwMCxcbiAgICAgICAgICBpbnN0YW5jZVR5cGVzOiBbJ201LmxhcmdlJ10sXG4gICAgICAgIH07XG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBiYXNlQ29uZmlnO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAgKiBKb2IgRGVmaW5pdGlvbuioreWumuOCkuS9nOaIkFxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgY3JlYXRlSm9iRGVmaW5pdGlvbkNvbmZpZyhcbiAgICBhcHA6IGNkay5BcHAsXG4gICAgZW52Q29uZmlnOiBFbWJlZGRpbmdFbnZpcm9ubWVudENvbmZpZ1xuICApOiBFbWJlZGRpbmdKb2JEZWZpbml0aW9uQ29uZmlnIHtcbiAgICByZXR1cm4ge1xuICAgICAgam9iRGVmaW5pdGlvbk5hbWU6IGFwcC5ub2RlLnRyeUdldENvbnRleHQoJ2VtYmVkZGluZzpqb2JEZWZpbml0aW9uOm5hbWUnKSB8fCAnZW1iZWRkaW5nLWpvYi1kZWZpbml0aW9uJyxcbiAgICAgIGNwdTogYXBwLm5vZGUudHJ5R2V0Q29udGV4dCgnZW1iZWRkaW5nOmpvYkRlZmluaXRpb246Y3B1JykgfHwgMixcbiAgICAgIG1lbW9yeU1pQjogYXBwLm5vZGUudHJ5R2V0Q29udGV4dCgnZW1iZWRkaW5nOmpvYkRlZmluaXRpb246bWVtb3J5TWlCJykgfHwgNDA5NixcbiAgICAgIHRpbWVvdXRIb3VyczogYXBwLm5vZGUudHJ5R2V0Q29udGV4dCgnZW1iZWRkaW5nOmpvYkRlZmluaXRpb246dGltZW91dEhvdXJzJykgfHwgMSxcbiAgICAgIHJldHJ5QXR0ZW1wdHM6IGFwcC5ub2RlLnRyeUdldENvbnRleHQoJ2VtYmVkZGluZzpqb2JEZWZpbml0aW9uOnJldHJ5QXR0ZW1wdHMnKSB8fCAzLFxuICAgICAgcGxhdGZvcm1DYXBhYmlsaXRpZXM6IGFwcC5ub2RlLnRyeUdldENvbnRleHQoJ2VtYmVkZGluZzpqb2JEZWZpbml0aW9uOnBsYXRmb3JtQ2FwYWJpbGl0aWVzJykgfHwgWydFQzInXSxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIEZTeOe1seWQiOioreWumuOCkuS9nOaIkFxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgY3JlYXRlRnN4SW50ZWdyYXRpb25Db25maWcoYXBwOiBjZGsuQXBwKTogRW1iZWRkaW5nRnN4SW50ZWdyYXRpb25Db25maWcge1xuICAgIHJldHVybiB7XG4gICAgICBmaWxlU3lzdGVtSWQ6IGFwcC5ub2RlLnRyeUdldENvbnRleHQoJ2VtYmVkZGluZzpmc3g6ZmlsZVN5c3RlbUlkJykgfHwgcHJvY2Vzcy5lbnYuRlNYX0lELFxuICAgICAgc3ZtUmVmOiBhcHAubm9kZS50cnlHZXRDb250ZXh0KCdlbWJlZGRpbmc6ZnN4OnN2bVJlZicpIHx8IHByb2Nlc3MuZW52LlNWTV9SRUYsXG4gICAgICBzdm1JZDogYXBwLm5vZGUudHJ5R2V0Q29udGV4dCgnZW1iZWRkaW5nOmZzeDpzdm1JZCcpIHx8IHByb2Nlc3MuZW52LlNWTV9JRCxcbiAgICAgIGNpZnNkYXRhVm9sTmFtZTogYXBwLm5vZGUudHJ5R2V0Q29udGV4dCgnZW1iZWRkaW5nOmZzeDpjaWZzZGF0YVZvbE5hbWUnKSB8fCBwcm9jZXNzLmVudi5DSUZTREFUQV9WT0xfTkFNRSB8fCAnc21iX3NoYXJlJyxcbiAgICAgIHJhZ2RiVm9sUGF0aDogYXBwLm5vZGUudHJ5R2V0Q29udGV4dCgnZW1iZWRkaW5nOmZzeDpyYWdkYlZvbFBhdGgnKSB8fCBwcm9jZXNzLmVudi5SQUdEQl9WT0xfUEFUSCB8fCAnL3NtYl9zaGFyZS9yYWdkYicsXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBY3RpdmUgRGlyZWN0b3J56Kit5a6a44KS5L2c5oiQXG4gICAqL1xuICBwcml2YXRlIHN0YXRpYyBjcmVhdGVBY3RpdmVEaXJlY3RvcnlDb25maWcoYXBwOiBjZGsuQXBwKTogRW1iZWRkaW5nQWN0aXZlRGlyZWN0b3J5Q29uZmlnIHtcbiAgICByZXR1cm4ge1xuICAgICAgZG9tYWluOiBhcHAubm9kZS50cnlHZXRDb250ZXh0KCdlbWJlZGRpbmc6YWQ6ZG9tYWluJykgfHwgJ2V4YW1wbGUuY29tJyxcbiAgICAgIHVzZXJuYW1lOiBhcHAubm9kZS50cnlHZXRDb250ZXh0KCdlbWJlZGRpbmc6YWQ6dXNlcm5hbWUnKSB8fCAnYWRtaW4nLFxuICAgICAgcGFzc3dvcmRTZWNyZXRBcm46IGFwcC5ub2RlLnRyeUdldENvbnRleHQoJ2VtYmVkZGluZzphZDpwYXNzd29yZFNlY3JldEFybicpIHx8ICcnLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogQmVkcm9ja+ioreWumuOCkuS9nOaIkFxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgY3JlYXRlQmVkcm9ja0NvbmZpZyhhcHA6IGNkay5BcHApOiBFbWJlZGRpbmdCZWRyb2NrQ29uZmlnIHtcbiAgICByZXR1cm4ge1xuICAgICAgcmVnaW9uOiBhcHAubm9kZS50cnlHZXRDb250ZXh0KCdlbWJlZGRpbmc6YmVkcm9jazpyZWdpb24nKSB8fCBhcHAubm9kZS50cnlHZXRDb250ZXh0KCdyZWdpb24nKSB8fCAndXMtZWFzdC0xJyxcbiAgICAgIG1vZGVsSWQ6IGFwcC5ub2RlLnRyeUdldENvbnRleHQoJ2VtYmVkZGluZzpiZWRyb2NrOm1vZGVsSWQnKSB8fCAnYW1hem9uLnRpdGFuLWVtYmVkLXRleHQtdjEnLFxuICAgIH07XG4gIH1cblxuICAvKipcbiAgICogT3BlblNlYXJjaOe1seWQiOioreWumuOCkuS9nOaIkFxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgY3JlYXRlT3BlblNlYXJjaEludGVncmF0aW9uQ29uZmlnKGFwcDogY2RrLkFwcCk6IEVtYmVkZGluZ09wZW5TZWFyY2hJbnRlZ3JhdGlvbkNvbmZpZyB7XG4gICAgcmV0dXJuIHtcbiAgICAgIGNvbGxlY3Rpb25OYW1lOiBhcHAubm9kZS50cnlHZXRDb250ZXh0KCdlbWJlZGRpbmc6b3BlblNlYXJjaDpjb2xsZWN0aW9uTmFtZScpLFxuICAgICAgaW5kZXhOYW1lOiBhcHAubm9kZS50cnlHZXRDb250ZXh0KCdlbWJlZGRpbmc6b3BlblNlYXJjaDppbmRleE5hbWUnKSB8fCAnZG9jdW1lbnRzJyxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIFJEU+ioreWumuOCkuS9nOaIkFxuICAgKi9cbiAgcHJpdmF0ZSBzdGF0aWMgY3JlYXRlUmRzQ29uZmlnKGFwcDogY2RrLkFwcCk6IEVtYmVkZGluZ1Jkc0NvbmZpZyB8IHVuZGVmaW5lZCB7XG4gICAgY29uc3Qgc2VjcmV0TmFtZSA9IGFwcC5ub2RlLnRyeUdldENvbnRleHQoJ2VtYmVkZGluZzpyZHM6c2VjcmV0TmFtZScpO1xuICAgIGlmICghc2VjcmV0TmFtZSkge1xuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICByZXR1cm4ge1xuICAgICAgc2VjcmV0TmFtZSxcbiAgICAgIHNlY3JldEFybjogYXBwLm5vZGUudHJ5R2V0Q29udGV4dCgnZW1iZWRkaW5nOnJkczpzZWNyZXRBcm4nKSB8fCAnJyxcbiAgICAgIGNsdXN0ZXJBcm46IGFwcC5ub2RlLnRyeUdldENvbnRleHQoJ2VtYmVkZGluZzpyZHM6Y2x1c3RlckFybicpIHx8ICcnLFxuICAgIH07XG4gIH1cblxuICAvLyDku5bjga7jg6Hjgr3jg4Pjg4njga/nsKHnlaXljJbjga7jgZ/jgoHnnIHnlaVcbiAgcHJpdmF0ZSBzdGF0aWMgY3JlYXRlQmF0Y2hDb25maWcoYXBwOiBjZGsuQXBwLCBmbGFnczogYW55LCBlbnZDb25maWc6IGFueSk6IEVtYmVkZGluZ0JhdGNoQ29uZmlnIHtcbiAgICByZXR1cm4ge30gYXMgRW1iZWRkaW5nQmF0Y2hDb25maWc7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBjcmVhdGVFY3NDb25maWcoYXBwOiBjZGsuQXBwLCBmbGFnczogYW55LCBlbnZDb25maWc6IGFueSk6IEVtYmVkZGluZ0Vjc0NvbmZpZyB7XG4gICAgcmV0dXJuIHt9IGFzIEVtYmVkZGluZ0Vjc0NvbmZpZztcbiAgfVxuXG4gIHByaXZhdGUgc3RhdGljIGNyZWF0ZVNwb3RGbGVldENvbmZpZyhhcHA6IGNkay5BcHAsIGZsYWdzOiBhbnksIGVudkNvbmZpZzogYW55KTogRW1iZWRkaW5nU3BvdEZsZWV0Q29uZmlnIHtcbiAgICByZXR1cm4ge30gYXMgRW1iZWRkaW5nU3BvdEZsZWV0Q29uZmlnO1xuICB9XG5cbiAgcHJpdmF0ZSBzdGF0aWMgY3JlYXRlQ29tbW9uUmVzb3VyY2VzQ29uZmlnKGFwcDogY2RrLkFwcCwgZW52Q29uZmlnOiBhbnkpOiBFbWJlZGRpbmdDb21tb25SZXNvdXJjZXNDb25maWcge1xuICAgIHJldHVybiB7fSBhcyBFbWJlZGRpbmdDb21tb25SZXNvdXJjZXNDb25maWc7XG4gIH1cblxuICBwcml2YXRlIHN0YXRpYyBjcmVhdGVNb25pdG9yaW5nQ29uZmlnKGFwcDogY2RrLkFwcCwgZW52Q29uZmlnOiBhbnkpOiBFbWJlZGRpbmdNb25pdG9yaW5nQ29uZmlnIHtcbiAgICByZXR1cm4ge30gYXMgRW1iZWRkaW5nTW9uaXRvcmluZ0NvbmZpZztcbiAgfVxufVxuXG4vKipcbiAqIEVtYmVkZGluZ+apn+iDveODleODqeOCsFxuICovXG5leHBvcnQgaW50ZXJmYWNlIEVtYmVkZGluZ0ZlYXR1cmVGbGFncyB7XG4gIHJlYWRvbmx5IGVuYWJsZUF3c0JhdGNoOiBib29sZWFuO1xuICByZWFkb25seSBlbmFibGVFY3NPbkVDMjogYm9vbGVhbjtcbiAgcmVhZG9ubHkgZW5hYmxlU3BvdEZsZWV0OiBib29sZWFuO1xuICByZWFkb25seSBlbmFibGVNb25pdG9yaW5nOiBib29sZWFuO1xuICByZWFkb25seSBlbmFibGVBdXRvU2NhbGluZzogYm9vbGVhbjtcbn1cblxuLyoqXG4gKiBFbWJlZGRpbmfnkrDlooPoqK3lrppcbiAqL1xuZXhwb3J0IGludGVyZmFjZSBFbWJlZGRpbmdFbnZpcm9ubWVudENvbmZpZyB7XG4gIHJlYWRvbmx5IGluc3RhbmNlVHlwZXM6IHN0cmluZ1tdO1xuICByZWFkb25seSBtYXh2Q3B1czogbnVtYmVyO1xuICByZWFkb25seSBtaW52Q3B1czogbnVtYmVyO1xuICByZWFkb25seSBtdWx0aUF6OiBib29sZWFuO1xufSJdfQ==