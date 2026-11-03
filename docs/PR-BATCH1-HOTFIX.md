# 批次 1 热修：A1、A2、B11–B15

面谈与口谕分类不再耗掉正文额度或让正文在排程期间过期；Google Fonts 不再阻塞首屏。修复面谈秘密与失败台词、午槽锁、预演名册及长局立传输入，并将国库失窃文案标明为户部银库。

仅执行本地审计 `docs/AUDIT-2026-11-02.md` 第 6 节的批次 1。程序版本仍为 0.9.1，存档仍为 **v4**；`state.js`、`migrate()`、存储格式、随机函数和其他批次条目未改。已有 `pending.forecast` 不重算、不重掷。

## 逐条改动与测试

全部新增回归均先在修复前运行失败，再实施修复。9 条新增 Node 测试覆盖 7 个条目；首次失败输出保留于本地 `qa/batch1/red-tests.log`。下表的公共构建产物均为 `index.html`。

| 条目编号 | 改了哪些文件 | 测试名 | 结果 |
|---|---|---|---|
| A1 | `src/ui/app.js`、`src/ui/turn-request.js`、`test/batch1-hotfix.test.js`、`test/turn-request.test.js`、`index.html` | A1 面谈后超过240秒仍可请求正文，三轮面谈与分类不占正文四次额度；A1 待续重载只保留已用次数，重新计时且重试不重掷 | 通过。3 轮面谈与 1 次分类均使用独立请求预算；生成 pending 时新建 `{used:0}`，新预演不夹带旧时钟。正文以本次调用开始计 240 秒，自动重试共用这一时钟；重载或手动再请求重新计时，已用次数继续计入同一 pending 的 4 次上限。401、格式重试和 v4 存取后预演 SHA-256 不变。 |
| A2 | `src/ui/shell.html`、`test/ui-audit.test.js`、`scripts/batch1-font-startup.pw.js`、`index.html` | A2 构建页面头部无同步加载的外域样式表；A2 Google Fonts请求挂起时首屏在2秒内显示 | 通过。字体样式表改为 `media="print"`，加载完成后转 `all`，去掉 googleapis preconnect。360 / 1280px 首屏绘制 68 / 64ms，导航到可见界面 128 / 100ms；测量时字体请求各挂起 1 个，页面宽度等于视口。 |
| B11 | `src/core/court.js`、`src/llm/prompts.js`、`src/llm/validate.js`、`src/ui/app.js`、`test/batch1-hotfix.test.js`、`index.html` | B11 试读心声与普通面谈提示词不泄密，试探成功或已知才提供秘密；B11 未允和越权保留安全推托台词，剔除数字承诺并校验硬事实 | 通过。心声使用好感 / 派系诉求模板；普通 NPC 资料不带 secret / memory / life，只有已知秘密或成功试探才附秘密。未允和越权按句剔除数字及承诺，再复用正文硬事实校验；保留通过检查的推托台词，无安全句才退回模板，模型 effects 始终为 null。 |
| B12 | `src/core/turn.js`、`test/batch1-hotfix.test.js`、`index.html` | B12 面谈落账后午槽不可清空覆盖或换人，正确召见仅扣一次精力 | 通过。`validateSchedule` 检查本旬 talks 对应人物；UI 的 arrange 与引擎 forecast 共用校验。空槽、歇息、下旨、换人均拒绝；正确召见精力 1、面谈拨款只结转一次、提交幂等；过往旬面谈不锁当前旬。应用内浏览器 360px 实走覆盖 / 清空 / 刷新 / 起驾。 |
| B13 | `src/llm/prompts.js`、`test/batch1-hotfix.test.js`、`index.html` | B13 正文名册国势使用预演后状态，包含新人与储君太后宗室外君和前后变化 | 通过。国势、人物和其他当前状态取 `forecast.state`，附钱粮国势及人物前后变化。名册以一人一行补皇帝、皇嗣 / 储君、太后、宗室女、外邦君主。提示词构造不修改输入。 |
| B14 | `src/llm/prompts.js`、`test/batch1-hotfix.test.js`、`index.html` | B14 立传只汇总本朝实录，每年一行至多80行并附引擎统计 | 通过。只取 `accessionTurn <= turn <= state.turn`，同年继位前章节也排除；年度去重提要最多取最近 80 年、每行至多 320 字，附封卷记录内本朝统计。7,200 章测试不含前朝或全文，输入 <40,000 字符；保留原谥庙号。 |
| B15 | `src/core/turn.js`、`test/batch1-hotfix.test.js`、`index.html` | B15 大凶国库扣款明确记为户部银库失窃，内帑与数值公式不变 | 通过。只把“内库失窃”改成“户部银库失窃”。仍扣国库最多 8 万两、心情 -2，既定实损与随机序列不变。 |

`test/stage9-ui.test.js` 的历史源码冻结检查保留未涉热修文件的旧 SHA-256，仅排除本批明确授权的 court / turn / prompts / validate 四文件；原七条界面决定与完整预演哈希仍通过。旧正文“绝对时间过期就永远拒绝”的断言改为新要求，同时保留四次上限、无提交、无重掷检查。

## 完整验证

- `npm test`：**163/163 通过**，0 失败、0 跳过；改动前为 154/154。
- `npm run simulate`：固定种子 **200 年 / 7,200 旬**，完整报告与基线 `fe84b59053c2b1dc89ab973c14d401e1fa3a807f` 完全一致，包括 200 行年度数据。
- 对同一固定种子的每旬提交状态和 forecast 递归提取全部数字字段（保留字段路径及顺序），修复前后 SHA-256 均为 `5df55fe02e1a92e1192f45f8145cac16c2709ffbf7b3017371c158741bb410dd`。B15 只有账目来源文字变化。
- `npm run balance`：四种子各 200 年、四组全歇息策略、108 个低民心场景全部通过；**完整 JSON 与改动前完全一致**。四种子亡国率依次 16.67% / 33.33% / 33.33% / 33.33%，子嗣均值 6.17 / 7 / 5.67 / 7；无数值调参。
- `npm run build`：生成单文件 `index.html`，无新增构建依赖；已有纯函数边界、旧档保护、提交幂等和构建解析测试继续通过。
- 新版 Codex In-app Browser 通过 `http://localhost:4174/` 的独立空卷验收，360px 无横向溢出，已查可见控件均至少 44×44px。字体挂起专项使用独立 Playwright 会话，常规验收保持在应用内浏览器。

本地完整原始输出保存在 `qa/batch1/`，截图在 `output/playwright/`；可随 PR 检查的精简验证数据见 `qa/batch1/summary.json`。字体测试可在 4174 本地服务启动后用 `playwright-cli run-code --filename scripts/batch1-font-startup.pw.js` 重跑。

## DESIGN 与范围说明

本批没有新增数值偏离。B15 按“预先定死一件实损”保留原扣款，只修正名称；没有引入建议中的随机损失分支。A1 只改变请求额度归属和计时，不改变天命骰与效果包。B11 / B12 是保密、叙事与行动约束修复；不改经济、人物数值公式。

**未完成条目：无。** 其他批次均未执行。真实服务商密钥、付费请求、实体手机尚未验收；这里的模型请求来自可控 fixture。草稿 PR 不合并、不部署 Pages。
