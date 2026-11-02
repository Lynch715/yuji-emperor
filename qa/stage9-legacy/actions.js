import { $, esc, openDialog, toast, closeDialog } from "./common.js";
import { ACTIONS, scheduleCost } from "../../src/core/turn.js";
import { EDICTS, execution } from "../../src/core/edicts.js";
import { energyLimit } from "../../src/core/emperor.js";
export function actionDialog(s, kind, preferred, onSchedule, onTalk) {
  const rule = ACTIONS[kind];
  if (!rule) throw new Error("未识别的行动");
  const opt = (items, value = "id", label = "name") =>
    items
      .map(
        (x) =>
          '<option value="' +
          esc(x[value]) +
          '">' +
          esc(x[label]) +
          "</option>",
      )
      .join("");
  let fields = "";
  if (kind === "上朝" || kind === "批折")
    fields =
      "<fieldset><legend>选择奏报（上朝至多 3 本）</legend>" +
      s.memorials
        .slice(0, 18)
        .map(
          (m) =>
            '<label class="check"><input type="checkbox" name="memorial" value="' +
            esc(m.id) +
            '">' +
            esc(m.title) +
            "</label>",
        )
        .join("") +
      '</fieldset><label for="decision">统一处置</label><select id="decision"><option value="approve">准奏</option><option value="reject">驳回</option><option value="hold">留中</option><option value="remark">朱批</option><option value="discuss">发部再议</option></select><label for="stance">朝堂立场</label><select id="stance"><option>依旨施行</option><option>廷议</option><option>当廷问责</option></select><label for="accountable">问责人选</label><select id="accountable">' +
      opt(s.court.officials) +
      '</select><label for="remark">朱批文字（嘉奖/申饬）</label><textarea id="remark" maxlength="100"></textarea>';
  if (kind === "下旨")
    fields =
      '<label for="edict-type">旨意模板</label><select id="edict-type">' +
      Object.keys(EDICTS)
        .map((x) => "<option>" + x + "</option>")
        .join("") +
      '</select><label for="province">主办州郡</label><select id="province">' +
      opt(s.nation.provinces) +
      '</select><label for="edict-amount">拨转金额（万两）</label><input id="edict-amount" type="number" min="1" max="100" value="10"><label for="edict-child">储君人选</label><select id="edict-child"><option value="">请选择在世皇子</option>' +
      opt(s.harem.children.filter((c) => c.sex === "男" && c.health > 0)) +
      '</select><label for="edict-text">旨意文字（选填，按模板规则结算）</label><textarea id="edict-text" maxlength="500" placeholder="着有司依议施行。"></textarea><label class="check"><input id="force-edict" type="checkbox">如遭封驳，再行强推（失败引发党争）</label>';
  if (kind === "任命")
    fields =
      '<label for="post">官职</label><select id="post">' +
      s.court.posts
        .map(
          (p) =>
            '<option value="' +
            p.id +
            '">' +
            esc(p.title) +
            " · " +
            esc(
              s.court.officials.find((o) => o.id === p.holder)?.name || "空缺",
            ) +
            "</option>",
        )
        .join("") +
      '</select><label for="person">人选</label><select id="person">' +
      opt(s.court.officials.filter((o) => o.alive)) +
      '</select><label for="operation">处分</label><select id="operation"><option value="appoint">任命 / 调任</option><option value="remove">罢免</option><option value="demote">贬谪</option><option value="retire">致仕</option><option value="jail">下狱</option></select>';
  if (kind === "召见")
    fields =
      '<label for="person">在京人物</label><select id="person">' +
      opt(s.court.officials.filter((o) => o.alive)) +
      opt(s.harem.consorts) +
      opt(s.foreign) +
      '</select><p class="muted">面谈在本旬落账，占用午间 1 点精力。谈话拨款受官职与好感上限约束。</p>';
  if (kind === "宴请")
    fields =
      '<label for="banquet-type">宴会类型</label><select id="banquet-type"><option>君臣宴</option><option>家宴</option><option>寿宴</option><option>接风宴</option><option>鸿门宴</option></select><label for="banquet-cost">开销档</label><select id="banquet-cost"><option value="俭">俭 · 2 万两</option><option value="常" selected>常 · 5 万两</option><option value="盛">盛 · 12 万两</option></select><fieldset><legend>宾客（2–6 人）</legend>' +
      s.court.officials
        .slice(0, 12)
        .map(
          (o) =>
            '<label class="check"><input type="checkbox" name="guest" value="' +
            o.id +
            '">' +
            esc(o.name) +
            "</label>",
        )
        .join("") +
      "</fieldset>";
  if (kind === "外交")
    fields =
      '<label for="country">外邦</label><select id="country">' +
      opt(s.foreign) +
      '</select><label for="operation">国书事项</label><select id="operation">' +
      ["接见", "遣使", "册封", "和亲", "互市", "索贡", "宣战", "议和"]
        .map((x) => "<option>" + x + "</option>")
        .join("") +
      '</select><label for="envoy">正使</label><select id="envoy">' +
      opt(s.court.officials.filter((o) => o.alive)) +
      '</select><label for="bride">和亲人选</label><select id="bride"><option value="">请选择成年未婚宗室女</option>' +
      opt([
        ...(s.harem.royalWomen || []).filter((w) => w.age >= 18 && !w.married),
        ...s.harem.children.filter(
          (c) => c.sex === "女" && s.turn - c.born >= 18 * 36 && !c.married,
        ),
      ]) +
      "</select>";
  if (kind === "后宫")
    fields =
      '<label for="person">妃嫔</label><select id="person">' +
      opt(s.harem.consorts) +
      '</select><label for="operation">内廷安排</label><select id="operation">' +
      ["探望", "侍寝", "晋位", "降位", "赏赐", "禁足", "冷宫"]
        .map((x) => "<option>" + x + "</option>")
        .join("") +
      '</select><label for="harem-amount">赏赐（万两）</label><input id="harem-amount" type="number" min="1" max="20" value="2">';
  if (kind === "选妃")
    fields =
      '<label for="person">本届秀女</label><select id="person">' +
      opt(s.harem.candidates) +
      '</select><label for="rank">赐位</label><select id="rank"><option>贵人</option><option>常在</option><option>答应</option><option>嫔</option></select><p class="muted">选秀三年一次，非选秀年无法留牌。</p>';
  if (kind === "出巡")
    fields =
      '<label for="destination">去向</label><select id="destination"><option>微服江南</option><option>游幸</option><option>狩猎</option><option>祭天</option></select><p class="warning">占满一旬，其他时段必须空白；出行期间奏报仍会积压。内帑支出 6 万两。</p>';
  if (kind === "私下行事")
    fields =
      '<label for="operation">手段</label><select id="operation"><option>试探</option><option>离间</option><option>暗查</option><option>收买</option><option>闲谈</option></select><label for="person">目标人物</label><select id="person">' +
      opt(s.court.officials.filter((o) => o.alive && !o.jailed && !o.retired)) +
      '</select><p class="muted">难度由手段确定；收买消耗内帑 5 万两，暗查与试探成功可揭露秘密。</p>';
  if (kind === "亲征")
    fields =
      '<label for="regent">留守大臣</label><select id="regent">' +
      opt(s.court.officials.filter((o) => o.alive)) +
      '</select><p class="warning">先通过外交宣战。亲征持续至战役结束，期间无法在京安排其他行动。</p>';
  openDialog(
    kind + " · 安排本旬",
    '<form id="action-form"><label for="action-slot">时辰</label><select id="action-slot">' +
      rule.slots
        .map(
          (slot) =>
            "<option " +
            (slot === preferred ? "selected" : "") +
            ">" +
            slot +
            "</option>",
        )
        .join("") +
      "</select>" +
      fields +
      '<div id="action-estimate" class="onboarding"></div><div class="dialog-actions"><button class="primary" type="submit">' +
      (kind === "召见" ? "进入面谈" : "放入日程") +
      "</button></div></form>",
  );
  const estimate = () => {
    let text =
      "本卡精力 " +
      rule.energy +
      " · 当前日程 " +
      scheduleCost(s.schedule) +
      " / " +
      energyLimit(s);
    if (kind === "上朝" || kind === "批折") {
      const ids = [
          ...document.querySelectorAll("input[name=memorial]:checked"),
        ].map((x) => x.value),
        cost = s.memorials
          .filter((m) => ids.includes(m.id))
          .reduce(
            (n, m) =>
              n +
              Math.max(
                0,
                -(
                  m.options.find((o) => o.id === $("#decision").value)?.effects
                    ?.treasury ||
                  m.options[$("#decision").value === "reject" ? 1 : 0]?.effects
                    ?.treasury ||
                  0
                ),
              ),
            0,
          );
      text += "；预计国库支出 " + cost + " 万两。";
    }
    if (kind === "下旨") {
      const type = $("#edict-type").value,
        e = EDICTS[type],
        x = execution(s, type, 11);
      text +=
        "；" +
        (e.private ? "内帑" : "国库") +
        "预支 " +
        e.cost +
        " 万两" +
        (e.grain ? "、粮 " + e.grain + " 万石" : "") +
        "；常态执行估算 " +
        x.label +
        "，实际随本旬天命变化。";
    }
    $("#action-estimate").textContent = text;
  };
  estimate();
  $("#action-form").onchange = estimate;
  $("#action-form").onsubmit = (e) => {
    e.preventDefault();
    try {
      const val = (id) => $("#" + id)?.value,
        checked = (name) =>
          [
            ...document.querySelectorAll('input[name="' + name + '"]:checked'),
          ].map((x) => x.value);
      const a = { kind };
      if (kind === "上朝" || kind === "批折")
        Object.assign(a, {
          memorials: checked("memorial"),
          decision: val("decision"),
          stance: val("stance"),
          target: val("accountable"),
          remark: val("remark"),
        });
      if (kind === "下旨")
        Object.assign(a, {
          edictType: val("edict-type"),
          province: val("province"),
          amount: Number(val("edict-amount")),
          child: val("edict-child"),
          text: val("edict-text"),
          force: $("#force-edict").checked,
        });
      if (kind === "任命")
        Object.assign(a, {
          post: val("post"),
          person: val("person"),
          operation: val("operation"),
        });
      if (kind === "召见") {
        onTalk(val("person"));
        return;
      }
      if (kind === "宴请")
        Object.assign(a, {
          type: val("banquet-type"),
          cost: val("banquet-cost"),
          guests: checked("guest"),
        });
      if (kind === "外交")
        Object.assign(a, {
          country: val("country"),
          operation: val("operation"),
          envoy: val("envoy"),
          bride: val("bride"),
        });
      if (kind === "后宫")
        Object.assign(a, {
          person: val("person"),
          operation: val("operation"),
          amount: Number(val("harem-amount")),
        });
      if (kind === "私下行事")
        Object.assign(a, {
          person: val("person"),
          operation: val("operation"),
        });
      if (kind === "选妃")
        Object.assign(a, { person: val("person"), rank: val("rank") });
      if (kind === "出巡") a.destination = val("destination");
      if (kind === "亲征") a.regent = val("regent");
      a.label =
        a.edictType ||
        a.operation ||
        a.type ||
        (a.memorials
          ? a.memorials.length + " 本奏报"
          : a.person
            ? s.court.officials.find((o) => o.id === a.person)?.name ||
              s.harem.consorts.find((c) => c.id === a.person)?.name
            : kind);
      onSchedule(val("action-slot"), a);
      closeDialog();
    } catch (error) {
      toast(error.message);
    }
  };
}
