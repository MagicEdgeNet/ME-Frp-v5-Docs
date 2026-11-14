import type { GlobalThemeOverrides } from 'naive-ui'
const baseFont = { fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif', borderRadius: '7px', primaryColor: '#111111', primaryColorHover: '#333333', primaryColorPressed: '#000000', primaryColorSuppl: '#666666' }
export const getExemptedTheme = (): GlobalThemeOverrides => ({ common: baseFont })
export const workbenchPalette = {
  light: {
    canvas: '#f5f5f5',
    surface: '#ffffff',
    surfaceMuted: '#eeeeee',
    ink: '#111111',
    muted: '#555555',
    faint: '#777777',
    line: '#d4d4d4',
    lineStrong: '#a3a3a3',
    accent: '#111111',
    accentSoft: '#e5e5e5'
  },
  dark: {
    canvas: '#111111',
    surface: '#1a1a1a',
    surfaceMuted: '#242424',
    ink: '#ffffff',
    muted: '#d4d4d4',
    faint: '#a3a3a3',
    line: '#404040',
    lineStrong: '#666666',
    accent: '#ffffff',
    accentSoft: '#333333'
  }
} as const

export function getWorkbenchThemeOverrides(isDark: boolean): GlobalThemeOverrides {
  const palette = isDark ? workbenchPalette.dark : workbenchPalette.light
  return {
    common: {
      ...baseFont,
      bodyColor: palette.canvas,
      cardColor: palette.surface,
      modalColor: palette.surface,
      popoverColor: palette.surface,
      tableColor: palette.surface,
      tableHeaderColor: palette.surfaceMuted,
      actionColor: palette.surfaceMuted,
      borderColor: palette.line,
      dividerColor: palette.line,
      textColorBase: palette.ink,
      textColor1: palette.ink,
      textColor2: palette.muted,
      textColor3: palette.faint
    },
    Alert: {
      titleTextColor: palette.ink,
      contentTextColor: palette.muted,
      titleTextColorInfo: palette.ink,
      contentTextColorInfo: palette.muted,
      titleTextColorSuccess: palette.ink,
      contentTextColorSuccess: palette.muted,
      titleTextColorWarning: palette.ink,
      contentTextColorWarning: palette.muted,
      titleTextColorError: palette.ink,
      contentTextColorError: palette.muted
    },
    BackTop: {
      color: palette.surface,
      textColor: palette.ink,
      iconColor: palette.ink,
      iconColorHover: palette.ink,
      iconColorPressed: palette.ink,
      width: '40px',
      height: '40px'
    }
  }
}


export const exemptedSwc = ({ focused, checked }: { focused: boolean; checked: boolean }) => ({ background: checked ? '#111111' : undefined, boxShadow: focused ? '0 0 0 2px #777777' : undefined })
