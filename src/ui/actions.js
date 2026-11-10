import { portraitHTML, sceneHTML, sceneKey } from './art.js';
import {fiatEnabled} from '../core/fiat.js';
import { examiners } from '../core/keju.js';
import {researchFields,industryFields,developmentAction,updateDevelopmentPreview} from './technology.js';
import {sceneActionFields,sceneActionLabel} from './scene-view.js';
import { postTitle } from "../core/scenarios.js";
import { $, esc, openDialog, toast, closeDialog } from "./common.js";
import { ACTIONS, scheduleCost } from "../core/turn.js";
import { EDICTS, execution,edictCost } from "../core/edicts.js";
import { inCapital } from "../core/court.js";
import { edictBlock } from "../core/edicts.js";
import { energyLimit } from "../core/emperor.js";
import { memorialDialog } from "./memorials.js";
import { selectionDescription } from "./view-model.js";
import { WAR_GOALS, treatyProtected } from '../core/campaign-rules.js';
export function actionDialog(s, kind, preferred, onSchedule, onTalk) {
  if (kind === "上朝" || kind === "批折") return memorialDialog(s,kind,preferred,onSchedule,null,{newBatch:true});
  if(s.regency&&!fiatEnabled(s)&&!["批折","召见","自拟情节","私下行事","歇息"].includes(kind))throw new Error("摄政期间只能批折、召见、经筵或歇息");
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
  if(kind==='自拟情节')fields=sceneActionFields(s,s.schedule[preferred]?.kind===kind?s.schedule[preferred]:{});
  if (kind === "下旨")
    fields =
      '<label for="edict-type">旨意事项</label><select id="edict-type">' +
      Object.keys(EDICTS)
        .map((x) => "<option>" + x + "</option>")
        .join("") +
      '</select><div id="edict-province-field"><label for="province">主办州郡</label><select id="province">' +
      '<option value="">全国</option>' + opt(s.nation.provinces) +
      '</select></div><div id="edict-army-field"><label for="edict-army">补充军队</label><select id="edict-army"><option value="capital">京营</option>'+s.nation.army.frontiers.map(b=>'<option value="'+esc(b.dir)+'">'+esc(b.dir)+'境边军</option>').join('')+'</select></div><div id="edict-amount-field"><label for="edict-amount">拨转金额（万两）</label><input id="edict-amount" type="number" min="0.01" step="any" value="10"></div><div id="edict-child-field"><label for="edict-child">储君人选</label><select id="edict-child"><option value="">请选择在世皇子</option>' +
      opt(s.harem.children.filter((c) => c.sex === "男" && c.health > 0)) +
      '</select></div><div id="edict-followup-field"><label for="edict-followup">同一事项尚未办结时</label><select id="edict-followup"><option value="重申">重申原旨，不另花钱</option><option value="督办">追加督办，再付一份钱粮，缩短工期、改善执行</option></select></div><div id="edict-text-field"><label for="edict-text">御旨（选填）</label><textarea id="edict-text" maxlength="8000" placeholder="着有司依议施行。"></textarea></div><label id="force-edict-field" class="check"><input id="force-edict" type="checkbox">遭封驳仍强推（可能引发党争）</label>';
  if(kind==='下旨')fields+='<div id="examiner-edict-field"><label for="enke-examiner">恩科主考官</label><select id="enke-examiner"><option value="">请先任主考</option>'+opt(examiners(s))+'</select><p class="muted">颁旨后开恩科，国库支三十万两，士林声望加3；请到科举殿命题。</p></div>';
  if(kind==='下旨')fields+='<div id="research-fields">'+researchFields(s)+'</div><div id="industry-fields">'+industryFields(s)+'</div>';
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
      '</select><p class="muted">午间可先后召见多人，每人耗精力1，继续交谈不限轮数。'+(s.settings.freedom==='free'?'拨款以国库余银为限。':'拨款须看官职与交情。')+'</p>';
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
      '</select><div id="war-goal-field"><label for="war-goal">战争目标</label><select id="war-goal">'+
      Object.entries(WAR_GOALS).map(([id,g])=>'<option value="'+id+'">'+esc(g.label)+'</option>').join('')+
      '</select><p id="war-goal-hint" class="muted"></p><label for="war-province">筹粮州</label><select id="war-province">'+
      opt(s.nation.provinces)+'</select><p class="muted">若在战中向地方征粮，将由此州承担。</p></div>'+
      '<div id="bride-field"><label for="bride">和亲人选</label><select id="bride"><option value="">请选择成年未婚宗室女</option>' +
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
      '</select><div id="harem-amount-field"><label for="harem-amount">赏赐（万两）</label><input id="harem-amount" type="number" min="0.01" step="any" value="2"></div>';
  if (kind === "选妃")
    fields =
      '<label for="selection-operation">荐选安排</label><select id="selection-operation"><option value="留牌">从候选人中留牌</option><option value="举荐">日常举荐一人（内帑三万两）</option></select><div id="selection-candidates"><label for="person">待选人选</label><select id="person">' +
      opt(s.harem.candidates) +
      '</select><label for="rank">赐位</label><select id="rank"><option>贵人</option><option>常在</option><option>答应</option><option>嫔</option></select></div><p class="muted">'+selectionDescription(s)+'</p>';
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
  if(kind==='下旨'&&fiatEnabled(s))fields='<p class="muted">言出法随：直接写想要的结果，可连写多条。钱粮不足会自动补足，新人物、势力和制度也可创建。</p>'+fields.replace('着有司依议施行。','例如：国库设为一亿两；全体官员忠诚设为100；创建官员张三；任命张三为工业部长。');
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
  $('#modal .dialog-head').insertAdjacentHTML('beforebegin','<div id="action-art">' + sceneHTML(sceneKey({kind},preferred),'action',preferred==='夜') + '</div>');
  if(kind==='下旨'&&fiatEnabled(s))$('#edict-type').value='禁令';
  if(kind==='自拟情节')$('#modal').classList.add('scene-dialog');
  document.querySelectorAll('[data-form-slot]').forEach(b=>b.onclick=()=>{
    $('#action-slot').value=b.dataset.formSlot;
    document.querySelectorAll('[data-form-slot]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
    paper();
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
        e = {...EDICTS[type],cost:edictCost(s,type)},
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
    if(kind==='下旨'){
      const type=$('#edict-type').value,province=$('#province').value||null;
      const ongoing=s.projects.find(p=>!p.done&&p.edictType===type&&(p.province||null)===province&&(type!=='征兵'||p.armyTarget===$('#edict-army').value));
      if(['转内帑','转国库'].includes(type))text='按实际余银拨转，超过余额或收款余量时只拨可用部分。';
      else if(ongoing)text=$('#edict-followup').value==='督办'?'追加一份钱粮，催办原来的事项；不会再另开一项。':'重申原旨，不另支钱粮，仍按原来的进度办理。';
      if(type==='加开恩科')text='国库三十万两，士林声望加3；先选主考，起驾后到科举殿命题。';
      if(type==='格物')text='格物月经费 '+$('#research-funding').value+' 万两，月结按余银拨付；安排后起驾生效。';
      if(type==='兴业'){updateDevelopmentPreview($('#action-form'),s);text=$('#industry-quote').textContent;}
      const blocked=edictBlock(s,$('#edict-type').value,$('#province').value||null);if(blocked)text+='；'+blocked;}
    if(kind==='外交'){
      const country=s.foreign.find(f=>f.id===$('#country').value),operation=$('#operation');
      for(const option of operation.options)option.disabled=country.status==='交战'&&!['接见','议和'].includes(option.value)||country.status==='停战待议'&&option.value!=='接见';
      if(operation.selectedOptions[0]?.disabled)operation.value='接见';
      const key=country.id+':'+operation.value;
      if(key!==breachTarget){$('#confirm-breach').checked=false;breachTarget=key;}
      text+='；'+country.frontier+'境 · '+country.status;
      const goal=WAR_GOALS[$('#war-goal').value];
      $('#war-goal-hint').textContent=goal.note+' 备军需银'+goal.silver+'万两、粮'+goal.grain+'万石；预计敌兵'+goal.enemy+'人，最长'+goal.rounds+'旬，行营钱粮另支。';
      if(operation.value==='宣战')text+='；备军银'+goal.silver+'万两、粮'+goal.grain+'万石';
      if(country.status==='停战待议')text+='；请先批复战后议约奏报';
    }
    if(kind==='下旨'&&$('#edict-text')?.value.trim())text='精力 '+rule.energy+'；御旨已拟，起驾后可查看办理结果与支出。';
    if(kind==='后宫'&&$('#operation')?.value==='赏赐')text+='；按内帑余银赏赐，厚赏愈多，好感增长愈缓。';
    if(kind==='选妃'&&$('#selection-operation')?.value==='举荐')text+='；查验并举荐一人，内帑三万两，留牌另择时安排。';
    if(kind==='外交'&&$('#operation')?.value==='互市')text+='；可重新议约，议成后替换原约，未成仍照旧约往来。';
    $("#action-estimate").textContent = text;
    const show=(id,visible)=>$("#"+id)?.classList.toggle("hidden",!visible);
    const development=['格物','兴业','加开恩科'].includes($('#edict-type')?.value);
    for(const id of ['edict-province-field','edict-followup-field','edict-text-field','force-edict-field'])show(id,!development);
    show('examiner-edict-field',$('#edict-type')?.value==='加开恩科');
    show('research-fields',$('#edict-type')?.value==='格物');
    show('industry-fields',$('#edict-type')?.value==='兴业');
    show("edict-amount-field",["转内帑","转国库"].includes($("#edict-type")?.value));
    show("edict-child-field",$("#edict-type")?.value==="立储");
    show('edict-army-field',$('#edict-type')?.value==='征兵');
    show('war-goal-field',kind==='外交'&&$('#operation')?.value==='宣战');
    const other=s.foreign.find(f=>f.id===$('#country')?.value);
    show("breach-field",kind==="外交"&&$("#operation")?.value==="宣战"&&(["婚盟","朝贡"].includes(other?.status)||treatyProtected(other,s.turn)));
    show("bride-field",$("#operation")?.value==="和亲");
    show("harem-amount-field",$("#operation")?.value==="赏赐");
    show("selection-candidates",$("#selection-operation")?.value!=="举荐");
  };
  estimate();
  const paper=()=>{
    const person=s.court.officials.find(o=>o.id===$('#person')?.value)||s.harem.consorts.find(o=>o.id===$('#person')?.value)||s.foreign.find(o=>o.id===$('#country')?.value)||s.harem.candidates.find(o=>o.id===$('#person')?.value);
    const slot=$('#action-slot').value;
    $('#action-art').innerHTML=sceneHTML(sceneKey({kind,place:$('#scene-place')?.value,edictType:$('#edict-type')?.value},slot),'action',slot==='夜');
    let html=(person?portraitHTML(s,person,'paper'):'')+'<div class="eyebrow">'+kind+' · 待定</div><h3>'+esc(person?.ruler||person?.name||$('#edict-type')?.value||kind)+'</h3>';
    if(person)html+='<p>'+esc(person.family||person.personality||postTitle(s,s.court.posts.find(p=>p.holder===person.id))||person.status||'御前候命')+'</p><p>'+esc(person.age?person.age+' 岁':'')+(person.favor!==undefined?' · 好感 '+person.favor:'')+'</p>';
    if(kind==='下旨'){
      const r={...EDICTS[$('#edict-type').value],cost:edictCost(s,$('#edict-type').value)};
      if($('#edict-type').value==='加开恩科')html+='<p>国库三十万两，士林声望加3。</p><p>主考：'+esc(s.court.officials.find(o=>o.id===$('#enke-examiner').value)?.name||'尚未任命')+'</p><p>起驾后，前往科举殿颁题阅卷。</p>';
      else if(['格物','兴业'].includes($('#edict-type').value))html+='<p>先定方向与经费，起驾后发往有司。</p>';
      else html+='<p>主办　'+r.office+'</p><p>每次新办或追加督办需 '+r.cost+' 万两'+(r.grain?'、'+r.grain+' 万石':'')+'，预计 '+r.months+' 个月。</p><p>预计成算「'+execution(s,$('#edict-type').value,11).label+'」</p>';
    }
    html+='<p class="muted action-preview-note">'+({自拟情节:'写下想经历的事情，人物会有自己的回应。',召见:'候见之人已至殿外。',宴请:'择宾客，定酒席。',后宫:'宫中诸事，待陛下裁定。',任命:'官职与人选，均在此列。',外交:'先定来往之国，再议国书。',选妃:'大选有定期，平日也可举荐；候选人须年满十八。',出巡:'出行占满一旬，奏报仍会呈来。',亲征:'御驾亲征，须留一臣守京。',私下行事:'择一人，定所行之事。',下旨:'旨意发至有司，须待回奏。'}[kind]||'安排时辰后，放入本旬日程。')+'</p>';
    $('#action-document').innerHTML=html;
  };
  paper();
  $("#action-form").onchange = ()=>{estimate();paper();};
  $("#action-form").oninput=()=>updateDevelopmentPreview($('#action-form'),s);
  $("#action-form").onsubmit = (e) => {
    e.preventDefault();
    try {
      const val = (id) => $("#" + id)?.value,
        checked = (name) =>
          [
            ...document.querySelectorAll('input[name="' + name + '"]:checked'),
          ].map((x) => x.value);
      const a = { kind };
      if(kind==='自拟情节')Object.assign(a,{people:checked('scene-person'),place:val('scene-place').trim(),text:val('scene-text').trim(),label:'自拟情节'});
      if (kind === "下旨")
        Object.assign(a, {
          edictType: val("edict-type"),
          ...($("#edict-type").value==='加开恩科'?{examiner:val("enke-examiner")}:{}),
          province: val("province"),
          ...($('#edict-type').value==='征兵'?{armyTarget:val('edict-army')}:{}),
          amount: Number(val("edict-amount")),
          child: val("edict-child"),
          text: val("edict-text"),
          force: $("#force-edict").checked,
        });
      if(kind==='下旨'&&['格物','兴业'].includes(val('edict-type')))Object.assign(a,developmentAction($('#action-form'),val('edict-type')));
      if(kind==='下旨'&&val('edict-followup')==='督办')a.followup='督办';
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
      if(kind==='外交'&&val('operation')==='宣战')Object.assign(a,{warGoal:val('war-goal'),levyProvince:val('war-province')});
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
      if (kind === "选妃") {
        if(val("selection-operation")==="举荐")a.operation="举荐";
        else Object.assign(a, { person: val("person"), rank: val("rank") });
      }
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
      if(kind==='自拟情节')a.label=sceneActionLabel(s,a);
      onSchedule(val("action-slot"), a);
      closeDialog();
    } catch (error) {
      toast(error.message);
    }
  };
}
