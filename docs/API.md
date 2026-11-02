# API 接入依据

核对日期：2026-10-31。

2026-11-02补充：[正文接口链路审计](NARRATION-API-AUDIT.md)完成。连接测试成功后须保存表单；试读存档可点“保存并用于正文”启用后续接口章节。正文使用相同客户端和配置，额外校验朝 / 午 / 夜章节及结算一致性，校验后三段全空不提交；重试仍保留原结算、共用每回合4次 / 240秒预算。已完成本地模拟接口的浏览器验收，真实服务商密钥未代测。

2026-11-01补充：[连接测试误取消修复](SETTINGS-PROBE-FIX.md)已在本地模拟接口回归。DeepSeek当前官方文档仍接受旧名称deepseek-v4-flash，本次不改写用户型号；真实密钥与账户状态仍未代测。

- DeepSeek 官方模型页：https://api-docs.deepseek.com/quick_start/pricing/ 。阶段 8 按用户要求对齐参考实现：预设 `deepseek-v4-flash`，可选 `deepseek-v4-pro`；早前核对官方模型页时列出的名称为 `deepseek-flash`，接口 `https://api.deepseek.com`；`thinking.type=enabled/disabled`，依据：https://api-docs.deepseek.com/guides/thinking_mode/ 。用户可自行填写其他兼容模型名。
- 千问地域端点依据：https://help.aliyun.com/en/model-studio/base-url 。预设北京、新加坡、弗吉尼亚的 DashScope 兼容域名；也允许填写工作空间专用域名。密钥地域需匹配。
- 自定义接口仅发送通用 Chat Completions 参数；思考开关由该服务端决定。
- 每回合共享最多 4 次请求 / 240 秒；网络重试与 JSON 修复重试都计入。重试复用已经持久化的预演，不允许通过刷新或改行动重新掷骰。
- 密钥默认仅在当前内存保留；明确勾选“在本机记住密钥”才存浏览器。导出游戏不含密钥。指标不存正文、请求体、地址或密钥。错误提示不透传供应商响应体。
- 页面直连接口需供应商允许 CORS。尚无真实测试密钥，已通过注入式 OpenAI 兼容响应验证流式、用量、错误、超时与预算；不把它视为真实付费接口验收。

阶段 8 的千问三地域默认统一为 reference 中的 `qwen3.8-flash`，备选 `qwen3.7-plus` / `qwen3.8-max`。设置页给出各预设说明，保留已有自填模型，不静默替换用户配置。这是参考预设对齐记录，不等同于当前服务商已做真实接口联调。
