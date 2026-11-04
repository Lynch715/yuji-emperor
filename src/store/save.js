import { restoreRecovery } from "./preview-delta.js";
import { hashText } from "./checksum.js";
import { storedLayout, recoveryState, sameEnvelope, envelopeIdentity } from "./layout.js";
// Three independent slots. Corruption/conflicts lock the slot; no automatic repair writes.
export function checksum(text){return hashText(text);}
export function pack(state, revision = 1, previous = null) {
  const payload = JSON.stringify(state);
  return {
    format: "YUJI1",
    revision,
    previous,
    checksum: checksum(payload),
    payload,
  };
}
export function unpack(raw) {
  const value = typeof raw === "string" ? JSON.parse(raw) : raw;
  if (
    !value ||
    value.format !== "YUJI1" ||
    !Number.isSafeInteger(value.revision) ||
    value.revision < 1 ||
    typeof value.payload !== "string" ||
    value.checksum !== checksum(value.payload)
  )
    throw new Error("存档校验失败");
  const state = JSON.parse(value.payload);
  if (
    !state ||
    typeof state !== "object" ||
    Array.isArray(state) ||
    !Number.isInteger(state.v) ||
    typeof state.runId !== "string" ||
    !Number.isInteger(state.turn) ||
    state.turn < 0
  )
    throw new Error("存档结构无效");
  return { envelope: value, state };
}
export function createIDB(indexedDB, timeout = 4000) {
  async function open() {
    if (!indexedDB) throw new Error("IndexedDB 不可用");
    return new Promise((resolve, reject) => {
      let settled = false;
      const timer = setTimeout(
        () => finish(new Error("数据库打开超时")),
        timeout,
      );
      const finish = (err, db) => {
        if (settled) {
          db?.close();
          return;
        }
        settled = true;
        clearTimeout(timer);
        err ? reject(err) : resolve(db);
      };
      let rq;
      try {
        rq = indexedDB.open("yuji-emperor", 3);
      } catch (e) {
        finish(e);
        return;
      }
      rq.onupgradeneeded = () => {
        if (settled) {
          rq.transaction.abort();
          return;
        }
        if (!rq.result.objectStoreNames.contains("slots"))
          rq.result.createObjectStore("slots");
        if (!rq.result.objectStoreNames.contains("volumes"))rq.result.createObjectStore("volumes");
        if (!rq.result.objectStoreNames.contains("archives"))
          rq.result.createObjectStore("archives");
      };
      rq.onsuccess = () => finish(null, rq.result);
      rq.onerror = () => finish(rq.error);
      rq.onblocked = () => finish(new Error("数据库被其他页面占用"));
    });
  }
  async function transaction(mode, action, storeName = "slots") {
    const db = await open();
    return new Promise((resolve, reject) => {
      let tx,
        rq,
        settled = false;
      const timer = setTimeout(() => {
        try {
          tx?.abort();
        } catch {}
        finish(new Error("存档读写超时"));
      }, timeout);
      const finish = (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        db.close();
        error ? reject(error) : resolve(rq?.result ?? null);
      };
      try {
        tx = db.transaction(storeName, mode);
        tx.oncomplete = () => finish();
        tx.onerror = tx.onabort = () =>
          finish(tx.error || new Error("存档事务失败"));
        rq = action(tx.objectStore(storeName));
      } catch (e) {
        finish(e);
      }
    });
  }
  return {
    archive: (id, record) =>
      transaction("readwrite", (st) => st.put(record, id), "archives"),
    archives: () => transaction("readonly", (st) => st.getAll(), "archives"),
    removeArchive: id=>transaction("readwrite",st=>st.delete(id),"archives"),
    getVolume: key=>transaction("readonly",st=>st.get(key),"volumes"),
    appendVolume: async(key,volume)=>{
      const existing=await transaction("readonly",st=>st.get(key),"volumes");
      if(existing){if(JSON.stringify(existing)!==JSON.stringify(volume)){const error=new Error('分卷内容冲突，原卷已保留');error.code='VOLUME_CONFLICT';throw error;}return;}
      return transaction("readwrite",st=>st.add(volume,key),"volumes");
    },
    get: (slot) => transaction("readonly", (st) => st.get(slot)),
    put: (slot, record) =>
      transaction("readwrite", (st) => st.put(record, slot)),
    comparePut: async (slot, record, expected) => {
      const db = await open();
      return new Promise((resolve, reject) => {
        let ended = false,
          conflict = false;
        const tx = db.transaction("slots", "readwrite"),
          st = tx.objectStore("slots"),
          rq = st.get(slot),
          timer = setTimeout(() => {
            try {
              tx.abort();
            } catch {}
            finish(new Error("存档写入超时"));
          }, timeout);
        const finish = (error) => {
          if (ended) return;
          ended = true;
          clearTimeout(timer);
          db.close();
          error ? reject(error) : resolve();
        };
        rq.onsuccess = () => {
          if (
            !sameEnvelope(rq.result,expected)
          ) {
            conflict = true;
            tx.abort();
            return;
          }
          st.put(record, slot);
        };
        tx.oncomplete = () => finish();
        tx.onerror = tx.onabort = () => {
          const e = new Error(
            conflict ? "存档已被其他页面修改" : "主档写入失败",
          );
          if (conflict) e.code = "CONFLICT";
          finish(e);
        };
      });
    },
  };
}
export function createSaveStore({ primary, backup, validate = (x) => x }) {
  const known = new Map(),
    locked = new Set(),writtenVolumes=new Map();
  const key = (slot) => {
    if (![1, 2, 3].includes(slot)) throw new Error("存档位须为 1–3");
    return "yuji:slot:" + slot;
  };
  async function copies(slot) {
    const bkey = key(slot);
    const [p, b] = await Promise.allSettled([
      Promise.resolve().then(() => primary.get(slot)),
      Promise.resolve().then(() => backup.getItem(bkey)),
    ]);
    return [p, b].map((r) =>
      r.status === "fulfilled" ? { raw: r.value } : { error: true, raw: null },
    );
  }
  const token = (cs) =>
    JSON.stringify(cs.map((c) => (c.error ? "unavailable" : envelopeIdentity(c.raw))));
  async function load(slot) {
    const cs = await copies(slot),
      valid = [],
      problems = [];
    if (cs.some((c) => c.error)) locked.add(slot);
    cs.forEach((c, i) => {
      if (c.error) {
        problems.push((i ? "恢复副本" : "主档") + "不可用");
        return;
      }
      if (c.raw != null) {
        try {
          const r = unpack(c.raw);
          r.state = validate(restoreRecovery(r.state));
          valid.push(r);
        } catch {
          problems.push((i ? "恢复副本" : "主档") + "损坏或版本不受支持");
          locked.add(slot);
        }
      }
    });
    valid.sort((a, b) => b.envelope.revision - a.envelope.revision);
    if (
      valid.length === 2 &&
      valid[0].envelope.checksum !== valid[1].envelope.checksum
    ) {
      const [a, b] = valid.map((v) => v.envelope);
      const immediate =
        a.revision === b.revision + 1 && a.previous === b.checksum;
      const tracedBackup =
        a.revision > b.revision &&
        a.backupAnchor === b.checksum &&
        a.backupRevision === b.revision;
      const coreBackup=valid[1].envelope.backupOf;
      const paired=coreBackup&&a.revision===coreBackup.revision&&a.checksum===coreBackup.checksum;
      if (!(immediate || tracedBackup || paired)) {
        locked.add(slot);
        problems.push("主档与恢复副本发生冲突");
      }
    }
    const chosen=valid[0];
    if(chosen?.state.volumeIndex?.length){
      try{
        const volumes=[];
        for(const ref of chosen.state.volumeIndex){const v=await primary.getVolume?.(ref.key);if(!v||!Array.isArray(v.chapters)||v.from!==ref.from||v.to!==ref.to||ref.checksum&&hashText(JSON.stringify(v))!==ref.checksum)throw new Error('分卷缺失');volumes.push(v);writtenVolumes.set(ref.key,ref.checksum);}
        chosen.state=validate({...chosen.state,volumes,volumeIndex:[]});
      }catch{locked.add(slot);problems.push('分卷缺失或不可用，请导出原始副本，不要覆盖旧档');}
    }
    if(chosen?.state.recoveryOnly)problems.push('已恢复核心进度；历史正文请从导出备份找回');
    known.set(slot, { token: token(cs), envelope: chosen?.envelope || null });
    return {
      state: valid[0]?.state || null,
      readOnly: locked.has(slot),
      problems,
      raw: cs.map((c) => c.raw),
    };
  }
  async function save(slot, state) {
    key(slot);
    if (!known.has(slot)) await load(slot);
    if (locked.has(slot))
      throw new Error("此存档位处于只读保护模式，请先导出原始存档并改用空位");
    const previous = known.get(slot),
      cs = await copies(slot);
    if (token(cs) !== previous.token) {
      locked.add(slot);
      throw new Error("存档已被其他页面修改，已进入只读保护模式");
    }
    const {main,volumes}=storedLayout(state);
    validate(main);
    const envelope = pack(
      main,
      (previous.envelope?.revision || 0) + 1,
      previous.envelope?.checksum || null,
    );
    try {
      const savedBackup = unpack(cs[1].raw).envelope;
      envelope.backupAnchor = savedBackup.checksum;
      envelope.backupRevision = savedBackup.revision;
    } catch {}
    let count = 0;
    const warnings = [];
    try {
      for(const volume of volumes){
        if(writtenVolumes.get(volume.key)===volume.checksum)continue;
        if(!primary.appendVolume)throw new Error('分卷存储不可用');
        await primary.appendVolume(volume.key,volume.value);writtenVolumes.set(volume.key,volume.checksum);
      }
      if (primary.comparePut)
        await primary.comparePut(slot, envelope, cs[0].raw);
      else await primary.put(slot, envelope);
      count++;
    } catch (e) {
      if(e.code==='VOLUME_CONFLICT'){locked.add(slot);throw e;}
      if (e.code === "CONFLICT") {
        locked.add(slot);
        throw new Error("存档已被其他页面修改，已进入只读保护模式");
      }
      warnings.push("主档写入失败");
    }
    try {
      if (
        !sameEnvelope(backup.getItem(key(slot)),cs[1].raw)
      ) {
        locked.add(slot);
        throw new Error("副本被其他页面修改");
      }
      const recovery=pack(recoveryState(state),envelope.revision,envelope.previous);
      recovery.backupOf={revision:envelope.revision,checksum:envelope.checksum};
      recovery.backupAnchor=envelope.backupAnchor;recovery.backupRevision=envelope.backupRevision;
      backup.setItem(key(slot), JSON.stringify(recovery));
      count++;
    } catch {
      warnings.push("恢复副本写入失败");
    }
    if (!count)
      throw new Error("存档未能写入，请立即导出 JSON；原进度仍在内存中");
    known.set(slot, { token: token(await copies(slot)), envelope });
    return { warnings, revision: envelope.revision };
  }
  async function importJSON(slot, raw) {
    if (raw.length > 150000000) throw new Error("导入文件超过 150 MB");
    const state = validate(restoreRecovery(unpack(raw).state));
    if(state.volumeIndex?.length)throw new Error('此为分卷主档，请先载入各卷后导出完整 JSON');
    const current = await load(slot);
    if (current.readOnly || current.state)
      throw new Error("导入仅允许写入空白且未受保护的存档位");
    await save(slot, state);
    return state;
  }
  async function listArchives() {
    let rows = [];
    try {
      rows = (await primary.archives?.()) || [];
    } catch {}
    try {
      const index = JSON.parse(backup.getItem("yuji:archive-index") || "[]");
      for (const id of index) {
        const rec = JSON.parse(backup.getItem("yuji:archive:" + id) || "null");
        if (rec && !rows.some((x) => x.id === rec.id)) rows.push(rec);
      }
    } catch {}
    return rows.sort((a, b) => b.at - a.at);
  }
  async function archiveAndSave(slot, state) {
    const current = await load(slot);
    if (current.readOnly) throw new Error("受保护的存档不能被替换");
    if (!current.state) return save(slot, state);
    const id =
        slot + "-" + Date.now() + "-" + known.get(slot).envelope.revision + "-" + known.get(slot).envelope.checksum,
      record = {
        id,
        slot,
        at: Date.now(),
        name: current.state.emperor.name,
        turn: current.state.turn,
        data: JSON.stringify(pack(current.state)),
        raw: current.raw,
      };
    const archives=await primary.archives?.()||[];
    if(archives.length>=5)throw new Error('封存已满5份，请先导出旧卷并移出已备份的封存；原档保留');
    try{if(!primary.archive)throw new Error();await primary.archive(id,record);}
    catch{throw new Error('旧卷未能封存，已停止替换；原档完整保留');}
    return save(slot, state);
  }
  return {
    load,
    save,
    importJSON,
    listArchives,
    archiveAndSave,
    removeArchive:async id=>{if(!primary.removeArchive)throw new Error('无法移出封存');await primary.removeArchive(id);},
    exportJSON: (state) => {if(state.volumeIndex?.length)throw new Error('分卷未完整载入，无法导出全本；请导出原始副本');return JSON.stringify(pack(validate(state)), null, 2);},
  };
}
