#!/usr/bin/env node
"use strict";
/**
 * モジュラー統合アプリケーション エントリーポイント
 * Embedding Batch統合用の統一エントリーポイント
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
require("source-map-support/register");
const cdk = __importStar(require("aws-cdk-lib"));
const embedding_stack_1 = require("../lib/stacks/integrated/embedding-stack");
const app = new cdk.App();
// Embedding Batch統合スタックのデプロイ
new embedding_stack_1.EmbeddingStack(app, 'EmbeddingStack', {
    env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION || 'ap-northeast-1',
    },
});
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9kdWxhci1pbnRlZ3JhdGVkLWFwcC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1vZHVsYXItaW50ZWdyYXRlZC1hcHAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFDQTs7O0dBR0c7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFSCx1Q0FBcUM7QUFDckMsaURBQW1DO0FBQ25DLDhFQUEwRTtBQUUxRSxNQUFNLEdBQUcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLEVBQUUsQ0FBQztBQUUxQiw2QkFBNkI7QUFDN0IsSUFBSSxnQ0FBYyxDQUFDLEdBQUcsRUFBRSxnQkFBZ0IsRUFBRTtJQUN4QyxHQUFHLEVBQUU7UUFDSCxPQUFPLEVBQUUsT0FBTyxDQUFDLEdBQUcsQ0FBQyxtQkFBbUI7UUFDeEMsTUFBTSxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsa0JBQWtCLElBQUksZ0JBQWdCO0tBQzNEO0NBQ0YsQ0FBQyxDQUFDO0FBRUgsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiIyEvdXNyL2Jpbi9lbnYgbm9kZVxuLyoqXG4gKiDjg6Ljgrjjg6Xjg6njg7zntbHlkIjjgqLjg5fjg6rjgrHjg7zjgrfjg6fjg7Mg44Ko44Oz44OI44Oq44O844Od44Kk44Oz44OIXG4gKiBFbWJlZGRpbmcgQmF0Y2jntbHlkIjnlKjjga7ntbHkuIDjgqjjg7Pjg4jjg6rjg7zjg53jgqTjg7Pjg4hcbiAqL1xuXG5pbXBvcnQgJ3NvdXJjZS1tYXAtc3VwcG9ydC9yZWdpc3Rlcic7XG5pbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0IHsgRW1iZWRkaW5nU3RhY2sgfSBmcm9tICcuLi9saWIvc3RhY2tzL2ludGVncmF0ZWQvZW1iZWRkaW5nLXN0YWNrJztcblxuY29uc3QgYXBwID0gbmV3IGNkay5BcHAoKTtcblxuLy8gRW1iZWRkaW5nIEJhdGNo57Wx5ZCI44K544K/44OD44Kv44Gu44OH44OX44Ot44KkXG5uZXcgRW1iZWRkaW5nU3RhY2soYXBwLCAnRW1iZWRkaW5nU3RhY2snLCB7XG4gIGVudjoge1xuICAgIGFjY291bnQ6IHByb2Nlc3MuZW52LkNES19ERUZBVUxUX0FDQ09VTlQsXG4gICAgcmVnaW9uOiBwcm9jZXNzLmVudi5DREtfREVGQVVMVF9SRUdJT04gfHwgJ2FwLW5vcnRoZWFzdC0xJyxcbiAgfSxcbn0pO1xuXG5hcHAuc3ludGgoKTtcbiJdfQ==