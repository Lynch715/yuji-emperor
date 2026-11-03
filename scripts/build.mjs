import { readFile, writeFile } from "node:fs/promises";
import { resolve, relative, dirname } from "node:path";
const root = resolve(import.meta.dirname, ".."),
  modules = new Map();
async function bundle(file) {
  const absolute = resolve(root, file),
    id = relative(root, absolute).replaceAll("\\", "/");
  if (modules.has(id)) return id;
  modules.set(id, "");
  let code = await readFile(absolute, "utf8");
  const imports = [
    ...code.matchAll(/^import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"];?$/gm),
  ];
  for (const match of imports) {
    const dep = await bundle(
      relative(root, resolve(dirname(absolute), match[2])),
    );
    code = code.replace(
      match[0],
      "const {" +
        match[1].replace(/\s+as\s+/g, ":") +
        "} = __load(" +
        JSON.stringify(dep) +
        ");",
    );
  }
  const exports = [
    ...code.matchAll(
      /^export\s+(?:async\s+)?(?:function|const|let|class)\s+([\w$]+)/gm,
    ),
  ].map((m) => m[1]);
  code = code.replace(/^export\s+/gm, "");
  // Remove indentation only when JS cannot contain a multiline literal.
  // Preserve all newlines (ASI), templates, escapes and regular expressions.
  if(!code.includes(String.fromCharCode(96))&&!/\\\r?\n/.test(code))code=code.split("\n").map(line=>line.trimStart()).join("\n").replace(/\n{2,}/g,"\n");
  modules.set(id, code + "\nreturn {" + exports.join(",") + "};");
  return id;
}
const entry = await bundle("src/ui/app.js");
const js =
  '(() => { "use strict"; const __modules = {' +
  [...modules]
    .map(
      ([id, code]) =>
        JSON.stringify(id) + ":function(__load){\n" + code + "\n}",
    )
    .join(",\n") +
  "}; const __cache={}; function __load(id){return __cache[id] || (__cache[id]=__modules[id](__load));} __load(" +
  JSON.stringify(entry) +
  ");})();";
const template = await readFile(resolve(root, "src/ui/shell.html"), "utf8"),
  css = await readFile(resolve(root, "src/ui/style.css"), "utf8");
await writeFile(
  resolve(root, "index.html"),
  template
    .replace("/* INLINE_CSS */", css.split("\n").map(line=>line.trim()).join("\n"))
    .replace("/* INLINE_JS */", js.replace(/<\/script/gi, "<\\/script")),
);
console.log(
  "已构建 index.html · " +
    modules.size +
    " 个模块 · " +
    Buffer.byteLength(js) +
    " 字节脚本",
);
