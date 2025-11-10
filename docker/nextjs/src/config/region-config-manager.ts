/**
 * リージョン設定管理システム
 * チャットボットUIのリージョンサポート強化機能
 */

// サポート対象リージョンの型定義
export type SupportedRegion = 
  | 'ap-northeast-1'  // 東京（プライマリ）
  | 'ap-northeast-3'  // 大阪（新規追加）
  | 'us-east-1'       // バージニア
  | 'us-west-2'       // オレゴン
  | 'eu-west-1';      // アイルランド

// リージョン情報インターフェース
export interface RegionInfo {
  code: SupportedRegion;
  name: string;
  nameJa: string;
  supported: boolean;
  bedrockSupported: boolean;
  availableModels: string[];
  description: string;
  isPrimary?: boolean;
  isNew?: boolean;
}

// リージョン選択オプション
export interface RegionSelectOption {
  value: SupportedRegion;
  label: string;
  labelJa: string;
  supported: boolean;
  bedrockSupported: boolean;
  modelCount: number;
  description: string;
  warningMessage?: string;
  isPrimary?: boolean;
  isNew?: boolean;
}

// サポート外リージョン情報
export interface UnsupportedRegionInfo {
  code: string;
  name: string;
  nameJa: string;
  supported: false;
  bedrockSupported: boolean;
  availableModels: string[];
  description: string;
  reason: string;
}

// リージョン検証結果の型定義
export const ValidationResult = {
  VALID: 'valid',
  UNSUPPORTED: 'unsupported',
  INVALID: 'invalid'
} as const;

export type ValidationResultType = typeof ValidationResult[keyof typeof ValidationResult];

// リージョン検証結果インターフェース
export interface RegionValidationResult {
  isValid: boolean;
  result: ValidationResultType;
  region: string;
  message: string;
  suggestedRegion?: SupportedRegion;
  fallbackRegion: SupportedRegion;
}

/**
 * リージョン設定管理クラス
 * サポート対象リージョンの定義、検証、情報取得機能を提供
 */
export class RegionConfigManager {
  // サポート対象リージョンの設定データ
  private static readonly REGION_CONFIG: Record<SupportedRegion, RegionInfo> = {
    'ap-northeast-1': {
      code: 'ap-northeast-1',
      name: 'Tokyo',
      nameJa: '東京',
      supported: true,
      bedrockSupported: true,
      availableModels: [
        'apac.amazon.nova-pro-v1:0',
        'apac.amazon.nova-lite-v1:0',
        'apac.anthropic.claude-3-5-sonnet-20241022-v2:0',
        'apac.anthropic.claude-3-sonnet-20240229-v1:0',
        'amazon.titan-embed-text-v2:0'
      ],
      description: 'アジアパシフィック（東京）- プライマリリージョン',
      isPrimary: true
    },
    'ap-northeast-3': {
      code: 'ap-northeast-3',
      name: 'Osaka',
      nameJa: '大阪',
      supported: true,
      bedrockSupported: true,
      availableModels: [
        'apac.amazon.nova-pro-v1:0',
        'apac.amazon.nova-lite-v1:0',
        'apac.anthropic.claude-3-sonnet-20240229-v1:0',
        'amazon.titan-embed-text-v2:0'
      ],
      description: 'アジアパシフィック（大阪）- 災害復旧・負荷分散対応',
      isNew: false
    },
    'us-east-1': {
      code: 'us-east-1',
      name: 'N. Virginia',
      nameJa: 'バージニア北部',
      supported: true,
      bedrockSupported: true,
      availableModels: [
        'amazon.nova-pro-v1:0',
        'amazon.nova-lite-v1:0',
        'anthropic.claude-3-5-sonnet-20241022-v2:0',
        'anthropic.claude-3-sonnet-20240229-v1:0',
        'anthropic.claude-3-haiku-20240307-v1:0',
        'meta.llama3-2-90b-instruct-v1:0',
        'mistral.mistral-large-2402-v1:0'
      ],
      description: '米国東部（バージニア北部）- 最多モデル対応'
    },
    'us-west-2': {
      code: 'us-west-2',
      name: 'Oregon',
      nameJa: 'オレゴン',
      supported: true,
      bedrockSupported: true,
      availableModels: [
        'amazon.nova-pro-v1:0',
        'amazon.nova-lite-v1:0',
        'anthropic.claude-3-5-sonnet-20241022-v2:0',
        'anthropic.claude-3-sonnet-20240229-v1:0'
      ],
      description: '米国西部（オレゴン）- 安定運用対応'
    },
    'eu-west-1': {
      code: 'eu-west-1',
      name: 'Ireland',
      nameJa: 'アイルランド',
      supported: true,
      bedrockSupported: true,
      availableModels: [
        'amazon.nova-pro-v1:0',
        'anthropic.claude-3-sonnet-20240229-v1:0',
        'amazon.titan-embed-text-v2:0'
      ],
      description: '欧州（アイルランド）- GDPR準拠'
    }
  };

