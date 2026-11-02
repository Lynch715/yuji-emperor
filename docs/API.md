# API 接入依据

核对日期：2026-10-31。

- DeepSeek 官方模型页：https://api-docs.deepseek.com/quick_start/pricing/ 。阶段 8 按用户要求对齐参考实现：预设 `deepseek-v4-flash`，可选 `deepseek-v4-pro`；早前核对官方模型页时列出的名称为 `deepseek-flash`，接口 `https://api.deepseek.com`；`thinking.type=enabled/disabled`，依据：https://api-docs.deepseek.com/guides/thinking_mode/ 。用户可自行填写其他兼容模型名。
- 千问地域端点依据：https://help.aliyun.com/en/model-studio/base-url 。预设北京、新加坡、弗吉尼亚的 DashScope 兼容域名；也允许填写工作空间专用域名。密钥地域需匹配。
- 自定义接口仅发送通用 Chat Completions 参数；思考开关由该服务端决定。
- 每回合共享最多 4 次请求 / 240 秒；网络重试与 JSON 修复重试都计入。重试复用已经持久化的预演，不允许通过刷新或改行动重新掷骰。
- 密钥默认仅在当前内存保留；明确勾选“在本机记住密钥”才存浏览器。导出游戏不含密钥。指标不存正文、请求体、地址或密钥。错误提示不透传供应商响应体。
- 页面直连接口需供应商允许 CORS。尚无真实测试密钥，已通过注入式 OpenAI 兼容响应验证流式、用量、错误、超时与预算；不把它视为真实付费接口验收。

阶段 8 的千问三地域默认统一为 reference 中的 `qwen3.8-flash`，备选 `qwen3.7-plus` / `qwen3.8-max`。设置页给出各预设说明，保留已有自填模型，不静默替换用户配置。这是参考预设对齐记录，不等同于当前服务商已做真实接口联调。
