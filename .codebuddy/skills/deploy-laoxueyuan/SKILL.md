---
name: deploy-laoxueyuan
description: This skill should be used when the user wants to deploy the laoxueyuan project to the Tencent Cloud Lighthouse server. Trigger phrases include "帮我部署", "部署到腾讯云", "上线", "deploy", "更新线上版本", "发布", "部署最新代码".
---

# deploy-laoxueyuan

Deploy the laoxueyuan project to Tencent Cloud Lighthouse server via the pre-configured `deploy.sh` script.

## When to Use

Trigger this skill when the user says any of the following (or similar):
- 帮我部署 / 部署一下 / 部署到腾讯云
- 上线 / 发布 / 更新线上版本
- deploy / push to server / update production

## Deployment Workflow

1. **Confirm the working directory** — Ensure the terminal is in the project root:
   ```
   /Users/effieyap/Desktop/code buddy/laoxueyuan
   ```

2. **Check PEM key permissions** — The key must have restricted permissions or SSH will refuse it:
   ```bash
   chmod 600 lighthouse.pem
   ```

3. **Run the deploy script** — This single command handles everything automatically:
   ```bash
   cd "/Users/effieyap/Desktop/code buddy/laoxueyuan" && ./deploy.sh
   ```

   The script performs these steps automatically:
   - [1/5] Local build (`npm run build` → generates `dist/`)
   - [2/5] Create remote directory on server (`/home/ubuntu/laoxueyuan_<timestamp>`)
   - [3/5] Upload `dist/` and `Dockerfile` via SCP
   - [4/5] Build Docker image and start container on server
   - [5/5] Verify deployment (HTTP 200 check)

4. **Report the result** — After the script completes, report:
   - Success: access URL `http://118.25.186.95:8083`
   - Failure: show the error output and diagnose using `references/server-info.md`

## Common Error Diagnosis

| Error | Cause | Fix |
|---|---|---|
| `Permission denied (publickey,password)` | SSH key not authorized on server | Re-add public key to `~/.ssh/authorized_keys` on server |
| `mkdir: cannot create /root` | Wrong remote path | Ensure `REMOTE_DIR` in `deploy.sh` uses `/home/ubuntu/` |
| `Docker permission denied` | ubuntu not in docker group | `ssh -i lighthouse.pem ubuntu@118.25.186.95 "sudo usermod -aG docker ubuntu"` |
| Browser cannot open URL | Firewall port not open | Add TCP 8083 rule in Tencent Cloud console firewall settings |
| Build fails (TypeScript errors) | Code has type errors | Fix errors first, then re-deploy |

## References

- Server details: `references/server-info.md`
