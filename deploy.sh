#!/bin/bash
set -e

# ===== 配置 =====
SERVER_USER="ubuntu"
SERVER_IP="118.25.186.95"
PEM_KEY="./lighthouse.pem"
PROJECT_NAME="laoxueyuan"
CONTAINER_NAME="laoxueyuan"
IMAGE_NAME="laoxueyuan"
HOST_PORT="8083"
CONTAINER_PORT="8083"
REMOTE_DIR="/home/ubuntu/${PROJECT_NAME}_$(date +%Y%m%d%H%M%S)"

echo "========================================="
echo " laoxueyuan 一键部署脚本"
echo "========================================="

# ===== 第一步：本地构建 =====
echo ""
echo "[1/5] 本地构建 dist/..."
npm run build
echo "✓ 构建完成"

# ===== 第二步：在服务器创建目录 =====
echo ""
echo "[2/5] 在服务器创建目录 ${REMOTE_DIR}..."
ssh -i "$PEM_KEY" -o StrictHostKeyChecking=no "${SERVER_USER}@${SERVER_IP}" "mkdir -p ${REMOTE_DIR}"
echo "✓ 目录创建完成"

# ===== 第三步：上传文件 =====
echo ""
echo "[3/5] 上传 dist/ 和 Dockerfile 到服务器..."
scp -i "$PEM_KEY" -o StrictHostKeyChecking=no -r dist/ Dockerfile "${SERVER_USER}@${SERVER_IP}:${REMOTE_DIR}/"
echo "✓ 上传完成"

# ===== 第四步：服务器构建镜像并启动容器 =====
echo ""
echo "[4/5] 服务器构建镜像并启动容器..."
ssh -i "$PEM_KEY" -o StrictHostKeyChecking=no "${SERVER_USER}@${SERVER_IP}" bash << EOF
  set -e
  cd ${REMOTE_DIR}

  echo "  -> 构建 Docker 镜像..."
  docker build -t ${IMAGE_NAME}:latest .

  echo "  -> 检查旧容器..."
  if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "  -> 停止并删除旧容器..."
    docker stop ${CONTAINER_NAME} && docker rm ${CONTAINER_NAME}
  fi

  echo "  -> 启动新容器..."
  docker run -d \
    --name ${CONTAINER_NAME} \
    -p ${HOST_PORT}:${CONTAINER_PORT} \
    --restart unless-stopped \
    ${IMAGE_NAME}:latest

  echo "  -> 等待容器启动..."
  sleep 3
EOF
echo "✓ 容器启动完成"

# ===== 第五步：验证 =====
echo ""
echo "[5/5] 验证部署结果..."
HTTP_CODE=$(ssh -i "$PEM_KEY" -o StrictHostKeyChecking=no "${SERVER_USER}@${SERVER_IP}" \
  "curl -s -o /dev/null -w '%{http_code}' http://localhost:${HOST_PORT}/")

if [ "$HTTP_CODE" = "200" ]; then
  echo "✓ 部署成功！HTTP ${HTTP_CODE}"
  echo ""
  echo "========================================="
  echo " 访问地址：http://${SERVER_IP}:${HOST_PORT}"
  echo "========================================="
else
  echo "✗ 部署异常，HTTP 状态码：${HTTP_CODE}"
  echo "请 SSH 登录服务器检查：docker logs ${CONTAINER_NAME}"
  exit 1
fi
