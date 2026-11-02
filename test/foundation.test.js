import test from "node:test";
import assert from "node:assert/strict";
import { parseJSONLoose, validateProbe } from "../src/llm/validate.js";
import {
  callJSON,
  createBudget,
  endpoint,
  readResponse,
  requestBody,
} from "../src/llm/client.js";
import { createSaveStore, pack, unpack } from "../src/store/save.js";
const state = { v: 1, runId: "fixture", turn: 0 };
function adapters() {
  const p = new Map(),
    b = new Map();
  return {
    p,
    b,
    primary: { get: async (k) => p.get(k), put: async (k, v) => p.set(k, v) },
    backup: { getItem: (k) => b.get(k), setItem: (k, v) => b.set(k, v) },
  };
}
const config = {
  key: "test-secret",
  model: "fixture",
  base: "http://127.0.0.1:1",
  provider: "custom",
};
const sse = (content, tail = "data: [DONE]\n\n") =>
  new Response(
    "data: " +
      JSON.stringify({ choices: [{ delta: { content } }] }) +
      "\r\n\r\n" +
      tail,
    { headers: { "Content-Type": "text/event-stream" } },
  );
test("JSON repairs fenced, punctuation, truncated strings and quotes without executing code", () => {
  assert.deepEqual(
    parseJSONLoose("```json\n{“ok”：true，“message”：“已接通”}\n```"),
    { ok: true, message: "已接通" },
  );
  assert.equal(
    parseJSONLoose('{"text":"臣曰"准奏"。","list":[1,2,]}').text,
    '臣曰"准奏"。',
  );
  assert.deepEqual(parseJSONLoose('{"text":"半章'), { text: "半章" });
  assert.throws(() => parseJSONLoose("(()=>alert(1))()"));
  assert.throws(() => parseJSONLoose('{"__proto__":{}}'));
  assert.throws(() => validateProbe({ ok: true, message: 4 }));
});
test("stream consumes split UTF-8, CRLF and ignores reasoning", async () => {
  const text =
    "data: " +
    JSON.stringify({ choices: [{ delta: { reasoning_content: "hidden" } }] }) +
    "\n\ndata: " +
    JSON.stringify({
      choices: [
        {
          delta: { content: '{"ok":true,"message":"你好"}' },
          finish_reason: "stop",
        },
      ],
    }) +
    "\n\ndata: [DONE]";
  const bytes = new TextEncoder().encode(text),
    pieces = [];
  for (let i = 0; i < bytes.length; i += 3) pieces.push(bytes.slice(i, i + 3));
  const stream = new ReadableStream({
      start(c) {
        for (const p of pieces) c.enqueue(p);
        c.close();
      },
    }),
    partials = [];
  const r = await readResponse(new Response(stream), (s) => partials.push(s));
  assert.equal(JSON.parse(r.text).message, "你好");
  assert.equal(partials.length, 1);
});
test("missing stream termination does not commit a silently cut response", async () => {
  await assert.rejects(() => readResponse(sse("{}", "")), /STREAM_CUT/);
});
test("network errors and 429 retry within one shared four-request budget, metrics contain no content", async () => {
  let count = 0;
  const metrics = [],
    budget = createBudget(),
    partials = [];
  const value = await callJSON(
    config,
    [{ role: "user", content: "private正文" }],
    {
      budget,
      sleep: async () => {},
      validate: validateProbe,
      onMetric: (m) => metrics.push(m),
      onPartial: (s) => partials.push(s),
      fetcher: async () => {
        count++;
        if (count === 1) throw new Error("contains test-secret private正文");
        if (count === 2) return new Response("", { status: 429 });
        return sse('{"ok":true,"message":"好"}');
      },
    },
  );
  assert.equal(value.ok, true);
  assert.equal(count, 3);
  assert.equal(budget.used, 3);
  assert.ok(!JSON.stringify(metrics).includes("test-secret"));
  assert.ok(!JSON.stringify(metrics).includes("private正文"));
  assert.equal(partials.at(-1), '{"ok":true,"message":"好"}');
});
test("401 does not retry and provider body cannot leak credentials", async () => {
  let count = 0;
  await assert.rejects(
    () =>
      callJSON(config, [], {
        fetcher: async () => {
          count++;
          return new Response("test-secret", { status: 401 });
        },
      }),
    /HTTP 401/,
  );
  assert.equal(count, 1);
});
test("format and network retries share total budget", async () => {
  const b = createBudget();
  let count = 0;
  await assert.rejects(() =>
    callJSON(config, [], {
      budget: b,
      sleep: async () => {},
      fetcher: async () => {
        count++;
        return sse("not json");
      },
    }),
  );
  assert.equal(count, 4);
  await assert.rejects(
    () => callJSON(config, [], { budget: b, fetcher: () => assert.fail() }),
    /预算/,
  );
});
test("absolute deadline stops a hanging request", async () => {
  const b = { used: 0, deadline: Date.now() + 20 };
  await assert.rejects(
    () =>
      callJSON(config, [], { budget: b, fetcher: () => new Promise(() => {}) }),
    /240 秒/,
  );
  assert.equal(b.used, 1);
});
test("provider thinking and regional endpoints", () => {
  assert.equal(
    requestBody({ ...config, provider: "deepseek", thinking: true }, [])
      .thinking.type,
    "enabled",
  );
  assert.equal(
    requestBody({ ...config, provider: "qwen_us" }, []).enable_thinking,
    false,
  );
  assert.equal(
    endpoint("https://example.com/v1/"),
    "https://example.com/v1/chat/completions",
  );
  assert.throws(() => endpoint("https://key@example.com"));
  assert.throws(() => endpoint("http://example.com"));
});
test("three slots, refresh, checksums and export/import", async () => {
  const a = adapters();
  let s = createSaveStore(a);
  await s.save(1, state);
  await s.save(2, { ...state, runId: "other" });
  s = createSaveStore(a);
  assert.equal((await s.load(1)).state.runId, "fixture");
  const raw = s.exportJSON({ ...state, turn: 10 });
  await s.importJSON(3, raw);
  assert.equal((await s.load(3)).state.turn, 10);
  await assert.rejects(() => s.importJSON(1, raw), /空白/);
  assert.throws(() => unpack(raw.replace("fixture", "ficture")));
});
test("corrupt primary preserves both original copies and locks writes", async () => {
  const a = adapters(),
    s = createSaveStore(a);
  await s.save(1, state);
  a.p.set(1, "broken");
  const before = JSON.stringify([...a.b]);
  const loaded = await s.load(1);
  assert.equal(loaded.readOnly, true);
  assert.equal(loaded.state.runId, "fixture");
  await assert.rejects(() => s.save(1, state), /保护模式/);
  assert.equal(a.p.get(1), "broken");
  assert.equal(JSON.stringify([...a.b]), before);
});
test("divergent branches protect, consecutive interrupted backup can recover", async () => {
  const a = adapters();
  a.p.set(1, pack(state, 2));
  a.b.set("yuji:slot:1", JSON.stringify(pack({ ...state, turn: 1 }, 2)));
  assert.equal((await createSaveStore(a).load(1)).readOnly, true);
  const old = pack(state),
    next = pack({ ...state, turn: 1 }, 2, old.checksum);
  a.p.set(2, next);
  a.b.set("yuji:slot:2", JSON.stringify(old));
  const r = await createSaveStore(a).load(2);
  assert.equal(r.readOnly, false);
  assert.equal(r.state.turn, 1);
});
test("multi-tab stale writer is refused", async () => {
  const a = adapters(),
    s1 = createSaveStore(a),
    s2 = createSaveStore(a);
  await s1.save(1, state);
  await s2.load(1);
  await s1.save(1, { ...state, turn: 1 });
  await assert.rejects(() => s2.save(1, { ...state, turn: 2 }), /其他页面/);
});
test("one storage backend failing uses the other, both failing never report success", async () => {
  const a = adapters();
  a.primary.put = async () => {
    throw new Error("quota");
  };
  const s = createSaveStore(a);
  assert.equal((await s.save(1, state)).warnings.length, 1);
  assert.equal((await s.load(1)).state.turn, 0);
  a.backup.setItem = () => {
    throw new Error("quota");
  };
  await assert.rejects(() => s.save(1, state), /未能写入/);
});
test("unreadable storage cannot be mistaken for an empty slot and overwritten", async () => {
  const a = adapters();
  a.primary.get = async () => {
    throw new Error("blocked");
  };
  const s = createSaveStore(a),
    l = await s.load(1);
  assert.equal(l.readOnly, true);
  await assert.rejects(() => s.save(1, state), /保护模式/);
  assert.equal(a.p.size, 0);
});
test("starting over archives the complete previous game before replacing a full slot", async () => {
  const a = adapters(),
    s = createSaveStore(a),
    old = { ...state, emperor: { name: "旧帝" } };
  await s.save(1, old);
  await s.archiveAndSave(1, { ...old, runId: "next" });
  assert.equal((await s.load(1)).state.runId, "next");
  const archives = await s.listArchives();
  assert.equal(archives.length, 1);
  assert.equal(unpack(archives[0].data).state.runId, "fixture");
  assert.equal(archives[0].raw.length, 2);
});
test("failed archival never replaces old progress", async () => {
  const a = adapters(),
    s = createSaveStore(a),
    old = { ...state, emperor: { name: "旧帝" } };
  await s.save(1, old);
  a.backup.setItem = (k, v) => {
    if (k.startsWith("yuji:archive")) throw new Error("quota");
    a.b.set(k, v);
  };
  await assert.rejects(
    () => s.archiveAndSave(1, { ...old, runId: "new" }),
    /旧卷未能封存/,
  );
  assert.equal((await s.load(1)).state.runId, "fixture");
});
test("repeated backup quota failures keep valid newer primary traceable on refresh", async () => {
  const a = adapters(),
    s = createSaveStore(a);
  await s.save(1, state);
  a.backup.setItem = () => {
    throw new Error("quota");
  };
  for (let turn = 1; turn <= 4; turn++) await s.save(1, { ...state, turn });
  const refreshed = await createSaveStore(a).load(1);
  assert.equal(refreshed.readOnly, false);
  assert.equal(refreshed.state.turn, 4);
});
test("5xx retry and non-stream JSON fallback preserve usage metrics", async () => {
  let count = 0;
  const metrics = [];
  const r = await callJSON(config, [], {
    sleep: async () => {},
    validate: validateProbe,
    onMetric: (m) => metrics.push(m),
    fetcher: async () =>
      ++count === 1
        ? new Response("", { status: 503 })
        : new Response(
            JSON.stringify({
              choices: [
                {
                  message: { content: '{"ok":true,"message":"已接通"}' },
                  finish_reason: "stop",
                },
              ],
              usage: { prompt_tokens: 12, completion_tokens: 8 },
            }),
            { headers: { "Content-Type": "application/json" } },
          ),
  });
  assert.equal(r.ok, true);
  assert.equal(count, 2);
  assert.equal(metrics[1].inputTokens, 12);
});
test("cancelling a hanging request consumes one attempt and stops without retry", async () => {
  const ac = new AbortController(),
    b = createBudget(),
    metrics = [];
  const timer = setTimeout(() => ac.abort(), 10);
  try {
    await assert.rejects(
      () =>
        callJSON(config, [], {
          signal: ac.signal,
          budget: b,
          onMetric: (m) => metrics.push(m),
          fetcher: () => new Promise(() => {}),
        }),
      /取消/,
    );
    assert.equal(b.used, 1);
    assert.equal(metrics[0].result, "cancelled");
  } finally {
    clearTimeout(timer);
  }
});
