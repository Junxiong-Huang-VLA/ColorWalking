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

## 原创保护
本项目视觉、文案、品牌设定（含“五彩斑斓的小羊卷”）默认归 ColorWalking 项目版权所有。
详见 `COPYRIGHT.md`。
