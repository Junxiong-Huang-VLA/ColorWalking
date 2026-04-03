# 小羊卷上线检查单（初稿）

## A. 产品主链路
- [ ] 移动端主路径完整：`首页 -> 抽色 -> 互动 -> 成长 -> 记忆 -> 候补 -> 返回首页`
- [ ] `pnpm -C apps/site test:e2e:mobile` 通过
- [ ] 候补入口不抢主体验：对外模式下仅在记忆/候补页承接

## B. 模式隔离
- [ ] 默认进入对外模式（无演示控制台、无脚本控制、无桥接调试噪音）
- [ ] `/?mode=demo` 可进入演示模式，显示 Demo 控制台
- [ ] `pnpm -C apps/site exec playwright test e2e/mode-isolation.spec.ts --project=mobile-chromium` 通过

## C. 角色与记忆主链
- [ ] 回复前执行角色宪法约束（短句、低打扰、非通用助手口吻）
- [ ] 回复前执行记忆召回尝试（关系记忆/仪式记忆/情绪记忆）
- [ ] 召回结果影响文本与行为输出：`statusText / eyeState / expression / motionTemplate / voiceStyle`

## D. 幸运色-情绪-动作链
- [ ] 幸运色驱动基础情绪（base emotion）
- [ ] 当前情绪驱动眼睛、围巾、表情、动作、状态短句
- [ ] scene 在基础链路上进行二级调制
- [ ] 互动事件（摸头/抱抱/靠近/今晚陪我）触发真实行为决策

## E. 设备桥接契约
- [ ] 协议结构检查：`pnpm -C apps/site test:bridge:contract`
- [ ] 引擎冒烟检查：`pnpm -C apps/site test:engines`
- [ ] Demo 基线检查：`pnpm -C apps/site test:demo-e2e`

## F. Waitlist Live 前置项
- [ ] 运行前置检查：`pnpm -C apps/site check:waitlist:prereqs -- --strict`
- [ ] 关键环境变量已配置：`WAITLIST_BACKEND_URL`, `WAITLIST_BACKEND_TOKEN`
- [ ] 若启用 Turnstile：`WAITLIST_TURNSTILE_SECRET` 与 `WAITLIST_VERIFY_CAPTCHA_TOKEN` 成对配置
- [ ] Live 联调通过：`pnpm -C apps/site test:waitlist:live`

## G. 发布前最后确认
- [ ] 生产构建通过：`pnpm -C apps/site build`
- [ ] 首页无技术噪音、无演示调试感
- [ ] 记忆页承接连续、关系表达优先于日志表达
- [ ] 候补页文案、状态、失败重试路径可读可用

