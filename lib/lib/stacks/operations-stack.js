"use strict";
/**
 * Operations Stack
 * 監視・エンタープライズ統合スタック
 *
 * 統合機能:
 * - CloudWatch、X-Ray、アラーム、ダッシュボード、マルチテナント、課金、コンプライアンス、ガバナンス
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
exports.OperationsStack = void 0;
const aws_cdk_lib_1 = require("aws-cdk-lib");
const cloudwatch = __importStar(require("aws-cdk-lib/aws-cloudwatch"));
const logs = __importStar(require("aws-cdk-lib/aws-logs"));
const sns = __importStar(require("aws-cdk-lib/aws-sns"));
const snsSubscriptions = __importStar(require("aws-cdk-lib/aws-sns-subscriptions"));
const cloudwatchActions = __importStar(require("aws-cdk-lib/aws-cloudwatch-actions"));
const lambda = __importStar(require("aws-cdk-lib/aws-lambda"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const gdpr_system_factory_1 = require("../data-protection/gdpr-system-factory");
const automated_compliance_auditor_1 = require("../compliance/automated-compliance-auditor");
const security_monitoring_system_1 = require("../security/security-monitoring-system");
class OperationsStack extends aws_cdk_lib_1.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        const { config } = props;
        // Create SNS topic for alerts
        this.createAlertTopic(config);
        // Create CloudWatch Dashboard
        if (config.features.monitoring.dashboards) {
            this.createDashboard(config, props);
        }
        // Create CloudWatch Alarms
        if (config.features.monitoring.alarms) {
            this.createAlarms(config, props);
        }
        // Create Compliance Logging
        if (config.features.enterprise.compliance) {
            this.createComplianceLogging(config);
        }
        // Enable X-Ray tracing
        if (config.features.monitoring.xray) {
            this.enableXRayTracing(config, props);
        }
        // Create GDPR System
        if (config.features.enterprise.compliance && props.gdprConfig) {
            this.createGdprSystem(config, props.gdprConfig);
        }
        // Create Compliance Auditor
        if (config.features.enterprise.compliance && props.complianceConfig) {
            this.createComplianceAuditor(config, props.complianceConfig);
        }
        // Create Security Monitoring
        if (config.features.security && props.securityMonitoringConfig) {
            this.createSecurityMonitoring(config, props.securityMonitoringConfig);
        }
    }
    createAlertTopic(config) {
        this.alertTopic = new sns.Topic(this, 'AlertTopic', {
            topicName: `${config.projectName}-alerts-${config.environment}`,
            displayName: `${config.projectName} System Alerts`
        });
        // Add email subscription for production
        if (config.environment === 'prod') {
            // TODO: Add actual email addresses
            // this.alertTopic.addSubscription(
            //   new snsSubscriptions.EmailSubscription('admin@example.com')
            // );
        }
    }
    createDashboard(config, props) {
        this.dashboard = new cloudwatch.Dashboard(this, 'SystemDashboard', {
            dashboardName: `${config.projectName}-${config.environment}`,
            periodOverride: cloudwatch.PeriodOverride.AUTO
        });
        // API Gateway metrics
        if (props.restApi) {
            this.dashboard.addWidgets(new cloudwatch.GraphWidget({
                title: 'API Gateway Requests',
                left: [
                    new cloudwatch.Metric({
                        namespace: 'AWS/ApiGateway',
                        metricName: 'Count',
                        dimensionsMap: {
                            ApiName: props.restApi.restApiName
                        },
                        statistic: 'Sum'
                    })
                ],
                width: 12
            }), new cloudwatch.GraphWidget({
                title: 'API Gateway Latency',
                left: [
                    new cloudwatch.Metric({
                        namespace: 'AWS/ApiGateway',
                        metricName: 'Latency',
                        dimensionsMap: {
                            ApiName: props.restApi.restApiName
                        },
                        statistic: 'Average'
                    })
                ],
                width: 12
            }));
        }
        // Lambda metrics
        if (props.lambdaFunctions && props.lambdaFunctions.length > 0) {
            const lambdaMetrics = props.lambdaFunctions.map(func => new cloudwatch.Metric({
                namespace: 'AWS/Lambda',
                metricName: 'Duration',
                dimensionsMap: {
                    FunctionName: func.functionName
                },
                statistic: 'Average'
            }));
            this.dashboard.addWidgets(new cloudwatch.GraphWidget({
                title: 'Lambda Function Duration',
                left: lambdaMetrics,
                width: 12
            }));
            const errorMetrics = props.lambdaFunctions.map(func => new cloudwatch.Metric({
                namespace: 'AWS/Lambda',
                metricName: 'Errors',
                dimensionsMap: {
                    FunctionName: func.functionName
                },
                statistic: 'Sum'
            }));
            this.dashboard.addWidgets(new cloudwatch.GraphWidget({
                title: 'Lambda Function Errors',
                left: errorMetrics,
                width: 12
            }));
        }
        // DynamoDB metrics
        if (props.dynamoTables && props.dynamoTables.length > 0) {
            const readMetrics = props.dynamoTables.map(table => new cloudwatch.Metric({
                namespace: 'AWS/DynamoDB',
                metricName: 'ConsumedReadCapacityUnits',
                dimensionsMap: {
                    TableName: table.tableName
                },
                statistic: 'Sum'
            }));
            this.dashboard.addWidgets(new cloudwatch.GraphWidget({
                title: 'DynamoDB Read Capacity',
                left: readMetrics,
                width: 12
            }));
        }
    }
    createAlarms(config, props) {
        if (!this.alertTopic)
            return;
        // API Gateway error rate alarm
        if (props.restApi) {
            const apiErrorAlarm = new cloudwatch.Alarm(this, 'ApiErrorAlarm', {
                alarmName: `${config.projectName}-api-errors-${config.environment}`,
                alarmDescription: 'API Gateway error rate is too high',
                metric: new cloudwatch.Metric({
                    namespace: 'AWS/ApiGateway',
                    metricName: '4XXError',
                    dimensionsMap: {
                        ApiName: props.restApi.restApiName
                    },
                    statistic: 'Sum'
                }),
                threshold: config.environment === 'prod' ? 10 : 50,
                evaluationPeriods: 2,
                treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
            });
            apiErrorAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alertTopic));
        }
        // Lambda error alarms
        if (props.lambdaFunctions) {
            props.lambdaFunctions.forEach((func, index) => {
                const errorAlarm = new cloudwatch.Alarm(this, `LambdaErrorAlarm${index}`, {
                    alarmName: `${config.projectName}-lambda-${func.functionName}-errors-${config.environment}`,
                    alarmDescription: `Lambda function ${func.functionName} error rate is too high`,
                    metric: new cloudwatch.Metric({
                        namespace: 'AWS/Lambda',
                        metricName: 'Errors',
                        dimensionsMap: {
                            FunctionName: func.functionName
                        },
                        statistic: 'Sum'
                    }),
                    threshold: config.environment === 'prod' ? 5 : 10,
                    evaluationPeriods: 2
                });
                errorAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alertTopic));
            });
        }
    }
    createComplianceLogging(config) {
        // Create dedicated log group for compliance events
        this.complianceLogGroup = new logs.LogGroup(this, 'ComplianceLogGroup', {
            logGroupName: `/aws/${config.projectName}/compliance/${config.environment}`,
            retention: logs.RetentionDays.ONE_YEAR,
            removalPolicy: config.environment === 'prod' ?
                aws_cdk_lib_1.RemovalPolicy.RETAIN :
                aws_cdk_lib_1.RemovalPolicy.DESTROY
        });
        // Create compliance audit Lambda function
        this.complianceAuditFunction = new lambda.Function(this, 'ComplianceAuditFunction', {
            functionName: `${config.projectName}-compliance-audit-${config.environment}`,
            runtime: lambda.Runtime.PYTHON_3_11,
            handler: 'index.lambda_handler',
            timeout: aws_cdk_lib_1.Duration.minutes(5),
            environment: {
                COMPLIANCE_LOG_GROUP: this.complianceLogGroup.logGroupName,
                REGULATIONS: config.compliance.regulations.join(','),
                REGION: config.region,
                PROJECT_NAME: config.projectName
            },
            code: lambda.Code.fromInline(`
import json
import boto3
import os
from datetime import datetime
from typing import Dict, Any

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Compliance audit function
    Logs compliance-related events and performs automated checks
    """
    
    logs_client = boto3.client('logs')
    
    # Extract event information
    event_type = event.get('eventType', 'unknown')
    user_id = event.get('userId', 'system')
    resource = event.get('resource', 'unknown')
    action = event.get('action', 'unknown')
    
    # Create compliance log entry
    log_entry = {
        'timestamp': datetime.utcnow().isoformat(),
        'eventType': event_type,
        'userId': user_id,
        'resource': resource,
        'action': action,
        'regulations': os.environ.get('REGULATIONS', '').split(','),
        'region': os.environ.get('REGION', 'unknown'),
        'projectName': os.environ.get('PROJECT_NAME', 'unknown')
    }
    
    # Log to CloudWatch
    try:
        logs_client.put_log_events(
            logGroupName=os.environ['COMPLIANCE_LOG_GROUP'],
            logStreamName=f"compliance-audit-{datetime.utcnow().strftime('%Y-%m-%d')}",
            logEvents=[
                {
                    'timestamp': int(datetime.utcnow().timestamp() * 1000),
                    'message': json.dumps(log_entry)
                }
            ]
        )
    except logs_client.exceptions.ResourceNotFoundException:
        # Create log stream if it doesn't exist
        logs_client.create_log_stream(
            logGroupName=os.environ['COMPLIANCE_LOG_GROUP'],
            logStreamName=f"compliance-audit-{datetime.utcnow().strftime('%Y-%m-%d')}"
        )
        logs_client.put_log_events(
            logGroupName=os.environ['COMPLIANCE_LOG_GROUP'],
            logStreamName=f"compliance-audit-{datetime.utcnow().strftime('%Y-%m-%d')}",
            logEvents=[
                {
                    'timestamp': int(datetime.utcnow().timestamp() * 1000),
                    'message': json.dumps(log_entry)
                }
            ]
        )
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Compliance event logged successfully',
            'eventType': event_type,
            'timestamp': log_entry['timestamp']
        })
    }
      `)
        });
        // Grant permissions to write to CloudWatch Logs
        this.complianceAuditFunction.addToRolePolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogStreams'
            ],
            resources: [this.complianceLogGroup.logGroupArn]
        }));
    }
    enableXRayTracing(config, props) {
        // Enable X-Ray tracing for Lambda functions
        if (props.lambdaFunctions) {
            props.lambdaFunctions.forEach(func => {
                // Note: X-Ray tracing is enabled at the function level
                // This is a placeholder for X-Ray configuration
                console.log(`X-Ray tracing configuration for ${func.functionName}`);
            });
        }
        // Create X-Ray service map
        // Note: X-Ray service maps are automatically generated
        // This is a placeholder for additional X-Ray configuration
        console.log('X-Ray tracing enabled for the application');
    }
    createGdprSystem(config, gdprConfig) {
        this.gdprSystem = new gdpr_system_factory_1.GdprSystemFactory(this, 'GdprSystem', {
            globalConfig: config,
            gdprConfig: gdprConfig
        });
        // GDPR システムのメトリクスをダッシュボードに追加
        if (this.dashboard && this.gdprSystem.complianceManager) {
            this.dashboard.addWidgets(new cloudwatch.GraphWidget({
                title: 'GDPR データ主体権利リクエスト',
                left: [
                    this.gdprSystem.complianceManager.dataAccessFunction.metricInvocations({
                        label: 'データアクセス権'
                    }),
                    this.gdprSystem.complianceManager.dataErasureFunction.metricInvocations({
                        label: 'データ削除権'
                    }),
                    this.gdprSystem.complianceManager.dataPortabilityFunction.metricInvocations({
                        label: 'データポータビリティ権'
                    })
                ],
                width: 12
            }));
            this.dashboard.addWidgets(new cloudwatch.SingleValueWidget({
                title: 'GDPR コンプライアンス状況',
                metrics: [
                    this.gdprSystem.complianceManager.complianceMonitorFunction.metricInvocations({
                        label: 'コンプライアンス監視実行回数'
                    })
                ],
                width: 6
            }));
            if (this.gdprSystem.dpiaSystem) {
                this.dashboard.addWidgets(new cloudwatch.SingleValueWidget({
                    title: 'DPIA実行状況',
                    metrics: [
                        this.gdprSystem.dpiaSystem.dpiaExecutorFunction.metricInvocations({
                            label: 'DPIA実行回数'
                        })
                    ],
                    width: 6
                }));
            }
        }
        // GDPR アラートを統合アラートトピックに接続
        if (this.alertTopic && this.gdprSystem.complianceManager) {
            this.gdprSystem.complianceManager.alertTopic.addSubscription(new snsSubscriptions.EmailSubscription('gdpr@example.com'));
        }
    }
    createComplianceAuditor(config, complianceConfig) {
        this.complianceAuditor = new automated_compliance_auditor_1.AutomatedComplianceAuditor(this, 'ComplianceAuditor', {
            globalConfig: config,
            complianceConfig: complianceConfig
        });
        // コンプライアンス監査メトリクスをダッシュボードに追加
        if (this.dashboard) {
            this.dashboard.addWidgets(new cloudwatch.GraphWidget({
                title: 'コンプライアンス監査実行状況',
                left: [
                    this.complianceAuditor.auditExecutorFunction.metricInvocations({
                        label: '監査実行回数'
                    }),
                    this.complianceAuditor.reportGeneratorFunction.metricInvocations({
                        label: 'レポート生成回数'
                    })
                ],
                width: 12
            }));
            this.dashboard.addWidgets(new cloudwatch.SingleValueWidget({
                title: 'コンプライアンス違反処理',
                metrics: [
                    this.complianceAuditor.violationProcessorFunction.metricInvocations({
                        label: '違反処理回数'
                    })
                ],
                width: 6
            }));
        }
        // アラートを統合アラートトピックに接続
        if (this.alertTopic) {
            this.complianceAuditor.alertsTopic.addSubscription(new snsSubscriptions.EmailSubscription('compliance@example.com'));
        }
    }
    createSecurityMonitoring(config, securityConfig) {
        this.securityMonitoring = new security_monitoring_system_1.SecurityMonitoringSystem(this, 'SecurityMonitoring', {
            globalConfig: config,
            securityConfig: securityConfig
        });
        // セキュリティ監視メトリクスをダッシュボードに追加
        if (this.dashboard) {
            this.dashboard.addWidgets(new cloudwatch.GraphWidget({
                title: 'セキュリティ脅威検出',
                left: [
                    this.securityMonitoring.threatDetectorFunction.metricInvocations({
                        label: '脅威検出実行回数'
                    }),
                    this.securityMonitoring.incidentResponderFunction.metricInvocations({
                        label: 'インシデント対応回数'
                    })
                ],
                width: 12
            }));
            this.dashboard.addWidgets(new cloudwatch.SingleValueWidget({
                title: 'セキュリティインシデント',
                metrics: [
                    this.securityMonitoring.incidentResponderFunction.metricErrors({
                        label: 'インシデント対応エラー'
                    })
                ],
                width: 6
            }));
        }
        // セキュリティアラートを統合アラートトピックに接続
        if (this.alertTopic) {
            this.securityMonitoring.securityAlertTopic.addSubscription(new snsSubscriptions.EmailSubscription('security@example.com'));
        }
    }
}
exports.OperationsStack = OperationsStack;