  // サポート外リージョンの参考データ
  private static readonly UNSUPPORTED_REGIONS: Record<string, UnsupportedRegionInfo> = {
    'ap-south-1': {
      code: 'ap-south-1',
      name: 'Mumbai',
      nameJa: 'ムンバイ',
      supported: false,
      bedrockSupported: true,
      availableModels: [],
      description: 'アジアパシフィック（ムンバイ）- 現在サポート対象外',
      reason: '現在サポートされていません。将来的にサポート予定です。'
    },
    'ap-southeast-1': {
      code: 'ap-southeast-1',
      name: 'Singapore',
      nameJa: 'シンガポール',
      supported: false,
      bedrockSupported: true,
      availableModels: [],
      description: 'アジアパシフィック（シンガポール）- 現在サポート対象外',
      reason: '現在サポートされていません。将来的にサポート予定です。'
    },
    'ap-southeast-2': {
      code: 'ap-southeast-2',
      name: 'Sydney',
      nameJa: 'シドニー',
      supported: false,
      bedrockSupported: true,
      availableModels: [],
      description: 'アジアパシフィック（シドニー）- 現在サポート対象外',
      reason: '現在サポートされていません。将来的にサポート予定です。'
    },
    'eu-central-1': {
      code: 'eu-central-1',
      name: 'Frankfurt',
      nameJa: 'フランクフルト',
      supported: false,
      bedrockSupported: true,
      availableModels: [],
      description: '欧州（フランクフルト）- 現在サポート対象外',
      reason: '現在サポートされていません。将来的にサポート予定です。'
    },
    'eu-west-2': {
      code: 'eu-west-2',
      name: 'London',
      nameJa: 'ロンドン',
      supported: false,
      bedrockSupported: true,
      availableModels: [],
      description: '欧州（ロンドン）- 現在サポート対象外',
      reason: '現在サポートされていません。将来的にサポート予定です。'
    },
    'ca-central-1': {
      code: 'ca-central-1',
      name: 'Canada Central',
      nameJa: 'カナダ中部',
      supported: false,
      bedrockSupported: true,
      availableModels: [],
      description: 'カナダ（中部）- 現在サポート対象外',
      reason: '現在サポートされていません。将来的にサポート予定です。'
    }
  };

  // デフォルトリージョン（東京）
  private static readonly DEFAULT_REGION: SupportedRegion = 'ap-northeast-1';

  /**
   * サポート対象リージョン一覧を取得
   */
  public static getSupportedRegions(): SupportedRegion[] {
    return Object.keys(this.REGION_CONFIG) as SupportedRegion[];
  }

  /**
   * リージョンがサポート対象かどうかを確認
   */
  public static isRegionSupported(region: string): region is SupportedRegion {
    return region in this.REGION_CONFIG;
  }

  /**
   * リージョン情報を取得
   */
  public static getRegionInfo(region: string): RegionInfo | UnsupportedRegionInfo | null {
    // サポート対象リージョンの場合
    if (this.isRegionSupported(region)) {
      return this.REGION_CONFIG[region];
    }

    // サポート外リージョンの場合
    if (region in this.UNSUPPORTED_REGIONS) {
      return this.UNSUPPORTED_REGIONS[region];
    }

    // 未知のリージョンの場合
    return null;
  }

  /**
   * デフォルトリージョンを取得
   */
  public static getDefaultRegion(): SupportedRegion {
    return this.DEFAULT_REGION;
  }

  /**
   * プライマリリージョンを取得
   */
  public static getPrimaryRegion(): SupportedRegion {
    const primaryRegion = Object.entries(this.REGION_CONFIG)
      .find(([_, info]) => info.isPrimary)?.[0] as SupportedRegion;
    
    return primaryRegion || this.DEFAULT_REGION;
  }

  /**
   * 新規追加リージョン一覧を取得
   */
  public static getNewRegions(): SupportedRegion[] {
    return Object.entries(this.REGION_CONFIG)
      .filter(([_, info]) => info.isNew)
      .map(([code, _]) => code as SupportedRegion);
  }

