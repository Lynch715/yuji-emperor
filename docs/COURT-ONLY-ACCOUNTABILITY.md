# 问责入口仅保留在上朝

- 日期：2026-11-06。
- 分支：`codex/court-only-accountability`。
- 基线：`main` / `d5a959647c86a15f342a4e12dca9fcddada1d899`。
- 状态：本地开发与验收，等待玩家测试；不合并、不推送、不部署。

## 改动

`src/ui/memorials.js` 只调整“问责”按钮的显示条件：当前批阅行动必须是“上朝”，且上奏人仍在世。普通批折和摄政批折不再提供按钮；上朝保留原有问责对象、点选与提示。准驳、朱批、时辰和选折功能不变。

## 存档与进度

本次仅改界面条件，仍使用存档 v24；没有改动核心引擎、迁移、数据库、卷位或备份键。

- 已有进度载入、打开拟批页面均不改写原存档。
- 旧批折日程若已安排“当廷问责”，保留原立场、对象和结算；编辑时不再出现新增问责按钮，原已排提示仍保留，避免玩家不知情时改变原计划。
- 冻结待续不重新预演、不重掷骰、不重复记账。专项核对原骰13、钱粮、人物及重复提交均保持；与基线引擎预演逐项一致。
- 专项兼容结果：[compatibility.json](court-only-accountability-evidence/compatibility.json)。

## 验收

- `npm test`：595/595通过，约275秒；[完整日志](court-only-accountability-evidence/npm-test.log)。本次是单项界面条件调整，沿用现有回归，不增加重复实现的测试。
- `node scripts/simulate.mjs 200 '仅上朝问责两百年'`：200年/7200旬、5朝，状态断言通过；[完整输出](court-only-accountability-evidence/simulate-200.json)。
- `npm run build`：95模块，`index.html` 817523字节，小于原830000字节预算。
- 新版 Codex In-app Browser，独立端口 `http://127.0.0.1:49639`，新建自拟王朝和宋仁宗试读卷；未操作正式站点或玩家存档。

| 验收场景 | 结果 |
| --- | --- |
| 1280×900批折 | 问责按钮0个；正常显示奏文、准驳与朱批 |
| 360×800批折 | 问责按钮0个 |
| 1280×900上朝 | 问责按钮1个；点选后按下状态为true，显示原当廷问责提示 |
| 360×800上朝 | 问责按钮仍在，触控高度44px |
| 宋仁宗摄政批折 | 问责按钮0个 |
| 批折全流程 | 依票拟、逐本确认、入日程、起驾结案通过，进入第2旬 |
| 刷新恢复 | 新试读宋仁宗卷正常恢复 |
| 横向布局 | 桌面1280/1280、手机360/360，无横向溢出 |
| 控制台 | error 0、warn 0 |

[浏览器记录](court-only-accountability-evidence/browser.json) · [桌面批折](court-only-accountability-evidence/desktop-batch.jpg) · [手机批折](court-only-accountability-evidence/mobile-batch.jpg) · [桌面上朝](court-only-accountability-evidence/desktop-court.jpg) · [手机上朝](court-only-accountability-evidence/mobile-court.jpg) · [摄政批折](court-only-accountability-evidence/regency-batch.jpg)
