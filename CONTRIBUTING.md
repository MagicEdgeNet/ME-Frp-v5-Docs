# 贡献指南

欢迎通过 Pull Request 改进正文、图片、导航和标题。修改文档内容不需要了解前端组件。

## 本地预览

```bash
git clone https://github.com/MagicEdgeNet/ME-Frp-v5-Docs.git
cd ME-Frp-v5-Docs
# 独立站尚未合并到默认分支时，切换到 feat/standalone-docs。
git switch feat/standalone-docs
pnpm install
pnpm run dev
```

需要 Node.js 24+ 和 pnpm 10+。直接编辑本仓库的 `pages/`、`manifest.json` 或 `assets/`；无需克隆前端或配置 API。不要直接修改生成的 `dist/`、`/_docs-data/` 或 sitemap。

直接克隆本仓库也可用 Node.js 检查结构：

```bash
node scripts/check.mjs
```

## 内容规范

- 本次迁移不修改历史正文、标题、分类和顺序。后续新文档建议使用一个清楚的一级标题，正文使用二级及以下标题；`title`、`navTitle` 与正文标题可根据已有约定分别保留，不要求强制改成一样。
- 标题简短清晰，不堆砌关键词，不按排版需要跳过标题层级。
- `description` 应描述读者能完成什么，不要只复制页面标题。
- 代码块注明语言。不要把真实 Token、密码、内网拓扑、个人信息放进示例。
- 使用标准 Markdown。提示框可使用 `:::info 标题` / `:::warning 标题` / `:::tip 标题`，并以独占一行的 `:::` 结束。
- 不支持执行脚本、组件、任意 HTML 或 frontmatter。正文中的 HTML 会转义，不会执行。
- 内部文档链接使用 `/docs/usage/client` 这样的稳定站点路径；不带 `.md`。
- 本页锚点与跨页锚点从标题生成；相同标题依次追加 `-2`、`-3`。修改标题后检查入链。
- 新图片放入 `assets/`，用 `/docs-assets/截图名.png` 引用，写清楚替代文本。文件名保持简单，压缩后再提交。
- 文档站部署到 `docs.mefrp.com`，构建产物为 `dist/`。提交后 CI 校验内容、单测及构建；主站无需同步 submodule 才能构建独立站。
- 代码采用 MIT，原创文档内容除非另有说明采用 CC BY-NC-SA 4.0；提交前确认你有权按相应许可贡献，第三方资源保留原许可和署名。

## 提交 PR

说明修改目的、涉及页面；截图教程请注明适用系统和客户端版本。目录、路径调整请同时说明旧链接如何保持可访问。
