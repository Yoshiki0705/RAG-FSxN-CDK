import { Construct } from 'constructs';
import { SecurityConfig } from '../interfaces/security-config';
export interface SecurityConstructProps {
    config: SecurityConfig;
}
export declare class SecurityConstruct extends Construct {
    constructor(scope: Construct, id: string, props: SecurityConstructProps);
}
