"use strict";
/**
 * WebAppスタック戦略パターン実装
 *
 * 異なる環境・用途に応じた設定戦略を提供
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
exports.WebAppConfigContext = exports.WebAppConfigStrategyFactory = exports.EnterpriseConfigStrategy = exports.ProductionConfigStrategy = exports.StagingConfigStrategy = exports.DevelopmentConfigStrategy = exports.WebAppConfigStrategy = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
/**
 * 抽象設定戦略
 */
class WebAppConfigStrategy {
    createFullConfig(projectName, environment) {
        return {
            projectName,
            environment,
            cognitoConfig: this.createCognitoConfig(projectName, environment),
            lambdaConfig: this.createLambdaConfig(),
            outputConfig: this.createOutputConfig(),
        };
    }
}
exports.WebAppConfigStrategy = WebAppConfigStrategy;
/**
 * 開発環境戦略
 */
class DevelopmentConfigStrategy extends WebAppConfigStrategy {
    createCognitoConfig(projectName, environment) {
        return {
            userPool: {
                selfSignUpEnabled: true,
                passwordPolicy: {
                    minLength: 6, // 開発環境では緩い設定
                    requireLowercase: true,
                    requireUppercase: false,
                    requireDigits: true,
                    requireSymbols: false,
                },
                signInAliases: {
                    email: true,
                    username: true,
                },
                autoVerify: {
                    email: true,
                },
                removalPolicy: cdk.RemovalPolicy.DESTROY, // 開発環境では削除可能
            },
            userPoolClient: {
                generateSecret: false,
                authFlows: {
                    userPassword: true,
                    userSrp: true,
                    adminUserPassword: true, // 開発環境では管理者パスワード認証も有効
                },
            },
            identityPool: {
                allowUnauthenticatedIdentities: true, // 開発環境では未認証アクセス許可
            },
        };
    }
    createLambdaConfig() {
        return {
            imagePath: './docker',
            tag: 'dev',
            vpcConfig: null, // 開発環境ではVPCなし
        };
    }
    createOutputConfig() {
        return {
            enableCognitoOutputs: true,
            enableApiGatewayOutputs: true,
            enableLambdaOutputs: true,
            enableEnvironmentVariables: true, // 開発環境では全出力有効
        };
    }
}
exports.DevelopmentConfigStrategy = DevelopmentConfigStrategy;
/**
 * ステージング環境戦略
 */
class StagingConfigStrategy extends WebAppConfigStrategy {
    createCognitoConfig(projectName, environment) {
        return {
            userPool: {
                selfSignUpEnabled: true,
                passwordPolicy: {
                    minLength: 8,
                    requireLowercase: true,
                    requireUppercase: true,
                    requireDigits: true,
                    requireSymbols: false,
                },
                signInAliases: {
                    email: true,
                    username: true,
                },
                autoVerify: {
                    email: true,
                },
                removalPolicy: cdk.RemovalPolicy.RETAIN, // ステージングでは保持
            },
            userPoolClient: {
                generateSecret: false,
                authFlows: {
                    userPassword: true,
                    userSrp: true,
                },
            },
            identityPool: {
                allowUnauthenticatedIdentities: false,
            },
        };
    }
    createLambdaConfig() {
        return {
            imagePath: './docker',
            tag: 'staging',
            vpcConfig: null,
        };
    }
    createOutputConfig() {
        return {
            enableCognitoOutputs: true,
            enableApiGatewayOutputs: true,
            enableLambdaOutputs: true,
            enableEnvironmentVariables: false, // ステージングでは環境変数出力無効
        };
    }
}
exports.StagingConfigStrategy = StagingConfigStrategy;
/**
 * 本番環境戦略
 */
