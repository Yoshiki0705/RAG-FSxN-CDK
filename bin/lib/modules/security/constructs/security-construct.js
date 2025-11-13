"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityConstruct = void 0;
const constructs_1 = require("constructs");
class SecurityConstruct extends constructs_1.Construct {
    constructor(scope, id, props) {
        super(scope, id);
        // 最小限の実装 - 実際の機能は別途実装
        console.log('SecurityConstruct initialized (stub)');
    }
}
exports.SecurityConstruct = SecurityConstruct;