  /**
   * リージョン選択オプションを生成
   */
  public static getRegionSelectOptions(): RegionSelectOption[] {
    const supportedOptions: RegionSelectOption[] = Object.values(this.REGION_CONFIG)
      .map(info => ({
        value: info.code,
        label: `${info.name} (${info.code})`,
        labelJa: `${info.nameJa} (${info.code})`,
        supported: info.supported,
        bedrockSupported: info.bedrockSupported,
        modelCount: info.availableModels.length,
        description: info.description,
        isPrimary: info.isPrimary,
        isNew: info.isNew
      }));

    const unsupportedOptions: RegionSelectOption[] = Object.values(this.UNSUPPORTED_REGIONS)
      .map(info => ({
        value: info.code as SupportedRegion, // 型キャストは選択不可のため問題なし
        label: `${info.name} (${info.code})`,
        labelJa: `${info.nameJa} (${info.code})`,
        supported: info.supported,
        bedrockSupported: info.bedrockSupported,
        modelCount: info.availableModels.length,
        description: info.description,
        warningMessage: info.reason
      }));

    return [...supportedOptions, ...unsupportedOptions];
  }

  /**
   * サポート対象リージョンのみの選択オプションを取得
   */
  public static getSupportedRegionSelectOptions(): RegionSelectOption[] {
    return this.getRegionSelectOptions().filter(option => option.supported);
  }

  /**
   * サポート外リージョンのみの選択オプションを取得
   */
  public static getUnsupportedRegionSelectOptions(): RegionSelectOption[] {
    return this.getRegionSelectOptions().filter(option => !option.supported);
  }

  /**
   * リージョンコードから表示名を取得
   */
  public static getRegionDisplayName(region: string, useJapanese: boolean = true): string {
    const info = this.getRegionInfo(region);
    if (!info) {
      return region;
    }

    const name = useJapanese ? info.nameJa : info.name;
    return `${name} (${region})`;
  }

  /**
   * リージョンの利用可能モデル数を取得
   */
  public static getRegionModelCount(region: string): number {
    const info = this.getRegionInfo(region);
    return info?.availableModels.length || 0;
  }

  /**
   * 全サポート対象リージョンの統計情報を取得
   */
  public static getRegionStatistics() {
    const supportedRegions = this.getSupportedRegions();
    const totalModels = new Set<string>();
    
    // 全リージョンの利用可能モデルを収集
    supportedRegions.forEach(region => {
      const info = this.REGION_CONFIG[region];
      info.availableModels.forEach(model => totalModels.add(model));
    });

    return {
      totalSupportedRegions: supportedRegions.length,
      totalUniqueModels: totalModels.size,
      primaryRegion: this.getPrimaryRegion(),
      newRegions: this.getNewRegions(),
      regionModelCounts: supportedRegions.map(region => ({
        region,
        modelCount: this.getRegionModelCount(region),
        displayName: this.getRegionDisplayName(region)
      }))
    };
  }

  // ===== リージョン検証機能 =====

  /**
   * リージョンサポート状況をチェック
   */
  public static validateRegion(region: string): RegionValidationResult {
    // 空文字列や null/undefined のチェック
    if (!region || typeof region !== 'string') {
      return {
        isValid: false,
        result: ValidationResult.INVALID,
        region: region || '',
        message: '無効なリージョンが指定されました。',
        fallbackRegion: this.getDefaultRegion()
      };
    }

    const trimmedRegion = region.trim();

    // サポート対象リージョンの場合
    if (this.isRegionSupported(trimmedRegion)) {
      const regionInfo = this.getRegionInfo(trimmedRegion) as RegionInfo;
      return {
        isValid: true,
        result: ValidationResult.VALID,
        region: trimmedRegion,
        message: `${regionInfo.nameJa}リージョンは正常にサポートされています。`,
        fallbackRegion: trimmedRegion as SupportedRegion
      };
    }

    // サポート外リージョンの場合
    if (trimmedRegion in this.UNSUPPORTED_REGIONS) {
      const regionInfo = this.UNSUPPORTED_REGIONS[trimmedRegion];
      return {
        isValid: false,
        result: ValidationResult.UNSUPPORTED,
        region: trimmedRegion,
        message: `${regionInfo.nameJa}リージョンは現在サポートされていません。${regionInfo.reason}`,
        suggestedRegion: this.getDefaultRegion(),
        fallbackRegion: this.getDefaultRegion()
      };
    }

    // 完全に未知のリージョンの場合
    return {
      isValid: false,
      result: ValidationResult.INVALID,
      region: trimmedRegion,
      message: `未知のリージョン「${trimmedRegion}」が指定されました。サポート対象リージョンを選択してください。`,
      suggestedRegion: this.getDefaultRegion(),
      fallbackRegion: this.getDefaultRegion()
    };
  }

