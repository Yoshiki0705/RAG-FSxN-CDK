"use strict";
/**
 * 命名設定インターフェース
 * スタック命名の標準化とコンポーネント定義
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StackComponent = void 0;
/**
 * スタックコンポーネント列挙型
 */
var StackComponent;
(function (StackComponent) {
    StackComponent["NETWORKING"] = "Networking";
    StackComponent["SECURITY"] = "Security";
    StackComponent["DATA"] = "Data";
    StackComponent["COMPUTE"] = "Compute";
    StackComponent["WEBAPP"] = "WebApp";
    StackComponent["OPERATIONS"] = "Operations";
    StackComponent["EMBEDDING"] = "Embedding";
    StackComponent["ADVANCED_PERMISSION"] = "AdvancedPermission";
    StackComponent["MONITORING"] = "Monitoring";
    StackComponent["ENTERPRISE"] = "Enterprise";
})(StackComponent || (exports.StackComponent = StackComponent = {}));
