import type { ComputedRef, Ref } from 'vue'
import type { GlobalTheme } from 'naive-ui'

export type ThemeMode = 'system' | 'light' | 'dark'

export interface ThemeContext {
  isDarkMode: Ref<boolean> | ComputedRef<boolean>
  mode: Ref<ThemeMode>
  theme: ComputedRef<GlobalTheme | null>
  setMode: (mode: ThemeMode) => void
}

export const THEME_KEY = 'theme' as const
