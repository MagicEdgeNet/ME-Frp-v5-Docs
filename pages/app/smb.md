# SMB 文件共享

:::info 适用场景说明

本指南专为希望将本地 NAS 设备或自建文件服务通过内网穿透暴露至公网的用户设计，适用于以下场景：

- 随时随地访问 NAS 中的文件和文件夹
- 在外网将文件上传、下载或共享
- 搭建个人云盘服务（如 Nextcloud、Seafile）
- 暴露媒体库服务（如 Emby、Plex、Jellyfin）

本指南只涉及配置幻缘映射内网穿透的部分，请确保您已部署 NAS 或文件服务后再进行后续操作。

:::

:::warning 安全提醒

NAS 中通常包含您的重要数据和隐私信息。暴露至公网前，请务必：

- 设置强密码（至少 16 个字符，包含大小写字母、数字、特殊符号）
- 启用二次验证（如支持）
- 定期查看访问日志，及时发现异常访问
- 使用 HTTPS 加密传输
- 定期更新 NAS 系统和相关应用

:::

## NAS 系统选择

### 常见 NAS 系统

| NAS 系统 | 常见品牌 | Web 端口 | 协议 |
|---------|---------|---------|------|
| DSM (群晖) | Synology | 5000/5001 | HTTP/HTTPS |
| TrueNAS | TrueNAS | 80/443 | HTTP/HTTPS |
| OpenWrt | 多品牌 | 80 | HTTP |
| Unraid | Unraid | 80 | HTTP |
| OMV | 多品牌 | 80 | HTTP |

### 文件共享协议

不同的文件服务支持不同的协议：

| 服务类型 | 协议 | 端口 | 隧道类型 |
|---------|------|------|---------|
| Web 文件管理 | HTTP/HTTPS | 80/443 | HTTP(S) |
| Samba/SMB | TCP | 445 | TCP |
| NFS | TCP/UDP | 2049 | TCP/UDP |
| FTP | TCP | 21/990 | TCP |
| SFTP | TCP | 22 | TCP |

## 确认 NAS 访问地址和端口

### 查询 Web 管理界面

1. **在局域网内访问**：
   - 打开浏览器，输入 `nas_ip:端口` 或 NAS 设备名称
   - 常见地址：`http://192.168.1.100:5000` (群晖) 或 `http://192.168.1.100` (TrueNAS)

2. **确认工作端口**：
   - 群晖：打开 **控制面板** > **网络** > **常规** 查看 HTTP/HTTPS 端口
   - TrueNAS：打开 **System** > **General Settings** 查看 Web Interface 端口
   - 其他系统：查看对应管理后台的网络设置

### 其他服务端口确认

对于非 Web 服务（如 Samba、NFS），通过 NAS 管理界面查看具体服务端口配置。

## 创建隧道

根据您的需求，选择合适的隧道类型：

### Web 管理界面（推荐）

如果只需暴露 Web 界面，建议使用 HTTP(S) 隧道，无需带端口访问。

登录幻缘映射控制台，点击"创建隧道"：

![创建隧道](https://img.fastmirror.net/s/2025/10/31/690396107a212.png)

选择支持建站的 HTTP(S) 节点，填入配置：

![创建 HTTP(S) 隧道](https://img.fastmirror.net/s/2025/10/31/69039613af0d9.png)

- **IP 地址**：NAS 的局域网 IP（如 192.168.1.100）
- **端口**：NAS 的 Web 端口（如 5000）
- **域名**：绑定的域名（需支持 HTTPS）

### 文件共享服务（TCP/UDP）

对于 Samba、FTP 等文件共享协议，使用 TCP 或 UDP 隧道。

选择带有 TCP 标识的节点，填入配置：

![创建 TCP 隧道](https://img.fastmirror.net/s/2025/10/31/690398e37c42b.png)

- **IP 地址**：NAS 的局域网 IP
- **端口**：相应服务的端口（如 Samba 的 445）
- **远程端口**：建议使用随机空闲端口

## 设置域名解析（仅限 HTTP(S) 隧道）

参考 [Web 应用穿透指南](/docs/app/website) 的**设置解析**部分进行配置。

## 启动隧道

请您阅读 [启动隧道教程 - 通用客户端](/docs/introduction) 快速上手。

日志中会出现 `您可以使用 [xxx] 访问您的服务` 的提示，即可通过该地址访问 NAS。

## 访问和使用

### 通过 Web 界面访问

- **HTTP(S) 隧道**：直接使用域名访问（如 `https://my-nas.example.com`）
- **TCP 隧道**：使用地址和端口访问（如 `http://frp.example.com:12345`）

### 通过文件管理器访问（Windows）

对于 Samba 隧道，可在 Windows 文件管理器中访问：

1. 按 `Win+E` 打开文件管理器
2. 点击地址栏，输入 `\\<节点地址>:<远程端口>`
3. 输入 NAS 用户名和密码

### 通过第三方应用访问

许多 NAS 应用支持自定义服务器地址：

- **Synology Drive**：输入 HTTP(S) 穿透地址
- **群晖 Moments**：配置相同地址
- **Media 播放器**：指向 Emby/Plex 穿透地址

## 常见 NAS 服务穿透配置

### 群晖 DSM

| 服务 | 端口 | 隧道类型 | 备注 |
|------|------|---------|------|
| Web 管理 | 5000/5001 | HTTP(S) | 推荐 HTTPS |
| Moments | 5000/5001 | HTTP(S) | 同上 |
| Drive | 6690 | TCP | 需特殊配置 |
| Synology Office | 5000/5001 | HTTP(S) | 同上 |

### TrueNAS

| 服务 | 端口 | 隧道类型 |
|------|------|---------|
| Web UI | 80/443 | HTTP(S) |
| SSH | 22 | TCP |
| Samba | 445 | TCP |

### Nextcloud / Seafile

| 服务 | 端口 | 隧道类型 |
|------|------|---------|
| Web 界面 | 80/8080 | HTTP(S) |
| WebDAV | 同上 | HTTP(S) |

## Windows11 22H2 连接不了

请使用 powershell 执行以下命令：

```
Set-SmbClientConfiguration -RequireSecuritySignature $false
Set-SmbClientConfiguration -EnableInsecureGuestLogons $true
```