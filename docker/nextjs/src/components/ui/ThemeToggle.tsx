'use client';

/**
 * テーマ切り替えコンポーネント
 * ライト/ダーク/システムテーマの切り替えUI
 */

import { Moon, Sun, Monitor } from 'lucide-react';
import { useThemeStore } from '@/store/useThemeStore';
import { ThemeMode } from '@/types/theme';

interface ThemeToggleProps {
  variant?: 'icon' | 'dropdown';
  className?: string;
}

/**
 * テーマトグルボタン
 */
export function ThemeToggle({ variant = 'icon', className = '' }: ThemeToggleProps) {
  const { theme, effectiveTheme, setTheme } = useThemeStore();

  if (variant === 'icon') {
    return (
      <button
        onClick={() => {
          const currentEffective = effectiveTheme;
          const newTheme: ThemeMode = currentEffective === 'light' ? 'dark' : 'light';
          setTheme(newTheme);
        }}
        className={`p-2 rounded-lg hover:bg-accent transition-colors ${className}`}
        aria-label="テーマを切り替え"
        title={`現在: ${effectiveTheme === 'light' ? 'ライトモード' : 'ダークモード'}`}
      >
        {effectiveTheme === 'light' ? (
          <Sun className="h-5 w-5" />
        ) : (
          <Moon className="h-5 w-5" />
        )}
      </button>
    );
  }

  return (
    <div className={`flex gap-1 p-1 bg-muted rounded-lg ${className}`}>
      <button
        onClick={() => setTheme('light')}
        className={`p-2 rounded-md transition-colors ${
          theme === 'light'
            ? 'bg-background shadow-sm'
            : 'hover:bg-background/50'
        }`}
        aria-label="ライトモード"
        title="ライトモード"
      >
        <Sun className="h-4 w-4" />
      </button>
      <button
        onClick={() => setTheme('dark')}
        className={`p-2 rounded-md transition-colors ${
          theme === 'dark'
            ? 'bg-background shadow-sm'
            : 'hover:bg-background/50'
        }`}
        aria-label="ダークモード"
        title="ダークモード"
      >
        <Moon className="h-4 w-4" />
      </button>
      <button
        onClick={() => setTheme('system')}
        className={`p-2 rounded-md transition-colors ${
          theme === 'system'
            ? 'bg-background shadow-sm'
            : 'hover:bg-background/50'
        }`}
        aria-label="システム設定"
        title="システム設定"
      >
        <Monitor className="h-4 w-4" />
      </button>
    </div>
  );
}