class ProductionConfigStrategy extends WebAppConfigStrategy {
    createCognitoConfig(projectName, environment) {
        return {
            userPool: {
                selfSignUpEnabled: false, // 本番では管理者作成のみ
                passwordPolicy: {
                    minLength: 12, // 本番では厳格なパスワード
                    requireLowercase: true,
                    requireUppercase: true,
                    requireDigits: true,
                    requireSymbols: true,
                },
                signInAliases: {
                    email: true,
                    username: false, // 本番ではメールのみ
                },
                autoVerify: {
                    email: true,
                },
                removalPolicy: cdk.RemovalPolicy.RETAIN, // 本番では必ず保持
            },
            userPoolClient: {
                generateSecret: true, // 本番ではシークレット生成
                authFlows: {
                    userSrp: true, // 本番ではSRPのみ
                },
            },
            identityPool: {
                allowUnauthenticatedIdentities: false,
            },
        };
    }
    createLambdaConfig() {
        return {
            imagePath: './docker',
            tag: 'latest',
            vpcConfig: null, // 本番でもVPCは要件次第
        };
    }
    createOutputConfig() {
        return {
            enableCognitoOutputs: true,
            enableApiGatewayOutputs: true,
            enableLambdaOutputs: false, // 本番ではLambda出力無効
            enableEnvironmentVariables: false, // 本番では環境変数出力無効
        };
    }
}
exports.ProductionConfigStrategy = ProductionConfigStrategy;
/**
 * エンタープライズ環境戦略
 */
class EnterpriseConfigStrategy extends WebAppConfigStrategy {
    createCognitoConfig(projectName, environment) {
        return {
            userPool: {
                selfSignUpEnabled: false,
                passwordPolicy: {
                    minLength: 14, // エンタープライズでは最も厳格
                    requireLowercase: true,
                    requireUppercase: true,
                    requireDigits: true,
                    requireSymbols: true,
                },
                signInAliases: {
                    email: true,
                    username: false,
                },
                autoVerify: {
                    email: true,
                },
                removalPolicy: cdk.RemovalPolicy.RETAIN,
            },
            userPoolClient: {
                generateSecret: true,
                authFlows: {
                    userSrp: true,
                },
            },
            identityPool: {
                allowUnauthenticatedIdentities: false,
            },
        };
    }
    createLambdaConfig() {
        return {
            imagePath: './docker',
            tag: 'enterprise',
            vpcConfig: null, // エンタープライズではVPC必須の場合が多い
        };
    }
    createOutputConfig() {
        return {
            enableCognitoOutputs: false, // エンタープライズでは出力最小化
            enableApiGatewayOutputs: false,
            enableLambdaOutputs: false,
            enableEnvironmentVariables: false,
        };
    }
}
exports.EnterpriseConfigStrategy = EnterpriseConfigStrategy;
/**
 * 設定戦略ファクトリー
 */
class WebAppConfigStrategyFactory {
    static createStrategy(environment) {
        switch (environment.toLowerCase()) {
            case 'dev':
            case 'development':
                return new DevelopmentConfigStrategy();
            case 'staging':
            case 'stage':
                return new StagingConfigStrategy();
            case 'prod':
            case 'production':
                return new ProductionConfigStrategy();
            case 'enterprise':
            case 'ent':
                return new EnterpriseConfigStrategy();
            default:
                throw new Error(`サポートされていない環境: ${environment}`);
        }
    }
    static getSupportedEnvironments() {
        return ['dev', 'development', 'staging', 'stage', 'prod', 'production', 'enterprise', 'ent'];
    }
}
exports.WebAppConfigStrategyFactory = WebAppConfigStrategyFactory;
/**
 * 設定戦略コンテキスト
 */
class WebAppConfigContext {
    constructor(environment) {
        this.strategy = WebAppConfigStrategyFactory.createStrategy(environment);
    }
    setStrategy(strategy) {
        this.strategy = strategy;
    }
    createConfig(projectName, environment) {
        return this.strategy.createFullConfig(projectName, environment);
    }
    getCognitoConfig(projectName, environment) {
        return this.strategy.createCognitoConfig(projectName, environment);
    }
    getLambdaConfig() {
        return this.strategy.createLambdaConfig();
    }
    getOutputConfig() {
        return this.strategy.createOutputConfig();
    }
}
exports.WebAppConfigContext = WebAppConfigContext;
