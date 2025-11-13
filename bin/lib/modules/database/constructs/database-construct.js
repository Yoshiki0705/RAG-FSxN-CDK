"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseConstruct = void 0;
const constructs_1 = require("constructs");
class DatabaseConstruct extends constructs_1.Construct {
    constructor(scope, id, props) {
        super(scope, id);
        // 最小限の実装 - 実際の機能は別途実装
        console.log('DatabaseConstruct initialized (stub)');
        // 空の出力を初期化
        this.outputs = {
            dynamoDbTables: {},
            openSearchEndpoint: undefined,
            openSearchDomainArn: undefined,
            openSearchDomainId: undefined,
        };
    }
}
exports.DatabaseConstruct = DatabaseConstruct;
