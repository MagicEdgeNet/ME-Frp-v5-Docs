# ME Frp 使用文档

[docs.mefrp.com](https://docs.mefrp.com/) 的独立文档站，使用 Vue 3、Naive UI、TypeScript 和 Vite。正文、导航和站点代码在同一仓库维护，不再依赖前端仓库或 Git submodule。

## 本地开发

需要 Node.js 24+ 和 pnpm 10+：

```bash
pnpm install
pnpm run dev
```

打开终端输出的地址。`/` 自动进入文档首页，保留 `/docs/...` 路径兼容原文档内链。

```bash
pnpm test                 # 内容校验、Markdown/SEO/加载状态单测
pnpm run typecheck
pnpm run build            # 类型检查与静态构建
pnpm run test:build       # 检查生成的 HTML 和 sitemap
pnpm run preview          # 生产产物预览
```

浏览器验收需要已安装的 Chrome/Chromium：

```bash
MEFRP_PREVIEW_ORIGIN=http://127.0.0.1:4173 pnpm run test:browser
MEFRP_PREVIEW_ORIGIN=http://127.0.0.1:4173 node tests/acceptance/pull-to-refresh.browser.cjs
```

浏览器可用 `MEFRP_BROWSER_EXECUTABLE` 指定，默认 `/opt/google/chrome/chrome`。请先运行 `pnpm run build` 并启动预览。

## 目录

- `manifest.json`：分组、导航顺序、标题、摘要、入口、重定向和目录层级。
- `pages/`：Markdown 正文；`pages/usage/common.md` 对应 `/docs/usage/common`。
- `assets/`：文档图片及附件，经 `/docs-assets/文件名` 引用。
- `src/`：文档布局、导航、Markdown 渲染、主题、图片预览、代码/表格组件和下拉刷新。
- `scripts/check.mjs`：无第三方依赖的内容结构检查。
- `scripts/docs-content.mjs`、`scripts/docs-plugin.mjs`：Markdown 校验、编译与静态站点生成。
- `tests/`：单元测试与浏览器验收。

## 功能与部署

保留桌面可折叠侧栏、悬浮目录、移动导航与目录抽屉、深浅色主题、代码复制、图片缩放/旋转/下载、表格滚动、返回顶部及主内容下拉刷新。首次直接访问显示品牌动画，浏览器刷新不重播。主题偏好独立保存，不读取主站账户状态。

`pnpm run build` 输出 `dist/`：每篇文档包含无需 JavaScript 即可阅读的静态 HTML、SEO 元数据、JSON-LD、JSON 数据与 Markdown 源文件，生成仅包含文档的 sitemap。部署域名为 `https://docs.mefrp.com`。根路径也输出静态首页内容。

将 `dist/` 部署到静态托管服务；应优先返回文档目录下的 `index.html`，再做 SPA fallback，避免直接访问深层文档时丢失静态正文。不要求使用 Nginx，也没有服务器端跨站重定向规则。DNS、TLS 及线上发布需由部署环境配置，此仓库不会自动修改主站部署。

首页、管理面板及正文中的账户/面板链接指向 `https://www.mefrp.com`；独立站没有登录、账户 API 或依赖登录态的广告弹窗。主前端内原有文档站本次未删除，待独立站上线后再决定主站重定向策略。

## 新增或调整文档

在 `pages/` 新增 Markdown，并登记到 `manifest.json`；分组和页面数组的顺序即侧栏与上下篇顺序。`title` 为路由标题，`navTitle` 可单独指定导航名称，正文标题不会被覆盖。

目录从 Markdown 标题自动生成，层级可通过 `toc.minDepth` / `toc.maxDepth` 配置。尽量保留 `path`；修改路径时在 `redirects` 中登记旧路径。`unlisted` 用于维护者参考页；`index: false` 页面不会加入 sitemap 和上下篇序列。

详细约定见 [贡献指南](CONTRIBUTING.md)。

## License

本仓库的代码采用 [MIT License](LICENSE)。

除非特别说明，本仓库中的原创文档内容采用：

Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International

完整协议请参阅：

https://creativecommons.org/licenses/by-nc-sa/4.0/

## 内容来源

初始内容迁自 `MagicEdgeNet/ME-Frp-v5-Frontend` 的 `public/_docs`。独立站界面和渲染实现迁自该前端的 `32acb68` 提交。第三方内容及资源遵循其各自的许可和署名要求。请只提交有权分发的内容和图片，保留必要署名；不要提交账户凭据、Token 或未经打码的个人信息。
