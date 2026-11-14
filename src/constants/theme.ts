import type { GlobalThemeOverrides } from 'naive-ui'
const baseFont = { fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif', borderRadius: '7px', primaryColor: '#1d4ed8', primaryColorHover: '#1742b5', primaryColorPressed: '#153a9b', primaryColorSuppl: '#1546a0' }
export const getExemptedTheme = (): GlobalThemeOverrides => ({ common: baseFont })
export const workbenchPalette = {
  light: {
    canvas: '#f5f7fa',
    surface: '#ffffff',
    surfaceMuted: '#eef2f6',
    ink: '#111827',
    muted: '#475569',
    faint: '#596579',
    line: '#c7d0dc',
    lineStrong: '#9aa8ba',
    accent: '#1d4ed8',
    accentSoft: '#e5edff'
  },
  dark: {
    canvas: '#0f141c',
    surface: '#151c26',
    surfaceMuted: '#1c2633',
    ink: '#f5f7fb',
    muted: '#c3ccd7',
    faint: '#a9b6c5',
    line: '#334155',
    lineStrong: '#475569',
    accent: '#8ab8ff',
    accentSoft: '#1d3151'
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


export const exemptedSwc = ({ focused, checked }: { focused: boolean; checked: boolean }) => ({ background: checked ? '#2196f3' : undefined, boxShadow: focused ? '0 0 0 2px #90caf9' : undefined })
