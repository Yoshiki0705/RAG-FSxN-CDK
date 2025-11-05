const AWS = require('aws-sdk');

exports.handler = async (event) => {
    console.log('高度権限制御チェック開始:', JSON.stringify(event, null, 2));
    
    try {
        const { userId, ipAddress, userAgent, timestamp, requestedResource } = event;
        
        // 現在時刻チェック
        const currentTime = new Date();
        const currentHour = currentTime.getHours();
        const currentDay = currentTime.getDay(); // 0=日曜日, 1=月曜日, ...
        
        // 営業時間チェック（平日 9:00-18:00）
        const isBusinessHours = (currentDay >= 1 && currentDay <= 5) && (currentHour >= 9 && currentHour < 18);
        const isEmergencyUser = ['admin001', 'emergency001', 'security_admin', 'system_admin'].includes(userId);
        
        // 地理的制限チェック（簡易版）
        const isAllowedIP = ipAddress.startsWith('127.0.0.1') || 
                           ipAddress.startsWith('::1') ||
                           ipAddress.startsWith('192.168.') ||
                           ipAddress.startsWith('10.0.') ||
                           ipAddress.startsWith('172.16.') ||
                           ipAddress.startsWith('203.0.113.') ||
                           ipAddress.startsWith('198.51.100.') ||
                           ipAddress.startsWith('192.0.2.');
        
        // 動的権限チェック
        const hasProjectAccess = ['admin001', 'project_alpha_user', 'project_beta_user'].includes(userId);
        
        let allowed = true;
        let reason = '';
        const restrictions = {
            timeBasedRestriction: false,
            geographicRestriction: false,
            dynamicPermissionDenied: false
        };
        
        // 時間制限チェック
        if (!isBusinessHours && !isEmergencyUser) {
            allowed = false;
            reason = '営業時間外のアクセスです。緊急時アクセス権限が必要です。';
            restrictions.timeBasedRestriction = true;
        }
        
        // 地理的制限チェック
        if (!isAllowedIP && !isEmergencyUser) {
            allowed = false;
            reason = '許可されていない地域からのアクセスです。';
            restrictions.geographicRestriction = true;
        }
        
        // 動的権限チェック
        if (!hasProjectAccess && requestedResource.includes('confidential')) {
            allowed = false;
            reason = 'このリソースへのアクセス権限がありません。';
            restrictions.dynamicPermissionDenied = true;
        }
        
        const auditLog = {
            accessAttempt: true,
            timestamp: currentTime.toISOString(),
            result: allowed ? 'ALLOWED' : 'DENIED',
            reason: allowed ? 'アクセス許可' : reason
        };
        
        console.log('権限チェック結果:', { allowed, reason, restrictions, auditLog });
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                allowed,
                reason: allowed ? undefined : reason,
                restrictions: allowed ? undefined : restrictions,
                auditLog
            })
        };
        
    } catch (error) {
        console.error('権限チェックエラー:', error);
        
        return {
            statusCode: 500,
            body: JSON.stringify({
                allowed: false,
                reason: 'システムエラー: 権限チェックに失敗しました',
                auditLog: {
                    accessAttempt: true,
                    timestamp: new Date().toISOString(),
                    result: 'DENIED',
                    reason: `システムエラー: ${error.message}`
                }
            })
        };
    }
};
