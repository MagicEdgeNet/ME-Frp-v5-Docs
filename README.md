# ME Frp 社区文档

这里维护 [幻缘映射使用文档](https://www.mefrp.com/docs/) 的正文、目录、顺序、页面元数据和资源。此仓库是内容仓库，不是独立文档站；前端通过 Git submodule 固定引用一个经过审核的提交。

## 目录

- `manifest.json`：文档分组、侧栏顺序、页面标题、摘要、入口、旧路径重定向和页内目录层级。
- `pages/`：Markdown 正文，路径与现有 `/docs/...` URL 对应。
- `assets/`：文档专用图片与附件。通过 `/docs-assets/文件名` 引用。历史正文中的外部图床链接暂时保留，可在后续贡献中逐步本地化。
- `scripts/check.mjs`：不需要安装依赖的内容结构检查。
- `CONTRIBUTING.md`：投稿、格式和本地预览说明。

## 新增或调整文档

1. 在 `pages/` 新增 Markdown，例如 `pages/usage/example.md`。
2. 在 `manifest.json` 的对应分组中新增：

   ```json
   { "path": "usage/example", "title": "示例客户端", "description": "介绍示例客户端的安装、配置和故障排查。" }
   ```

3. 原有正文、标题、分类和顺序原样迁移。`title` 保留原路由标题，`navTitle` 可保留不同的原侧栏名称；不会用导航名称覆盖正文标题。
4. 分组和 `pages` 数组顺序就是侧栏和上下篇顺序，不要在主项目中另写目录。
5. 页内目录从 Markdown 标题自动生成，`toc.minDepth` / `toc.maxDepth` 配置显示层级；单页可覆盖 `toc`。
6. 尽量不改 `path`。必须改时，将旧路径加入 `redirects`：`"旧路径": "新路径"`。
7. `unlisted` 用于维护者参考页。`index: false` 的页面会输出 `noindex,follow`，且不出现在 sitemap 和上下篇序列中。

## 检查

需要 Node.js 24 或更高版本，无需安装第三方依赖：

```bash
node scripts/check.mjs
```

检查正文是否完整登记、配置、内链路径及本地资源。GitHub Actions 对 PR 自动执行。主前端构建还会检查解析后的锚点、生成静态 HTML、右侧悬浮目录、SEO 元数据和 sitemap。

## 预览

在前端项目中修改已检出的 `docs-content/`，运行 `pnpm run dev`；构建时运行 `pnpm run build`。具体命令见 [贡献指南](CONTRIBUTING.md)。

## License

本仓库的代码采用 [MIT License](LICENSE)。

除非特别说明，本仓库中的原创文档内容采用：

Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International

完整协议请参阅：

https://creativecommons.org/licenses/by-nc-sa/4.0/

## 内容来源

初始内容迁自 `MagicEdgeNet/ME-Frp-v5-Frontend` 的 `public/_docs`。第三方内容及资源遵循其各自的许可和署名要求。请只提交有权分发的内容和图片，保留必要署名；不要提交账户凭据、Token 或未经打码的个人信息。
