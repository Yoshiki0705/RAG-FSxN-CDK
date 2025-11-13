"use strict";
/**
 * OpenSearch Domain設定
 *
 * 環境別のOpenSearchドメイン設定を提供
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDevOpenSearchConfig = getDevOpenSearchConfig;
exports.getStagingOpenSearchConfig = getStagingOpenSearchConfig;
exports.getProdOpenSearchConfig = getProdOpenSearchConfig;
exports.getOpenSearchDomainConfig = getOpenSearchDomainConfig;
const ec2 = __importStar(require("aws-cdk-lib/aws-ec2"));
/**
 * 開発環境用OpenSearch設定
 */
function getDevOpenSearchConfig(projectName = 'permission-aware-rag') {
    return {
        domainName: `${projectName}-dev-vectordb`,
        environment: 'dev',
        instanceConfig: {
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.SMALL),
            instanceCount: 1,
            dedicatedMasterEnabled: false,
        },
        storageConfig: {
            volumeType: ec2.EbsDeviceVolumeType.GP3,
            volumeSize: 20,
            throughput: 125,
        },
        networkConfig: {
            vpcEnabled: false, // 開発環境では簡単のためVPCなし
        },
        securityConfig: {
            encryptionAtRest: true,
            nodeToNodeEncryption: true,
            enforceHttps: true,
            fineGrainedAccessControl: false, // 開発環境では無効
        },
        monitoringConfig: {
            logsEnabled: true,
            slowLogsEnabled: false,
            appLogsEnabled: true,
            indexSlowLogsEnabled: false,
        },
        backupConfig: {
            automatedSnapshotStartHour: 3,
        },
        indexConfig: {
            numberOfShards: 2,
            numberOfReplicas: 0, // 開発環境では0
        },
        tags: {
            Environment: 'dev',
            Purpose: 'MultimodalEmbedding',
            CostCenter: 'Development',
        },
    };
}
/**
 * ステージング環境用OpenSearch設定
 */
function getStagingOpenSearchConfig(projectName = 'permission-aware-rag') {
    return {
        domainName: `${projectName}-staging-vectordb`,
        environment: 'staging',
        instanceConfig: {
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
            instanceCount: 2,
            dedicatedMasterEnabled: false,
        },
        storageConfig: {
            volumeType: ec2.EbsDeviceVolumeType.GP3,
            volumeSize: 50,
            throughput: 250,
        },
        networkConfig: {
            vpcEnabled: true,
        },
        securityConfig: {
            encryptionAtRest: true,
            nodeToNodeEncryption: true,
            enforceHttps: true,
            fineGrainedAccessControl: true,
            masterUserName: 'admin',
        },
        monitoringConfig: {
            logsEnabled: true,
            slowLogsEnabled: true,
            appLogsEnabled: true,
            indexSlowLogsEnabled: true,
        },
        backupConfig: {
            automatedSnapshotStartHour: 2,
        },
        indexConfig: {
            numberOfShards: 2,
            numberOfReplicas: 1,
        },
        tags: {
            Environment: 'staging',
            Purpose: 'MultimodalEmbedding',
            CostCenter: 'Development',
        },
    };
}
/**
 * 本番環境用OpenSearch設定
 */
function getProdOpenSearchConfig(projectName = 'permission-aware-rag') {
    return {
        domainName: `${projectName}-prod-vectordb`,
        environment: 'prod',
        instanceConfig: {
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.R6G, ec2.InstanceSize.LARGE),
            instanceCount: 3,
            dedicatedMasterEnabled: true,
            masterInstanceType: ec2.InstanceType.of(ec2.InstanceClass.C6G, ec2.InstanceSize.MEDIUM),
            masterInstanceCount: 3,
        },
        storageConfig: {
            volumeType: ec2.EbsDeviceVolumeType.GP3,
            volumeSize: 100,
            throughput: 500,
            iops: 3000,
        },
        networkConfig: {
            vpcEnabled: true,
        },
        securityConfig: {
            encryptionAtRest: true,
            nodeToNodeEncryption: true,
            enforceHttps: true,
            fineGrainedAccessControl: true,
            masterUserName: 'admin',
        },
        monitoringConfig: {
            logsEnabled: true,
            slowLogsEnabled: true,
            appLogsEnabled: true,
            indexSlowLogsEnabled: true,
        },
        backupConfig: {
            automatedSnapshotStartHour: 1,
        },
        indexConfig: {
            numberOfShards: 3,
            numberOfReplicas: 2,
        },
        tags: {
            Environment: 'prod',
            Purpose: 'MultimodalEmbedding',
            CostCenter: 'Production',
        },
    };
}
/**
 * 環境に応じた設定取得
 */
