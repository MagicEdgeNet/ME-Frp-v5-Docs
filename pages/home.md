# 幻缘映射 V5

## 让内网服务安全地被外部访问

ME Frp 是基于 Frp 的内网穿透服务。它让运行在家中、办公室或开发设备上的服务，通过 ME Frp 节点获得可从公网访问的入口，无需直接暴露设备或配置路由器端口转发。

选择一个场景，先了解工作方式，再创建第一条隧道。

[开始使用](/docs/guide/quick-start)　[浏览使用教程](/docs/usage/common)

## 工作方式

一台位于内网的设备运行客户端 `frpc`，主动连接 ME Frp 节点上的服务端 `frps`。创建隧道后，访问者连接分配的公网地址和端口，节点再把流量转发到你的本地服务。

```text
访问者 ── 公网地址:端口 ──> ME Frp 节点 (frps) ── 加密连接 ──> 你的设备 (frpc) ──> 本地服务
```

[了解内网穿透](/docs/concepts/overview)　[认识 frpc 和 frps](/docs/concepts/frpc-frps)

## 选择穿透类型

| 类型 | 适合访问 | 典型场景 |
| --- | --- | --- |
| TCP | 通用 TCP 服务 | SSH、远程桌面、游戏服务器 |
| UDP | UDP 服务 | 部分游戏、语音和实时应用 |
| HTTP | 网站和 HTTP 服务 | 本地开发站点、Web 管理界面 |
| HTTPS | TLS 网站服务 | 使用域名访问 HTTPS 服务 |
| STCP | 需要访问密钥的 TCP 服务 | 仅授权设备可以访问的服务 |
| XTCP | 支持时尝试点对点连接 | 两端网络条件允许的直连传输 |
| SUDP | 需要密钥的 UDP 服务 | 限定访问方的 UDP 应用 |

各类型的可用性受节点、账号和服务端配置影响。先查看[完整类型说明](/docs/concepts/protocols)，或按应用查找[场景配置](/docs/app/minecraft)。

## 从这里开始

### 第一次使用

注册账户、下载匹配系统的客户端、创建隧道并启动连接。

[打开快速开始](/docs/guide/quick-start)

### 了解已有概念

理解隧道、代理、节点和端口的区别，避免在配置时混淆客户端与服务端。

[浏览基础概念](/docs/concepts/terms)

### 按设备安装

在通用客户端、Docker 或 fnOS 上配置 ME Frp。

[客户端使用教程](/docs/usage/common)　[Docker](/docs/usage/docker)　[fnOS](/docs/usage/fnnas)

### 按场景配置

查找 Minecraft、远程桌面、SSH、Web 建站等逐步教程。

[浏览实际场景](/docs/app/minecraft)

## 常见问题

- [服务端 `frps` 和客户端 `frpc` 有什么区别？](/docs/concepts/frpc-frps)
- [TCP、UDP、HTTP 和 HTTPS 应该怎么选？](/docs/concepts/protocols)
- [外网无法访问我的服务怎么办？](/docs/faq/site-inaccessible)
- [如何快速定位启动报错？](/docs/errors)

[搜索所有文档](/docs/usage/common)

## 准备好创建隧道了吗？

前往 ME Frp 管理面板注册或登录，创建隧道、管理客户端和查看节点状态。

[前往管理面板](https://www.mefrp.com/dashboard)　[访问 ME Frp 官网](https://www.mefrp.com/)
