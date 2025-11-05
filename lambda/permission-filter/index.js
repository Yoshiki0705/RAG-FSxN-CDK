// Node.js 20.x用 - CommonJS形式でAWS SDK v3を使用
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');

// DynamoDB設定
const client = new DynamoDBClient({
    region: process.env.AWS_REGION || 'ap-northeast-1'
});
const dynamodb = DynamoDBDocumentClient.from(client);

// 環境変数
const PERMISSION_TABLE = process.env.PERMISSION_TABLE || 'TokyoRegion-permission-aware-rag-prod-PermissionConfig';
const AUDIT_TABLE = process.env.AUDIT_TABLE || 'TokyoRegion-permission-aware-rag-prod-AuditLogs';

/**
 * 権限フィルタリング Lambda 関数
 * ユーザーの権限レベルに基づいてアクセス制御を実行
 */
exports.handler = async (event) => {
    console.log('受信イベント:', JSON.stringify(event, null, 2));
    
    try {
        // イベントの解析
        let body;
        if (typeof event.body === 'string') {
            body = JSON.parse(event.body);
        } else {
            body = event.body || event;
        }
        
        const { userId, action, resourceType, resourceId } = body;
        
        if (!userId) {
            return createResponse(400, { error: 'ユーザーIDが必要です' });
        }
        
        // ユーザー権限の取得
        const userPermissions = await getUserPermissions(userId);
        if (!userPermissions) {
            await logAuditEvent(userId, action, resourceType, 'DENIED', 'ユーザーが見つかりません');
            return createResponse(403, { error: 'ユーザーが見つかりません' });
        }
        
        // アクションに基づく権限チェック
        const isAllowed = checkPermission(userPermissions, action, resourceType, resourceId);
        
        // 監査ログの記録
        await logAuditEvent(userId, action, resourceType, isAllowed ? 'ALLOWED' : 'DENIED', 
                           isAllowed ? '成功' : '権限不足');
        
        if (isAllowed) {
            return createResponse(200, {
                allowed: true,
                userPermissions: {
                    userId: userPermissions.userId,
                    permissionLevel: userPermissions.permissionLevel,
                    displayName: userPermissions.displayName,
                    department: userPermissions.department,
                    role: userPermissions.role
                },
                message: 'アクセス許可'
            });
        } else {
            return createResponse(403, {
                allowed: false,
                message: 'アクセス拒否: 権限が不足しています'
            });
        }
        
    } catch (error) {
        console.error('エラー:', error);
        return createResponse(500, { 
            error: 'サーバーエラーが発生しました',
            details: error.message 
        });
    }
};

/**
 * ユーザー権限の取得
 */
async function getUserPermissions(userId) {
    try {
        const command = new GetCommand({
            TableName: PERMISSION_TABLE,
            Key: {
                userId: userId,
                resourceType: 'user-profile'
            }
        });
        
        const result = await dynamodb.send(command);
        return result.Item;
    } catch (error) {
        console.error('ユーザー権限取得エラー:', error);
        return null;
    }
}

/**
 * 権限チェック
 */
function checkPermission(userPermissions, action, resourceType, resourceId) {
    const permissionLevel = userPermissions.permissionLevel;
    const permissions = userPermissions.permissions ? userPermissions.permissions.split(',') : [];
    
    // 基本的な権限チェック
    switch (action) {
        case 'test':
            return true; // テストアクションは常に許可
            
        case 'bedrock-chat':
            return checkBedrockPermission(permissionLevel, permissions);
            
        case 'document-access':
            return checkDocumentPermission(permissionLevel, permissions, resourceId);
            
        case 'system-management':
            return checkSystemPermission(permissionLevel, permissions);
            
        case 'user-management':
            return checkUserManagementPermission(permissionLevel, permissions);
            
        default:
            return permissions.includes('basic'); // 基本権限があれば許可
    }
}

/**
 * Bedrock チャット権限チェック
 */
function checkBedrockPermission(permissionLevel, permissions) {
    const allowedLevels = ['admin', 'emergency', 'security', 'system', 'project', 'basic'];
    return allowedLevels.includes(permissionLevel);
}

/**
 * 文書アクセス権限チェック
 */
function checkDocumentPermission(permissionLevel, permissions, resourceId) {
    const adminLevels = ['admin', 'emergency', 'security', 'system'];
    
    if (adminLevels.includes(permissionLevel)) {
        return true; // 管理者レベルは全文書アクセス可能
    }
    
    // プロジェクトレベルの場合、プロジェクト固有の文書のみ
    if (permissionLevel === 'project') {
        return resourceId && (
            resourceId.startsWith('/shared') ||
            resourceId.startsWith('/public') ||
            resourceId.startsWith('/projects/')
        );
    }
    
    // 基本レベルの場合、共有・公開文書のみ
    if (permissionLevel === 'basic') {
        return resourceId && (
            resourceId.startsWith('/shared') ||
            resourceId.startsWith('/public')
        );
    }
    
    return false;
}

/**
 * システム管理権限チェック
 */
function checkSystemPermission(permissionLevel, permissions) {
    return ['admin', 'system'].includes(permissionLevel);
}

/**
 * ユーザー管理権限チェック
 */
function checkUserManagementPermission(permissionLevel, permissions) {
    return ['admin', 'security', 'system'].includes(permissionLevel);
}

/**
 * 監査ログの記録
 */
async function logAuditEvent(userId, action, resource, result, details) {
    try {
        const command = new PutCommand({
            TableName: AUDIT_TABLE,
            Item: {
                userId: userId,
                timestamp: new Date().toISOString(),
                action: action || 'unknown',
                resource: resource || 'unknown',
                result: result,
                details: details,
                ipAddress: 'lambda-internal',
                userAgent: 'permission-filter-lambda',
                riskScore: result === 'DENIED' ? 5 : 1
            }
        });
        
        await dynamodb.send(command);
    } catch (error) {
        console.error('監査ログ記録エラー:', error);
    }
}

/**
 * レスポンス作成
 */
function createResponse(statusCode, body) {
    return {
        statusCode: statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        body: JSON.stringify(body, null, 2)
    };
}