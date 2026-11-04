import { seedNumber, random } from './rng.js';
// Routine requests fund a small, specified administrative task. Approval trades
// silver (and, for handling grain, stock) for execution; refusal saves resources
// and asserts authority. Large rewards remain in events and edicts.
const stateTrigger=type=>s=>{
 if(['钱粮','赋税','盐政'].includes(type))return s.nation.provinces.some(p=>p.tax>0&&!p.rebellion);
 if(['仓储','漕运'].includes(type))return s.nation.grain>=0.6&&s.nation.army.capital.troops+s.nation.army.frontiers.reduce((n,b)=>n+b.troops,0)>0;
 if(['兵务','军粮','边警'].includes(type))return s.nation.army.frontiers.some(b=>b.troops>0||b.pressure>30);
 if(type==='科举')return Math.floor(s.turn/36)%3===0||s.court.posts.some(p=>!p.holder);
 if(type==='河工')return s.nation.provinces.some(p=>p.disaster>0)||s.era.month<=6;
 if(type==='言官')return s.nation.governance<80||s.nation.arrears>0;
 if(type==='宗室')return s.harem.children.length>0||s.harem.royalWomen?.length>0;
 if(type==='礼制')return s.turn%9<3;
 return s.court.posts.some(p=>p.holder);
};
const entry=(id,group,title,type,request,when=stateTrigger(type),grain=0)=>({id,group,title,type,request,when,grain});
export const MEMORIAL_TEMPLATES = [
 entry('tax-register',0,'钱粮月报','钱粮','新旧税册的收解数目对不上，县中担心百姓重复纳税，请准逐户核清'),
 entry('tax-audit',0,'请复核赋税册籍','赋税','请拨书吏缮写税册'),
 entry('salt-books',0,'请清理盐课账册','盐政','请核盐引，仍照旧额征课'),
 entry('land-books',0,'请校勘鱼鳞图册','钱粮','请查田亩册籍，暂缓另议加征'),
 entry('deficit',0,'请核库银亏空','钱粮','国库拮据，请逐库查核',s=>s.nation.treasury<100),
 entry('arrears',0,'请核积欠次第','钱粮','积欠未清，请核偿付名册',s=>s.nation.arrears>0),
 entry('tax-receipts',0,'请稽赋税收解','赋税','请查收解凭照'),
 entry('old-tax',0,'请勾稽旧年钱粮','钱粮','请厘清历年报销案'),
 entry('documents',1,'六部请整饬案牍','政务','请拨书吏整饬案牍'),
 entry('exams',1,'礼部请校乡试名册','科举','请校考生籍贯与保结'),
 entry('exam-rooms',1,'请修贡院号舍','科举','请修缮旧号舍，不增录取额'),
 entry('river-inspect',1,'请查河工埽岸','河工','汛期将近，堤户催修旧埽岸，请派河员查验哪些险段应先动工'),
 entry('roads',1,'请整驿站文移','政务','请稽查驿递公文'),
 entry('official-records',1,'请校官员履历','政务','请补齐考成履历'),
 entry('grain-shortage',2,'请核报粮缺','仓储','仓中余粮不足以支应，仓役请核对欠粮与在途粮册，再拟接济次序',s=>s.nation.grain<0.6,0.6),
 entry('grain-register',2,'请核实仓廪','仓储','请核实库存并支用检仓役粮',stateTrigger('仓储'),0.6),
 entry('grain-air',2,'请晾晒仓粮','仓储','请支役粮翻晾旧谷',stateTrigger('仓储'),0.6),
 entry('grain-boat',2,'请清漕运耗粮','漕运','请支搬运口粮，核验漕单',stateTrigger('仓储'),0.6),
 entry('grain-measure',2,'请校仓斛量器','仓储','请支役粮校准仓斛',stateTrigger('仓储'),0.6),
 entry('grain-seal',2,'请查仓门封识','仓储','请支役粮巡查仓门',stateTrigger('仓储'),0.6),
 entry('grain-road',2,'请整漕运交割','漕运','请支役粮清点粮袋',stateTrigger('仓储'),0.6),
 entry('army-grain',3,'边营请补军粮','军粮','请拨检运费用，支运粮役粮',stateTrigger('军粮'),0.6),
 entry('army-arms',3,'兵部请检军械','兵务','请查旧械修补簿'),
 entry('army-roll',3,'请核边营兵籍','兵务','请核实点卯名册'),
 entry('army-post',3,'请修边台烽燧','边警','请修缮传警器具'),
 entry('army-horses',3,'请核马政刍秣','兵务','请核马匹草料册'),
 entry('army-scout',3,'请校边关塘报','边警','请整理塘报传递次序'),
 entry('classics',4,'言官请开经筵','言官','请备经筵讲义'),
 entry('censor',4,'言官请查考成','言官','请按册稽查考成'),
 entry('greed',4,'言官请核贪墨风闻','贪腐','街谈指有官员收受馈礼，言官请先核往来账簿，再传当事人说明',s=>s.court.officials.some(o=>o.alive&&o.greed>50)),
 entry('prison-books',4,'请核刑狱文书','言官','囚属催问积案，县中称卷宗散失，请派书吏清点旧卷，莫再拖延'),
 entry('rules',4,'言官请重申旧章','言官','请校订现行仪制'),
 entry('censor-merit',4,'言官请录清明考成','言官','地方荐举清明官员，言官请核对考成与乡评，再议褒奖',s=>s.nation.governance>=80),
 entry('accounts',4,'请稽部院报销','言官','请交叉核对各部报销凭据'),
 entry('good-official',5,'地方请奖循吏','政务','请核循吏事迹，先行存案'),
 entry('clan',5,'宗室请校封爵谱牒','宗室','远支宗亲请封，玉牒载录有疏漏，请先核籍贯与辈次，免使名分混乱'),
 entry('envoy',5,'礼部请定来使仪注','外邦','请备接使仪注',s=>s.foreign.some(f=>f.status!=='交战')),
 entry('tribute-books',5,'请核朝贡译牍','外邦','请缮写通好邦国译牍',s=>s.foreign.some(f=>f.status!=='交战')),
 entry('schools',5,'请修州学祭器','政务','请小修州学祭器'),
 entry('ritual',5,'请校岁时祀典','礼制','请核祀典用物账册'),
];
const story=(id,type,title,request,approve,reject,when=stateTrigger(type))=>({id,type,title,request,approve,reject,when});
MEMORIAL_TEMPLATES.push(
 story('tax-ferry','赋税','渡口小贩请缓征摊钱','渡口迁市，小贩既缴旧摊钱，又被催收新摊钱，请暂准以旧票抵缴。','准旧票抵缴','仍按新市例征收'),
 story('tax-weavers','赋税','织户请改纳折银','织户交绢误了农时，愿改纳折银；收税吏担心成色参差，请定章程。','准试行折银','仍照旧例交绢'),
 story('money-wages','钱粮','库吏请先付工匠欠薪','修缮工匠催讨旧薪，地方想先付工钱，再置庆典用物，请裁先后。','先付工钱','先办原定用物'),
 story('salt-mothers','盐政','盐户请留自食盐','灶户家中缺盐，官吏却将自食盐一并封存，请划清官课与家用。','准留家用盐','先核清课额'),
 story('salt-roads','盐政','盐商争走新埠','新埠近便，旧埠盐商怕失生计，请准两埠轮日开市。','准轮日开市','仍用旧埠'),
 story('grain-mice','仓储','仓役请改木架隔鼠','仓役担心旧仓鼠患，想垫高粮垛，另铺木架，请支小修费用。','准修木架','先用旧料修补',stateTrigger('仓储')),
 story('grain-quay','漕运','漕船请让民船避风','风急船挤，漕船要先入港，民船也急于避风，请定入港次序。','准分批共用泊位','官船依例先入',stateTrigger('漕运')),
 story('canal-lock','漕运','船户请错时过闸','漕船与运柴民船争闸，船户请错开时辰，免得整日相阻。','准错时放行','仍按旧次序',stateTrigger('漕运')),
 story('army-shoes','军粮','边营请以旧布制冬靴','边营请把库中旧布改制冬靴，省下购料钱，却须给军匠补贴。','准军匠赶制','待例拨再办',stateTrigger('军粮')),
 story('army-meals','军粮','军厨请添磨坊','军厨想添小磨坊就地磨粮，商人怕失去供应生意，请核准试办。','准小营试办','仍向粮商采买',stateTrigger('军粮')),
 story('army-leave','兵务','老卒请轮班归葬','老卒想归乡祭扫，营官怕同时离营误操练，请准分班给假。','准分班给假','待换防后给假'),
 story('army-archery','兵务','武官争练弓还是练阵','营中教习各执一说，一方重弓术，一方重阵法，请定本季操练次序。','先阵法后弓术','先弓术后阵法'),
 story('border-flags','边警','边台请重定夜间旗号','边台担心旧旗号夜里难辨，想加灯号，守军又怕民间误用。','准边台试新灯号','先修旧烽台'),
 story('border-market','边警','边民请开白日小市','边民想在关外白日互易柴草，守将担心私带军械，请定查验办法。','准设卡查验开市','暂缓关外小市'),
 story('exam-inn','科举','寒士请借官舍候试','寒士进城候试，无力久住客店，请借闲置官舍，地方担心混居生事。','准官舍分院借住','仍由客店安置'),
 story('exam-paper','科举','考官请统一试纸','各县试纸大小不齐，考官想统一式样，书坊却称存纸难以卖出。','准试行统一试纸','旧纸用完再换'),
 story('river-willow','河工','堤户争栽柳还是补石','堤户想栽柳护岸，河工主张先补石，双方都怕误了汛前工期。','先补险段再栽柳','先植柳固土',stateTrigger('河工')),
 story('river-ferry','河工','村民请留修堤便道','修堤便道横穿菜地，村民愿暂借，却请工毕归还原路。','准修路并限期还地','另觅不占田的路',stateTrigger('河工')),
 story('censor-gifts','言官','御史请禁接风厚礼','新官到任常有接风礼，御史怕借礼索财，地方又怕失了礼数。','准简礼接风','先由各省自定'),
 story('censor-drums','言官','言官请重开鸣冤鼓','言官请恢复鼓院轮值，怕衙门以无人在场为由拦下陈情。','准轮值受理','先整现有申诉处'),
 story('greed-stamps','贪腐','御史疑官印被借用','御史接到借官印办私事的风闻，请封存印簿核对，不凭传言定罪。','准核查印簿','先令本衙说明',stateTrigger('贪腐')),
 story('greed-relatives','贪腐','言官请查官亲包揽采购','言官疑地方采购总由官亲承办，请公开比价，先不论罪。','准公开比价核查','先补采购凭据',stateTrigger('贪腐')),
 story('clan-school','宗室','宗室子弟请同入州学','宗室子弟想与寒门学生同堂读书，族老担心失了身份。','准同堂受业','仍在宗学就读'),
 story('clan-fields','宗室','宗室请借荒园安置族人','族中远亲想借荒园住下，管园人担心日后难以收回，请立借居期限。','准限期借居','另议城中住处'),
 story('envoy-food','外邦','译官请改使馆饮食','来使饮食禁忌与馆中旧例不合，译官请另备食单，礼官怕开攀比例。','准依习俗另备','仍照馆中旧例',s=>s.foreign.some(f=>f.status!=='交战')),
 story('envoy-seats','外邦','来使与礼官争席次','礼官与来使对席次各有说法，译官请先以便宴相待，再议正礼。','准先设便宴','等礼仪议定再宴',s=>s.foreign.some(f=>f.status!=='交战')),
 story('ritual-music','礼制','乐官请修旧乐器','乐官想修旧器，礼臣主张备新器以重典礼，请裁取舍。','准先修旧器','依礼备新器'),
 story('ritual-villages','礼制','乡老请合办社祭','邻村愿合办社祭省下花销，地方担心旧有先后之争再起。','准轮流主祭','仍各村分办'),
 story('justice-water','刑狱','两村争渠口先后','两村争灌田次序，都持祖辈旧契，县中请先定轮灌，再核契界。','准先行轮灌','先核契界再议'),
 story('justice-pawn','刑狱','当铺与失主争赎物','当铺凭票留物，失主称票据被冒领，请核验经手人，不先偏听。','准传双方对质','先查铺中账簿'),
 story('justice-fines','刑狱','县令请以修桥代轻罚','县令请让轻微犯禁者参与修桥抵罚，胥吏担心难以点验。','准限定轻罪试办','仍依旧例纳罚'),
 story('farm-bees','农桑','果农请留养蜂花地','果农想在田边留花地养蜂，邻户担心占去粮田，请划定边角地试种。','准边角地试种','先保现有粮田'),
 story('farm-water','农桑','田户请共修小水车','高田用水不便，田户愿出工修水车，却请官府借木料。','准借料由田户出工','待地方自筹木料'),
 story('farm-seeds','农桑','老农与田官争播种早晚','田官催按旧历播种，老农称今年土温尚冷，请各地试田后再定。','准试田再推行','仍循本地旧历'),
 story('market-night','商贸','百姓请准灯市延时','夜市商贩想多留灯火，巡夜兵怕添负担，请划出专街试办。','准专街试办','仍按旧时闭市'),
 story('market-scales','商贸','行商请公置秤尺','客商与本地铺户各执一秤，行会请在市口公置秤尺。','准设公秤公尺','先由行会调处'),
 story('market-fair','商贸','乡集争逢集日子','邻近乡集撞在同日，商贩往来不便，请轮换集日，乡老却各不相让。','准轮换集日','各乡仍循旧日'),
 story('people-wells','民生','里民请分时共用新井','新井近富户宅院，穷户担心被拦取水，请明定共用时辰。','准立共用井约','先由里老调处'),
 story('people-elders','民生','乡老请借空屋作养济所','乡中想借空屋安置孤老，房主怕久借不还，请立岁末续借之约。','准立约借屋','另寻官有房舍'),
 story('people-peddlers','民生','里民争让流贩入巷','流贩入巷方便老人采买，住户却嫌吆喝扰人，请定叫卖时辰。','准划时入巷','仍在巷外摆摊'),
 story('works-bridge','工务','桥匠请留可拆便桥','旧桥待修，桥匠想先架便桥，商户盼早通行，船户怕挡水路。','准架可拆便桥','先修桥墩再通行'),
 story('works-roof','工务','匠户请调换衙署屋瓦','旧署漏雨，匠户想用库存瓦修屋，库吏坚持须先按册请领。','准先领瓦修漏','补齐请领文书再修'),
 story('works-apprentices','工务','工匠请带学徒赴工','老师傅想带学徒随工学艺，监工怕混报工钱，请另册点验。','准学徒另册随工','仅用在册工匠'),
 story('school-books','文教','州学请借书给乡塾','乡塾缺书，州学愿轮流借出旧刻本，教官担心损毁难追。','准立借书簿轮借','先抄副本再借'),
 story('school-girls','文教','乡塾请添女童识字课','乡塾愿在农闲教女童识字，族老各有顾虑，请由有意之家自愿送学。','准自愿入塾','先由乡老议定'),
 story('school-plays','文教','教官争戏文能否劝学','教官想借乡戏讲孝义，另有士绅担心唱词失雅，请先审戏本。','准审本后试演','仍用讲读劝学'),
 story('medicine-boxes','医药','医馆请备行路药箱','乡间离医馆路远，医者想备便携药箱巡诊，请借驿站歇脚。','准借驿站巡诊','仍由村民入城求诊'),
 story('medicine-herbs','医药','药商请合修辨药图','药商担心市售药材混名，愿与医者合修图样，却盼官府刊印。','准校图刊印','先在药行传抄'),
 story('medicine-midwives','医药','医者请教乡婆辨险症','医者想教乡中接生婆识别险症，部分里老怕动了旧规，请自愿试学。','准自愿试学','先办医馆讲习'),
 story('palace-lamps','内廷','宫人请改灯油领取法','宫中灯油按房领用，值夜人手常变，请改为交班核领。','准随交班核领','仍按房领取'),
 story('palace-fabrics','内廷','尚衣处请用余绸补旧衣','尚衣处想把余绸补作常服，管库人担心账目难分，请另立领用簿。','准余绸补衣','先清库存再议'),
 story('palace-garden','内廷','园役请留落叶作堆肥','园役想留落叶养花，管事嫌园中不洁，请划出后圃收存。','准后圃堆肥','仍按旧例清运'),
 story('war-messengers','战事','行营请分路传递军报','行营担心军报集中一路容易迟误，请分路传递，但需多拨驿递费用。','准分路传报','仍由原驿路传递',s=>s.campaigns.some(w=>!w.done)),
 story('war-letters','战事','军眷请代转平安家书','出征将士家眷请代转家书，行营怕挤占军报驿路，请择便车附送。','准便车附送','待战事稍缓再送',s=>s.campaigns.some(w=>!w.done)),
 story('war-carts','战事','行营请借民车运辎重','行营想借民车运辎重，车户怕误农，请定归还期限，不强征长用。','准立约短借','仍用官有军车',s=>s.campaigns.some(w=>!w.done))
);
const relief={id:'disaster-relief',title:'请赈灾民',type:'请赈',request:'灾情未解，灾民盼先领口粮，地方请拨银赈济，再清核领用名册。',relief:true};
export function routineTemplate(state,group,province,draw){
 const active=new Set(state.memorials.map(m=>m.templateId)),recent=state.memorialVariety||[];
 const disaster=state.nation.provinces.filter(p=>p.disaster>0);
 const unserved=disaster.filter(p=>!state.memorials.some(m=>m.type==='请赈'&&m.provinceId===p.id));
 if(group===2&&unserved.length){const z=unserved[draw%unserved.length];return {...relief,id:relief.id+':'+z.id,provinceId:z.id,title:z.name+' '+relief.title};}
 const shortage=MEMORIAL_TEMPLATES.find(t=>t.id==='grain-shortage');
 if(group===2&&state.nation.grain<0.6&&!active.has(shortage.id))return {...shortage,provinceId:province.id,title:province.name+' '+shortage.title};
 const available=MEMORIAL_TEMPLATES.filter(t=>t.when(state)&&!active.has(t.id));
 if(!available.length)return null;
 let rng=seedNumber(`memorial:${state.rng}:${state.turn}:${group}:${draw}`);
 const pick=pool=>{const r=random(rng);rng=r.rng;return pool[Math.floor(r.value*pool.length)];};
 const least=(pool,key)=>{const ranks=pool.map(x=>recent.findLastIndex(r=>r[key]===x[key]));const min=Math.min(...ranks);return pool.filter((_,i)=>ranks[i]===min);};
 const types=[...new Set(available.map(t=>t.type))].map(type=>({type}));
 const batchTypes=new Set(recent.filter(r=>r.turn===state.turn).map(r=>r.type)),unpicked=types.filter(t=>!batchTypes.has(t.type));
 const type=pick(least(unpicked.length?unpicked:types,'type')).type;
 const t=pick(least(available.filter(t=>t.type===type),'id'));
 const z=province,logistics=group===2&&!t.grain;
 return {...t,...(logistics?{grain:0.6,request:t.request+'，并请拨外差所需口粮'}:{}),provinceId:z.id,title:z.name+' '+t.title};
}
export function routineOptions(t,province){
 return [
  {id:'approve',label:t.approve||'准奏',effects:t.relief?{treasury:-8,province:{id:province.id,morale:2,disaster:-5},virtue:1}:{treasury:-2,governance:0.1,...(t.grain?{grain:-t.grain}:{})}},
  {id:'reject',label:t.reject||'驳回',effects:{prestige:0.2,...(t.relief?{virtue:-2}:{})}},
  {id:'hold',label:'留中',effects:{}},
 ];
}
const MEMORIAL_DETAILS={
 钱粮:'此事牵涉收款、解送与支领各处，若只凭一册定夺，恐将旧欠当作新欠，反教百姓再出钱。臣拟让经手人带原据当面核对，先分清哪些是册上笔误，哪些确须追问，再将有争议之处另呈御前，不使无涉人户陪着等候。',
 赋税:'征解自有旧额，百姓手中也有完纳凭据，地方最怕一处改了办法，别处仍照旧催征。臣请把新旧办法对照说清，容各户持票申明；应纳者不许借机推脱，已经交纳者也不应再受催逼。若准试办，还须先向乡里明白晓谕。',
 盐政:'盐课关乎官收，也系灶户、运商与小民日用，各方只顾眼前之利，容易互相推诿。臣拟请课司会同灶户与商人核议，把应守的课额、可以通融的家用和市易分开说明。既免借变通之名漏课，也不让地方多设关卡扰民。',
 政务:'旧例并非全无道理，只是各衙理解不同，往来公文一多，具体承办的人便相互等待。臣拟先把争议交由经手各方当面说清，能按现例办的即行办理，确须变通的再另列缘由呈请。如此既不轻改成法，也免小事拖成积案。',
 科举:'科场重在公允，寒士赴试又各有难处，不能只顾方便而让人疑有偏私。臣拟先将办法张示，听取教官、考生与地方经办者的意见，把谁可受益、如何查验写明。若试办不妥，仍可收回旧章，不至一开始便推及各处。',
 河工:'河工最怕错过时令，却也不能因催办便草率用料。臣拟让河员与熟悉水势的堤户共同踏勘，先辨险缓，再定用工先后；需要借地、借料的地方，也应先说清归还之约。既防拖延误事，也免工程未稳，乡间先添争端。',
 仓储:'仓中出入不可只凭口头交割，现存、欠解与在途各有凭据，若混作一处，催运与支领便都无从着手。臣拟让仓役会同收粮经手人对册查验，逐项说明差异，有疑处另行封记呈报。所需役用也请明示，以免差役自行向民间摊派。',
 漕运:'官船有运期，民船也有养家活计，若一味相争，最后反倒都误了行程。臣拟让闸官、船户与沿岸经办者共同定下先后，遇风阻水浅时另留转圜之地。既守官运之责，也使民间知道何时可以通行，不必日日拥在岸边候问。',
 军粮:'营中用度不能因争议中断，军需采买又须防有人借急务抬价。臣拟请营官把现有物料、可以改用的旧物和确须添置之处分别说明，再与军匠、供应者当面核议。能省的省，不能省的也要说出缘由，免使将士替文书争执受累。',
 兵务:'操练与军中人情须兼顾，若只求一时整齐，恐令将士有难不敢言；若凡事通融，又怕营规渐弛。臣拟请各营将官先议出可行的轮次与查验办法，择一处试行，再据实情议定。既不空许方便，也不使旧例成为推脱之辞。',
 边警:'边地守备不可稍懈，军民往来又不能全靠禁令处置。臣拟请守将先明定查验、传警与交班之责，容边民申说日用之需，再把可行与不可行的缘由一并呈明。若准试办，应先限在便于照应之处，遇有不妥便及时停下。',
 言官:'风闻、旧例与实际经办常不相同，若只听一面之词，恐使肯任事者受屈；若置之不问，又难服众。臣拟让有关衙门逐项答复，原呈者亦可补具凭据，先把事实问清。应改者明示如何改，应守者也须说出不能变通的缘由。',
 贪腐:'此番所陈仍须查证，不宜先凭传闻论人罪名，也不能让当事衙门只以一纸答复了事。臣请将经手文据与往来记录留存，由无涉此事之人核对，容被指者自行申明。若确有疑处再具名呈请，免得查弊反成借机倾轧。',
 宗室:'宗亲自有身份，地方与有司也各有应守之责，若只凭族中口说便行通融，恐使远近支派争相援例。臣拟先核清旧牒与现有章程，把所请之事的期限、界限与经办者写明，再交族中议定，使名分与日后收回之责都有着落。',
 外邦:'宾礼既须顾及朝廷体面，也要让来使明白何处可以商量、何处须守成法。臣拟请礼官与译官先将双方说法对照，免因传译不同生出误会；可以暂用便例的，注明只为此次接待，须另议正礼的，再由双方各陈所据。',
 礼制:'礼有成文，地方用物与民间习惯却未必处处相同，若骤然更改，容易让人无所适从。臣拟请礼官先查旧章，再听经办者说明难处，取不伤礼意而能节省烦费的办法。若须试行，应先告知各方所守之例，免得临事再争先后。',
 刑狱:'双方各有所据，若尚未问清便先定是非，恐使小争执拖成长期嫌隙。臣拟将旧契、票据与经手人的说法一并核验，先设法使日常生计不致中断，再依法理议定。有争议者可当面申说，不能以催办为由逼人认下未明之事。',
 农桑:'农事有时令，田户也熟悉各处水土，不宜只凭一纸新法便令各乡照办。臣拟择愿意试行的地方先做，保留原有办法作比照，并请乡老记录其中利弊。若确能省工便民，再逐步劝行；若水土不宜，也容地方照旧耕作。',
 商贸:'商贩求便利，住户与行会则各有顾虑，若只准一方所请，争执未必就此平息。臣拟先约各方议明时辰、场所与查验之责，试行时留出申诉之门。既使守规矩者有所遵循，也免地方借新规多收费用，让便民之意落空。',
 民生:'此事看似乡里小务，所涉却有老弱、业主与经办者的不同难处，不宜只教一方让步。臣拟由里老会同各家当面立约，把使用时辰、照管之责与日后收回之法说清。若有异议，先容其申说，免得好意未成，邻里先结下怨隙。',
 工务:'用工、领料与完工交接各有章程，若等手续全齐才动手，恐误眼前急用；若先办后补，又怕日后推不清责任。臣拟先列明可用旧料与确须添置之处，由匠人说明做法，再定经手与验收之人，使赶工与守例都有凭据。',
 文教:'教化贵在使人愿学，书舍、教习与乡里看法也须妥善照应，不能只下一道文书便算办成。臣拟先听教官与家长所虑，再择愿意参与者试行，借物、用屋及照管之责均立明约。若确有成效，再请推广，不勉强各乡一时齐行。',
 医药:'医药之事关系乡民安危，既不可因循不办，也不能只凭热心便草率推广。臣拟请熟悉此事的医者先校核做法，地方只负责借屋、通行与召集，不代医者断病。先在便于往来的地方试行，再听乡民与医馆说明其中难处。',
 内廷:'内廷用物虽小，日久也会积成烦费，若只催着节省而不改交接办法，宫人恐仍无所适从。臣拟让管事与实际领用者一同议定，旧物可用的先用，需要收存的明定去处。既求俭省，也不许借此另加差派，使值役之人难以承当。',
 战事:'军前所需贵在及时，驿路、民用与营中规矩又不能顾此失彼。臣拟请行营先说明何处可以随现有安排通融，何处确须另拨人手，并将归还、交接之责写明。凡涉及军报与机密仍守原制，不因图一时方便便擅自放宽。',
 请赈:'赈济须及时，领用也须有人照管，若等所有名册核完才办，恐使求助者久候；若一概凭口头领用，又怕挤占应得之人。臣拟先由熟悉乡情者会同经办官查明急缓，发放与复核分别有人负责，有争议之户另记呈问，不误眼前救急。'
};
export function memorialText(m,modern=false){
 const request=String(m.request||m.title||'有事待议').replace(/[。；]+$/,''),place=m.provinceId&&m.title.includes(' ')?m.title.split(' ')[0]:'';
 const detail=MEMORIAL_DETAILS[m.type]||MEMORIAL_DETAILS.政务,approve=m.options?.[0]?.label==='准奏'?'准照所请办理':m.options?.[0]?.label||'裁处',reject=m.options?.[1]?.label||'暂缓议行';
 return (modern?'陛下，'+(place?place+'报来一事：':''):'臣谨奏：'+(place?place+'来文，':''))+request+'。\n\n'+detail+'\n\n'+
 (modern?'因此，臣请'+approve+'；若陛下另有考虑，也请裁定是否'+reject+'。地方正在等候回音，臣不敢自行更改旧例。':'伏请'+approve+'；若仍'+reject+'，亦请明示应守之例，臣等谨候圣裁。');
}
