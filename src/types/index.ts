import type { MessageApi, LoadingBarApi } from 'naive-ui'

export interface Window extends globalThis.Window {
  $message?: MessageApi
  $loadingBar?: LoadingBarApi
  __tableParsingTested?: boolean
  __manualTableTested?: boolean
}

declare global {
  interface Window {
    $message?: MessageApi
    $loadingBar?: LoadingBarApi
    __tableParsingTested?: boolean
    __manualTableTested?: boolean
  }
}
