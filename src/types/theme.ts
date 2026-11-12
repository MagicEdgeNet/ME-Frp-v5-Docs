import type { Ref, ComputedRef } from 'vue'
import type { GlobalTheme } from 'naive-ui'

export interface ThemeContext {
  isDarkMode: Ref<boolean>
  theme: ComputedRef<GlobalTheme | null>
  toggleTheme: () => void
}

export const THEME_KEY = 'theme' as const
