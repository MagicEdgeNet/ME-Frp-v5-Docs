# Navidrome 音乐流媒体

:::info 适用场景说明

本指南专为希望将本地 Navidrome 实例通过 TCP/HTTP 协议暴露至公网的用户设计。

:::

Navidrome 是一个音乐服务器，本身提供 Web 界面，允许在任何设备上播放音乐。音流 APP 可以连接 Navidrome 服务，实现手机 APP 播放音乐。

## 快速开始

:::tip 开始之前

准备好音乐文件，推荐 FLAC 无损格式。可以配合 MusicTag(Web) 等实现音乐刮削。

:::

### 在飞牛 NAS 上安装

1. 打开应用商店，搜索 Navidrome 并安装：

![搜索 Navidrome 并安装](https://img.fastmirror.net/s/2025/11/16/6919bb2db9d1a.png)

2. 选择音乐文件存储目录（建议单独建一个文件夹）

![选择音乐文件存储目录](https://img.fastmirror.net/s/2025/11/16/6919bb2e552c0.png)

3. 安装完成后，通过浏览器打开 Navidrome（可以设置里改成中文）

![fnOS-navidrome-3](https://img.fastmirror.net/s/2025/11/16/6919bb2dce423.png)

### 使用 Docker Compose 安装

参考官方文档，使用以下 `compose.yml` 运行：

```yaml
services:
  navidrome:
    image: deluan/navidrome:latest
    user: 1000:1000 # should be owner of volumes
    ports:
      - "4533:4533"
    restart: unless-stopped
    environment:
      # Optional: put your config options customization here. Examples:
      # ND_LOGLEVEL: debug
    volumes:
      - "/path/to/data:/data"
      - "/path/to/your/music/folder:/music:ro"
```

更改 `volumes:` 路径以指向您的本地路径。容器内 `/data` 是 Navidrome 存储其数据库和缓存的地方，`/music` 存储音乐文件。

### 访问

安装完成使用 `IP:4533` 访问 Navidrome:

1. 首次进入需要创建管理员
2. 进入界面是英文的，可以通过设置进行修改语言为中文

![Navidrome-zh-CN](https://img.fastmirror.net/s/2025/11/16/6919bb2e947c7.png)

## 创建隧道

:::warning 有关 TCP 穿透网页内容的安全提醒

注意，若使用 TCP 协议建站搭建违规业务，我方有权直接暂停隧道强制下线，并将信息报至公安。若您使用禁止国内 TCP 隧道建站的节点，我方有权根据情节的轻重进行警告或封号处理。

:::

> Navidrome 使用 `4533/tcp` 端口，所以我们需要创建一个 TCP 类型的隧道。

登录幻缘映射控制台，点击侧边栏的“创建隧道”选项：

![创建隧道](https://img.fastmirror.net/s/2025/10/31/690396107a212.png)

选择带有 TCP 标识的节点（推荐使用非大陆地区节点），在隧道创建页填入你本地应用的 `IP 地址` 和 `端口: 4533`，`远程端口` 建议使用获取随机空闲端口功能：

![创建 TCP 隧道](https://img.fastmirror.net/s/2025/10/31/690398e37c42b.png)

信息填写完成后点击右侧**创建隧道**按钮，若提示 **创建隧道成功** 则隧道创建成功。

## 启动隧道

请您阅读 [启动隧道教程 - Docker](/docs/usage/docker) 部分快速上手，本教程部分不再赘述。

日志中会出现一行 `您可以使用 [xxx] 访问您的服务` 的提示，则您可以使用该地址访问到您的 Navidrome 流媒体服务器。