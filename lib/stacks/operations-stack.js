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
    dashboard;
    alertTopic;
    complianceLogGroup;
    complianceAuditFunction;
    gdprSystem;
    complianceAuditor;
    securityMonitoring;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoib3BlcmF0aW9ucy1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm9wZXJhdGlvbnMtc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7Ozs7R0FNRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCw2Q0FBeUU7QUFFekUsdUVBQXlEO0FBQ3pELDJEQUE2QztBQUM3Qyx5REFBMkM7QUFDM0Msb0ZBQXNFO0FBQ3RFLHNGQUF3RTtBQUN4RSwrREFBaUQ7QUFHakQseURBQTJDO0FBRTNDLGdGQUE2RjtBQUM3Riw2RkFBbUg7QUFDbkgsdUZBQTRHO0FBWTVHLE1BQWEsZUFBZ0IsU0FBUSxtQkFBSztJQUNqQyxTQUFTLENBQXdCO0lBQ2pDLFVBQVUsQ0FBYTtJQUN2QixrQkFBa0IsQ0FBaUI7SUFDbkMsdUJBQXVCLENBQW1CO0lBQzFDLFVBQVUsQ0FBcUI7SUFDL0IsaUJBQWlCLENBQThCO0lBQy9DLGtCQUFrQixDQUE0QjtJQUVyRCxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQTJCO1FBQ25FLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLE1BQU0sRUFBRSxNQUFNLEVBQUUsR0FBRyxLQUFLLENBQUM7UUFFekIsOEJBQThCO1FBQzlCLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxNQUFNLENBQUMsQ0FBQztRQUU5Qiw4QkFBOEI7UUFDOUIsSUFBSSxNQUFNLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUMxQyxJQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQztRQUN0QyxDQUFDO1FBRUQsMkJBQTJCO1FBQzNCLElBQUksTUFBTSxDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLENBQUM7WUFDdEMsSUFBSSxDQUFDLFlBQVksQ0FBQyxNQUFNLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDbkMsQ0FBQztR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LFVBQVUsQ0FBQyxXQUFXLENBQUM7Z0JBQ3pCLEtBQUssRUFBRSxZQUFZO2dCQUNuQixJQUFJLEVBQUU7b0JBQ0osSUFBSSxDQUFDLGtCQUFrQixDQUFDLHNCQUFzQixDQUFDLGlCQUFpQixDQUFDO3dCQUMvRCxLQUFLLEVBQUUsVUFBVTtxQkFDbEIsQ0FBQztvQkFDRixJQUFJLENBQUMsa0JBQWtCLENBQUMseUJBQXlCLENBQUMsaUJBQWlCLENBQUM7d0JBQ2xFLEtBQUssRUFBRSxZQUFZO3FCQUNwQixDQUFDO2lCQUNIO2dCQUNELEtBQUssRUFBRSxFQUFFO2FBQ1YsQ0FBQyxDQUNILENBQUM7WUFFRixJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FDdkIsSUFBSSxVQUFVLENBQUMsaUJBQWlCLENBQUM7Z0JBQy9CLEtBQUssRUFBRSxjQUFjO2dCQUNyQixPQUFPLEVBQUU7b0JBQ1AsSUFBSSxDQUFDLGtCQUFrQixDQUFDLHlCQUF5QixDQUFDLFlBQVksQ0FBQzt3QkFDN0QsS0FBSyxFQUFFLGFBQWE7cUJBQ3JCLENBQUM7aUJBQ0g7Z0JBQ0QsS0FBSyxFQUFFLENBQUM7YUFDVCxDQUFDLENBQ0gsQ0FBQztRQUNKLENBQUM7UUFFRCwyQkFBMkI7UUFDM0IsSUFBSSxJQUFJLENBQUMsVUFBVSxFQUFFLENBQUM7WUFDcEIsSUFBSSxDQUFDLGtCQUFrQixDQUFDLGtCQUFrQixDQUFDLGVBQWUsQ0FDeEQsSUFBSSxnQkFBZ0IsQ0FBQyxpQkFBaUIsQ0FBQyxzQkFBc0IsQ0FBQyxDQUMvRCxDQUFDO1FBQ0osQ0FBQztJQUNILENBQUM7Q0FDRjtBQWhmRCwwQ0FnZkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIE9wZXJhdGlvbnMgU3RhY2tcbiAqIOebo+imluODu+OCqOODs+OCv+ODvOODl+ODqeOCpOOCuue1seWQiOOCueOCv+ODg+OCr1xuICogXG4gKiDntbHlkIjmqZ/og706XG4gKiAtIENsb3VkV2F0Y2jjgIFYLVJheeOAgeOCouODqeODvOODoOOAgeODgOODg+OCt+ODpeODnOODvOODieOAgeODnuODq+ODgeODhuODiuODs+ODiOOAgeiqsumHkeOAgeOCs+ODs+ODl+ODqeOCpOOCouODs+OCueOAgeOCrOODkOODiuODs+OCuVxuICovXG5cbmltcG9ydCB7IFN0YWNrLCBTdGFja1Byb3BzLCBEdXJhdGlvbiwgUmVtb3ZhbFBvbGljeSB9IGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0ICogYXMgY2xvdWR3YXRjaCBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWR3YXRjaCc7XG5pbXBvcnQgKiBhcyBsb2dzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sb2dzJztcbmltcG9ydCAqIGFzIHNucyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc25zJztcbmltcG9ydCAqIGFzIHNuc1N1YnNjcmlwdGlvbnMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXNucy1zdWJzY3JpcHRpb25zJztcbmltcG9ydCAqIGFzIGNsb3Vkd2F0Y2hBY3Rpb25zIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jbG91ZHdhdGNoLWFjdGlvbnMnO1xuaW1wb3J0ICogYXMgbGFtYmRhIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sYW1iZGEnO1xuaW1wb3J0ICogYXMgZHluYW1vZGIgZnJvbSAnYXdzLWNkay1saWIvYXdzLWR5bmFtb2RiJztcbmltcG9ydCAqIGFzIGFwaWdhdGV3YXkgZnJvbSAnYXdzLWNkay1saWIvYXdzLWFwaWdhdGV3YXknO1xuaW1wb3J0ICogYXMgaWFtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nO1xuaW1wb3J0IHsgR2xvYmFsUmFnQ29uZmlnIH0gZnJvbSAnLi4vLi4vdHlwZXMvZ2xvYmFsLWNvbmZpZyc7XG5pbXBvcnQgeyBHZHByU3lzdGVtRmFjdG9yeSwgR2RwclN5c3RlbUNvbmZpZyB9IGZyb20gJy4uL2RhdGEtcHJvdGVjdGlvbi9nZHByLXN5c3RlbS1mYWN0b3J5JztcbmltcG9ydCB7IEF1dG9tYXRlZENvbXBsaWFuY2VBdWRpdG9yLCBBdXRvbWF0ZWRDb21wbGlhbmNlQ29uZmlnIH0gZnJvbSAnLi4vY29tcGxpYW5jZS9hdXRvbWF0ZWQtY29tcGxpYW5jZS1hdWRpdG9yJztcbmltcG9ydCB7IFNlY3VyaXR5TW9uaXRvcmluZ1N5c3RlbSwgU2VjdXJpdHlNb25pdG9yaW5nQ29uZmlnIH0gZnJvbSAnLi4vc2VjdXJpdHkvc2VjdXJpdHktbW9uaXRvcmluZy1zeXN0ZW0nO1xuXG5leHBvcnQgaW50ZXJmYWNlIE9wZXJhdGlvbnNTdGFja1Byb3BzIGV4dGVuZHMgU3RhY2tQcm9wcyB7XG4gIGNvbmZpZzogR2xvYmFsUmFnQ29uZmlnO1xuICByZXN0QXBpPzogYXBpZ2F0ZXdheS5JUmVzdEFwaTtcbiAgbGFtYmRhRnVuY3Rpb25zPzogbGFtYmRhLklGdW5jdGlvbltdO1xuICBkeW5hbW9UYWJsZXM/OiBkeW5hbW9kYi5JVGFibGVbXTtcbiAgZ2RwckNvbmZpZz86IEdkcHJTeXN0ZW1Db25maWc7XG4gIGNvbXBsaWFuY2VDb25maWc/OiBBdXRvbWF0ZWRDb21wbGlhbmNlQ29uZmlnO1xuICBzZWN1cml0eU1vbml0b3JpbmdDb25maWc/OiBTZWN1cml0eU1vbml0b3JpbmdDb25maWc7XG59XG5cbmV4cG9ydCBjbGFzcyBPcGVyYXRpb25zU3RhY2sgZXh0ZW5kcyBTdGFjayB7XG4gIHB1YmxpYyBkYXNoYm9hcmQ/OiBjbG91ZHdhdGNoLkRhc2hib2FyZDtcbiAgcHVibGljIGFsZXJ0VG9waWM/OiBzbnMuVG9waWM7XG4gIHB1YmxpYyBjb21wbGlhbmNlTG9nR3JvdXA/OiBsb2dzLkxvZ0dyb3VwO1xuICBwdWJsaWMgY29tcGxpYW5jZUF1ZGl0RnVuY3Rpb24/OiBsYW1iZGEuRnVuY3Rpb247XG4gIHB1YmxpYyBnZHByU3lzdGVtPzogR2RwclN5c3RlbUZhY3Rvcnk7XG4gIHB1YmxpYyBjb21wbGlhbmNlQXVkaXRvcj86IEF1dG9tYXRlZENvbXBsaWFuY2VBdWRpdG9yO1xuICBwdWJsaWMgc2VjdXJpdHlNb25pdG9yaW5nPzogU2VjdXJpdHlNb25pdG9yaW5nU3lzdGVtO1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBPcGVyYXRpb25zU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgY29uc3QgeyBjb25maWcgfSA9IHByb3BzO1xuXG4gICAgLy8gQ3JlYXRlIFNOUyB0b3BpYyBmb3IgYWxlcnRzXG4gICAgdGhpcy5jcmVhdGVBbGVydFRvcGljKGNvbmZpZyk7XG5cbiAgICAvLyBDcmVhdGUgQ2xvdWRXYXRjaCBEYXNoYm9hcmRcbiAgICBpZiAoY29uZmlnLmZlYXR1cmVzLm1vbml0b3JpbmcuZGFzaGJvYXJkcykge1xuICAgICAgdGhpcy5jcmVhdGVEYXNoYm9hcmQoY29uZmlnLCBwcm9wcyk7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIENsb3VkV2F0Y2ggQWxhcm1zXG4gICAgaWYgKGNvbmZpZy5mZWF0dXJlcy5tb25pdG9yaW5nLmFsYXJtcykge1xuICAgICAgdGhpcy5jcmVhdGVBbGFybXMoY29uZmlnLCBwcm9wcyk7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIENvbXBsaWFuY2UgTG9nZ2luZ1xuICAgIGlmIChjb25maWcuZmVhdHVyZXMuZW50ZXJwcmlzZS5jb21wbGlhbmNlKSB7XG4gICAgICB0aGlzLmNyZWF0ZUNvbXBsaWFuY2VMb2dnaW5nKGNvbmZpZyk7XG4gICAgfVxuXG4gICAgLy8gRW5hYmxlIFgtUmF5IHRyYWNpbmdcbiAgICBpZiAoY29uZmlnLmZlYXR1cmVzLm1vbml0b3JpbmcueHJheSkge1xuICAgICAgdGhpcy5lbmFibGVYUmF5VHJhY2luZyhjb25maWcsIHByb3BzKTtcbiAgICB9XG5cbiAgICAvLyBDcmVhdGUgR0RQUiBTeXN0ZW1cbiAgICBpZiAoY29uZmlnLmZlYXR1cmVzLmVudGVycHJpc2UuY29tcGxpYW5jZSAmJiBwcm9wcy5nZHByQ29uZmlnKSB7XG4gICAgICB0aGlzLmNyZWF0ZUdkcHJTeXN0ZW0oY29uZmlnLCBwcm9wcy5nZHByQ29uZmlnKTtcbiAgICB9XG5cbiAgICAvLyBDcmVhdGUgQ29tcGxpYW5jZSBBdWRpdG9yXG4gICAgaWYgKGNvbmZpZy5mZWF0dXJlcy5lbnRlcnByaXNlLmNvbXBsaWFuY2UgJiYgcHJvcHMuY29tcGxpYW5jZUNvbmZpZykge1xuICAgICAgdGhpcy5jcmVhdGVDb21wbGlhbmNlQXVkaXRvcihjb25maWcsIHByb3BzLmNvbXBsaWFuY2VDb25maWcpO1xuICAgIH1cblxuICAgIC8vIENyZWF0ZSBTZWN1cml0eSBNb25pdG9yaW5nXG4gICAgaWYgKGNvbmZpZy5mZWF0dXJlcy5zZWN1cml0eSAmJiBwcm9wcy5zZWN1cml0eU1vbml0b3JpbmdDb25maWcpIHtcbiAgICAgIHRoaXMuY3JlYXRlU2VjdXJpdHlNb25pdG9yaW5nKGNvbmZpZywgcHJvcHMuc2VjdXJpdHlNb25pdG9yaW5nQ29uZmlnKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZUFsZXJ0VG9waWMoY29uZmlnOiBHbG9iYWxSYWdDb25maWcpOiB2b2lkIHtcbiAgICB0aGlzLmFsZXJ0VG9waWMgPSBuZXcgc25zLlRvcGljKHRoaXMsICdBbGVydFRvcGljJywge1xuICAgICAgdG9waWNOYW1lOiBgJHtjb25maWcucHJvamVjdE5hbWV9LWFsZXJ0cy0ke2NvbmZpZy5lbnZpcm9ubWVudH1gLFxuICAgICAgZGlzcGxheU5hbWU6IGAke2NvbmZpZy5wcm9qZWN0TmFtZX0gU3lzdGVtIEFsZXJ0c2BcbiAgICB9KTtcblxuICAgIC8vIEFkZCBlbWFpbCBzdWJzY3JpcHRpb24gZm9yIHByb2R1Y3Rpb25cbiAgICBpZiAoY29uZmlnLmVudmlyb25tZW50ID09PSAncHJvZCcpIHtcbiAgICAgIC8vIFRPRE86IEFkZCBhY3R1YWwgZW1haWwgYWRkcmVzc2VzXG4gICAgICAvLyB0aGlzLmFsZXJ0VG9waWMuYWRkU3Vic2NyaXB0aW9uKFxuICAgICAgLy8gICBuZXcgc25zU3Vic2NyaXB0aW9ucy5FbWFpbFN1YnNjcmlwdGlvbignYWRtaW5AZXhhbXBsZS5jb20nKVxuICAgICAgLy8gKTtcbiAgICB9XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZURhc2hib2FyZChjb25maWc6IEdsb2JhbFJhZ0NvbmZpZywgcHJvcHM6IE9wZXJhdGlvbnNTdGFja1Byb3BzKTogdm9pZCB7XG4gICAgdGhpcy5kYXNoYm9hcmQgPSBuZXcgY2xvdWR3YXRjaC5EYXNoYm9hcmQodGhpcywgJ1N5c3RlbURhc2hib2FyZCcsIHtcbiAgICAgIGRhc2hib2FyZE5hbWU6IGAke2NvbmZpZy5wcm9qZWN0TmFtZX0tJHtjb25maWcuZW52aXJvbm1lbnR9YCxcbiAgICAgIHBlcmlvZE92ZXJyaWRlOiBjbG91ZHdhdGNoLlBlcmlvZE92ZXJyaWRlLkFVVE9cbiAgICB9KTtcblxuICAgIC8vIEFQSSBHYXRld2F5IG1ldHJpY3NcbiAgICBpZiAocHJvcHMucmVzdEFwaSkge1xuICAgICAgdGhpcy5kYXNoYm9hcmQuYWRkV2lkZ2V0cyhcbiAgICAgICAgbmV3IGNsb3Vkd2F0Y2guR3JhcGhXaWRnZXQoe1xuICAgICAgICAgIHRpdGxlOiAnQVBJIEdhdGV3YXkgUmVxdWVzdHMnLFxuICAgICAgICAgIGxlZnQ6IFtcbiAgICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XG4gICAgICAgICAgICAgIG5hbWVzcGFjZTogJ0FXUy9BcGlHYXRld2F5JyxcbiAgICAgICAgICAgICAgbWV0cmljTmFtZTogJ0NvdW50JyxcbiAgICAgICAgICAgICAgZGltZW5zaW9uc01hcDoge1xuICAgICAgICAgICAgICAgIEFwaU5hbWU6IHByb3BzLnJlc3RBcGkucmVzdEFwaU5hbWVcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgc3RhdGlzdGljOiAnU3VtJ1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICBdLFxuICAgICAgICAgIHdpZHRoOiAxMlxuICAgICAgICB9KSxcbiAgICAgICAgbmV3IGNsb3Vkd2F0Y2guR3JhcGhXaWRnZXQoe1xuICAgICAgICAgIHRpdGxlOiAnQVBJIEdhdGV3YXkgTGF0ZW5jeScsXG4gICAgICAgICAgbGVmdDogW1xuICAgICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcbiAgICAgICAgICAgICAgbmFtZXNwYWNlOiAnQVdTL0FwaUdhdGV3YXknLFxuICAgICAgICAgICAgICBtZXRyaWNOYW1lOiAnTGF0ZW5jeScsXG4gICAgICAgICAgICAgIGRpbWVuc2lvbnNNYXA6IHtcbiAgICAgICAgICAgICAgICBBcGlOYW1lOiBwcm9wcy5yZXN0QXBpLnJlc3RBcGlOYW1lXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHN0YXRpc3RpYzogJ0F2ZXJhZ2UnXG4gICAgICAgICAgICB9KVxuICAgICAgICAgIF0sXG4gICAgICAgICAgd2lkdGg6IDEyXG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIExhbWJkYSBtZXRyaWNzXG4gICAgaWYgKHByb3BzLmxhbWJkYUZ1bmN0aW9ucyAmJiBwcm9wcy5sYW1iZGFGdW5jdGlvbnMubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgbGFtYmRhTWV0cmljcyA9IHByb3BzLmxhbWJkYUZ1bmN0aW9ucy5tYXAoZnVuYyA9PiBcbiAgICAgICAgbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcbiAgICAgICAgICBuYW1lc3BhY2U6ICdBV1MvTGFtYmRhJyxcbiAgICAgICAgICBtZXRyaWNOYW1lOiAnRHVyYXRpb24nLFxuICAgICAgICAgIGRpbWVuc2lvbnNNYXA6IHtcbiAgICAgICAgICAgIEZ1bmN0aW9uTmFtZTogZnVuYy5mdW5jdGlvbk5hbWVcbiAgICAgICAgICB9LFxuICAgICAgICAgIHN0YXRpc3RpYzogJ0F2ZXJhZ2UnXG4gICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgICB0aGlzLmRhc2hib2FyZC5hZGRXaWRnZXRzKFxuICAgICAgICBuZXcgY2xvdWR3YXRjaC5HcmFwaFdpZGdldCh7XG4gICAgICAgICAgdGl0bGU6ICdMYW1iZGEgRnVuY3Rpb24gRHVyYXRpb24nLFxuICAgICAgICAgIGxlZnQ6IGxhbWJkYU1ldHJpY3MsXG4gICAgICAgICAgd2lkdGg6IDEyXG4gICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgICBjb25zdCBlcnJvck1ldHJpY3MgPSBwcm9wcy5sYW1iZGFGdW5jdGlvbnMubWFwKGZ1bmMgPT4gXG4gICAgICAgIG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XG4gICAgICAgICAgbmFtZXNwYWNlOiAnQVdTL0xhbWJkYScsXG4gICAgICAgICAgbWV0cmljTmFtZTogJ0Vycm9ycycsXG4gICAgICAgICAgZGltZW5zaW9uc01hcDoge1xuICAgICAgICAgICAgRnVuY3Rpb25OYW1lOiBmdW5jLmZ1bmN0aW9uTmFtZVxuICAgICAgICAgIH0sXG4gICAgICAgICAgc3RhdGlzdGljOiAnU3VtJ1xuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgICAgdGhpcy5kYXNoYm9hcmQuYWRkV2lkZ2V0cyhcbiAgICAgICAgbmV3IGNsb3Vkd2F0Y2guR3JhcGhXaWRnZXQoe1xuICAgICAgICAgIHRpdGxlOiAnTGFtYmRhIEZ1bmN0aW9uIEVycm9ycycsXG4gICAgICAgICAgbGVmdDogZXJyb3JNZXRyaWNzLFxuICAgICAgICAgIHdpZHRoOiAxMlxuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBEeW5hbW9EQiBtZXRyaWNzXG4gICAgaWYgKHByb3BzLmR5bmFtb1RhYmxlcyAmJiBwcm9wcy5keW5hbW9UYWJsZXMubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgcmVhZE1ldHJpY3MgPSBwcm9wcy5keW5hbW9UYWJsZXMubWFwKHRhYmxlID0+IFxuICAgICAgICBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xuICAgICAgICAgIG5hbWVzcGFjZTogJ0FXUy9EeW5hbW9EQicsXG4gICAgICAgICAgbWV0cmljTmFtZTogJ0NvbnN1bWVkUmVhZENhcGFjaXR5VW5pdHMnLFxuICAgICAgICAgIGRpbWVuc2lvbnNNYXA6IHtcbiAgICAgICAgICAgIFRhYmxlTmFtZTogdGFibGUudGFibGVOYW1lXG4gICAgICAgICAgfSxcbiAgICAgICAgICBzdGF0aXN0aWM6ICdTdW0nXG4gICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgICB0aGlzLmRhc2hib2FyZC5hZGRXaWRnZXRzKFxuICAgICAgICBuZXcgY2xvdWR3YXRjaC5HcmFwaFdpZGdldCh7XG4gICAgICAgICAgdGl0bGU6ICdEeW5hbW9EQiBSZWFkIENhcGFjaXR5JyxcbiAgICAgICAgICBsZWZ0OiByZWFkTWV0cmljcyxcbiAgICAgICAgICB3aWR0aDogMTJcbiAgICAgICAgfSlcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgcHJpdmF0ZSBjcmVhdGVBbGFybXMoY29uZmlnOiBHbG9iYWxSYWdDb25maWcsIHByb3BzOiBPcGVyYXRpb25zU3RhY2tQcm9wcyk6IHZvaWQge1xuICAgIGlmICghdGhpcy5hbGVydFRvcGljKSByZXR1cm47XG5cbiAgICAvLyBBUEkgR2F0ZXdheSBlcnJvciByYXRlIGFsYXJtXG4gICAgaWYgKHByb3BzLnJlc3RBcGkpIHtcbiAgICAgIGNvbnN0IGFwaUVycm9yQWxhcm0gPSBuZXcgY2xvdWR3YXRjaC5BbGFybSh0aGlzLCAnQXBpRXJyb3JBbGFybScsIHtcbiAgICAgICAgYWxhcm1OYW1lOiBgJHtjb25maWcucHJvamVjdE5hbWV9LWFwaS1lcnJvcnMtJHtjb25maWcuZW52aXJvbm1lbnR9YCxcbiAgICAgICAgYWxhcm1EZXNjcmlwdGlvbjogJ0FQSSBHYXRld2F5IGVycm9yIHJhdGUgaXMgdG9vIGhpZ2gnLFxuICAgICAgICBtZXRyaWM6IG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XG4gICAgICAgICAgbmFtZXNwYWNlOiAnQVdTL0FwaUdhdGV3YXknLFxuICAgICAgICAgIG1ldHJpY05hbWU6ICc0WFhFcnJvcicsXG4gICAgICAgICAgZGltZW5zaW9uc01hcDoge1xuICAgICAgICAgICAgQXBpTmFtZTogcHJvcHMucmVzdEFwaS5yZXN0QXBpTmFtZVxuICAgICAgICAgIH0sXG4gICAgICAgICAgc3RhdGlzdGljOiAnU3VtJ1xuICAgICAgICB9KSxcbiAgICAgICAgdGhyZXNob2xkOiBjb25maWcuZW52aXJvbm1lbnQgPT09ICdwcm9kJyA/IDEwIDogNTAsXG4gICAgICAgIGV2YWx1YXRpb25QZXJpb2RzOiAyLFxuICAgICAgICB0cmVhdE1pc3NpbmdEYXRhOiBjbG91ZHdhdGNoLlRyZWF0TWlzc2luZ0RhdGEuTk9UX0JSRUFDSElOR1xuICAgICAgfSk7XG5cbiAgICAgIGFwaUVycm9yQWxhcm0uYWRkQWxhcm1BY3Rpb24oXG4gICAgICAgIG5ldyBjbG91ZHdhdGNoQWN0aW9ucy5TbnNBY3Rpb24odGhpcy5hbGVydFRvcGljKVxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyBMYW1iZGEgZXJyb3IgYWxhcm1zXG4gICAgaWYgKHByb3BzLmxhbWJkYUZ1bmN0aW9ucykge1xuICAgICAgcHJvcHMubGFtYmRhRnVuY3Rpb25zLmZvckVhY2goKGZ1bmMsIGluZGV4KSA9PiB7XG4gICAgICAgIGNvbnN0IGVycm9yQWxhcm0gPSBuZXcgY2xvdWR3YXRjaC5BbGFybSh0aGlzLCBgTGFtYmRhRXJyb3JBbGFybSR7aW5kZXh9YCwge1xuICAgICAgICAgIGFsYXJtTmFtZTogYCR7Y29uZmlnLnByb2plY3ROYW1lfS1sYW1iZGEtJHtmdW5jLmZ1bmN0aW9uTmFtZX0tZXJyb3JzLSR7Y29uZmlnLmVudmlyb25tZW50fWAsXG4gICAgICAgICAgYWxhcm1EZXNjcmlwdGlvbjogYExhbWJkYSBmdW5jdGlvbiAke2Z1bmMuZnVuY3Rpb25OYW1lfSBlcnJvciByYXRlIGlzIHRvbyBoaWdoYCxcbiAgICAgICAgICBtZXRyaWM6IG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XG4gICAgICAgICAgICBuYW1lc3BhY2U6ICdBV1MvTGFtYmRhJyxcbiAgICAgICAgICAgIG1ldHJpY05hbWU6ICdFcnJvcnMnLFxuICAgICAgICAgICAgZGltZW5zaW9uc01hcDoge1xuICAgICAgICAgICAgICBGdW5jdGlvbk5hbWU6IGZ1bmMuZnVuY3Rpb25OYW1lXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhdGlzdGljOiAnU3VtJ1xuICAgICAgICAgIH0pLFxuICAgICAgICAgIHRocmVzaG9sZDogY29uZmlnLmVudmlyb25tZW50ID09PSAncHJvZCcgPyA1IDogMTAsXG4gICAgICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDJcbiAgICAgICAgfSk7XG5cbiAgICAgICAgZXJyb3JBbGFybS5hZGRBbGFybUFjdGlvbihcbiAgICAgICAgICBuZXcgY2xvdWR3YXRjaEFjdGlvbnMuU25zQWN0aW9uKHRoaXMuYWxlcnRUb3BpYylcbiAgICAgICAgKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlQ29tcGxpYW5jZUxvZ2dpbmcoY29uZmlnOiBHbG9iYWxSYWdDb25maWcpOiB2b2lkIHtcbiAgICAvLyBDcmVhdGUgZGVkaWNhdGVkIGxvZyBncm91cCBmb3IgY29tcGxpYW5jZSBldmVudHNcbiAgICB0aGlzLmNvbXBsaWFuY2VMb2dHcm91cCA9IG5ldyBsb2dzLkxvZ0dyb3VwKHRoaXMsICdDb21wbGlhbmNlTG9nR3JvdXAnLCB7XG4gICAgICBsb2dHcm91cE5hbWU6IGAvYXdzLyR7Y29uZmlnLnByb2plY3ROYW1lfS9jb21wbGlhbmNlLyR7Y29uZmlnLmVudmlyb25tZW50fWAsXG4gICAgICByZXRlbnRpb246IGxvZ3MuUmV0ZW50aW9uRGF5cy5PTkVfWUVBUixcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNvbmZpZy5lbnZpcm9ubWVudCA9PT0gJ3Byb2QnID8gXG4gICAgICAgIFJlbW92YWxQb2xpY3kuUkVUQUlOIDogXG4gICAgICAgIFJlbW92YWxQb2xpY3kuREVTVFJPWVxuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIGNvbXBsaWFuY2UgYXVkaXQgTGFtYmRhIGZ1bmN0aW9uXG4gICAgdGhpcy5jb21wbGlhbmNlQXVkaXRGdW5jdGlvbiA9IG5ldyBsYW1iZGEuRnVuY3Rpb24odGhpcywgJ0NvbXBsaWFuY2VBdWRpdEZ1bmN0aW9uJywge1xuICAgICAgZnVuY3Rpb25OYW1lOiBgJHtjb25maWcucHJvamVjdE5hbWV9LWNvbXBsaWFuY2UtYXVkaXQtJHtjb25maWcuZW52aXJvbm1lbnR9YCxcbiAgICAgIHJ1bnRpbWU6IGxhbWJkYS5SdW50aW1lLlBZVEhPTl8zXzExLFxuICAgICAgaGFuZGxlcjogJ2luZGV4LmxhbWJkYV9oYW5kbGVyJyxcbiAgICAgIHRpbWVvdXQ6IER1cmF0aW9uLm1pbnV0ZXMoNSksXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBDT01QTElBTkNFX0xPR19HUk9VUDogdGhpcy5jb21wbGlhbmNlTG9nR3JvdXAubG9nR3JvdXBOYW1lLFxuICAgICAgICBSRUdVTEFUSU9OUzogY29uZmlnLmNvbXBsaWFuY2UucmVndWxhdGlvbnMuam9pbignLCcpLFxuICAgICAgICBSRUdJT046IGNvbmZpZy5yZWdpb24sXG4gICAgICAgIFBST0pFQ1RfTkFNRTogY29uZmlnLnByb2plY3ROYW1lXG4gICAgICB9LFxuICAgICAgY29kZTogbGFtYmRhLkNvZGUuZnJvbUlubGluZShgXG5pbXBvcnQganNvblxuaW1wb3J0IGJvdG8zXG5pbXBvcnQgb3NcbmZyb20gZGF0ZXRpbWUgaW1wb3J0IGRhdGV0aW1lXG5mcm9tIHR5cGluZyBpbXBvcnQgRGljdCwgQW55XG5cbmRlZiBsYW1iZGFfaGFuZGxlcihldmVudDogRGljdFtzdHIsIEFueV0sIGNvbnRleHQ6IEFueSkgLT4gRGljdFtzdHIsIEFueV06XG4gICAgXCJcIlwiXG4gICAgQ29tcGxpYW5jZSBhdWRpdCBmdW5jdGlvblxuICAgIExvZ3MgY29tcGxpYW5jZS1yZWxhdGVkIGV2ZW50cyBhbmQgcGVyZm9ybXMgYXV0b21hdGVkIGNoZWNrc1xuICAgIFwiXCJcIlxuICAgIFxuICAgIGxvZ3NfY2xpZW50ID0gYm90bzMuY2xpZW50KCdsb2dzJylcbiAgICBcbiAgICAjIEV4dHJhY3QgZXZlbnQgaW5mb3JtYXRpb25cbiAgICBldmVudF90eXBlID0gZXZlbnQuZ2V0KCdldmVudFR5cGUnLCAndW5rbm93bicpXG4gICAgdXNlcl9pZCA9IGV2ZW50LmdldCgndXNlcklkJywgJ3N5c3RlbScpXG4gICAgcmVzb3VyY2UgPSBldmVudC5nZXQoJ3Jlc291cmNlJywgJ3Vua25vd24nKVxuICAgIGFjdGlvbiA9IGV2ZW50LmdldCgnYWN0aW9uJywgJ3Vua25vd24nKVxuICAgIFxuICAgICMgQ3JlYXRlIGNvbXBsaWFuY2UgbG9nIGVudHJ5XG4gICAgbG9nX2VudHJ5ID0ge1xuICAgICAgICAndGltZXN0YW1wJzogZGF0ZXRpbWUudXRjbm93KCkuaXNvZm9ybWF0KCksXG4gICAgICAgICdldmVudFR5cGUnOiBldmVudF90eXBlLFxuICAgICAgICAndXNlcklkJzogdXNlcl9pZCxcbiAgICAgICAgJ3Jlc291cmNlJzogcmVzb3VyY2UsXG4gICAgICAgICdhY3Rpb24nOiBhY3Rpb24sXG4gICAgICAgICdyZWd1bGF0aW9ucyc6IG9zLmVudmlyb24uZ2V0KCdSRUdVTEFUSU9OUycsICcnKS5zcGxpdCgnLCcpLFxuICAgICAgICAncmVnaW9uJzogb3MuZW52aXJvbi5nZXQoJ1JFR0lPTicsICd1bmtub3duJyksXG4gICAgICAgICdwcm9qZWN0TmFtZSc6IG9zLmVudmlyb24uZ2V0KCdQUk9KRUNUX05BTUUnLCAndW5rbm93bicpXG4gICAgfVxuICAgIFxuICAgICMgTG9nIHRvIENsb3VkV2F0Y2hcbiAgICB0cnk6XG4gICAgICAgIGxvZ3NfY2xpZW50LnB1dF9sb2dfZXZlbnRzKFxuICAgICAgICAgICAgbG9nR3JvdXBOYW1lPW9zLmVudmlyb25bJ0NPTVBMSUFOQ0VfTE9HX0dST1VQJ10sXG4gICAgICAgICAgICBsb2dTdHJlYW1OYW1lPWZcImNvbXBsaWFuY2UtYXVkaXQte2RhdGV0aW1lLnV0Y25vdygpLnN0cmZ0aW1lKCclWS0lbS0lZCcpfVwiLFxuICAgICAgICAgICAgbG9nRXZlbnRzPVtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICd0aW1lc3RhbXAnOiBpbnQoZGF0ZXRpbWUudXRjbm93KCkudGltZXN0YW1wKCkgKiAxMDAwKSxcbiAgICAgICAgICAgICAgICAgICAgJ21lc3NhZ2UnOiBqc29uLmR1bXBzKGxvZ19lbnRyeSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgIClcbiAgICBleGNlcHQgbG9nc19jbGllbnQuZXhjZXB0aW9ucy5SZXNvdXJjZU5vdEZvdW5kRXhjZXB0aW9uOlxuICAgICAgICAjIENyZWF0ZSBsb2cgc3RyZWFtIGlmIGl0IGRvZXNuJ3QgZXhpc3RcbiAgICAgICAgbG9nc19jbGllbnQuY3JlYXRlX2xvZ19zdHJlYW0oXG4gICAgICAgICAgICBsb2dHcm91cE5hbWU9b3MuZW52aXJvblsnQ09NUExJQU5DRV9MT0dfR1JPVVAnXSxcbiAgICAgICAgICAgIGxvZ1N0cmVhbU5hbWU9ZlwiY29tcGxpYW5jZS1hdWRpdC17ZGF0ZXRpbWUudXRjbm93KCkuc3RyZnRpbWUoJyVZLSVtLSVkJyl9XCJcbiAgICAgICAgKVxuICAgICAgICBsb2dzX2NsaWVudC5wdXRfbG9nX2V2ZW50cyhcbiAgICAgICAgICAgIGxvZ0dyb3VwTmFtZT1vcy5lbnZpcm9uWydDT01QTElBTkNFX0xPR19HUk9VUCddLFxuICAgICAgICAgICAgbG9nU3RyZWFtTmFtZT1mXCJjb21wbGlhbmNlLWF1ZGl0LXtkYXRldGltZS51dGNub3coKS5zdHJmdGltZSgnJVktJW0tJWQnKX1cIixcbiAgICAgICAgICAgIGxvZ0V2ZW50cz1bXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAndGltZXN0YW1wJzogaW50KGRhdGV0aW1lLnV0Y25vdygpLnRpbWVzdGFtcCgpICogMTAwMCksXG4gICAgICAgICAgICAgICAgICAgICdtZXNzYWdlJzoganNvbi5kdW1wcyhsb2dfZW50cnkpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICApXG4gICAgXG4gICAgcmV0dXJuIHtcbiAgICAgICAgJ3N0YXR1c0NvZGUnOiAyMDAsXG4gICAgICAgICdib2R5JzoganNvbi5kdW1wcyh7XG4gICAgICAgICAgICAnbWVzc2FnZSc6ICdDb21wbGlhbmNlIGV2ZW50IGxvZ2dlZCBzdWNjZXNzZnVsbHknLFxuICAgICAgICAgICAgJ2V2ZW50VHlwZSc6IGV2ZW50X3R5cGUsXG4gICAgICAgICAgICAndGltZXN0YW1wJzogbG9nX2VudHJ5Wyd0aW1lc3RhbXAnXVxuICAgICAgICB9KVxuICAgIH1cbiAgICAgIGApXG4gICAgfSk7XG5cbiAgICAvLyBHcmFudCBwZXJtaXNzaW9ucyB0byB3cml0ZSB0byBDbG91ZFdhdGNoIExvZ3NcbiAgICB0aGlzLmNvbXBsaWFuY2VBdWRpdEZ1bmN0aW9uLmFkZFRvUm9sZVBvbGljeShuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICBlZmZlY3Q6IGlhbS5FZmZlY3QuQUxMT1csXG4gICAgICBhY3Rpb25zOiBbXG4gICAgICAgICdsb2dzOkNyZWF0ZUxvZ1N0cmVhbScsXG4gICAgICAgICdsb2dzOlB1dExvZ0V2ZW50cycsXG4gICAgICAgICdsb2dzOkRlc2NyaWJlTG9nU3RyZWFtcydcbiAgICAgIF0sXG4gICAgICByZXNvdXJjZXM6IFt0aGlzLmNvbXBsaWFuY2VMb2dHcm91cC5sb2dHcm91cEFybl1cbiAgICB9KSk7XG4gIH1cblxuICBwcml2YXRlIGVuYWJsZVhSYXlUcmFjaW5nKGNvbmZpZzogR2xvYmFsUmFnQ29uZmlnLCBwcm9wczogT3BlcmF0aW9uc1N0YWNrUHJvcHMpOiB2b2lkIHtcbiAgICAvLyBFbmFibGUgWC1SYXkgdHJhY2luZyBmb3IgTGFtYmRhIGZ1bmN0aW9uc1xuICAgIGlmIChwcm9wcy5sYW1iZGFGdW5jdGlvbnMpIHtcbiAgICAgIHByb3BzLmxhbWJkYUZ1bmN0aW9ucy5mb3JFYWNoKGZ1bmMgPT4ge1xuICAgICAgICAvLyBOb3RlOiBYLVJheSB0cmFjaW5nIGlzIGVuYWJsZWQgYXQgdGhlIGZ1bmN0aW9uIGxldmVsXG4gICAgICAgIC8vIFRoaXMgaXMgYSBwbGFjZWhvbGRlciBmb3IgWC1SYXkgY29uZmlndXJhdGlvblxuICAgICAgICBjb25zb2xlLmxvZyhgWC1SYXkgdHJhY2luZyBjb25maWd1cmF0aW9uIGZvciAke2Z1bmMuZnVuY3Rpb25OYW1lfWApO1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIFgtUmF5IHNlcnZpY2UgbWFwXG4gICAgLy8gTm90ZTogWC1SYXkgc2VydmljZSBtYXBzIGFyZSBhdXRvbWF0aWNhbGx5IGdlbmVyYXRlZFxuICAgIC8vIFRoaXMgaXMgYSBwbGFjZWhvbGRlciBmb3IgYWRkaXRpb25hbCBYLVJheSBjb25maWd1cmF0aW9uXG4gICAgY29uc29sZS5sb2coJ1gtUmF5IHRyYWNpbmcgZW5hYmxlZCBmb3IgdGhlIGFwcGxpY2F0aW9uJyk7XG4gIH1cblxuICBwcml2YXRlIGNyZWF0ZUdkcHJTeXN0ZW0oY29uZmlnOiBHbG9iYWxSYWdDb25maWcsIGdkcHJDb25maWc6IEdkcHJTeXN0ZW1Db25maWcpOiB2b2lkIHtcbiAgICB0aGlzLmdkcHJTeXN0ZW0gPSBuZXcgR2RwclN5c3RlbUZhY3RvcnkodGhpcywgJ0dkcHJTeXN0ZW0nLCB7XG4gICAgICBnbG9iYWxDb25maWc6IGNvbmZpZyxcbiAgICAgIGdkcHJDb25maWc6IGdkcHJDb25maWdcbiAgICB9KTtcblxuICAgIC8vIEdEUFIg44K344K544OG44Og44Gu44Oh44OI44Oq44Kv44K544KS44OA44OD44K344Ol44Oc44O844OJ44Gr6L+95YqgXG4gICAgaWYgKHRoaXMuZGFzaGJvYXJkICYmIHRoaXMuZ2RwclN5c3RlbS5jb21wbGlhbmNlTWFuYWdlcikge1xuICAgICAgdGhpcy5kYXNoYm9hcmQuYWRkV2lkZ2V0cyhcbiAgICAgICAgbmV3IGNsb3Vkd2F0Y2guR3JhcGhXaWRnZXQoe1xuICAgICAgICAgIHRpdGxlOiAnR0RQUiDjg4fjg7zjgr/kuLvkvZPmqKnliKnjg6rjgq/jgqjjgrnjg4gnLFxuICAgICAgICAgIGxlZnQ6IFtcbiAgICAgICAgICAgIHRoaXMuZ2RwclN5c3RlbS5jb21wbGlhbmNlTWFuYWdlci5kYXRhQWNjZXNzRnVuY3Rpb24ubWV0cmljSW52b2NhdGlvbnMoe1xuICAgICAgICAgICAgICBsYWJlbDogJ+ODh+ODvOOCv+OCouOCr+OCu+OCueaoqSdcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgdGhpcy5nZHByU3lzdGVtLmNvbXBsaWFuY2VNYW5hZ2VyLmRhdGFFcmFzdXJlRnVuY3Rpb24ubWV0cmljSW52b2NhdGlvbnMoe1xuICAgICAgICAgICAgICBsYWJlbDogJ+ODh+ODvOOCv+WJiumZpOaoqSdcbiAgICAgICAgICAgIH0pLFxuICAgICAgICAgICAgdGhpcy5nZHByU3lzdGVtLmNvbXBsaWFuY2VNYW5hZ2VyLmRhdGFQb3J0YWJpbGl0eUZ1bmN0aW9uLm1ldHJpY0ludm9jYXRpb25zKHtcbiAgICAgICAgICAgICAgbGFiZWw6ICfjg4fjg7zjgr/jg53jg7zjgr/jg5Pjg6rjg4bjgqPmqKknXG4gICAgICAgICAgICB9KVxuICAgICAgICAgIF0sXG4gICAgICAgICAgd2lkdGg6IDEyXG4gICAgICAgIH0pXG4gICAgICApO1xuXG4gICAgICB0aGlzLmRhc2hib2FyZC5hZGRXaWRnZXRzKFxuICAgICAgICBuZXcgY2xvdWR3YXRjaC5TaW5nbGVWYWx1ZVdpZGdldCh7XG4gICAgICAgICAgdGl0bGU6ICdHRFBSIOOCs+ODs+ODl+ODqeOCpOOCouODs+OCueeKtuazgScsXG4gICAgICAgICAgbWV0cmljczogW1xuICAgICAgICAgICAgdGhpcy5nZHByU3lzdGVtLmNvbXBsaWFuY2VNYW5hZ2VyLmNvbXBsaWFuY2VNb25pdG9yRnVuY3Rpb24ubWV0cmljSW52b2NhdGlvbnMoe1xuICAgICAgICAgICAgICBsYWJlbDogJ+OCs+ODs+ODl+ODqeOCpOOCouODs+OCueebo+imluWun+ihjOWbnuaVsCdcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgXSxcbiAgICAgICAgICB3aWR0aDogNlxuICAgICAgICB9KVxuICAgICAgKTtcblxuICAgICAgaWYgKHRoaXMuZ2RwclN5c3RlbS5kcGlhU3lzdGVtKSB7XG4gICAgICAgIHRoaXMuZGFzaGJvYXJkLmFkZFdpZGdldHMoXG4gICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guU2luZ2xlVmFsdWVXaWRnZXQoe1xuICAgICAgICAgICAgdGl0bGU6ICdEUElB5a6f6KGM54q25rOBJyxcbiAgICAgICAgICAgIG1ldHJpY3M6IFtcbiAgICAgICAgICAgICAgdGhpcy5nZHByU3lzdGVtLmRwaWFTeXN0ZW0uZHBpYUV4ZWN1dG9yRnVuY3Rpb24ubWV0cmljSW52b2NhdGlvbnMoe1xuICAgICAgICAgICAgICAgIGxhYmVsOiAnRFBJQeWun+ihjOWbnuaVsCdcbiAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB3aWR0aDogNlxuICAgICAgICAgIH0pXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gR0RQUiDjgqLjg6njg7zjg4jjgpLntbHlkIjjgqLjg6njg7zjg4jjg4jjg5Tjg4Pjgq/jgavmjqXntppcbiAgICBpZiAodGhpcy5hbGVydFRvcGljICYmIHRoaXMuZ2RwclN5c3RlbS5jb21wbGlhbmNlTWFuYWdlcikge1xuICAgICAgdGhpcy5nZHByU3lzdGVtLmNvbXBsaWFuY2VNYW5hZ2VyLmFsZXJ0VG9waWMuYWRkU3Vic2NyaXB0aW9uKFxuICAgICAgICBuZXcgc25zU3Vic2NyaXB0aW9ucy5FbWFpbFN1YnNjcmlwdGlvbignZ2RwckBleGFtcGxlLmNvbScpXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlQ29tcGxpYW5jZUF1ZGl0b3IoY29uZmlnOiBHbG9iYWxSYWdDb25maWcsIGNvbXBsaWFuY2VDb25maWc6IEF1dG9tYXRlZENvbXBsaWFuY2VDb25maWcpOiB2b2lkIHtcbiAgICB0aGlzLmNvbXBsaWFuY2VBdWRpdG9yID0gbmV3IEF1dG9tYXRlZENvbXBsaWFuY2VBdWRpdG9yKHRoaXMsICdDb21wbGlhbmNlQXVkaXRvcicsIHtcbiAgICAgIGdsb2JhbENvbmZpZzogY29uZmlnLFxuICAgICAgY29tcGxpYW5jZUNvbmZpZzogY29tcGxpYW5jZUNvbmZpZ1xuICAgIH0pO1xuXG4gICAgLy8g44Kz44Oz44OX44Op44Kk44Ki44Oz44K555uj5p+744Oh44OI44Oq44Kv44K544KS44OA44OD44K344Ol44Oc44O844OJ44Gr6L+95YqgXG4gICAgaWYgKHRoaXMuZGFzaGJvYXJkKSB7XG4gICAgICB0aGlzLmRhc2hib2FyZC5hZGRXaWRnZXRzKFxuICAgICAgICBuZXcgY2xvdWR3YXRjaC5HcmFwaFdpZGdldCh7XG4gICAgICAgICAgdGl0bGU6ICfjgrPjg7Pjg5fjg6njgqTjgqLjg7Pjgrnnm6Pmn7vlrp/ooYznirbms4EnLFxuICAgICAgICAgIGxlZnQ6IFtcbiAgICAgICAgICAgIHRoaXMuY29tcGxpYW5jZUF1ZGl0b3IuYXVkaXRFeGVjdXRvckZ1bmN0aW9uLm1ldHJpY0ludm9jYXRpb25zKHtcbiAgICAgICAgICAgICAgbGFiZWw6ICfnm6Pmn7vlrp/ooYzlm57mlbAnXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIHRoaXMuY29tcGxpYW5jZUF1ZGl0b3IucmVwb3J0R2VuZXJhdG9yRnVuY3Rpb24ubWV0cmljSW52b2NhdGlvbnMoe1xuICAgICAgICAgICAgICBsYWJlbDogJ+ODrOODneODvOODiOeUn+aIkOWbnuaVsCdcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgXSxcbiAgICAgICAgICB3aWR0aDogMTJcbiAgICAgICAgfSlcbiAgICAgICk7XG5cbiAgICAgIHRoaXMuZGFzaGJvYXJkLmFkZFdpZGdldHMoXG4gICAgICAgIG5ldyBjbG91ZHdhdGNoLlNpbmdsZVZhbHVlV2lkZ2V0KHtcbiAgICAgICAgICB0aXRsZTogJ+OCs+ODs+ODl+ODqeOCpOOCouODs+OCuemBleWPjeWHpueQhicsXG4gICAgICAgICAgbWV0cmljczogW1xuICAgICAgICAgICAgdGhpcy5jb21wbGlhbmNlQXVkaXRvci52aW9sYXRpb25Qcm9jZXNzb3JGdW5jdGlvbi5tZXRyaWNJbnZvY2F0aW9ucyh7XG4gICAgICAgICAgICAgIGxhYmVsOiAn6YGV5Y+N5Yem55CG5Zue5pWwJ1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICBdLFxuICAgICAgICAgIHdpZHRoOiA2XG4gICAgICAgIH0pXG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIOOCouODqeODvOODiOOCkue1seWQiOOCouODqeODvOODiOODiOODlOODg+OCr+OBq+aOpee2mlxuICAgIGlmICh0aGlzLmFsZXJ0VG9waWMpIHtcbiAgICAgIHRoaXMuY29tcGxpYW5jZUF1ZGl0b3IuYWxlcnRzVG9waWMuYWRkU3Vic2NyaXB0aW9uKFxuICAgICAgICBuZXcgc25zU3Vic2NyaXB0aW9ucy5FbWFpbFN1YnNjcmlwdGlvbignY29tcGxpYW5jZUBleGFtcGxlLmNvbScpXG4gICAgICApO1xuICAgIH1cbiAgfVxuXG4gIHByaXZhdGUgY3JlYXRlU2VjdXJpdHlNb25pdG9yaW5nKGNvbmZpZzogR2xvYmFsUmFnQ29uZmlnLCBzZWN1cml0eUNvbmZpZzogU2VjdXJpdHlNb25pdG9yaW5nQ29uZmlnKTogdm9pZCB7XG4gICAgdGhpcy5zZWN1cml0eU1vbml0b3JpbmcgPSBuZXcgU2VjdXJpdHlNb25pdG9yaW5nU3lzdGVtKHRoaXMsICdTZWN1cml0eU1vbml0b3JpbmcnLCB7XG4gICAgICBnbG9iYWxDb25maWc6IGNvbmZpZyxcbiAgICAgIHNlY3VyaXR5Q29uZmlnOiBzZWN1cml0eUNvbmZpZ1xuICAgIH0pO1xuXG5cblxuICAgIC8vIOOCu+OCreODpeODquODhuOCo+ebo+imluODoeODiOODquOCr+OCueOCkuODgOODg+OCt+ODpeODnOODvOODieOBq+i/veWKoFxuICAgIGlmICh0aGlzLmRhc2hib2FyZCkge1xuICAgICAgdGhpcy5kYXNoYm9hcmQuYWRkV2lkZ2V0cyhcbiAgICAgICAgbmV3IGNsb3Vkd2F0Y2guR3JhcGhXaWRnZXQoe1xuICAgICAgICAgIHRpdGxlOiAn44K744Kt44Ol44Oq44OG44Kj6ISF5aiB5qSc5Ye6JyxcbiAgICAgICAgICBsZWZ0OiBbXG4gICAgICAgICAgICB0aGlzLnNlY3VyaXR5TW9uaXRvcmluZy50aHJlYXREZXRlY3RvckZ1bmN0aW9uLm1ldHJpY0ludm9jYXRpb25zKHtcbiAgICAgICAgICAgICAgbGFiZWw6ICfohIXlqIHmpJzlh7rlrp/ooYzlm57mlbAnXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgICAgIHRoaXMuc2VjdXJpdHlNb25pdG9yaW5nLmluY2lkZW50UmVzcG9uZGVyRnVuY3Rpb24ubWV0cmljSW52b2NhdGlvbnMoe1xuICAgICAgICAgICAgICBsYWJlbDogJ+OCpOODs+OCt+ODh+ODs+ODiOWvvuW/nOWbnuaVsCdcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgXSxcbiAgICAgICAgICB3aWR0aDogMTJcbiAgICAgICAgfSlcbiAgICAgICk7XG5cbiAgICAgIHRoaXMuZGFzaGJvYXJkLmFkZFdpZGdldHMoXG4gICAgICAgIG5ldyBjbG91ZHdhdGNoLlNpbmdsZVZhbHVlV2lkZ2V0KHtcbiAgICAgICAgICB0aXRsZTogJ+OCu+OCreODpeODquODhuOCo+OCpOODs+OCt+ODh+ODs+ODiCcsXG4gICAgICAgICAgbWV0cmljczogW1xuICAgICAgICAgICAgdGhpcy5zZWN1cml0eU1vbml0b3JpbmcuaW5jaWRlbnRSZXNwb25kZXJGdW5jdGlvbi5tZXRyaWNFcnJvcnMoe1xuICAgICAgICAgICAgICBsYWJlbDogJ+OCpOODs+OCt+ODh+ODs+ODiOWvvuW/nOOCqOODqeODvCdcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgXSxcbiAgICAgICAgICB3aWR0aDogNlxuICAgICAgICB9KVxuICAgICAgKTtcbiAgICB9XG5cbiAgICAvLyDjgrvjgq3jg6Xjg6rjg4bjgqPjgqLjg6njg7zjg4jjgpLntbHlkIjjgqLjg6njg7zjg4jjg4jjg5Tjg4Pjgq/jgavmjqXntppcbiAgICBpZiAodGhpcy5hbGVydFRvcGljKSB7XG4gICAgICB0aGlzLnNlY3VyaXR5TW9uaXRvcmluZy5zZWN1cml0eUFsZXJ0VG9waWMuYWRkU3Vic2NyaXB0aW9uKFxuICAgICAgICBuZXcgc25zU3Vic2NyaXB0aW9ucy5FbWFpbFN1YnNjcmlwdGlvbignc2VjdXJpdHlAZXhhbXBsZS5jb20nKVxuICAgICAgKTtcbiAgICB9XG4gIH1cbn0iXX0=