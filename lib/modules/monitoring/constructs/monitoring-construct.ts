import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import { MonitoringConfig } from '../interfaces/monitoring-config';

export interface MonitoringConstructProps {
  config: MonitoringConfig;
}

export class MonitoringConstruct extends Construct {
  constructor(scope: Construct, id: string, props: MonitoringConstructProps) {
    super(scope, id);
    // 最小限の実装 - 実際の機能は別途実装
    console.log('MonitoringConstruct initialized (stub)');
  }
}
