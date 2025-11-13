import { Construct } from 'constructs';
import { MonitoringConfig } from '../interfaces/monitoring-config';
export interface MonitoringConstructProps {
    config: MonitoringConfig;
}
export declare class MonitoringConstruct extends Construct {
    constructor(scope: Construct, id: string, props: MonitoringConstructProps);
}
