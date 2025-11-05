// AWS SDK v3を使用（Node.js 20.x対応）
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

// DynamoDB設定（パフォーマンス最適化）
const client = new DynamoDBClient({
    region: CONFIG.AWS_REGION,
    maxAttempts: 3,
    requestTimeout: 5000,
    // 接続プールの最適化
    maxSockets: 50
});
const dynamodb = DynamoDBDocumentClient.from(client, {
    marshallOptions: {
        removeUndefinedValues: true,
        convertEmptyValues: false
    }
});

// 権限キャッシュ（メモリ内キャッシュ）
const permissionCache = new Map();
const CACHE_TTL = CONFIG.CACHE_TTL_MINUTES * 60 * 1000;

// 環境変数と設定
const CONFIG = {
    PERMISSION_TABLE: process.env.PERMISSION_TABLE || 'TokyoRegion-permission-aware-rag-prod-PermissionConfig',
    AUDIT_TABLE: process.env.AUDIT_TABLE || 'TokyoRegion-permission-aware-rag-prod-AuditLogs',
    AWS_REGION: process.env.AWS_REGION || 'ap-northeast-1',
    LOG_LEVEL: process.env.LOG_LEVEL || 'INFO',
    CACHE_TTL_MINUTES: parseInt(process.env.CACHE_TTL_MINUTES) || 5,
    MAX_CACHE_SIZE: parseInt(process.env.MAX_CACHE_SIZE) || 1000
};

// ログレベル設定
const LOG_LEVELS = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
};

const currentLogLevel = LOG_LEVELS[CONFIG.LOG_LEVEL] || LOG_LEVELS.INFO;

/**
 * 権限フィルタリング Lambda 関数
 * ユーザーの権限レベルに基づいてアクセス制御を実行
 */
export const handler = async (event) => {
    console.log('受信イベント:', JSON.stringify(event, null, 2));
    
    try {
        // イベントの解析と入力値検証
        const body = parseEventBody(event);
        const { userId, action, resourceType, resourceId } = body;
        
        // 入力値検証の強化
        const validationResult = validateInput({ userId, action, resourceType, resourceId });
        if (!validationResult.isValid) {
            return createResponse(400, { error: validationResult.error });
        }
        
        if (!userId) {
            return createResponse(400, { error: 'ユーザーIDが必要です' });
        }
        
        // ユーザー権限の取得（キャッシュ対応）
        const userPermissions = await getUserPermissionsWithCache(userId);
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
 * ユーザー権限の取得（セキュリティ強化版）
 */
async function getUserPermissions(userId) {
    try {
        // レート制限チェック
        if (await isRateLimited(userId)) {
            throw new Error('レート制限に達しました');
        }
        
        const command = new GetCommand({
            TableName: CONFIG.PERMISSION_TABLE,
            Key: {
                userId: userId,
                resourceType: 'user-profile'
            }
        });
        
        const result = await dynamodb.send(command);
        
        // ユーザーの有効性チェック
        if (result.Item && result.Item.isActive === false) {
            console.warn(`無効なユーザーのアクセス試行: ${userId}`);
            return null;
        }
        
        return result.Item;
    } catch (error) {
        console.error('ユーザー権限取得エラー:', error);
        // セキュリティ上の理由で詳細なエラー情報は返さない
        return null;
    }
}

/**
 * キャッシュ対応ユーザー権限取得
 */
async function getUserPermissionsWithCache(userId) {
    const cacheKey = `user_permissions_${userId}`;
    const cached = permissionCache.get(cacheKey);
    
    // キャッシュヒット確認
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
        return cached.data;
    }
    
    // キャッシュミス時はDBから取得
    const permissions = await getUserPermissions(userId);
    
    // キャッシュに保存
    if (permissions) {
        permissionCache.set(cacheKey, {
            data: permissions,
            timestamp: Date.now()
        });
        
        // キャッシュサイズ制限（メモリリーク防止）
        if (permissionCache.size > CONFIG.MAX_CACHE_SIZE) {
            const firstKey = permissionCache.keys().next().value;
            permissionCache.delete(firstKey);
        }
    }
    
    return permissions;
}

/**
 * レート制限チェック（簡易実装）
 */
async function isRateLimited(userId) {
    // 実装例：DynamoDBまたはElastiCacheでレート制限を管理
    // ここでは簡易的にfalseを返す
    return false;
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
 * 構造化ログ出力
 */
function logMessage(level, message, metadata = {}) {
    if (LOG_LEVELS[level] <= currentLogLevel) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level: level,
            message: message,
            ...metadata
        };
        console.log(JSON.stringify(logEntry));
    }
}

/**
 * 監査ログの記録（強化版）
 */
async function logAuditEvent(userId, action, resource, result, details, additionalMetadata = {}) {
    try {
        const auditItem = {
            userId: userId,
            timestamp: new Date().toISOString(),
            action: action || 'unknown',
            resource: resource || 'unknown',
            result: result,
            details: details,
            ipAddress: 'lambda-internal',
            userAgent: 'permission-filter-lambda',
            riskScore: calculateRiskScore(result, action, additionalMetadata),
            // TTL設定（90日後に自動削除）
            ttl: Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60),
            ...additionalMetadata
        };

        const command = new PutCommand({
            TableName: CONFIG.AUDIT_TABLE,
            Item: auditItem
        });
        
        await dynamodb.send(command);
        
        logMessage('INFO', '監査ログ記録完了', { userId, action, result });
    } catch (error) {
        logMessage('ERROR', '監査ログ記録エラー', { error: error.message, userId, action });
    }
}

/**
 * リスクスコア計算
 */
function calculateRiskScore(result, action, metadata) {
    let baseScore = result === 'DENIED' ? 5 : 1;
    
    // アクション別リスク調整
    const highRiskActions = ['system-management', 'user-management'];
    if (highRiskActions.includes(action)) {
        baseScore += 2;
    }
    
    // 追加のリスク要因
    if (metadata.suspiciousActivity) {
        baseScore += 3;
    }
    
    return Math.min(baseScore, 10); // 最大10点
}

/**
 * イベントボディの解析
 */
function parseEventBody(event) {
    if (typeof event.body === 'string') {
        try {
            return JSON.parse(event.body);
        } catch (error) {
            throw new Error('無効なJSONフォーマット');
        }
    }
    return event.body || event;
}

/**
 * 入力値検証
 */
function validateInput({ userId, action, resourceType, resourceId }) {
    // ユーザーID検証
    if (!userId || typeof userId !== 'string' || userId.length > 100) {
        return { isValid: false, error: 'ユーザーIDが無効です（1-100文字の文字列が必要）' };
    }
    
    // SQLインジェクション・XSS攻撃防止
    const dangerousPatterns = /[<>'";&|`$(){}[\]\\]/;
    if (dangerousPatterns.test(userId)) {
        return { isValid: false, error: 'ユーザーIDに不正な文字が含まれています' };
    }
    
    // アクション検証
    const allowedActions = ['test', 'bedrock-chat', 'document-access', 'system-management', 'user-management'];
    if (action && !allowedActions.includes(action)) {
        return { isValid: false, error: '許可されていないアクションです' };
    }
    
    return { isValid: true };
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