# 项目：《御极》皇帝模拟器
你在开发一个接入用户自己大模型 API 的网页文字游戏。完整设计见 DESIGN.md，所有数值、规则、提示词以它为准；如需偏离，先在 PR 说明里写理由。
参考实现：仓库里的 reference/qiuxiantu.html（求仙途）。可以借鉴它的 API 接入层、回合事务（预演→校验→一次提交）、JSON 宽松解析、存档与恢复、面谈系统、起居注；不要复制它的界面布局、配色和修仙题材内容。

## 硬性原则
1. 引擎记账、模型叙事：所有数值变化只能经由 src/core 的纯函数产生；模型返回的数值一律经 validate 翻译成效果包并截断。
2. 回合是事务：forecastTurn 在深拷贝上推进时间和掷骰；模型调用失败时重试不重掷；commitTurn 幂等（同一 turnId 只提交一次）。
3. src/core 与 src/llm/prompts、src/llm/validate 不得访问 DOM、localStorage、fetch；全部可在 Node 里 `node --test` 运行。
4. 随机数一律走 core/rng.js，可注入种子，测试必须可复现。
5. 存档向后兼容：任何结构改动都要升 S.v 并在 migrate() 里补字段；读档失败进入只读保护模式，不得覆盖原存档。
6. 最终产物是单文件 index.html（scripts/build.mjs 把 src 拼进去），可直接部署到 GitHub Pages；不引入框架和构建依赖。
7. 界面全部中文；触控目标 ≥44px；手机宽度 360px 下无横向滚动。
8. 每阶段结束：跑测试、跑 200 年无模型模拟（mock LLM）、更新 CHANGELOG.md。

## 浏览器验收
使用新版 Codex In-app Browser，通过 localhost 提供页面；连接失败按故障排查流程恢复，确认无法恢复后才使用 Chrome。
