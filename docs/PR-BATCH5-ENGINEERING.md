# 批次 5 工程 E1–E4

长局的正文和台账此前反复写入存档位与 localStorage，待续还会复制历史。现在已封存分卷独立追加到 IndexedDB，存档位保留近期章节与目录，恢复副本只保留核心进度。导出仍生成包含各卷的完整 `YUJI1` JSON。

基于最新 main `fe84b59` 创建 `codex/audit-batch5-engineering`。按用户确认，先以合并提交 `d7e971c` 引入批次 2–4 的 `41605e9`，保留 main 的移动端修复，再实施本批。因而相对 main 的 PR 含前置批次；本批的独立工程差异为 `d7e971c..HEAD`。本次草稿 PR 不合并、不部署。

## 逐条改动与回归

每条均先运行失败测试，再修改代码；RED 日志仅本地留存于 `qa/batch5/*-red.log`。`qa/batch2`–`qa/batch5` 仅跟踪各批的 `summary.json`，37 份原始输出已取消跟踪，文件全部保留本地。C0 历史摘要、格式化固定哈希和浏览器结果已合入对应摘要，测试不依赖本地原始文件。最终全套测试和验收见 [ACCEPTANCE](ACCEPTANCE.md)。

附件精简复验：`npm test` **261/261**、simulate **200 年**通过；无原始附件的干净文件快照中 E3 通过。37 个原始文件（8,989,212 字节）逐一核对 SHA256 保持不变，运行单文件字节不变；详情见 [批次 5 摘要](../qa/batch5/summary.json) 的 `artifactCleanup`。本次更新不重写历史、不放宽任何验收门槛。

| 条目 | 改动文件 | 测试名 | 结果 |
|---|---|---|---|
| E1 存储布局 | `src/store/save.js`、`layout.js`、`checksum.js`；`src/core/state.js`、`turn.js`、`archive.js`；`src/llm/prompts.js` | 「E1 分卷只追加IDB、主档仅目录，恢复副本无正文，待续无历史副本且旧预演不重掷」；「E1 归档账目同路径同来源合并，净零剔除且不同来源不串账」 | 通过。存档 v8 / IDB v3；近期最多 36 旬；归档按同 path、同 source 合并并剔除净零；只追加独立分卷，目录含校验值。正文提示词从 base 取历史，待续不保存历史副本。 |
| E1 恢复与导出 | `src/store/preview-delta.js`、`layout.js`、`save.js`；`scripts/batch5-storage.mjs`；`test/polish.test.js` | 「E1 待续恢复副本不复制未变核心，读回后原骰和预演账目一致」；「E1 one thousand played turns keep history exportable, no duplicate receipts or blocked states」 | 通过。7200 旬每旬保存含 3×300 字模拟正文；前 1000 旬每旬完整导出、导入新存储后整个状态 SHA256 一致，另对 1000 章逐章比对。含待续主档峰值 1,802,914 字节，恢复副本峰值 737,431 字节。 |
| E1 迁移与保护 | `src/core/state.js`、`src/store/save.js`；`test/fixtures/v7-pending.json`、`test/batch5-engineering.test.js` | 「E1 v1至v3旧外壳与待续保留硬结果，v8补分卷目录」；「E1 旧档隐式选折迁移为显式ID；缺卷不得冒充完整JSON导出」；「E1 分卷遗失或校验不符进入只读保护，不覆盖原档」；「E1 分卷目录损坏进入只读保护而不是当作空目录覆盖」；「E1 只有分卷目录的原始主档不可作为完整导入写入空位」 | 全通过。v1–v7 可读；v4–v7 使用旧引擎生成的真实 pending 夹具，v1–v3 外壳保留原预演；原骰、RNG、结算不重算。目录损坏或缺卷锁定原档；不完整原始主档不能冒充全本导入。 |
| E1 写入与封存 | `src/store/debounce.js`、`save.js`；`src/ui/app.js` | 「E1 排程去抖800ms且关键保存可立即冲刷」；「E1 封存只写IDB且第六份提示导出而不覆盖旧卷」；「E1 回合预演和提交不重复遍历不可变的旧分卷」 | 全通过。排程 800ms 去抖，起驾 / 导出 / 切卷冲刷；冲突比较只使用 revision + checksum。新旧局封存仅写 IDB，满 5 份阻止替换并提示导出；用户确认已备份后才可移出目录。真实浏览器验证 IDB v2→v3、分卷恢复、陈旧写者冲突、待续核心恢复与手机排程刷新。 |
| E2 | `src/ui/icon.js`、`src/ui/assets/app-icon-{32,180,192}.png`、`docs/icons/app-icon-{512,1024}.png`；`scripts/build.mjs`；`test/ui-audit.test.js` | 「E2 图标只保留32、180、192且单文件小于400KB」 | 通过。运行图标仅 3 尺寸、调色板 PNG，icon.js <60KB；大图仅在 docs。构建去除安全模块缩进和 CSS 缩进，不加构建依赖；最终单文件小于用户指定的 400,000 字节。 |
| E3 | `src/ui/render.js`、`memorials.js`、`style.css`；`scripts/batch5-format-proof.mjs` | 「E3 三个界面文件无长单行且七路径预演哈希不变」 | 通过。按逻辑换行、原长 HTML 字面量拆为等值字符串；3 文件无 ≥200 字符的长行。Stage 9 的 court3 / batch6 / discuss / hold / accountability / remark / debate，格式化前后完整 forecast 的 7 个 SHA256 全相同。 |
| E4 | `src/core/edicts.js`、`private.js`、`turn.js`、`state.js`；显式选折的旧测试适配 | 「E4 私下行动复用传入骰子不改RNG、上朝批折必须显式选折、事实先查类型」 | 通过。删除无用导入；私下行动复用本旬 die；缺少 memorials 明确报错（显式空列表允许）；fact.reason 先检查字符串类型再 includes。旧档原有隐式排程仅迁移为明确的前三本 ID，旧 pending 不重算。 |

