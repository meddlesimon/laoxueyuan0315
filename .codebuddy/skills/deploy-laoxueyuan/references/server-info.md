# laoxueyuan 服务器信息

## 服务器配置

| 项目 | 值 |
|---|---|
| 服务器 IP | `118.25.186.95` |
| 登录用户名 | `ubuntu` |
| SSH 端口 | `22` |
| 密钥文件路径 | 项目根目录 `lighthouse.pem` |
| 应用端口 | `8083` |
| 线上访问地址 | `http://118.25.186.95:8083` |

## 部署目录

每次部署会在服务器上创建带时间戳的目录：
```
/home/ubuntu/laoxueyuan_<YYYYMMDDHHMMSS>/
```

## Docker 信息

| 项目 | 值 |
|---|---|
| 镜像名称 | `laoxueyuan:latest` |
| 容器名称 | `laoxueyuan` |
| Nginx 监听端口 | `8083` |

## SSH 免密登录

公钥已添加到服务器 `~/.ssh/authorized_keys`，连接命令：
```bash
ssh -i lighthouse.pem ubuntu@118.25.186.95
```

## 腾讯云控制台

- 控制台地址：https://console.cloud.tencent.com
- 服务类型：轻量应用服务器 (Lighthouse)
- 防火墙已开放：TCP 8083

## deploy.sh 关键变量

```bash
SERVER_USER="ubuntu"
SERVER_IP="118.25.186.95"
PEM_KEY="./lighthouse.pem"
PROJECT_NAME="laoxueyuan"
HOST_PORT="8083"
CONTAINER_PORT="8083"
REMOTE_DIR="/home/ubuntu/${PROJECT_NAME}_$(date +%Y%m%d%H%M%S)"
```

## 历史操作记录

- ubuntu 用户已加入 docker 组：`sudo usermod -aG docker ubuntu`
- SSH 免密登录配置时间：2026-03-15
