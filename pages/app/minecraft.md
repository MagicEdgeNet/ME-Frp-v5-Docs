# Minecraft 开服联机

:::info 适用场景说明

本指南专为希望将本地 Minecraft 服务器通过 TCP/UDP 协议暴露至公网的用户设计。

本指南只涉及配置幻缘映射内网穿透的部分，请确保您已部署 Minecraft Server (Java/Bedrock) 后再进行后续操作。

:::

## 确认端口

### Java 版局域网联机

进入要联机的单人世界，按下键盘上的 ESC 键暂停游戏，在出现的界面里找到 `对局域网开放` 字样的按钮并且点击，然后 `创建一个局域网世界`。

在聊天框里会提示 `本地游戏已在端口 xxxxx 上开启`，这是我们的本地端口，请记住它。

> 如您使用辅助 Mod ([LAN World Plug-n-Play](https://www.mcmod.cn/class/4498.html)/LanServerProperties/[EasyLAN](https://www.mcmod.cn/class/11373.html)) 进行联机，通常可以手动设置本地端口。辅助 Mod 互相不兼容，请勿重复添加。

### Java 版服务器

查看服务器根目录下的 `server.properties` 文件内容，找到 `server-port` 后面的数字即本地端口。

如果服务器已在运行，也可通过 `netstat -tulnp | grep java` (Linux) 查看进程监听端口。

### Bedrock 服务器

开启服务器，在服务端输出中寻找 `port: 19132: Used for gameplay` 字样，其中 `19132` 即本地端口。

## 创建隧道

当您确认本地端口后，就可以开始创建隧道了。

### 适用于 Java 版的 TCP 隧道

登录幻缘映射控制台，点击侧边栏的“创建隧道”选项：

![创建隧道](https://img.fastmirror.net/s/2025/10/31/690396107a212.png)

选择带有 TCP 标识的节点，在隧道创建页填入你本地应用的 `IP 地址` 和 `端口`，`远程端口` 建议使用获取随机空闲端口功能：

![创建 TCP 隧道](https://img.fastmirror.net/s/2025/10/31/690398e37c42b.png)

信息填写完成后点击右侧**创建隧道**按钮，若提示 **创建隧道成功** 则隧道创建成功。

### 适用于基岩版的 UDP 隧道

登录幻缘映射控制台，点击侧边栏的“创建隧道”选项：

![创建隧道](https://img.fastmirror.net/s/2025/10/31/690396107a212.png)

选择带有 UDP 标识的节点，在隧道创建页填入你本地应用的 `IP 地址` 和 `端口`，`远程端口` 建议使用获取随机空闲端口功能：

![创建 UDP 隧道](https://img.fastmirror.net/s/2025/11/16/6918b245dfb56.png)

信息填写完成后点击右侧**创建隧道**按钮，若提示 **创建隧道成功** 则隧道创建成功。

## 启动隧道

请您阅读 [启动隧道教程 - 通用客户端](/docs/usage/common) 快速上手，本教程部分不再赘述。

日志中会出现一行 `您可以使用 [xxx] 访问您的服务` 的提示，则客户端可以使用这个地址来加入您的游戏。

## 设置解析

如果您希望**使用自己的域名**用于服务器连接或希望**隐藏端口**号，则需要设置 SRV 解析，SRV 解析只是为了美观，并非必须。

:::info 提示

配置 SRV 记录后使用 `ping` 等命令无法测试连通性，可在游戏中正常使用。目前，只有 Minecraft Java 版支持解析 SRV 记录，**基岩版并不支持此特性**。

:::

若要进行 SRV 解析，您必须要拥有一个域名并可为其添加 DNS 记录（通常免费域名并不支持添加 SRV 记录），对于大多数 DNS 提供商，可以参考下表内容填写：

|   字段   |            内容            |                    说明                    |
| :------: | :------------------------: | :----------------------------------------: |
| 主机记录 |    `_minecraft._tcp.xx`    | `xx` 可以自定义，亦可去除 `.xx` 以使用根域 |
| 记录类型 |            SRV             |                                            |
|  记录值  | `0 5 远程端口 节点域名/IP` |                                            |

对于 Cloudflare，请参考下表填写：

|  字段  |    内容     |       说明        |
| :----: | :---------: | :---------------: |
|  类型  |     SRV     |                   |
|  名称  |   自定义     | 填写 @ 以使用根域 |
|  服务  | `_minecraft` |                   |
|  协议  |     TCP     |                   |
| 优先级 |      0      |                   |
|  权重  |      5      |                   |
|  端口  |  远程端口   |                   |
|  目标  | 节点域名/IP |                   |

保存完毕后通常需要等待至少 10 分钟来让解析生效，极端情况可能需要 24 小时才能完全生效。

### 使用 SRV 后的域名游玩

在游戏中添加服务器时，使用移除了 `_minecraft._tcp.` 的地址连接，如 `_minecraft._tcp.example.com` -> `example.com`。

## 使用 Proxy Protocol 获取玩家真实 IP

如果按上述方案配置隧道，则可能在服务端日志中将所有玩家显示为同一地址（通常是 `127.0.0.1`），易引起管理混乱。

### 配置隧道

创建/编辑隧道时，在**高级配置**中设置 Proxy Protocol 后，Frpc 就会在请求本地服务时应用 Proxy Protocol 协议：

![高级配置-Proxy Protocol](https://img.fastmirror.net/s/2025/11/16/6918b3a3b7d0f.png)

:::warning UDP 支持

Proxy Protocol v1 并未为 UDP 设计，在 UDP 隧道中您总是应该使用 v2。

:::

### 配置服务器

配置服务器后，您才可以正确获取玩家的 IP 地址信息，通常插件会自适应。

#### BungeeCord/Waterfall

对于 BungeeCord 或 Waterfall 代理端，请参考 [官方文档](https://www.spigotmc.org/wiki/bungeecord-configuration-guide/#proxy_protocol) 进行配置。
这通常是通过 `proxy_protocol: true` 来开启的。

#### Paper/Purpur/...

对于 **Paper/Purpur 及其衍生服务端**，推荐使用 v2 版本的 Proxy Protocol。

首先，需要确认 `server.properties ` 的 `prevent-proxy-connections` 为 `false`。

然后，打开 `config/paper-global.yml` 文件，并对此部分作出如下修改:

```yaml
proxies:
  # 修改为 true
  proxy-protocol: true
```

完成后重启隧道和服务器。

#### Velocity

参考 [官网文档](https://docs.papermc.io/velocity/configuration/#advanced-section)，修改 `advanced` 下的 `haproxy-protocol` 为 `true`，保存并重启隧道和服务器生效。

#### 其他服务端

对于 Spigot 分支，您可以使用 [HAProxyDetector](https://github.com/andylizi/haproxy-detector) 提供支持，否则请自行查阅服务端文档或在 ME-Frp 群内询问。