function getOpenSearchDomainConfig(environment, projectName = 'permission-aware-rag') {
    switch (environment.toLowerCase()) {
        case 'dev':
        case 'development':
            return getDevOpenSearchConfig(projectName);
        case 'staging':
        case 'stage':
            return getStagingOpenSearchConfig(projectName);
        case 'prod':
        case 'production':
            return getProdOpenSearchConfig(projectName);
        default:
            throw new Error(`未対応の環境: ${environment}`);
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3BlbnNlYXJjaC1kb21haW4tY29uZmlnLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsib3BlbnNlYXJjaC1kb21haW4tY29uZmlnLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7QUFBQTs7OztHQUlHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBUUgsd0RBa0RDO0FBS0QsZ0VBbURDO0FBS0QsMERBc0RDO0FBS0QsOERBb0JDO0FBcE1ELHlEQUEyQztBQUczQzs7R0FFRztBQUNILFNBQWdCLHNCQUFzQixDQUFDLGNBQXNCLHNCQUFzQjtJQUNqRixPQUFPO1FBQ0wsVUFBVSxFQUFFLEdBQUcsV0FBVyxlQUFlO1FBQ3pDLFdBQVcsRUFBRSxLQUFLO1FBRWxCLGNBQWMsRUFBRTtZQUNkLFlBQVksRUFBRSxHQUFHLENBQUMsWUFBWSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQztZQUMvRSxhQUFhLEVBQUUsQ0FBQztZQUNoQixzQkFBc0IsRUFBRSxLQUFLO1NBQzlCO1FBRUQsYUFBYSxFQUFFO1lBQ2IsVUFBVSxFQUFFLEdBQUcsQ0FBQyxtQkFBbUIsQ0FBQyxHQUFHO1lBQ3ZDLFVBQVUsRUFBRSxFQUFFO1lBQ2QsVUFBVSxFQUFFLEdBQUc7U0FDaEI7UUFFRCxhQUFhLEVBQUU7WUFDYixVQUFVLEVBQUUsS0FBSyxFQUFFLG1CQUFtQjtTQUN2QztRQUVELGNBQWMsRUFBRTtZQUNkLGdCQUFnQixFQUFFLElBQUk7WUFDdEIsb0JBQW9CLEVBQUUsSUFBSTtZQUMxQixZQUFZLEVBQUUsSUFBSTtZQUNsQix3QkFBd0IsRUFBRSxLQUFLLEVBQUUsV0FBVztTQUM3QztRQUVELGdCQUFnQixFQUFFO1lBQ2hCLFdBQVcsRUFBRSxJQUFJO1lBQ2pCLGVBQWUsRUFBRSxLQUFLO1lBQ3RCLGNBQWMsRUFBRSxJQUFJO1lBQ3BCLG9CQUFvQixFQUFFLEtBQUs7U0FDNUI7UUFFRCxZQUFZLEVBQUU7WUFDWiwwQkFBMEIsRUFBRSxDQUFDO1NBQzlCO1FBRUQsV0FBVyxFQUFFO1lBQ1gsY0FBYyxFQUFFLENBQUM7WUFDakIsZ0JBQWdCLEVBQUUsQ0FBQyxFQUFFLFVBQVU7U0FDaEM7UUFFRCxJQUFJLEVBQUU7WUFDSixXQUFXLEVBQUUsS0FBSztZQUNsQixPQUFPLEVBQUUscUJBQXFCO1lBQzlCLFVBQVUsRUFBRSxhQUFhO1NBQzFCO0tBQ0YsQ0FBQztBQUNKLENBQUM7QUFFRDs7R0FFRztBQUNILFNBQWdCLDBCQUEwQixDQUFDLGNBQXNCLHNCQUFzQjtJQUNyRixPQUFPO1FBQ0wsVUFBVSxFQUFFLEdBQUcsV0FBVyxtQkFBbUI7UUFDN0MsV0FBVyxFQUFFLFNBQVM7UUFFdEIsY0FBYyxFQUFFO1lBQ2QsWUFBWSxFQUFFLEdBQUcsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDO1lBQ2hGLGFBQWEsRUFBRSxDQUFDO1lBQ2hCLHNCQUFzQixFQUFFLEtBQUs7U0FDOUI7UUFFRCxhQUFhLEVBQUU7WUFDYixVQUFVLEVBQUUsR0FBRyxDQUFDLG1CQUFtQixDQUFDLEdBQUc7WUFDdkMsVUFBVSxFQUFFLEVBQUU7WUFDZCxVQUFVLEVBQUUsR0FBRztTQUNoQjtRQUVELGFBQWEsRUFBRTtZQUNiLFVBQVUsRUFBRSxJQUFJO1NBQ2pCO1FBRUQsY0FBYyxFQUFFO1lBQ2QsZ0JBQWdCLEVBQUUsSUFBSTtZQUN0QixvQkFBb0IsRUFBRSxJQUFJO1lBQzFCLFlBQVksRUFBRSxJQUFJO1lBQ2xCLHdCQUF3QixFQUFFLElBQUk7WUFDOUIsY0FBYyxFQUFFLE9BQU87U0FDeEI7UUFFRCxnQkFBZ0IsRUFBRTtZQUNoQixXQUFXLEVBQUUsSUFBSTtZQUNqQixlQUFlLEVBQUUsSUFBSTtZQUNyQixjQUFjLEVBQUUsSUFBSTtZQUNwQixvQkFBb0IsRUFBRSxJQUFJO1NBQzNCO1FBRUQsWUFBWSxFQUFFO1lBQ1osMEJBQTBCLEVBQUUsQ0FBQztTQUM5QjtRQUVELFdBQVcsRUFBRTtZQUNYLGNBQWMsRUFBRSxDQUFDO1lBQ2pCLGdCQUFnQixFQUFFLENBQUM7U0FDcEI7UUFFRCxJQUFJLEVBQUU7WUFDSixXQUFXLEVBQUUsU0FBUztZQUN0QixPQUFPLEVBQUUscUJBQXFCO1lBQzlCLFVBQVUsRUFBRSxhQUFhO1NBQzFCO0tBQ0YsQ0FBQztBQUNKLENBQUM7QUFFRDs7R0FFRztBQUNILFNBQWdCLHVCQUF1QixDQUFDLGNBQXNCLHNCQUFzQjtJQUNsRixPQUFPO1FBQ0wsVUFBVSxFQUFFLEdBQUcsV0FBVyxnQkFBZ0I7UUFDMUMsV0FBVyxFQUFFLE1BQU07UUFFbkIsY0FBYyxFQUFFO1lBQ2QsWUFBWSxFQUFFLEdBQUcsQ0FBQyxZQUFZLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDO1lBQ2hGLGFBQWEsRUFBRSxDQUFDO1lBQ2hCLHNCQUFzQixFQUFFLElBQUk7WUFDNUIsa0JBQWtCLEVBQUUsR0FBRyxDQUFDLFlBQVksQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLFlBQVksQ0FBQyxNQUFNLENBQUM7WUFDdkYsbUJBQW1CLEVBQUUsQ0FBQztTQUN2QjtRQUVELGFBQWEsRUFBRTtZQUNiLFVBQVUsRUFBRSxHQUFHLENBQUMsbUJBQW1CLENBQUMsR0FBRztZQUN2QyxVQUFVLEVBQUUsR0FBRztZQUNmLFVBQVUsRUFBRSxHQUFHO1lBQ2YsSUFBSSxFQUFFLElBQUk7U0FDWDtRQUVELGFBQWEsRUFBRTtZQUNiLFVBQVUsRUFBRSxJQUFJO1NBQ2pCO1FBRUQsY0FBYyxFQUFFO1lBQ2QsZ0JBQWdCLEVBQUUsSUFBSTtZQUN0QixvQkFBb0IsRUFBRSxJQUFJO1lBQzFCLFlBQVksRUFBRSxJQUFJO1lBQ2xCLHdCQUF3QixFQUFFLElBQUk7WUFDOUIsY0FBYyxFQUFFLE9BQU87U0FDeEI7UUFFRCxnQkFBZ0IsRUFBRTtZQUNoQixXQUFXLEVBQUUsSUFBSTtZQUNqQixlQUFlLEVBQUUsSUFBSTtZQUNyQixjQUFjLEVBQUUsSUFBSTtZQUNwQixvQkFBb0IsRUFBRSxJQUFJO1NBQzNCO1FBRUQsWUFBWSxFQUFFO1lBQ1osMEJBQTBCLEVBQUUsQ0FBQztTQUM5QjtRQUVELFdBQVcsRUFBRTtZQUNYLGNBQWMsRUFBRSxDQUFDO1lBQ2pCLGdCQUFnQixFQUFFLENBQUM7U0FDcEI7UUFFRCxJQUFJLEVBQUU7WUFDSixXQUFXLEVBQUUsTUFBTTtZQUNuQixPQUFPLEVBQUUscUJBQXFCO1lBQzlCLFVBQVUsRUFBRSxZQUFZO1NBQ3pCO0tBQ0YsQ0FBQztBQUNKLENBQUM7QUFFRDs7R0FFRztBQUNILFNBQWdCLHlCQUF5QixDQUN2QyxXQUFtQixFQUNuQixjQUFzQixzQkFBc0I7SUFFNUMsUUFBUSxXQUFXLENBQUMsV0FBVyxFQUFFLEVBQUUsQ0FBQztRQUNsQyxLQUFLLEtBQUssQ0FBQztRQUNYLEtBQUssYUFBYTtZQUNoQixPQUFPLHNCQUFzQixDQUFDLFdBQVcsQ0FBQyxDQUFDO1FBRTdDLEtBQUssU0FBUyxDQUFDO1FBQ2YsS0FBSyxPQUFPO1lBQ1YsT0FBTywwQkFBMEIsQ0FBQyxXQUFXLENBQUMsQ0FBQztRQUVqRCxLQUFLLE1BQU0sQ0FBQztRQUNaLEtBQUssWUFBWTtZQUNmLE9BQU8sdUJBQXVCLENBQUMsV0FBVyxDQUFDLENBQUM7UUFFOUM7WUFDRSxNQUFNLElBQUksS0FBSyxDQUFDLFdBQVcsV0FBVyxFQUFFLENBQUMsQ0FBQztJQUM5QyxDQUFDO0FBQ0gsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogT3BlblNlYXJjaCBEb21haW7oqK3lrppcbiAqIFxuICog55Kw5aKD5Yil44GuT3BlblNlYXJjaOODieODoeOCpOODs+ioreWumuOCkuaPkOS+m1xuICovXG5cbmltcG9ydCAqIGFzIGVjMiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWMyJztcbmltcG9ydCB7IE9wZW5TZWFyY2hEb21haW5Db25maWcgfSBmcm9tICcuLi9jb25zdHJ1Y3RzL29wZW5zZWFyY2gtZG9tYWluLWNvbnN0cnVjdCc7XG5cbi8qKlxuICog6ZaL55m655Kw5aKD55SoT3BlblNlYXJjaOioreWumlxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0RGV2T3BlblNlYXJjaENvbmZpZyhwcm9qZWN0TmFtZTogc3RyaW5nID0gJ3Blcm1pc3Npb24tYXdhcmUtcmFnJyk6IE9wZW5TZWFyY2hEb21haW5Db25maWcge1xuICByZXR1cm4ge1xuICAgIGRvbWFpbk5hbWU6IGAke3Byb2plY3ROYW1lfS1kZXYtdmVjdG9yZGJgLFxuICAgIGVudmlyb25tZW50OiAnZGV2JyxcbiAgICBcbiAgICBpbnN0YW5jZUNvbmZpZzoge1xuICAgICAgaW5zdGFuY2VUeXBlOiBlYzIuSW5zdGFuY2VUeXBlLm9mKGVjMi5JbnN0YW5jZUNsYXNzLlQzLCBlYzIuSW5zdGFuY2VTaXplLlNNQUxMKSxcbiAgICAgIGluc3RhbmNlQ291bnQ6IDEsXG4gICAgICBkZWRpY2F0ZWRNYXN0ZXJFbmFibGVkOiBmYWxzZSxcbiAgICB9LFxuICAgIFxuICAgIHN0b3JhZ2VDb25maWc6IHtcbiAgICAgIHZvbHVtZVR5cGU6IGVjMi5FYnNEZXZpY2VWb2x1bWVUeXBlLkdQMyxcbiAgICAgIHZvbHVtZVNpemU6IDIwLFxuICAgICAgdGhyb3VnaHB1dDogMTI1LFxuICAgIH0sXG4gICAgXG4gICAgbmV0d29ya0NvbmZpZzoge1xuICAgICAgdnBjRW5hYmxlZDogZmFsc2UsIC8vIOmWi+eZuueSsOWig+OBp+OBr+ewoeWNmOOBruOBn+OCgVZQQ+OBquOBl1xuICAgIH0sXG4gICAgXG4gICAgc2VjdXJpdHlDb25maWc6IHtcbiAgICAgIGVuY3J5cHRpb25BdFJlc3Q6IHRydWUsXG4gICAgICBub2RlVG9Ob2RlRW5jcnlwdGlvbjogdHJ1ZSxcbiAgICAgIGVuZm9yY2VIdHRwczogdHJ1ZSxcbiAgICAgIGZpbmVHcmFpbmVkQWNjZXNzQ29udHJvbDogZmFsc2UsIC8vIOmWi+eZuueSsOWig+OBp+OBr+eEoeWKuVxuICAgIH0sXG4gICAgXG4gICAgbW9uaXRvcmluZ0NvbmZpZzoge1xuICAgICAgbG9nc0VuYWJsZWQ6IHRydWUsXG4gICAgICBzbG93TG9nc0VuYWJsZWQ6IGZhbHNlLFxuICAgICAgYXBwTG9nc0VuYWJsZWQ6IHRydWUsXG4gICAgICBpbmRleFNsb3dMb2dzRW5hYmxlZDogZmFsc2UsXG4gICAgfSxcbiAgICBcbiAgICBiYWNrdXBDb25maWc6IHtcbiAgICAgIGF1dG9tYXRlZFNuYXBzaG90U3RhcnRIb3VyOiAzLFxuICAgIH0sXG4gICAgXG4gICAgaW5kZXhDb25maWc6IHtcbiAgICAgIG51bWJlck9mU2hhcmRzOiAyLFxuICAgICAgbnVtYmVyT2ZSZXBsaWNhczogMCwgLy8g6ZaL55m655Kw5aKD44Gn44GvMFxuICAgIH0sXG4gICAgXG4gICAgdGFnczoge1xuICAgICAgRW52aXJvbm1lbnQ6ICdkZXYnLFxuICAgICAgUHVycG9zZTogJ011bHRpbW9kYWxFbWJlZGRpbmcnLFxuICAgICAgQ29zdENlbnRlcjogJ0RldmVsb3BtZW50JyxcbiAgICB9LFxuICB9O1xufVxuXG4vKipcbiAqIOOCueODhuODvOOCuOODs+OCsOeSsOWig+eUqE9wZW5TZWFyY2joqK3lrppcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFN0YWdpbmdPcGVuU2VhcmNoQ29uZmlnKHByb2plY3ROYW1lOiBzdHJpbmcgPSAncGVybWlzc2lvbi1hd2FyZS1yYWcnKTogT3BlblNlYXJjaERvbWFpbkNvbmZpZyB7XG4gIHJldHVybiB7XG4gICAgZG9tYWluTmFtZTogYCR7cHJvamVjdE5hbWV9LXN0YWdpbmctdmVjdG9yZGJgLFxuICAgIGVudmlyb25tZW50OiAnc3RhZ2luZycsXG4gICAgXG4gICAgaW5zdGFuY2VDb25maWc6IHtcbiAgICAgIGluc3RhbmNlVHlwZTogZWMyLkluc3RhbmNlVHlwZS5vZihlYzIuSW5zdGFuY2VDbGFzcy5UMywgZWMyLkluc3RhbmNlU2l6ZS5NRURJVU0pLFxuICAgICAgaW5zdGFuY2VDb3VudDogMixcbiAgICAgIGRlZGljYXRlZE1hc3RlckVuYWJsZWQ6IGZhbHNlLFxuICAgIH0sXG4gICAgXG4gICAgc3RvcmFnZUNvbmZpZzoge1xuICAgICAgdm9sdW1lVHlwZTogZWMyLkVic0RldmljZVZvbHVtZVR5cGUuR1AzLFxuICAgICAgdm9sdW1lU2l6ZTogNTAsXG4gICAgICB0aHJvdWdocHV0OiAyNTAsXG4gICAgfSxcbiAgICBcbiAgICBuZXR3b3JrQ29uZmlnOiB7XG4gICAgICB2cGNFbmFibGVkOiB0cnVlLFxuICAgIH0sXG4gICAgXG4gICAgc2VjdXJpdHlDb25maWc6IHtcbiAgICAgIGVuY3J5cHRpb25BdFJlc3Q6IHRydWUsXG4gICAgICBub2RlVG9Ob2RlRW5jcnlwdGlvbjogdHJ1ZSxcbiAgICAgIGVuZm9yY2VIdHRwczogdHJ1ZSxcbiAgICAgIGZpbmVHcmFpbmVkQWNjZXNzQ29udHJvbDogdHJ1ZSxcbiAgICAgIG1hc3RlclVzZXJOYW1lOiAnYWRtaW4nLFxuICAgIH0sXG4gICAgXG4gICAgbW9uaXRvcmluZ0NvbmZpZzoge1xuICAgICAgbG9nc0VuYWJsZWQ6IHRydWUsXG4gICAgICBzbG93TG9nc0VuYWJsZWQ6IHRydWUsXG4gICAgICBhcHBMb2dzRW5hYmxlZDogdHJ1ZSxcbiAgICAgIGluZGV4U2xvd0xvZ3NFbmFibGVkOiB0cnVlLFxuICAgIH0sXG4gICAgXG4gICAgYmFja3VwQ29uZmlnOiB7XG4gICAgICBhdXRvbWF0ZWRTbmFwc2hvdFN0YXJ0SG91cjogMixcbiAgICB9LFxuICAgIFxuICAgIGluZGV4Q29uZmlnOiB7XG4gICAgICBudW1iZXJPZlNoYXJkczogMixcbiAgICAgIG51bWJlck9mUmVwbGljYXM6IDEsXG4gICAgfSxcbiAgICBcbiAgICB0YWdzOiB7XG4gICAgICBFbnZpcm9ubWVudDogJ3N0YWdpbmcnLFxuICAgICAgUHVycG9zZTogJ011bHRpbW9kYWxFbWJlZGRpbmcnLFxuICAgICAgQ29zdENlbnRlcjogJ0RldmVsb3BtZW50JyxcbiAgICB9LFxuICB9O1xufVxuXG4vKipcbiAqIOacrOeVqueSsOWig+eUqE9wZW5TZWFyY2joqK3lrppcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFByb2RPcGVuU2VhcmNoQ29uZmlnKHByb2plY3ROYW1lOiBzdHJpbmcgPSAncGVybWlzc2lvbi1hd2FyZS1yYWcnKTogT3BlblNlYXJjaERvbWFpbkNvbmZpZyB7XG4gIHJldHVybiB7XG4gICAgZG9tYWluTmFtZTogYCR7cHJvamVjdE5hbWV9LXByb2QtdmVjdG9yZGJgLFxuICAgIGVudmlyb25tZW50OiAncHJvZCcsXG4gICAgXG4gICAgaW5zdGFuY2VDb25maWc6IHtcbiAgICAgIGluc3RhbmNlVHlwZTogZWMyLkluc3RhbmNlVHlwZS5vZihlYzIuSW5zdGFuY2VDbGFzcy5SNkcsIGVjMi5JbnN0YW5jZVNpemUuTEFSR0UpLFxuICAgICAgaW5zdGFuY2VDb3VudDogMyxcbiAgICAgIGRlZGljYXRlZE1hc3RlckVuYWJsZWQ6IHRydWUsXG4gICAgICBtYXN0ZXJJbnN0YW5jZVR5cGU6IGVjMi5JbnN0YW5jZVR5cGUub2YoZWMyLkluc3RhbmNlQ2xhc3MuQzZHLCBlYzIuSW5zdGFuY2VTaXplLk1FRElVTSksXG4gICAgICBtYXN0ZXJJbnN0YW5jZUNvdW50OiAzLFxuICAgIH0sXG4gICAgXG4gICAgc3RvcmFnZUNvbmZpZzoge1xuICAgICAgdm9sdW1lVHlwZTogZWMyLkVic0RldmljZVZvbHVtZVR5cGUuR1AzLFxuICAgICAgdm9sdW1lU2l6ZTogMTAwLFxuICAgICAgdGhyb3VnaHB1dDogNTAwLFxuICAgICAgaW9wczogMzAwMCxcbiAgICB9LFxuICAgIFxuICAgIG5ldHdvcmtDb25maWc6IHtcbiAgICAgIHZwY0VuYWJsZWQ6IHRydWUsXG4gICAgfSxcbiAgICBcbiAgICBzZWN1cml0eUNvbmZpZzoge1xuICAgICAgZW5jcnlwdGlvbkF0UmVzdDogdHJ1ZSxcbiAgICAgIG5vZGVUb05vZGVFbmNyeXB0aW9uOiB0cnVlLFxuICAgICAgZW5mb3JjZUh0dHBzOiB0cnVlLFxuICAgICAgZmluZUdyYWluZWRBY2Nlc3NDb250cm9sOiB0cnVlLFxuICAgICAgbWFzdGVyVXNlck5hbWU6ICdhZG1pbicsXG4gICAgfSxcbiAgICBcbiAgICBtb25pdG9yaW5nQ29uZmlnOiB7XG4gICAgICBsb2dzRW5hYmxlZDogdHJ1ZSxcbiAgICAgIHNsb3dMb2dzRW5hYmxlZDogdHJ1ZSxcbiAgICAgIGFwcExvZ3NFbmFibGVkOiB0cnVlLFxuICAgICAgaW5kZXhTbG93TG9nc0VuYWJsZWQ6IHRydWUsXG4gICAgfSxcbiAgICBcbiAgICBiYWNrdXBDb25maWc6IHtcbiAgICAgIGF1dG9tYXRlZFNuYXBzaG90U3RhcnRIb3VyOiAxLFxuICAgIH0sXG4gICAgXG4gICAgaW5kZXhDb25maWc6IHtcbiAgICAgIG51bWJlck9mU2hhcmRzOiAzLFxuICAgICAgbnVtYmVyT2ZSZXBsaWNhczogMixcbiAgICB9LFxuICAgIFxuICAgIHRhZ3M6IHtcbiAgICAgIEVudmlyb25tZW50OiAncHJvZCcsXG4gICAgICBQdXJwb3NlOiAnTXVsdGltb2RhbEVtYmVkZGluZycsXG4gICAgICBDb3N0Q2VudGVyOiAnUHJvZHVjdGlvbicsXG4gICAgfSxcbiAgfTtcbn1cblxuLyoqXG4gKiDnkrDlooPjgavlv5zjgZjjgZ/oqK3lrprlj5blvpdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldE9wZW5TZWFyY2hEb21haW5Db25maWcoXG4gIGVudmlyb25tZW50OiBzdHJpbmcsXG4gIHByb2plY3ROYW1lOiBzdHJpbmcgPSAncGVybWlzc2lvbi1hd2FyZS1yYWcnXG4pOiBPcGVuU2VhcmNoRG9tYWluQ29uZmlnIHtcbiAgc3dpdGNoIChlbnZpcm9ubWVudC50b0xvd2VyQ2FzZSgpKSB7XG4gICAgY2FzZSAnZGV2JzpcbiAgICBjYXNlICdkZXZlbG9wbWVudCc6XG4gICAgICByZXR1cm4gZ2V0RGV2T3BlblNlYXJjaENvbmZpZyhwcm9qZWN0TmFtZSk7XG4gICAgXG4gICAgY2FzZSAnc3RhZ2luZyc6XG4gICAgY2FzZSAnc3RhZ2UnOlxuICAgICAgcmV0dXJuIGdldFN0YWdpbmdPcGVuU2VhcmNoQ29uZmlnKHByb2plY3ROYW1lKTtcbiAgICBcbiAgICBjYXNlICdwcm9kJzpcbiAgICBjYXNlICdwcm9kdWN0aW9uJzpcbiAgICAgIHJldHVybiBnZXRQcm9kT3BlblNlYXJjaENvbmZpZyhwcm9qZWN0TmFtZSk7XG4gICAgXG4gICAgZGVmYXVsdDpcbiAgICAgIHRocm93IG5ldyBFcnJvcihg5pyq5a++5b+c44Gu55Kw5aKDOiAke2Vudmlyb25tZW50fWApO1xuICB9XG59Il19