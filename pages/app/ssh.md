# SSH 远程命令行访问

:::info 适用场景说明

本指南专为希望通过 SSH 远程访问和管理 Linux/Unix 服务器、开发机或其他支持 SSH 的设备的用户设计。

适用场景包括：

- 在外网远程管理服务器或工作站
- 进行远程开发、调试和部署
- 进行文件传输和远程编辑
- 运行远程脚本和任务

本指南只涉及配置幻缘映射内网穿透的部分，请确保您已在目标设备上部署 SSH Server 后再进行后续操作。

:::

:::warning 安全提醒

SSH 是远程访问的强大工具，但同时也是攻击者的目标。使用内网穿透暴露 SSH 端口前，请务必：

- **禁用密码认证**：使用基于密钥的身份验证
- **修改默认端口**：避免 22 端口（可选）
- **配置防火墙**：限制访问来源 IP（如可能）
- **使用 SSH 密钥对**：不存储密码在内存中
- **定期审计日志**：监控登录活动和异常访问

:::

## SSH Server 配置

### Linux 系统

#### 安装 SSH Server

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install openssh-server

# CentOS/RHEL
sudo yum install openssh-server openssh-clients

# Fedora
sudo dnf install openssh-server openssh-clients
```

#### 启动并启用 SSH

```bash
sudo systemctl start ssh        # Ubuntu/Debian
# 或
sudo systemctl start sshd       # CentOS/RHEL/Fedora

# 启用开机自启
sudo systemctl enable ssh
```

### Windows 系统

Windows 10/11 和 Windows Server 2019+ 内置 OpenSSH，可直接启用：

1. 打开 **设置** > **应用和功能** > **可选功能**
2. 搜索 **OpenSSH Server**，点击安装
3. 启动服务：按 `Win+R` 输入 `services.msc`，找到 **OpenSSH SSH Server**，设为自动启动

### macOS 系统

macOS 默认启用 SSH。若需启用，请在**系统偏好设置** > **共享** > **远程登录**中启用。

## 确认 SSH 端口

SSH 的默认端口是 `22`，但如果您已修改配置，需要确认实际使用的端口。

### 查询 SSH 配置

```bash
# 查看 SSH 配置文件
cat /etc/ssh/sshd_config | grep -i "^port"

# 查看监听端口
netstat -tulnp | grep ssh
# 或
ss -tulnp | grep ssh
```

### Windows 系统

按 `Win+R` 打开**命令提示符**，执行：

```cmd
netstat -an|findstr :22|findstr LISTENING
```

## 创建隧道

登录幻缘映射控制台，点击侧边栏的"创建隧道"选项：

![创建隧道](https://img.fastmirror.net/s/2025/10/31/690396107a212.png)

选择带有 TCP 标识的节点，在隧道创建页填入你本地应用的 `IP 地址` 和 `端口`（默认为 `22`），`远程端口` 建议使用获取随机空闲端口功能：

![创建 TCP 隧道](https://img.fastmirror.net/s/2025/10/31/690398e37c42b.png)

信息填写完成后点击右侧**创建隧道**按钮，若提示 **创建隧道成功** 则隧道创建成功。

## 启动隧道

请您阅读 [启动隧道教程 - 通用客户端](/docs/introduction) 快速上手，本教程部分不再赘述。

日志中会出现一行 `您可以使用 [xxx] 访问您的服务` 的提示，您可以使用此地址进行 SSH 连接。

## SSH 客户端连接

### Linux/macOS

```bash
ssh -p <远程端口> username@<节点地址>

# 示例
ssh -p 12345 user@frp.example.com
```

### Windows (PowerShell/Command Prompt)

```powershell
ssh -p <远程端口> username@<节点地址>

# 或使用 PuTTY
# 在 Host Name 输入：<节点地址>
# 在 Port 输入：<远程端口>
```

### 常见 SSH 客户端

| 工具 | 平台 | 特点 |
|------|------|------|
| OpenSSH | 所有平台 | 命令行工具，强大灵活 |
| PuTTY | Windows | 图形化界面，易用 |
| Termius | 全平台 | 现代 UI，支持密钥管理 |
| MobaXterm | Windows | 功能丰富，支持 X11 转发 |
| iTerm2 | macOS | 强大的终端模拟器 |

## SSH 密钥认证配置

### 生成密钥对

在客户端生成 SSH 密钥对：

```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""
```

- `-t rsa`：使用 RSA 算法（也可用 `-t ed25519` 获得更好的安全性）
- `-b 4096`：密钥长度为 4096 位
- `-f`：指定密钥文件位置
- `-N ""`：空密码（可选，通常推荐设置密码）

### 上传公钥到服务器

```bash
ssh-copy-id -p <远程端口> username@<节点地址>

