# ColorWalking

ColorWalking 是一个幸运色抽取网站，帮助用户每天通过简单仪式获得更好的心情体验。

## 项目结构
- `apps/site`: 官网与网页版幸运色转盘（Vite + React）
- `packages/shared`: 色盘与抽取逻辑共享模块

## 本地运行

1. 安装依赖
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install-deps.ps1
```

> 说明：仓库已配置 `.npmrc` 使用 `node-linker=hoisted`，用于保证 React Native / Expo 在 pnpm 工作区下的稳定构建。

2. 启动网站
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-site.ps1
```

3. 启动后端（候补上传 / 桥接 / E2E / 二次触达）
```powershell
pnpm run local:backend
```

4. 运行 E2E 基线
```powershell
pnpm run test:e2e
```

后端 API 与环境变量说明见：`docs/backend-integration.md`

5. 启动前端（自动指向本地后端）
```powershell
pnpm run local:site
```

6. 验证后端是否有数据
```powershell
pnpm run local:verify
```

## 最简单操作（只看这段）
1. 一条命令启动后端 + 前端：
```powershell
pnpm run local:demo
```
2. 打开：
`http://127.0.0.1:5173/?demo=1&internal=1`
3. 演示后检查闭环数据：
```powershell
pnpm run local:check
```

## 生产部署
- Vercel 项目建议配置：
  - Root Directory: 仓库根目录（不要设为 `apps/site`，否则不会包含根目录 `api/[...route].js`）
  - Build Command: `pnpm run build:site`
  - Output Directory: `apps/site/dist`
  - Install Command: `pnpm install --frozen-lockfile`
  - 必配环境变量：`WAITLIST_BACKEND_URL`
  - 可选环境变量：`WAITLIST_BACKEND_TOKEN`

## 双地办公快速同步（公司/家里）
- 回家开工前先拉最新：
```powershell
npm run sync:pull
```
- `sync:pull` 现在会在工作区不干净时自动 `stash -u`，拉取完成后自动恢复本地改动。
- 在任意地点改完后一键提交并推送：
```powershell
npm run sync:push
```
- 需要自定义提交信息时：
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\sync-push.ps1 -Message "feat: your message"
```

### 同步相关默认忽略项
- `AGENTS.md`
- `apps/mobile/eas-log-*.txt`
- `apps/site/public/downloads/*.apk`

## 浏览器下载 APK（Android）
1. 登录 Expo（首次需要）：
```powershell
npm run eas:login
```
2. 触发云端构建 APK（会输出可下载链接）：
```powershell
npm run build:apk
```
3. 将 APK 发布到站点下载目录：
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\publish-apk-to-site.ps1 -ApkPath "D:\path\to\your.apk"
```
4. 部署站点后浏览器下载：
- `/downloads/colorwalking-latest.apk`

## GitHub Actions 云端构建 APK
已内置工作流：`.github/workflows/build-android-apk.yml`

1. 在 GitHub 仓库设置 `Settings -> Secrets and variables -> Actions` 新增 `EXPO_TOKEN`
2. 打开 `Actions -> Build Android APK (EAS) -> Run workflow`
3. 构建日志里会输出 EAS Build 链接，可直接下载 APK

## 原创保护
本项目视觉、文案、品牌设定（含“五彩斑斓的小羊卷”）默认归 ColorWalking 项目版权所有。
详见 `COPYRIGHT.md`。
