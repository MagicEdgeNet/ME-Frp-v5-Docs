import { h } from 'vue'
import { RouterLink } from 'vue-router'
import { NIcon } from 'naive-ui'
import type { Component } from 'vue'
import type { MenuOption } from 'naive-ui'
import {
  AlertCircleOutline, AppsOutline, BookOutline, CodeSlashOutline, DesktopOutline,
  DocumentLockOutline, DocumentTextOutline, FolderOutline, GameControllerOutline,
  GlobeOutline, HelpCircleOutline, InformationCircleOutline, PersonOutline,
  PhonePortraitOutline, RocketOutline, ServerOutline, ShieldCheckmarkOutline,
  TerminalOutline, WifiOutline
} from '@vicons/ionicons5'
import { docGroups, docPath } from './docs'

const icons: Record<string, Component> = {
  AlertCircleOutline, AppsOutline, BookOutline, CodeSlashOutline, DesktopOutline,
  DocumentLockOutline, DocumentTextOutline, FolderOutline, GameControllerOutline,
  GlobeOutline, HelpCircleOutline, InformationCircleOutline, PersonOutline,
  PhonePortraitOutline, RocketOutline, ServerOutline, ShieldCheckmarkOutline,
  TerminalOutline, WifiOutline
}

const renderIcon = (name?: string) => () => h(NIcon, null, {
  default: () => h(icons[name || ''] || DocumentLockOutline)
})

export const docsMenuExpandedKeys = docGroups.filter(group => !group.standalone).map(group => group.id)

export function createDocsMenuOptions(onPageClick: () => void = () => {}): MenuOption[] {
  const pageOption = (page: (typeof docGroups)[number]['pages'][number]): MenuOption => ({
    key: page.path,
    label: () => h(RouterLink, { to: docPath(page.path), onClick: onPageClick }, { default: () => page.navTitle || page.title }),
    icon: renderIcon(page.icon)
  })

  return docGroups.map(group => group.standalone
    ? pageOption(group.pages[0])
    : {
      key: group.id,
      label: group.title,
      icon: renderIcon(group.icon),
      children: group.pages.map(pageOption)
    })
}

export const docsMenuActiveKey = (path: string) => path.replace(/^\/docs\//, '').replace(/\/$/, '')
