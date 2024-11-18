import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { Waf } from "./constructs/waf";
import { devConfig } from "../config";
import {
  CompositePrincipal,
  ManagedPolicy,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Runtime, Version } from "aws-cdk-lib/aws-lambda";
import { NagSuppressions } from "cdk-nag";
export class UsRegionStack extends cdk.Stack {
  public readonly wafAttrArn: string;
  public readonly edgeFnVersion: Version;
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    // WAF
    const wafv2 = new Waf(this, "CloudFrontFireWall", {
      allowedIps: devConfig.allowedIps,
      useCloudFront: true,
    });
    this.wafAttrArn = wafv2.webAcl.attrArn;

    // Lambda@Edge for CloufFront
    const edgeFnRole = new Role(this, "LambdaEdgeFunctionRole", {
      assumedBy: new CompositePrincipal(
        new ServicePrincipal("lambda.amazonaws.com"),
        new ServicePrincipal("edgelambda.amazonaws.com")
      ),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole"
        ),
        ManagedPolicy.fromAwsManagedPolicyName("AWSLambda_FullAccess"),
      ],
    });
    const lambdaEdgeFunction = new NodejsFunction(this, "LambdaEdgeFunction", {
      runtime: Runtime.NODEJS_20_X,
      entry: "./lambda/index.ts",
      handler: "handler",
      awsSdkConnectionReuse: false,
      memorySize: 1024,
      timeout: cdk.Duration.seconds(5),
      role: edgeFnRole,
    });
    this.edgeFnVersion = lambdaEdgeFunction.currentVersion;

    NagSuppressions.addResourceSuppressions(
      [edgeFnRole],
      [
        {
          id: "AwsSolutions-IAM4",
          reason: "Given the least privilege to this role for lambda",
        },
        {
          id: "AwsSolutions-IAM5",
          reason: "Given the least privilege to this role for lambda",
        },
      ],
      true
    );
  }
}
