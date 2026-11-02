import { readFile, writeFile } from "node:fs/promises";
import { createState } from "../src/core/state.js";
import { initialTurn } from "../src/core/turn.js";
import { selectAmbitions } from "../src/core/ambitions.js";
import { renderApp } from "../src/ui/render.js";
const state = initialTurn(
  selectAmbitions(createState({ seed: "无障碍静态快照" })),
);
const css = await readFile("src/ui/style.css", "utf8");
await writeFile(
  "qa/a11y-game.html",
  '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>御极 · 游戏界面可访问性快照</title><style>' +
    css +
    '</style></head><body><a class="skip" href="#scroll">跳至正文</a><div id="app">' +
    renderApp(state) +
    '</div><div id="notice" role="status" aria-live="polite"></div><dialog id="modal" aria-labelledby="modal-title"></dialog></body></html>',
);
