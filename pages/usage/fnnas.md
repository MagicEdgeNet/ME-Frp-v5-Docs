:::info 相关信息

飞牛私有云 fnOS 是一款基于最新 Linux 内核深度开发的 NAS 操作系统。  
官方网站：<https://www.fnnas.com>

:::

## 安装 ME-Frp 飞牛客户端

:::warning 系统要求

若您希望使用 ME-Frp 飞牛客户端，请确保：

1. 您的系统需升级至 fnOS 1.1.23 及以上版本
2. 设备 1201 端口未被其他服务占用

:::

1. 打开飞牛 Web 后台，找到「应用中心」，在应用中心搜索找到「ME Frp 内网穿透」：

![fnOS-mefrp-1.png](https://img.fastmirror.net/s/2026/04/26/69ece8e266b9e.png)

2. 选定应用安装的存储空间：

![fnOS-mefrp-2.png](https://img.fastmirror.net/s/2026/04/26/69ece90c068a7.png)

3. 仔细阅读使用说明

![efdb](https://img.fastmirror.net/s/2026/04/26/69ece93ebc313.png)

4. 设置 Web UI 的访问密钥，并按照需求自行选择是否需要允许 “公网访问 Web UI 功能”

![fnOS-mefrp-5.png](https://img.fastmirror.net/s/2026/04/26/69ece96c170af.png)

5. 点击“确认”，安装客户端

![fnOS-mefrp-6.png](https://img.fastmirror.net/s/2026/04/26/69ece99335628.png)

6. 安装完成后，在桌面上找到 “ME Frp 内网穿透” 应用，并点击打开

![1763998762162](https://img.fastmirror.net/s/2026/04/26/69ece9b35311b.png)

7. 打开后，输入在安装过程中设置的访问密钥

![1763998762162](https://img.fastmirror.net/s/2026/04/26/69ece9d392bc1.png)

8. 密钥验证通过后，将进入登录界面，在此处您需要登录您的幻缘映射官网账号，并完成人机验证

![1763998762162](https://img.fastmirror.net/s/2026/04/26/69ece9f78f3e0.png)

9. 验证成功并登录完成后，您便正式进入 Web UI 的管理界面，可按照需求，启动对应隧道

![1763998762162](https://img.fastmirror.net/s/2026/04/26/69ecea23a2eef.png)

10. 启动完成后，可在 “日志” 界面查看状态和隧道远程地址

![1763998762162](https://img.fastmirror.net/s/2026/04/26/69ecea36743d4.png)

:::info

如您在使用过程中遇到问题，可以填写 [飞牛客户端反馈问卷](https://acmecloud.feishu.cn/share/base/form/shrcn76SH4tJQpLSuIKQPCRn0rd) 向我们提交建议或 Bug，在核实后，我们会赠送您一定的奖励。

:::

### 常见问题

#### 1.在打开后，提示 “获取隧道配置失败，API错误” 提示怎么办

答：可切换无痕模式或使用 “飞牛 APP” 进行配置

#### 2.隧道启动时，提示 “已在其他客户端启动” 怎么办

答：请前往官网 "隧道管理" 界面，强制下线此条隧道

#### 3.打开 Web UI 白屏无响应怎么办？

答:1.请您先自查是否使用加密的 HTTPS 方式访问的飞牛 Web UI （注:此处指的就是飞牛 Web UI ，不是控制面板）
2.请自查是否使用了 fn connect 或 IPV6 等方式访问的应用管理面板

#### 4.如何远程配置隧道

答:请点击查看 [飞牛设备如何远程配置隧道](https://acmecloud.feishu.cn/docx/KNGVdxXsLozbUfxEepTcfw2Nnig?from=from_copylink)
