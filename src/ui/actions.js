import { postTitle } from "../core/scenarios.js";
import { $, esc, openDialog, toast, closeDialog } from "./common.js";
import { ACTIONS, scheduleCost } from "../core/turn.js";
import { EDICTS, execution } from "../core/edicts.js";
import { inCapital } from "../core/court.js";
import { edictBlock } from "../core/edicts.js";
import { energyLimit } from "../core/emperor.js";
import { memorialDialog } from "./memorials.js";
import { selectionDescription } from "./view-model.js";
export function actionDialog(s, kind, preferred, onSchedule, onTalk) {
  if (kind === "上朝" || kind === "批折") return memorialDialog(s,kind,preferred,onSchedule,null,{newBatch:true});
  if(s.regency&&!["批折","召见","私下行事","歇息"].includes(kind))throw new Error("摄政期间只能批折、召见、经筵或歇息");
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
  if (kind === "下旨")
    fields =
      '<label for="edict-type">旨意模板</label><select id="edict-type">' +
      Object.keys(EDICTS)
        .map((x) => "<option>" + x + "</option>")
        .join("") +
      '</select><label for="province">主办州郡</label><select id="province">' +
      '<option value="">全国</option>' + opt(s.nation.provinces) +
      '</select><div id="edict-army-field"><label for="edict-army">补充军队</label><select id="edict-army"><option value="capital">京营</option>'+s.nation.army.frontiers.map(b=>'<option value="'+esc(b.dir)+'">'+esc(b.dir)+'境边军</option>').join('')+'</select></div><div id="edict-amount-field"><label for="edict-amount">拨转金额（万两）</label><input id="edict-amount" type="number" min="1" max="100" value="10"></div><div id="edict-child-field"><label for="edict-child">储君人选</label><select id="edict-child"><option value="">请选择在世皇子</option>' +
      opt(s.harem.children.filter((c) => c.sex === "男" && c.health > 0)) +
      '</select></div><label for="edict-text">御旨（选填）</label><textarea id="edict-text" maxlength="500" placeholder="着有司依议施行。"></textarea><label class="check"><input id="force-edict" type="checkbox">遭封驳仍强推（可能引发党争）</label>';
  if (kind === "任命")
    fields =
      '<label for="post">官职</label><select id="post">' +
      s.court.posts
        .map(
          (p) =>
            '<option value="' +
            p.id +
            '">' +
            esc(postTitle(s, p)) +
            " · " +
            esc(
              s.court.officials.find((o) => o.id === p.holder)?.name || "空缺",
            ) +
            "</option>",
        )
        .join("") +
      '</select><label for="person">人选</label><select id="person">' +
      opt(s.court.officials.filter((o) => o.alive)) +
      '</select><label for="operation">处分</label><select id="operation"><option value="appoint">任命 / 调任</option><option value="remove">罢免</option><option value="demote">贬谪</option><option value="retire">致仕</option><option value="jail">下狱</option></select><label class="check"><input id="pardon-person" type="checkbox">先赦免所选人，再予起用</label>';
  if (kind === "召见")
    fields =
      '<label for="person">在京人物</label><select id="person">' +
      opt(s.court.officials.filter((o) => o.alive)) +
      opt(s.harem.consorts) +
      opt(s.foreign) +
      '</select><p class="muted">召见占午间，耗精力1。'+(s.settings.freedom==='free'?'拨款以国库余银为限。':'拨款须看官职与交情。')+'</p>';
  if (kind === "宴请")
    fields =
      '<label for="banquet-type">宴会类型</label><select id="banquet-type"><option>君臣宴</option><option>家宴</option><option>寿宴</option><option>接风宴</option><option>鸿门宴</option></select><label for="banquet-cost">开销档</label><select id="banquet-cost"><option value="俭">俭 · 2 万两</option><option value="常" selected>常 · 5 万两</option><option value="盛">盛 · 12 万两</option></select><fieldset><legend>宾客（2–6 人）</legend>' +
      s.court.officials.filter(inCapital)
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
      '</select><div id="bride-field"><label for="bride">和亲人选</label><select id="bride"><option value="">请选择成年未婚宗室女</option>' +
      opt([
        ...(s.harem.royalWomen || []).filter((w) => w.age >= 18 && !w.married),
        ...s.harem.children.filter(
          (c) => c.sex === "女" && s.turn - c.born >= 18 * 36 && !c.married,
        ),
      ]) +
      '</select></div><label id="breach-field" class="check"><input id="confirm-breach" type="checkbox">确认撕毁盟约并宣战（皇威、圣德各减5）</label>';
  if (kind === "后宫")
    fields =
      '<label for="person">妃嫔</label><select id="person">' +
      opt(s.harem.consorts) +
      '</select><label for="operation">内廷安排</label><select id="operation">' +
      ["探望", "侍寝", "晋位", "降位", "赏赐", "禁足", "冷宫"]
        .map((x) => "<option>" + x + "</option>")
        .join("") +
      '</select><div id="harem-amount-field"><label for="harem-amount">赏赐（万两）</label><input id="harem-amount" type="number" min="1" max="20" value="2"></div>';
  if (kind === "选妃")
    fields =
      '<label for="person">本届秀女</label><select id="person">' +
      opt(s.harem.candidates) +
      '</select><label for="rank">赐位</label><select id="rank"><option>贵人</option><option>常在</option><option>答应</option><option>嫔</option></select><p class="muted">'+selectionDescription(s)+'</p>';
  if (kind === "出巡")
    fields =
      '<label for="destination">去向</label><select id="destination"><option>微服江南</option><option>游幸</option><option>狩猎</option><option>祭天</option></select><p class="warning">占满一旬，其他时段必须空白；出行期间奏报仍会积压。内帑支出 6 万两。</p>';
  if (kind === "私下行事")
    fields =
      '<label for="operation">手段</label><select id="operation"><option>试探</option><option>离间</option><option>暗查</option><option>收买</option><option>闲谈</option></select><label for="person">目标人物</label><select id="person">' +
      opt(s.court.officials.filter((o) => o.alive && !o.jailed && !o.retired)) +
      '</select><p class="muted">难度由手段确定；收买消耗内帑 5 万两，暗查与试探成功可揭露秘密。</p>';
  if(kind==='私下行事'&&s.regency)fields='<label for="operation">经筵</label><select id="operation"><option>经筵</option></select><p class="muted">摄政期间进讲经史，五才随年龄与教养成长。</p>';
  if (kind === "亲征")
    fields =
      '<label for="regent">留守大臣</label><select id="regent">' +
      opt(s.court.officials.filter((o) => o.alive)) +
      '</select><p class="warning">先通过外交宣战。亲征持续至战役结束，期间无法在京安排其他行动。</p>';
  openDialog(
    kind + " · 安排本旬",
    '<form id="action-form"><div class="segmented" role="group" aria-label="行动时辰">'+rule.slots.map(sl=>'<button type="button" data-form-slot="'+sl+'" aria-pressed="'+(sl===(rule.slots.includes(preferred)?preferred:rule.slots[0]))+'">'+sl+'</button>').join('')+'</div><select id="action-slot" class="hidden" aria-label="时辰">' +
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
    "action-shell",
  );
  document.querySelectorAll('[data-form-slot]').forEach(b=>b.onclick=()=>{
    $('#action-slot').value=b.dataset.formSlot;
    document.querySelectorAll('[data-form-slot]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
  });
  let breachTarget="";
  const estimate = () => {
    let text =
      "精力 " +
      rule.energy +
      " · 已安排 " +
      scheduleCost(s.schedule) +
      " / " +
      energyLimit(s);
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
        "；预计执行「" +
        x.label +
        "」，仍须看本旬天命。";
    }
    if(kind==='下旨'){const blocked=edictBlock(s,$('#edict-type').value,$('#province').value||null);if(blocked)text+='；'+blocked;}
    if(kind==='外交'){
      const country=s.foreign.find(f=>f.id===$('#country').value),operation=$('#operation');
      for(const option of operation.options)option.disabled=country.status==='交战'&&!['接见','议和'].includes(option.value);
      if(operation.selectedOptions[0]?.disabled)operation.value='接见';
      const key=country.id+':'+operation.value;
      if(key!==breachTarget){$('#confirm-breach').checked=false;breachTarget=key;}
      text+='；'+country.frontier+'境 · '+country.status;
    }
    if(kind==='下旨'&&$('#edict-text')?.value.trim())text='精力 '+rule.energy+'；御旨已拟，起驾后可查看办理结果与支出。';
    $("#action-estimate").textContent = text;
    const show=(id,visible)=>$("#"+id)?.classList.toggle("hidden",!visible);
    show("edict-amount-field",["转内帑","转国库"].includes($("#edict-type")?.value));
    show("edict-child-field",$("#edict-type")?.value==="立储");
    show('edict-army-field',$('#edict-type')?.value==='征兵');
    show("breach-field",kind==="外交"&&$("#operation")?.value==="宣战"&&["婚盟","朝贡"].includes(s.foreign.find(f=>f.id===$("#country")?.value)?.status));
    show("bride-field",$("#operation")?.value==="和亲");
    show("harem-amount-field",$("#operation")?.value==="赏赐");
  };
  estimate();
  const paper=()=>{
    const person=s.court.officials.find(o=>o.id===$('#person')?.value)||s.harem.consorts.find(o=>o.id===$('#person')?.value)||s.foreign.find(o=>o.id===$('#country')?.value)||s.harem.candidates.find(o=>o.id===$('#person')?.value);
    let html='<div class="eyebrow">'+kind+' · 待定</div><h3>'+esc(person?.name||$('#edict-type')?.value||kind)+'</h3>';
    if(person)html+='<p>'+esc(person.family||person.personality||postTitle(s,s.court.posts.find(p=>p.holder===person.id))||person.status||'御前候命')+'</p><p>'+esc(person.age?person.age+' 岁':'')+(person.favor!==undefined?' · 好感 '+person.favor:'')+'</p>';
    if(kind==='下旨'){
      const r=EDICTS[$('#edict-type').value];
      html+='<p>主办　'+r.office+'</p><p>所需 '+r.cost+' 万两'+(r.grain?'、'+r.grain+' 万石':'')+'，预计 '+r.months+' 个月。</p><p>预计成算「'+execution(s,$('#edict-type').value,11).label+'」</p>';
    }
    html+='<p class="muted action-preview-note">'+({召见:'候见之人已至殿外。',宴请:'择宾客，定酒席。',后宫:'宫中诸事，待陛下裁定。',任命:'官职与人选，均在此列。',外交:'先定来往之国，再议国书。',选妃:'本届秀女候选于此。',出巡:'出行占满一旬，奏报仍会呈来。',亲征:'御驾亲征，须留一臣守京。',私下行事:'择一人，定所行之事。',下旨:'旨意发至有司，须待回奏。'}[kind]||'安排时辰后，放入本旬日程。')+'</p>';
    $('#action-document').innerHTML=html;
  };
  paper();
  $("#action-form").onchange = ()=>{estimate();paper();};
  $("#action-form").onsubmit = (e) => {
    e.preventDefault();
    try {
      const val = (id) => $("#" + id)?.value,
        checked = (name) =>
          [
            ...document.querySelectorAll('input[name="' + name + '"]:checked'),
          ].map((x) => x.value);
      const a = { kind };
      if (kind === "下旨")
        Object.assign(a, {
          edictType: val("edict-type"),
          province: val("province"),
          ...($('#edict-type').value==='征兵'?{armyTarget:val('edict-army')}:{}),
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
      if(kind==="任命"&&$("#pardon-person")?.checked)a.pardon=true;
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
      if(kind==="外交"&&$("#confirm-breach")?.checked)a.confirmBreach=true;
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
