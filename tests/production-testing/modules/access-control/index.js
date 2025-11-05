"use strict";
/**
 * アクセス権限テストモジュール統合エクスポート
 *
 * 実本番IAM/OpenSearchでの権限ベースアクセス制御テスト
 *
 * @version 1.0.0
 * @author NetApp Japan Technology Team
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SECURITY_SCORE_THRESHOLDS = exports.ACCESS_CONTROL_TEST_PRIORITIES = exports.ACCESS_CONTROL_TEST_CATEGORIES = exports.AccessControlTestRunner = exports.AccessControlTestModule = void 0;
var access_control_test_module_1 = require("./access-control-test-module");
Object.defineProperty(exports, "AccessControlTestModule", { enumerable: true, get: function () { return __importDefault(access_control_test_module_1).default; } });
var access_control_test_runner_1 = require("./access-control-test-runner");
Object.defineProperty(exports, "AccessControlTestRunner", { enumerable: true, get: function () { return __importDefault(access_control_test_runner_1).default; } });
// テストカテゴリの定義
exports.ACCESS_CONTROL_TEST_CATEGORIES = {
    AUTHORIZED_ACCESS: 'authorized-access',
    UNAUTHORIZED_ACCESS: 'unauthorized-access',
    ADMIN_PERMISSIONS: 'admin-permissions',
    MULTI_GROUP_PERMISSIONS: 'multi-group-permissions',
    IAM_ROLE_ACCESS: 'iam-role-access'
};
// テスト重要度の定義
exports.ACCESS_CONTROL_TEST_PRIORITIES = {
    CRITICAL: 'critical', // 不正アクセス防止
    HIGH: 'high', // 正当なアクセス確保
    MEDIUM: 'medium', // 管理者権限
    LOW: 'low' // 複合権限
};
// セキュリティスコア閾値
exports.SECURITY_SCORE_THRESHOLDS = {
    EXCELLENT: 0.9,
    GOOD: 0.7,
    NEEDS_IMPROVEMENT: 0.5
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7Ozs7Ozs7R0FPRzs7Ozs7O0FBRUgsMkVBQWtGO0FBQXpFLHNKQUFBLE9BQU8sT0FBMkI7QUFDM0MsMkVBQWtGO0FBQXpFLHNKQUFBLE9BQU8sT0FBMkI7QUFRM0MsYUFBYTtBQUNBLFFBQUEsOEJBQThCLEdBQUc7SUFDNUMsaUJBQWlCLEVBQUUsbUJBQW1CO0lBQ3RDLG1CQUFtQixFQUFFLHFCQUFxQjtJQUMxQyxpQkFBaUIsRUFBRSxtQkFBbUI7SUFDdEMsdUJBQXVCLEVBQUUseUJBQXlCO0lBQ2xELGVBQWUsRUFBRSxpQkFBaUI7Q0FDMUIsQ0FBQztBQUVYLFlBQVk7QUFDQyxRQUFBLDhCQUE4QixHQUFHO0lBQzVDLFFBQVEsRUFBRSxVQUFVLEVBQUssV0FBVztJQUNwQyxJQUFJLEVBQUUsTUFBTSxFQUFZLFlBQVk7SUFDcEMsTUFBTSxFQUFFLFFBQVEsRUFBUSxRQUFRO0lBQ2hDLEdBQUcsRUFBRSxLQUFLLENBQWMsT0FBTztDQUN2QixDQUFDO0FBRVgsY0FBYztBQUNELFFBQUEseUJBQXlCLEdBQUc7SUFDdkMsU0FBUyxFQUFFLEdBQUc7SUFDZCxJQUFJLEVBQUUsR0FBRztJQUNULGlCQUFpQixFQUFFLEdBQUc7Q0FDZCxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiDjgqLjgq/jgrvjgrnmqKnpmZDjg4bjgrnjg4jjg6Ljgrjjg6Xjg7zjg6vntbHlkIjjgqjjgq/jgrnjg53jg7zjg4hcbiAqIFxuICog5a6f5pys55WqSUFNL09wZW5TZWFyY2jjgafjga7mqKnpmZDjg5njg7zjgrnjgqLjgq/jgrvjgrnliLblvqHjg4bjgrnjg4hcbiAqIFxuICogQHZlcnNpb24gMS4wLjBcbiAqIEBhdXRob3IgTmV0QXBwIEphcGFuIFRlY2hub2xvZ3kgVGVhbVxuICovXG5cbmV4cG9ydCB7IGRlZmF1bHQgYXMgQWNjZXNzQ29udHJvbFRlc3RNb2R1bGUgfSBmcm9tICcuL2FjY2Vzcy1jb250cm9sLXRlc3QtbW9kdWxlJztcbmV4cG9ydCB7IGRlZmF1bHQgYXMgQWNjZXNzQ29udHJvbFRlc3RSdW5uZXIgfSBmcm9tICcuL2FjY2Vzcy1jb250cm9sLXRlc3QtcnVubmVyJztcblxuZXhwb3J0IHR5cGUge1xuICBBY2Nlc3NDb250cm9sVGVzdFJlc3VsdCxcbiAgVGVzdFVzZXJQZXJtaXNzaW9ucyxcbiAgRG9jdW1lbnRBY2Nlc3NJbmZvXG59IGZyb20gJy4vYWNjZXNzLWNvbnRyb2wtdGVzdC1tb2R1bGUnO1xuXG4vLyDjg4bjgrnjg4jjgqvjg4bjgrTjg6rjga7lrprnvqlcbmV4cG9ydCBjb25zdCBBQ0NFU1NfQ09OVFJPTF9URVNUX0NBVEVHT1JJRVMgPSB7XG4gIEFVVEhPUklaRURfQUNDRVNTOiAnYXV0aG9yaXplZC1hY2Nlc3MnLFxuICBVTkFVVEhPUklaRURfQUNDRVNTOiAndW5hdXRob3JpemVkLWFjY2VzcycsXG4gIEFETUlOX1BFUk1JU1NJT05TOiAnYWRtaW4tcGVybWlzc2lvbnMnLFxuICBNVUxUSV9HUk9VUF9QRVJNSVNTSU9OUzogJ211bHRpLWdyb3VwLXBlcm1pc3Npb25zJyxcbiAgSUFNX1JPTEVfQUNDRVNTOiAnaWFtLXJvbGUtYWNjZXNzJ1xufSBhcyBjb25zdDtcblxuLy8g44OG44K544OI6YeN6KaB5bqm44Gu5a6a576pXG5leHBvcnQgY29uc3QgQUNDRVNTX0NPTlRST0xfVEVTVF9QUklPUklUSUVTID0ge1xuICBDUklUSUNBTDogJ2NyaXRpY2FsJywgICAgLy8g5LiN5q2j44Ki44Kv44K744K56Ziy5q2iXG4gIEhJR0g6ICdoaWdoJywgICAgICAgICAgIC8vIOato+W9k+OBquOCouOCr+OCu+OCueeiuuS/nVxuICBNRURJVU06ICdtZWRpdW0nLCAgICAgICAvLyDnrqHnkIbogIXmqKnpmZBcbiAgTE9XOiAnbG93JyAgICAgICAgICAgICAgLy8g6KSH5ZCI5qip6ZmQXG59IGFzIGNvbnN0O1xuXG4vLyDjgrvjgq3jg6Xjg6rjg4bjgqPjgrnjgrPjgqLplr7lgKRcbmV4cG9ydCBjb25zdCBTRUNVUklUWV9TQ09SRV9USFJFU0hPTERTID0ge1xuICBFWENFTExFTlQ6IDAuOSxcbiAgR09PRDogMC43LFxuICBORUVEU19JTVBST1ZFTUVOVDogMC41XG59IGFzIGNvbnN0OyJdfQ==