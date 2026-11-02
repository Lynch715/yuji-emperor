# 御极 · 应用图标

使用内置 **imagegen** 制作，以朱砂御印、暗金篆意字和深色案面呼应「夜御案」。主体为单字「御」，保留充分外缘，供桌面和手机系统裁切。

## 文件与网页接入

- [1024px PNG](../src/ui/assets/app-icon-1024.png)：通用高清图标。
- [512px PNG](../src/ui/assets/app-icon-512.png) / [192px PNG](../src/ui/assets/app-icon-192.png)：桌面安装清单。
- [180px PNG](../src/ui/assets/app-icon-180.png)：Apple 触控图标。
- [32px PNG](../src/ui/assets/app-icon-32.png)：网页标签页。
- [ICO](../src/ui/assets/favicon.ico)：包含16 / 32 / 48 / 64 / 128 / 256px。
- [生成原图](../src/ui/assets/app-icon-original.png)：保留原始生成结果；各尺寸只作等比采样和格式导出。

所有网页所需图标以 data URL 打包进 index.html，不依赖额外静态图片请求。安装清单在当前站点目录生成，清除页面查询参数和锚点；包含「御极」名称、同源启动地址、独立窗口模式与192 / 512图标。favicon、Apple触控图标和manifest已在实际页面确认存在。本轮未执行浏览器安装或操作系统“添加到程序坞”，也未新增离线缓存。

## 实际生成提示词

工具：内置 imagegen，非 CLI。原图与导出文件均已保存在本项目。

```text
Use case: logo-brand. Asset type: finished desktop web-app icon for the Chinese imperial text management game 御极. Create one single square app icon, flat frontal view, full-bleed solid deep ebony-brown field matching #1C1714. Center a bold cinnabar-red imperial seal, slightly softened square corners, generous breathing room and an elegant restrained aged-gold outline. Inside the red seal engrave exactly the single Chinese character “御” in highly legible traditional seal-inspired Chinese lettering, warm ivory-gold ink, broad strokes, balanced, correct character structure. Very subtle carved seal material and paper-grain craftsmanship, crisp silhouette, premium restrained scholarly imperial aesthetic, consistent with a dark wooden emperor's writing desk and vermilion annotations. Designed to remain recognizable at 32px, strong simple shapes, no thin filigree. The central symbol stays inside the middle 70% so OS masks do not cut it. Full-bleed opaque square artwork, no pre-rounded outer canvas, no extra framing or mockup. No crowns, no western heraldry, no scenery, no people, no additional text, no Latin letters, no watermark. 1024 by 1024 square.
```
