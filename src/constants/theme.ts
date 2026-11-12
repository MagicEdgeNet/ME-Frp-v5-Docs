import type { GlobalThemeOverrides } from 'naive-ui'
const baseFont = { fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif', borderRadius: '7px', primaryColor: '#2196f3', primaryColorHover: '#42a5f5', primaryColorPressed: '#1976d2', primaryColorSuppl: '#90caf9' }
export const getExemptedTheme = (): GlobalThemeOverrides => ({ common: baseFont })
export const workbenchPalette = {
  light: {
    canvas: '#f5f7fa',
    surface: '#ffffff',
    surfaceMuted: '#eef2f6',
    ink: '#162235',
    muted: '#667085',
    faint: '#98a2b3',
    line: '#dce2e9',
    lineStrong: '#c5ced9',
    accent: '#2563eb',
    accentSoft: '#e7efff'
  },
  dark: {
    canvas: '#0f141c',
    surface: '#151c26',
    surfaceMuted: '#1c2633',
    ink: '#f3f6fa',
    muted: '#a7b2c1',
    faint: '#758294',
    line: '#2a3645',
    lineStrong: '#3a4a5e',
    accent: '#72a7ff',
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
      // 只强化一级文字（用首页的 --ink），二三级文字仍用 naive 默认值，
      // 避免暗色下次要文字被压暗、整体观感发灰
      textColorBase: palette.ink,
      textColor1: palette.ink
    }
  }
}


export const exemptedSwc = ({ focused, checked }: { focused: boolean; checked: boolean }) => ({ background: checked ? '#2196f3' : undefined, boxShadow: focused ? '0 0 0 2px #90caf9' : undefined })