## 数值与兼容选择

- **执行度系数选 ×1**：保留现行 `(die−10.5)×1`，没有采用 DESIGN 属性检定中的 ×4。执行度另有加权分和五档兑现，随机范围由 ±9.5 改为 ±38 会重调下旨平衡，超出工程范围。一般属性判定继续使用 `rng.js` 的 ×4；本旬天命骰由 forecast 传给私下行动。该决定在修改前已写入本说明。
- **存档升级 v8**：前置批次已升至 v7，本批新增目录与 detached forecast，按 AGENTS 硬性原则继续升 v8，而非回退为审计最初假定的 v5。IDB 另升至 v3；正常导出的外壳仍是 `YUJI1`，payload 包含完整各卷。内部恢复副本的预演差量会在读入时还原为正常 forecast，只编码未变核心，绝不重新预演。
- **导入上限 150MB**：200 年完整 JSON 实测 84,048,441 字节，旧 30MB 上限无法导回本程序自己的长局导出，因此提升至 150MB；依然要求校验和、结构验证和空白且未受保护的目标位。主档 / 恢复副本的小体积门槛不变。
- **封存上限与旧副本**：新封存只写 IDB，满 5 份提示先导出，再由用户确认移出已备份封存，不静默淘汰。历史版本已写在 localStorage 的旧封存只读兼容，不自动删除用户唯一旧备份，也不再往 localStorage 增加封存。`volumes` 始终只追加。
- **构建门槛**：按本轮用户明确要求采用 <400KB；审计表的旧 <350KB 目标未作为本轮门槛。没有引入框架、压缩库或新的运行 / 构建依赖。

## 验证口径与边界

`npm test` 全绿；`npm run simulate` 完成 200 年；`npm run balance` 完整运行，退出码 1，原 7 项失败保持原值，**新增 0 项**，施工前后完整报告逐字段一致。未修改模拟器策略、种子、事件或断言；基线取合入批次 2–4 后的 `d7e971c`，不拿 main 的旧规则作比较。具体七项与证据链接见 [ACCEPTANCE](ACCEPTANCE.md)。

200 年存储压力使用同一 runId、自由模式与 400 岁寿数，仅防止死亡或亡国切局掩盖积累，3 段正文每段恰好 300 字，每旬真实调用 SaveStore。它与普通 simulate / balance 分开，不用于声称平衡通过。第一轮发现 pending 恢复副本 1,360,499 字节超标，补失败回归与内部差量编码后，完整重跑同一 7200 旬 / 1000 次往返并达标，未缩减测试。

浏览器使用 Codex In-app Browser，经 localhost:4190 / 127.0.0.1:4190 的隔离测试存档验证；未访问用户正式存档、未调用真实付费 API。360px 无横向滚动，排程保存刷新和起驾提交刷新通过；不宣称完成实体手机软键盘、真实 API 或在线部署验收。
