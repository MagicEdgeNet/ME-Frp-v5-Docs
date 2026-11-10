# VNC 远程桌面配置

:::info 适用场景说明

本指南专为希望将本地 VNC 通过 TCP 协议暴露至公网的用户设计。**请注意：将 VNC 服务暴露于公网会带来安全隐患，请谨慎操作**

本指南只涉及配置幻缘映射内网穿透的部分，请确保您已部署 VNC Server 后再进行后续操作。

:::

:::warning 安全提醒

使用内网穿透等于 **绕过所有防火墙** 将您的计算机直接暴露于公网中，您需要自行承担由此带来的风险。建议使用 **强密码** 并启用 VNC 的加密连接功能（如 SSH tunneling）来增强安全性。

:::

## VNC 服务部署

:::tip 开始之前

确保您已安装并配置好 VNC Server。常见的选择包括：

- **Windows**: TightVNC、RealVNC、UltraVNC
- **Linux**: TigerVNC、TightVNC、x11vnc
- **macOS**: VNC Server (内置)

:::

## 确认 VNC 端口

VNC 的默认端口是 `5900`，但如果您运行了多个 VNC 实例或修改了默认配置，需要确认实际使用的端口。

### Windows 系统

1. 按 `Win+R` 打开运行窗口，输入 `cmd` 打开**命令提示符**

2. 执行命令

```cmd
netstat -an|findstr :5900|findstr LISTENING
```

3. 查看输出，如果显示 `LISTENING` 状态，则说明 VNC 服务正在监听此端口

若端口不同，请将 `5900` 替换为您的实际 VNC 端口。

### Linux/macOS 系统

执行以下命令：

```bash
netstat -tulnp | grep vnc
# 或
ps aux | grep vnc
```

查看输出中的端口号。

## 创建隧道

当您确认 VNC 本地端口后，就可以开始创建隧道了。

登录幻缘映射控制台，点击侧边栏的"创建隧道"选项：

![创建隧道](https://img.fastmirror.net/s/2025/10/31/690396107a212.png)

选择带有 TCP 标识的节点，在隧道创建页填入你本地应用的 `IP 地址` 和 `端口`（默认为 `5900`），`远程端口` 建议使用获取随机空闲端口功能：

![创建 TCP 隧道](https://img.fastmirror.net/s/2025/10/31/690398e37c42b.png)

信息填写完成后点击右侧**创建隧道**按钮，若提示 **创建隧道成功** 则隧道创建成功。

## 启动隧道

请您阅读 [启动隧道教程 - 通用客户端](/docs/usage/common) 快速上手，本教程部分不再赘述。

日志中会出现一行 `您可以使用 [xxx] 访问您的服务` 的提示，您可以使用此地址在 VNC 客户端中连接。

## VNC 客户端连接

### Windows

1. 安装 VNC 客户端（如 RealVNC Viewer、TightVNC Viewer 等）
2. 打开客户端，在连接地址栏输入：`<节点地址>:<远程端口>`
3. 点击连接，输入 VNC 密码即可

### Linux/macOS

使用命令行工具或图形化客户端：

```bash
vncviewer <节点地址>:<远程端口>
```

或者安装第三方 VNC 客户端（如 TigerVNC Viewer、RealVNC Viewer）连接。