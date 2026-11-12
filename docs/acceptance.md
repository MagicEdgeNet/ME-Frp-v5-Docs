# 独立文档站本地验收记录

验收日期：2026-11-11。范围：Docs 的 `feat/standalone-docs` 工作区以及主前端 `feat/autoTLS-and-security` 的文档入口兼容。结果对应 Docs `feat/standalone-docs` 与官网 `feat/autoTLS-and-security` 已推送的当前提交，不代表线上发布状态。

## 环境与结果

- Node.js 24.22.2、pnpm 10.32.1；Chrome/Chromium 使用 `/opt/google/chrome/chrome`，Playwright Core 驱动。
- `pnpm install --frozen-lockfile` 通过，不需要前端仓库或 submodule。
- `pnpm run build` 通过，包含 `vue-tsc --noEmit`。
- `MEFRP_CHECK_DIST=1 node --test tests/unit/*.test.*`：19 项全部通过、无跳过。
- 内容校验：22 篇正文、5 个分组。`pages/`、`assets/`、`manifest.json` 与当前已提交基线无修改。
- 生产预览浏览器验收及 CDP 触摸验收通过，无 pageerror。
- 逐页打开全部 22 篇的增强页面，正文加载与标题正确，无同源 HTTP 失败。
- 全部 22 篇禁用 JavaScript 后正文可读、canonical 指向 docs.mefrp.com；根页面也可读。

## 已覆盖

- 桌面侧栏展开/收起、22px 图标、目录顺序、上下篇、右侧悬浮目录。
- 移动导航、菜单内部滚动、横屏边界、目录抽屉及遮罩层级、Escape/点击遮罩关闭。
- Markdown 提示框、语义 HTML、行内代码、代码复制、代码语言标签、宽表格内部滚动。
- 图片预览、旋转、缩放、重置、实际下载事件；跨域读取失败时打开原图并显示提示。
- 主题切换及刷新后偏好保存。
- 首次直接访问播放品牌动画，刷新和下拉刷新不重播。
- 真实触摸：达到阈值后刷新；短拉、横向、取消、嵌套滚动、非顶部不误刷新。
- 根入口、旧 questions 别名保留查询及锚点、直接访问标题锚点、未知文档 404。
- canonical、description、Open Graph、JSON-LD、sitemap；非索引维护页不进入 sitemap。
- 正文面板/账户链接指向主站；站点不请求面板 API。

## 官网兼容

- 所有已发现的使用文档入口改为独立域名；首页、登录页、移动菜单、面板顶部帮助菜单及关于页通过浏览器验收。
- 旧 `/docs`、`/docs/*` 纯前端检测并 `location.replace`，路径、查询、锚点保留，未知新路径同样转交。
- 测试确认主站旧路径响应为 HTML 且没有 HTTP Location 头；移除 Nginx 示例和服务器端 308 中间件。
- 既覆盖 SPA 路由，也覆盖生成的静态跳转页；主站单测和构建产物检查 20 项全部通过。
- 托管平台仍需支持原有 SPA fallback；前端无法处理服务器在应用加载前直接返回的 404。

## 未完成/限制

- 迁移与主站跳转代码已分别提交并推送：Docs `fb9ed1e` / `c60afb0`，官网 `9ea898b` / `d2ccdc8`。
- 尚未进行线上部署、DNS/TLS 配置或公开域名可用性验收；GitHub Actions 配置已更新，但尚未在远端执行。
- 图片使用本地网络拦截夹具验证交互，未验收第三方图床的真实可用性/CORS 策略。
- 未在实体手机或真实 Safari 上验收。
- 主包约 866 KB（gzip 约 256 KB），构建有超过 500 KB 的体积提示；不影响当前构建与功能验收，可后续拆包优化。
- 主站与文档站应协调发布，先确保独立站可用，再发布主站新入口和跳转。

## 复验命令

```bash
pnpm install --frozen-lockfile
pnpm test
pnpm run build
MEFRP_CHECK_DIST=1 node --test tests/unit/*.test.*
pnpm exec vite preview --host 127.0.0.1 --port 4190
# 另一个终端
MEFRP_PREVIEW_ORIGIN=http://127.0.0.1:4190 pnpm run test:browser
MEFRP_PREVIEW_ORIGIN=http://127.0.0.1:4190 node tests/acceptance/pull-to-refresh.browser.cjs
```