# 或手动上传
cat ~/.ssh/id_rsa.pub | ssh -p <远程端口> username@<节点地址> \
  "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
```

### 在服务器上禁用密码认证

编辑 `/etc/ssh/sshd_config`：

```bash
sudo nano /etc/ssh/sshd_config
```

找到并修改以下行：

```
PasswordAuthentication no
PubkeyAuthentication yes
```

重启 SSH 服务：

```bash
sudo systemctl restart ssh
```

## 高级用法

### 通过 SSH 隧道访问内网服务

如果目标设备上运行了其他服务（如数据库、Web 应用），可通过 SSH 隧道安全地访问：

```bash
# 本地端口转发：本地访问本地 3306 端口时，通过 SSH 转发到目标设备的 3306 端口
ssh -p <远程端口> -L 3306:127.0.0.1:3306 username@<节点地址>

# 远程端口转发：目标设备上的应用可访问本地的服务
ssh -p <远程端口> -R 8080:127.0.0.1:8080 username@<节点地址>
```

### 使用 SFTP 进行文件传输

```bash
# 连接到 SFTP 服务器
sftp -P <远程端口> username@<节点地址>

# 常用命令
put local_file              # 上传文件
get remote_file             # 下载文件
ls                          # 列出文件
cd path/to/directory        # 切换目录
```

或使用图形化 SFTP 客户端（如 FileZilla、WinSCP）：

1. 选择 SFTP 协议
2. 输入主机地址、端口、用户名
3. 如果配置了密钥认证，选择密钥文件

### 使用 SSH 配置简化连接

在 `~/.ssh/config` 中添加：

```
Host myserver
    HostName <节点地址>
    Port <远程端口>
    User username
    IdentityFile ~/.ssh/id_rsa
```

之后只需 `ssh myserver` 即可快速连接。

## 常见问题

### 连接超时或被拒绝

1. 检查隧道是否运行正常
2. 确认 SSH Server 在目标设备上正常运行
3. 验证端口配置是否正确
4. 查看防火墙是否阻止 SSH 连接

### "Permission denied (publickey)"

- 检查公钥是否正确上传到服务器
- 验证 `~/.ssh/authorized_keys` 文件权限（应为 600）
- 确认 `~/.ssh` 目录权限（应为 700）
- 查看服务器 SSH 日志：`sudo tail -f /var/log/auth.log`

### "Connection reset by peer"

这通常表示连接被服务端或防火墙中断。排查步骤：

1. 检查 SSH Server 是否崩溃（查看进程）
2. 验证服务器磁盘空间和内存充足
3. 检查网络稳定性
4. 查看 SSH 日志获取更多信息

### 密钥认证不生效

1. 确保在生成密钥对时使用了正确的路径
2. 检查私钥文件权限（应为 600）：`chmod 600 ~/.ssh/id_rsa`
3. 使用 `-v` 参数调试连接过程：`ssh -v -p <端口> user@host`
4. 在服务器 SSH 配置中确认启用了 `PubkeyAuthentication yes`

### 某些命令在远程执行异常

可能是环境变量差异导致的。使用完整路径指定命令：

```bash
ssh user@host /usr/bin/command arg1 arg2
```

或在远程执行前设置环境变量：

```bash
ssh user@host "export PATH=$PATH && command"
```

## 安全建议

### 定期审计

```bash
# 查看 SSH 登录历史
lastlog

# 查看当前登录用户
w

# 查看登录失败尝试
sudo grep "Failed password" /var/log/auth.log | tail -20
```

### 配置 fail2ban 防止暴力破解

```bash
# 安装 fail2ban
sudo apt-get install fail2ban

# 启用 SSH 保护
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local
sudo nano /etc/fail2ban/jail.local
# 找到 [sshd] 部分，确保 enabled = true

sudo systemctl restart fail2ban
```

### 修改默认端口（可选）

在 `/etc/ssh/sshd_config` 中：

```
Port 2222
```

然后重启 SSH。连接时使用新端口：

```bash
ssh -p 2222 user@host
```

### 定期更新

```bash
sudo apt-get update && sudo apt-get upgrade
```

### 使用 SSH 密钥的密码保护

生成有密码保护的密钥：

```bash
ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa
# 根据提示输入密码
```

可使用 ssh-agent 避免每次输入密码：

```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_rsa
# 输入一次密码，后续连接无需重复输入
```