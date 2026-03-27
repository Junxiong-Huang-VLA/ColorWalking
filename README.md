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

2. 启动网站
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-site.ps1
```

## 生产部署
- Vercel 项目建议配置：
  - Root Directory: `apps/site`
  - Build Command: `pnpm run build`
  - Output Directory: `dist`
  - Install Command: `pnpm install --frozen-lockfile`

## 双地办公快速同步（公司/家里）
- 回家开工前先拉最新：
```powershell
npm run sync:pull
```
- 在任意地点改完后一键提交并推送：
```powershell
npm run sync:push
```
- 需要自定义提交信息时：
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\sync-push.ps1 -Message "feat: your message"
```

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
