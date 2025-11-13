import { Construct } from 'constructs';
import * as cdk from 'aws-cdk-lib';
import { SecurityConfig } from '../interfaces/security-config';

export interface SecurityConstructProps {
  config: SecurityConfig;
}

export class SecurityConstruct extends Construct {
  constructor(scope: Construct, id: string, props: SecurityConstructProps) {
    super(scope, id);
    // 最小限の実装 - 実際の機能は別途実装
    console.log('SecurityConstruct initialized (stub)');
  }
}
