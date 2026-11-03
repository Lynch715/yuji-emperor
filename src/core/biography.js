export function annualHighlights(state){
 const start=state.reign?.accessionTurn||0,years=new Map();
 for(const h of [...state.volumes.flatMap(v=>v.chapters||[]),...state.history]){
  if(!Number.isFinite(h.turn)||h.turn<=start||h.turn>state.turn)continue;
  const main=(h.entries||[]).filter(e=>Number.isFinite(e.delta)).sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta))[0];
  const text=String(main?.source||h.summary||h.notes?.[0]||'').replace(/[\r\n]+/g,' ').trim();if(!text)continue;
  const year=1+Math.floor(Math.max(0,h.turn-start-1)/36);
  const weight=(h.entries||[]).reduce((n,e)=>n+(Number.isFinite(e.delta)?Math.abs(e.delta):0),0);
  const old=years.get(year);if(!old||weight>old.weight)years.set(year,{year,text,weight});
 }
 return [...years.values()].sort((a,b)=>a.year-b.year);
}
export function fallbackBiography(s,r){
 const own=r.stats,years=(r.reignTurns/36).toFixed(1),start=s.reign?.accessionTurn||0;
 const completed=s.projects.filter(p=>p.done&&(p.start??0)>=start).length;
 const titles=s.ambitions.filter(a=>a.status==='达成').map(a=>a.title).join('、')||'尚无已达成者';
 const money=n=>Number(n).toFixed(1);
 const paragraphs=[
  `践祚：${s.dynasty}帝${r.emperor}，以${r.era}纪元，本朝在位${r.reignTurns}旬，折合${years}年。践祚时国库${money(s.reign?.initialTreasury??480)}万两，此为本朝收支的起点。史馆以即位之旬划定纪事，不把前朝的批折与诏令算作新君政绩。君臣所行各有职掌，施政能否落到州县，仍须并察钱粮与奉行之实，不能仅以御前措辞推断天下已治。`,
  `施政：本朝处置奏报${own.petitions}本，颁布政令${own.edicts}道，任免${own.appointments}次，设宴${own.banquets}次。本朝起建且已竣政务${completed}项；未结之事仍按在途记载，不以颁旨代替竣工。封卷时国库${money(s.nation.treasury)}万两，粮储${money(s.nation.grain)}万石，内帑${money(s.nation.privy)}万两；积欠银饷${money(s.nation.arrears||0)}万两。收支、存量与积欠分册相核，账上有余不等于地方无忧。`,
  `边事：本朝台账所记获胜战役${own.warsWon}场，战果依战役结算登记，不从文辞推定胜负。封卷时仍在进行的战役有${s.campaigns.filter(w=>!w.done).length}场，后续尚无定论。外邦交往以当时盟约与国书为据，通好、交战各有其时；史官只书已发生之事，不预言来日疆场的得失，也不把使臣的辞让记为已经割地称臣。`,
  `后宫：本朝皇嗣共${r.children}人，储位${s.harem.heir?'已有所定':'尚未预定'}，继统之议依封卷所存名册。宏愿与心事的达成者为${titles}。宫中起居与国事各有册籍，亲疏之情不能代替立储的成命，未遂之愿也不因封卷而算作功成。史馆记皇嗣只取本朝父系，先朝子女另载，不能将累朝繁衍混为新君一生的子嗣。`,
  `终局：本朝终于${r.ending}，其由为${r.cause}。${r.succession}。末时民心${money(s.nation.morale)}、吏治${money(s.nation.governance)}、皇威${money(s.emperor.prestige)}、圣德${money(s.emperor.virtue)}，史馆评绩${r.score}分，列${r.tier}档，定庙号${r.templeName}，谥${r.posthumous}。四项国势分别见民生、制度与君德之一端，不能以一端掩其余；功过据已存实录论定，不增写封卷之后的政事。`,
 ];
 // Add the largest recorded event of each year, rather than cycling filler.
 // Keep the five sections intact; annual notes belong to the governing section.
 const highlights=annualHighlights(s);let room=800-paragraphs.join('\n\n').length;
 for(const h of highlights){
  const sentence=`年度纪事：第${h.year}年，${h.text.replace(/[。！？]+$/,'').slice(0,60)}。`;
  if(sentence.length>room)continue;
  paragraphs[1]+=sentence;room-=sentence.length;
  if(paragraphs.join('\n\n').length>=700)break;
 }
 return paragraphs.join('\n\n');
}