  /**
   * 無効なリージョン指定時のエラーハンドリング
   */
  public static handleInvalidRegion(region: string, options?: {
    throwError?: boolean;
    logError?: boolean;
    returnFallback?: boolean;
  }): SupportedRegion {
    const opts = {
      throwError: false,
      logError: true,
      returnFallback: true,
      ...options
    };

    const validationResult = this.validateRegion(region);

    // ログ出力
    if (opts.logError) {
      if (validationResult.isValid) {
        console.log(`[RegionConfigManager] リージョン検証成功: ${validationResult.message}`);
      } else {
        console.warn(`[RegionConfigManager] リージョン検証失敗: ${validationResult.message}`);
        if (validationResult.suggestedRegion) {
          console.warn(`[RegionConfigManager] 推奨リージョン: ${this.getRegionDisplayName(validationResult.suggestedRegion)}`);
        }
      }
    }

    // エラーを投げる場合
    if (opts.throwError && !validationResult.isValid) {
      throw new Error(`リージョン検証エラー: ${validationResult.message}`);
    }

    // フォールバックを返す場合
    if (opts.returnFallback) {
      return validationResult.fallbackRegion;
    }

    // 有効な場合は元のリージョンを返す、無効な場合はデフォルトリージョンを返す
    return validationResult.isValid ? (region as SupportedRegion) : this.getDefaultRegion();
  }

  /**
   * デフォルトリージョン（東京）への自動フォールバック機能
   */
  public static getValidRegionWithFallback(region: string): {
    region: SupportedRegion;
    wasChanged: boolean;
    originalRegion: string;
    reason?: string;
  } {
    const validationResult = this.validateRegion(region);

    if (validationResult.isValid) {
      return {
        region: region as SupportedRegion,
        wasChanged: false,
        originalRegion: region
      };
    }

    return {
      region: validationResult.fallbackRegion,
      wasChanged: true,
      originalRegion: region,
      reason: validationResult.message
    };
  }

  /**
   * リージョン設定の安全な取得（フォールバック付き）
   */
  public static getSafeRegionConfig(region: string): {
    config: RegionInfo;
    wasChanged: boolean;
    originalRegion: string;
    warnings: string[];
  } {
    const warnings: string[] = [];
    const fallbackResult = this.getValidRegionWithFallback(region);

    if (fallbackResult.wasChanged) {
      warnings.push(`指定されたリージョン「${fallbackResult.originalRegion}」は無効です。`);
      warnings.push(`デフォルトリージョン「${this.getRegionDisplayName(fallbackResult.region)}」を使用します。`);
      if (fallbackResult.reason) {
        warnings.push(`理由: ${fallbackResult.reason}`);
      }
    }

    const config = this.getRegionInfo(fallbackResult.region) as RegionInfo;

    return {
      config,
      wasChanged: fallbackResult.wasChanged,
      originalRegion: fallbackResult.originalRegion,
      warnings
    };
  }

  /**
   * 複数リージョンの一括検証
   */
  public static validateMultipleRegions(regions: string[]): {
    valid: SupportedRegion[];
    invalid: string[];
    unsupported: string[];
    validationResults: RegionValidationResult[];
  } {
    const valid: SupportedRegion[] = [];
    const invalid: string[] = [];
    const unsupported: string[] = [];
    const validationResults: RegionValidationResult[] = [];

    regions.forEach(region => {
      const result = this.validateRegion(region);
      validationResults.push(result);

      switch (result.result) {
        case ValidationResult.VALID:
          valid.push(region as SupportedRegion);
          break;
        case ValidationResult.UNSUPPORTED:
          unsupported.push(region);
          break;
        case ValidationResult.INVALID:
          invalid.push(region);
          break;
      }
    });

    return {
      valid,
      invalid,
      unsupported,
      validationResults
    };
  }

  /**
   * リージョン検証のユーティリティ関数
   */
  public static getValidationSummary(region: string): string {
    const result = this.validateRegion(region);
    
    if (result.isValid) {
      const regionInfo = this.getRegionInfo(region) as RegionInfo;
      return `✅ ${regionInfo.nameJa} (${region}) - ${regionInfo.availableModels.length}個のモデルが利用可能`;
    } else {
      return `❌ ${result.message}`;
    }
  }
}