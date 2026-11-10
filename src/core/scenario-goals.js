// Scenario goals are game objectives, not claims about historical intentions.
// Templates contain names; selection resolves them to the actual save's IDs.
const n=(id,label,key,target,op='gte')=>({id,label,key,target,op});
const r=(id,label,rule,target=1,op='gte')=>({id,label,rule,target,op});
const official=(name,field)=>({type:'official',name,field});
const serving=(name,posts)=>({type:'serving',name,...(posts?{posts}: {})});
const province=(name,field)=>({type:'province',name,field});
const border=(dir,field)=>({type:'border',dir,field});
const country=(name,type)=>({type,name});
const child=(name,field)=>({type:'child',name,field});
const goal=(suffix,kind,title,reason,objectives,holdTurns=0)=>({suffix,kind,title,reason,objectives,...(holdTurns?{holdTurns}:{})});
const macro=(...args)=>goal(args[0],'宏愿',...args.slice(1));
const wish=(...args)=>goal(args[0],'心事',...args.slice(1));
const CATALOG={
 'han-wudi':[
  macro('xiongnu','北击匈奴','军功须落在匈奴身上，还要有能守住北边的军队。',[
   r('wins','本朝对匈奴赢得2场完整战役',country('匈奴','countryWins'),2),r('threat','北境边患不高于35',border('北','threat'),35,'lte'),
   r('troops','北境兵员至少40000人',border('北','troops'),40000)]),
  macro('schools','建元兴学','兴学与整顿官署一起办，不能只靠一句尊儒。',[
   n('book','本朝完成1次编修大典','project:编修大典',1),n('reform','本朝完成1次整饬吏治','project:整饬吏治',1),
   n('virtue','圣德至少75','virtue',75),n('letters','文采至少85','talent:文采',85)]),
  wish('ji-an','容得下汲黯的直言','让直臣留在朝中，也让他愿意亲近天子。',[
   r('post','汲黯在任，未下狱或致仕',serving('汲黯')),r('favor','汲黯好感至少80',official('汲黯','favor'),80),
   r('talks','近36旬与汲黯完成3轮面谈',{type:'officialTalks',name:'汲黯'},3)]),
  wish('heir','为刘氏立储育才','立储之外，还要给储君择师、教养。',[
   n('heir','已册立在世储君','livingHeir',1),n('tutor','储君已拜师','heirTutored',1),n('study','储君教养至少40','heirEducation',40)]),
 ],
 'tang-taizong':[
  macro('zhenguan','贞观之治','钱粮、民心和吏治都稳住，才算治世有了根基。',[
   n('gov','吏治至少80','governance',80),n('people','民心至少75','morale',75),n('silver','国库至少400万两','treasury',400),
   n('rebels','各州均无民变','rebellions',0,'lte')],18),
  macro('wei-river','化解渭水危局','可用交涉或战场胜利解围，北境与京营也须站稳。',[
   r('settled','与东突厥通好、结盟或使其朝贡；也可战胜后停战',country('东突厥','settledCountry')),
   r('threat','北境边患不高于30',border('北','threat'),30,'lte'),r('capital','京营兵员至少40000人',{type:'capital',field:'troops'},40000),
   r('war','北境没有未结束的战役',{type:'borderWars',dir:'北'},0,'lte')],9),
  wish('wei-zheng','留住魏征','容纳旧日东宫之臣，让他长久立于朝中。',[
   r('post','魏征在任，未下狱或致仕',serving('魏征')),r('favor','魏征好感至少80',official('魏征','favor'),80),n('years','本朝在位满3年','reignYears',3)]),
  wish('chengqian','教好承乾','储位落在承乾身上，也要看见实际教养。',[
   r('heir','李承乾在世并仍为储君',{type:'isHeir',name:'李承乾'}),r('study','李承乾教养至少70',child('李承乾','education'),70),
   r('tutor','李承乾已拜师',{type:'childTutored',name:'李承乾'})]),
 ],
 'song-renzong':[
  macro('benevolence','宽仁之治','让各州百姓都受益，不能只把全国平均数抬高。',[
   n('people','每一州民心都至少65','minMorale',65),n('disaster','每一州灾情都不高于10','maxDisaster',10,'lte'),n('virtue','圣德至少80','virtue',80)],12),
  macro('remonstrance','台谏重振','让鲁宗道与范仲淹各居言职，并整顿朝纲。',[
   r('lu','鲁宗道任御史中丞',{...serving('鲁宗道'),posts:['p7']}),r('fan','范仲淹任知谏院',{...serving('范仲淹'),posts:['p23']}),
   n('gov','吏治至少75','governance',75)]),
  wish('personal-rule','天圣亲政','走出垂帘之后，要有足够的威望亲自理政。',[
   n('rule','已满16岁并结束摄政','personalRule',1),n('prestige','皇威至少65','prestige',65),n('politics','政略至少70','talent:政略',70)]),
  wish('yan-shu','与晏殊论文章','文才要有长进，也要真正在御前与晏殊往来。',[
   r('post','晏殊在任，未下狱或致仕',serving('晏殊')),r('favor','晏殊好感至少80',official('晏殊','favor'),80),
   r('talks','近36旬与晏殊完成3轮面谈',{type:'officialTalks',name:'晏殊'},3),n('letters','文采至少85','talent:文采',85)]),
 ],
 'ming-wanli':[
  macro('performance','考成新政','考成须真正办完，也要让吏治与积欠见到改变。',[
   n('reform','本朝完成2次整饬吏治','project:整饬吏治',2),n('gov','吏治至少80','governance',80),n('debt','国库积欠清零','arrears',0,'lte')]),
  macro('river-grain','河清粮足','治河要见于河南、南直隶的灾情，仓中也须有粮。',[
   n('river','本朝完成2次修河','project:修河',2),r('henan','河南灾情不高于10',province('河南','disaster'),10,'lte'),
   r('south','南直隶灾情不高于10',province('南直隶','disaster'),10,'lte'),n('grain','现粮可供12个月军粮与赈济','grainMonths',12)],9),
  wish('zhang-juzheng','与江陵君臣相得','亲政后仍能用好张居正，而非一味依赖辅政。',[
   n('rule','已满16岁并结束摄政','personalRule',1),r('post','张居正在任',serving('张居正')),r('favor','张居正好感至少85',official('张居正','favor'),85),
   n('politics','政略至少75','talent:政略',75)]),
  wish('wang-guoguang','钱谷知王国光','把户部交给知钱谷的人，信任之外也要清掉积欠。',[
   r('post','王国光任户部尚书',serving('王国光',['p1'])),r('favor','王国光好感至少80',official('王国光','favor'),80),
   n('debt','国库积欠清零','arrears',0,'lte')]),
 ],
 'ming-chongzhen':[
  macro('restoration','中兴大明','朝局、钱粮与民情一起转好，并保持下来。',[
   n('gov','吏治至少70','governance',70),n('people','民心至少65','morale',65),n('silver','国库至少300万两','treasury',300),
   n('debt','国库积欠清零','arrears',0,'lte'),n('rebels','各州均无民变','rebellions',0,'lte')],12),
  macro('liaodong','稳住辽东','东境有可用的军队，辽东民情安定，才算稳住防线。',[
   r('threat','东境边患不高于35',border('东','threat'),35,'lte'),r('ready','东境战备至少70',border('东','readiness'),70),
   r('troops','东境兵员至少30000人',border('东','troops'),30000),r('people','辽东民心至少55',province('辽东','morale'),55),
   r('war','东境没有未结束的战役',{type:'borderWars',dir:'东'},0,'lte'),n('grain','现粮至少够1个月军粮与赈济','grainMonths',1)],12),
  wish('empress-zhou','与周后共守风雨','顾惜周氏，在国事之外留住相伴之人。',[
   r('company','周氏在世、在宫且未入冷宫',{type:'companion',name:'周氏'}),r('favor','周氏宠眷至少85',{type:'consort',name:'周氏',field:'favor'},85),
   r('health','周氏健康至少60',{type:'consort',name:'周氏',field:'health'},60),n('years','本朝在位满5年','reignYears',5)]),
  wish('bi-ziyan','钱谷托付毕自严','让毕自严掌户部，并把信任落实在钱粮上。',[
   r('post','毕自严任户部尚书',serving('毕自严',['p1'])),r('favor','毕自严好感至少80',official('毕自严','favor'),80),
   n('debt','国库积欠清零','arrears',0,'lte'),n('silver','国库至少180万两','treasury',180)]),
 ],
 'qing-kangxi':[
  macro('power','亲政收权','亲政之后，鳌拜不再占据朝职，皇权才能站稳。',[
   n('rule','已满16岁并结束摄政','personalRule',1),r('aobai','鳌拜已无在任职位',{type:'inactiveOfficial',name:'鳌拜'}),
   n('prestige','皇威至少75','prestige',75),n('politics','政略至少75','talent:政略',75)],9),
  macro('frontiers','安定藩镇海疆','分别安顿平西藩与台湾郑氏，南东两境都要安稳。',[
   r('south','平西藩通好、结盟、朝贡或战败停战',country('平西藩','settledCountry')),
   r('taiwan','台湾郑氏通好、结盟、朝贡或战败停战',country('台湾郑氏','settledCountry')),
   r('south-border','南境边患不高于35',border('南','threat'),35,'lte'),r('east-border','东境边患不高于35',border('东','threat'),35,'lte'),
   r('south-war','南境没有未结束的战役',{type:'borderWars',dir:'南'},0,'lte'),r('east-war','东境没有未结束的战役',{type:'borderWars',dir:'东'},0,'lte')],12),
  wish('wei-yijie','让魏裔介敢言','保住御史的言路，不能只换一个亲信占位。',[
   r('post','魏裔介任左都御史',serving('魏裔介',['p7'])),r('favor','魏裔介好感至少80',official('魏裔介','favor'),80),
   r('talks','近36旬与魏裔介完成3轮面谈',{type:'officialTalks',name:'魏裔介'},3)]),
  wish('mingzhu','御前有明珠','亲政后培养可用的近臣，也要听他把话说完。',[
   n('rule','已满16岁并结束摄政','personalRule',1),r('post','明珠在任',serving('明珠')),r('favor','明珠好感至少85',official('明珠','favor'),85),
   r('talks','近36旬与明珠完成3轮面谈',{type:'officialTalks',name:'明珠'},3)]),
 ],
 'qing-yongzheng':[
  macro('treasury','清平户部亏空','查核要办完，库款与积欠也要经得起看。',[
   n('reform','本朝完成2次整饬吏治','project:整饬吏治',2),n('gov','吏治至少80','governance',80),
   n('silver','国库至少900万两','treasury',900),n('debt','国库积欠清零','arrears',0,'lte')],9),
  macro('northwest','西北靖边','准噶尔一线要有兵、有备，也要停下未了的战事。',[
   r('settled','与准噶尔通好、结盟、朝贡或战胜停战',country('准噶尔','settledCountry')),
   r('threat','西境边患不高于30',border('西','threat'),30,'lte'),r('ready','西境战备至少75',border('西','readiness'),75),
   r('troops','西境兵员至少40000人',border('西','troops'),40000),r('war','西境没有未结束的战役',{type:'borderWars',dir:'西'},0,'lte')],12),
  wish('yinxiang','怡亲王为臂膀','让允祥在中枢任事，并保持君臣之间的信任。',[
   r('post','允祥任首席大学士或议政大臣',serving('允祥',['p0','p10'])),r('favor','允祥好感至少85',official('允祥','favor'),85),
   r('talks','近36旬与允祥完成3轮面谈',{type:'officialTalks',name:'允祥'},3)]),
  wish('hongli','为弘历定储基','储位、教养与健康须一并准备，不能只在故事里说属意弘历。',[
   r('heir','弘历在世并已立为储君',{type:'isHeir',name:'弘历'}),r('study','弘历教养至少70',child('弘历','education'),70),
   r('health','弘历健康至少80',child('弘历','health'),80),r('tutor','弘历已拜师',{type:'childTutored',name:'弘历'})]),
 ],
 'han-lingdi':[
  macro('restore','重振汉室','让卖官败坏的朝纲与民心回转，不能只把钱留在宫中。',[
   n('gov','吏治至少70','governance',70),n('people','民心至少65','morale',65),n('debt','国库积欠清零','arrears',0,'lte'),
   n('rebels','各州均无民变','rebellions',0,'lte')],12),
  macro('palace-power','不再事事问张让','近侍不再占据朝职，天子还须有能力亲自理政。',[
   r('zhang','张让已无在任职位',{type:'inactiveOfficial',name:'张让'}),n('power','皇威至少70','prestige',70),n('rule','政略至少60','talent:政略',60)],9),
  wish('cai-yong','听蔡邕说经论乐','留住通经知音律的人，也听得进他的话。',[
   r('post','蔡邕在任，未下狱或致仕',serving('蔡邕')),r('favor','蔡邕好感至少80',official('蔡邕','favor'),80),
   r('talks','近36旬与蔡邕完成3轮面谈',{type:'officialTalks',name:'蔡邕'},3),n('letters','文采至少75','talent:文采',75)]),
  wish('liu-bian','为刘辩定储育才','幼子不能只仗母家，储位和教养都须落实。',[
   r('heir','刘辩在世并已立为储君',{type:'isHeir',name:'刘辩'}),r('tutor','刘辩已拜师',{type:'childTutored',name:'刘辩'}),
   r('study','刘辩教养至少60',child('刘辩','education'),60)]),
 ],
 'song-huizong':[
  macro('peace','宣和真正太平','园石之外，各路百姓都要过得下去。',[
   n('people','每一州民心至少60','minMorale',60),n('disaster','每一州灾情不高于10','maxDisaster',10,'lte'),n('gov','吏治至少70','governance',70)],12),
  macro('border','不以边军赌国运','无论议和还是用兵，都须给北边留下能战能守的军队。',[
   r('liao','与辽通好、婚盟、朝贡或战胜后停战',country('辽','settledCountry')),r('threat','北境边患不高于35',border('北','threat'),35,'lte'),
   r('ready','北境战备至少75',border('北','readiness'),75),r('war','北境没有未结束战役',{type:'borderWars',dir:'北'},0,'lte')],9),
  wish('letters','宣和文墨传世','以书画之才编成一部大典，文事也须真正办完。',[
   n('book','本朝完成1次编修大典','project:编修大典',1),n('letters','文采至少95','talent:文采',95),n('virtue','圣德至少60','virtue',60)]),
  wish('empress','与郑后长相伴','顾惜旧日相伴之人，不只追逐眼前的新宠。',[
   r('company','郑氏在世、在宫且未入冷宫',{type:'companion',name:'郑氏'}),r('favor','郑氏宠眷至少85',{type:'consort',name:'郑氏',field:'favor'},85),
   r('health','郑氏健康至少60',{type:'consort',name:'郑氏',field:'health'},60),n('years','本朝在位满5年','reignYears',5)]),
 ],
 'ming-xizong':[
  macro('palace','内廷不代天子','收回魏忠贤的职位，也要让清理后的朝纲稳得住。',[
   r('wei','魏忠贤已无在任职位',{type:'inactiveOfficial',name:'魏忠贤'}),n('gov','吏治至少70','governance',70),n('power','皇威至少70','prestige',70)],9),
  macro('liaodong','守住辽东门户','稳住东境军队与辽东民情，不以一道捷报冒充安定。',[
   r('threat','东境边患不高于35',border('东','threat'),35,'lte'),r('ready','东境战备至少75',border('东','readiness'),75),
   r('people','辽东民心至少60',province('辽东','morale'),60),r('war','东境没有未结束战役',{type:'borderWars',dir:'东'},0,'lte'),n('grain','现粮可供3个月军粮与赈济','grainMonths',3)],12),
  wish('workshop','木石之外有分寸','可寄情营造，也须把国用与百姓放在心上。',[
   n('garden','本朝完成1次修园','project:修园',1),n('debt','国库积欠清零','arrears',0,'lte'),n('people','民心至少60','morale',60)]),
  wish('sun','听懂孙承宗的辽事','让讲官留在朝中，亲自问清兵饷与守战。',[
   r('post','孙承宗在任，未下狱或致仕',serving('孙承宗')),r('favor','孙承宗好感至少80',official('孙承宗','favor'),80),
   r('talks','近36旬与孙承宗完成3轮面谈',{type:'officialTalks',name:'孙承宗'},3),n('rule','政略至少65','talent:政略',65)]),
 ],
};
CATALOG['ming-yingzong']=[
 macro('capital','保住京师根本','边警再急，也须留下能守京师的兵粮。',[r('army','京营至少60000人',{type:'capital',field:'troops'},60000),r('ready','京营战备至少80',{type:'capital',field:'readiness'},80),n('grain','军粮可供6个月','grainMonths',6)],9),
 macro('border','不负边军','稳住北边，不以近侍的豪言代替军备。',[r('risk','北境边患不高于35',border('北','threat'),35,'lte'),r('ready','北境战备至少75',border('北','readiness'),75),n('gov','吏治至少65','governance',65)],12),
 wish('yu-qian','听于谦谈军民','让敢言知兵的人留在朝中。',[r('post','于谦在任',serving('于谦')),r('favor','于谦好感至少80',official('于谦','favor'),80),r('talks','近36旬与于谦面谈3轮',{type:'officialTalks',name:'于谦'},3)]),
 wish('empress','平安与钱后相守','国事之外，留住相伴之人。',[r('company','钱氏仍在宫中',{type:'companion',name:'钱氏'}),r('favor','钱氏宠眷至少85',{type:'consort',name:'钱氏',field:'favor'},85),n('years','在位满5年','reignYears',5)]),
];
CATALOG['tang-xuanzong']=[
 macro('command','边镇复归朝廷','安禄山离开朝职，北境军备也须重新稳住。',[r('an','安禄山已无在任职位',{type:'inactiveOfficial',name:'安禄山'}),r('risk','北境边患不高于35',border('北','threat'),35,'lte'),n('power','皇威至少75','prestige',75)],12),
 macro('peace','天宝再见太平','把盛景落在百姓生计上。',[n('people','每州民心至少65','minMorale',65),n('gov','吏治至少75','governance',75),n('rebels','各州无民变','rebellions',0,'lte')],12),
 wish('yang','长生殿外长相守','顾惜杨氏，也须顾及国用。',[r('company','杨玉环仍在宫中',{type:'companion',name:'杨玉环'}),r('favor','杨玉环宠眷至少95',{type:'consort',name:'杨玉环',field:'favor'},95),n('debt','积欠清零','arrears',0,'lte')]),
 wish('heir','父子之间少些猜疑','储位落实之外，还要真正教养。',[r('heir','李亨仍为在世储君',{type:'isHeir',name:'李亨'}),r('study','李亨教养至少80',child('李亨','education'),80),r('tutor','李亨有师傅',{type:'childTutored',name:'李亨'})]),
];
CATALOG['song-qinzong']=[
 macro('defence','守住靖康京城','守城不能只靠一句死战。',[r('army','京营至少60000人',{type:'capital',field:'troops'},60000),r('ready','京营战备至少80',{type:'capital',field:'readiness'},80),n('grain','军粮可供6个月','grainMonths',6)],12),
 macro('peace','解围之后能安民','解围之外，朝纲与民心都须回转。',[r('gold','金通好、朝贡、婚盟或战胜后停战',country('金','settledCountry')),n('people','民心至少65','morale',65),n('gov','吏治至少65','governance',65)],9),
 wish('li-gang','用得住李纲','任用守城之臣，不随谗言进退。',[r('post','李纲在任',serving('李纲')),r('favor','李纲好感至少85',official('李纲','favor'),85),r('talks','近36旬与李纲面谈3轮',{type:'officialTalks',name:'李纲'},3)]),
 wish('son','护住赵谌','储君的健康与教养不可偏废。',[r('heir','赵谌仍为在世储君',{type:'isHeir',name:'赵谌'}),r('health','赵谌健康至少85',child('赵谌','health'),85),r('study','赵谌教养至少70',child('赵谌','education'),70)]),
];
CATALOG['qing-jiaqing']=[
 macro('heshen','亲政先清积弊','处置权臣之后，更须让吏治真正转好。',[r('he','和珅已无在任职位',{type:'inactiveOfficial',name:'和珅'}),n('gov','吏治至少75','governance',75),n('debt','积欠清零','arrears',0,'lte')],12),
 macro('people','川楚军民得安','军务之后，还给百姓安稳。',[r('si','四川民心至少65',province('四川','morale'),65),r('hu','湖广民心至少65',province('湖广','morale'),65),n('rebels','各州无民变','rebellions',0,'lte'),n('grain','军粮可供6个月','grainMonths',6)],12),
 wish('teacher','不负帝师朱珪','亲理政务，也听得进旧师的规劝。',[r('post','朱珪在任',serving('朱珪')),r('favor','朱珪好感至少85',official('朱珪','favor'),85),r('talks','近36旬与朱珪面谈3轮',{type:'officialTalks',name:'朱珪'},3)]),
 wish('minning','为旻宁定储育才','以真实教养准备储位。',[r('heir','旻宁为在世储君',{type:'isHeir',name:'旻宁'}),r('study','旻宁教养至少80',child('旻宁','education'),80),r('tutor','旻宁有师傅',{type:'childTutored',name:'旻宁'})]),
];
export const SCENARIO_GOALS=Object.fromEntries(Object.entries(CATALOG).map(([scenarioId,goals])=>[scenarioId,goals.map(({suffix,...g})=>({...g,id:scenarioId+'-'+suffix,scenarioId}))]));
export function scenarioGoals(id) {return SCENARIO_GOALS[id] || [];}
const poolFor=(s,type)=>['official','serving','inactiveOfficial','officialTalks'].includes(type)?s.court.officials:
 ['child','isHeir','childTutored'].includes(type)?s.harem.children:['consort','companion'].includes(type)?s.harem.consorts:
 type==='province'?s.nation.provinces:['countryWins','settledCountry'].includes(type)?s.foreign:null;
export function bindScenarioGoal(state,template,owner) {
 const g=structuredClone(template);g.ownerReignId=owner;
 for(const o of g.objectives){
  if(!o.rule)continue;const q=o.rule;
  if(q.name){const target=poolFor(state,q.type)?.find(x=>x.name===q.name);if(!target)throw new Error('专属目标缺少人物或地区：'+q.name);q.id=target.id;}
  if(q.dir&&!state.nation.army.frontiers.some(b=>b.dir===q.dir))throw new Error('专属目标缺少边境：'+q.dir);
  if(q.posts&&!q.posts.every(id=>state.court.posts.some(p=>p.id===id)))throw new Error('专属目标官职不存在');
 }
 if(g.holdTurns){g.stableTurns=0;g.checkedTurn=state.turn;}
 return g;
}
const available=o=>!!o&&o.alive&&o.health>0&&!o.retired&&!o.jailed;
const servingNow=(s,o)=>available(o)&&s.court.posts.some(p=>p.holder===o.id&&p.id===o.post);
export function scenarioRuleValue(s,q) {
 const pool=poolFor(s,q.type),person=pool?.find(x=>x.id===q.id),border=s.nation.army.frontiers.find(b=>b.dir===q.dir);
 // These goals belong only to the preset's first reign. Its campaign history
 // is therefore the current emperor's, including legacy campaigns without dates.
 const wins=id=>s.campaigns.filter(w=>w.country===id&&w.done&&w.result==='胜利').length;
 if(q.type==='border')return border?.[q.field] ?? null;
 if(q.type==='borderWars')return border?s.campaigns.filter(w=>!w.done&&w.dir===q.dir).length:null;
 if(q.type==='capital')return s.nation.army.capital[q.field] ?? null;
 if(!person)return null;
 if(q.type==='province')return person[q.field] ?? null;
 if(q.type==='official')return available(person)?person[q.field]??null:null;
 if(q.type==='serving')return Number(servingNow(s,person)&&(!q.posts||q.posts.includes(person.post)));
 if(q.type==='inactiveOfficial')return Number(!servingNow(s,person));
 if(q.type==='officialTalks')return available(person)?new Set(s.talks.filter(t=>t.person===person.id&&t.turn>=Math.max(s.reign?.accessionTurn||0,s.turn-35)&&t.turn<=s.turn&&t.reply?.trim()).map(t=>t.id)).size:null;
 if(q.type==='consort')return person.health>0&&!person.retired?person[q.field]??null:null;
 if(q.type==='companion')return Number(person.health>0&&!person.retired&&!person.cold);
 if(q.type==='child')return person.health>0?person[q.field]??null:null;
 if(q.type==='isHeir')return Number(person.health>0&&s.harem.heir===person.id);
 if(q.type==='childTutored')return Number(person.health>0&&s.court.officials.some(o=>o.id===person.tutor&&servingNow(s,o)));
 if(q.type==='countryWins')return wins(person.id);
 if(q.type==='settledCountry')return Number(!['交战','停战待议'].includes(person.status)&&
  (['通好','朝贡','婚盟'].includes(person.status)||wins(person.id)>0));
 return null;
}
export function goalConditionLabel(o) {
 if(o.label)return o.label;
 if(o.type==='story')return '故事中完成：'+(o.keywords||[]).join('、');
 const labels={governance:'吏治',treasury:'国库（万两）',morale:'民心',virtue:'圣德',health:'健康',friendly:'友好外邦',tribute:'朝贡与婚盟外邦',warsWon:'本朝战役胜场',heir:'册立储君',outings:'本朝出巡次数',reignYears:'本朝在位年数',maxFavor:'本朝嫔妃最高宠眷',children:'本朝子嗣数',maxOfficialFavor:'大臣最高好感'};
 const key=o.key||'';return (labels[key]||(key.startsWith('project:')?'本朝完成'+key.slice(8):'目标进度'))+' '+(o.op==='lte'?'不高于':'至少')+' '+o.target;
}
export function validateScenarioAmbitions(s,owner) {
 for(const a of s.ambitions||[]){
  if(a.scenarioId===undefined)continue;
  if(!SCENARIO_GOALS[a.scenarioId]?.some(g=>g.id===a.id)||a.scenarioId!==s.scenario||a.ownerReignId!==owner||
   !['宏愿','心事'].includes(a.kind)||!Array.isArray(a.objectives)||!a.objectives.length)throw new Error('专属宏愿资料损坏');
  if(a.holdTurns!==undefined&&(!Number.isSafeInteger(a.holdTurns)||a.holdTurns<1||a.holdTurns>360||
   !Number.isSafeInteger(a.stableTurns)||a.stableTurns<0||a.stableTurns>a.holdTurns||
   !Number.isSafeInteger(a.checkedTurn)||a.checkedTurn<0||a.checkedTurn>s.turn))throw new Error('专属宏愿持续进度损坏');
  for(const o of a.objectives){
   if(typeof o.id!=='string'||typeof o.label!=='string'||!Number.isFinite(o.target)||o.target<0||!['gte','lte'].includes(o.op))throw new Error('专属宏愿条件损坏');
   if(o.rule){const q=o.rule,pool=poolFor(s,q.type);
    const fields={official:['favor'],province:['morale','disaster'],border:['threat','readiness','troops'],capital:['troops','readiness'],consort:['favor','health'],child:['health','education']};
    if(!['official','serving','inactiveOfficial','officialTalks','province','border','borderWars','capital','consort','companion','child','isHeir','childTutored','countryWins','settledCountry'].includes(q.type)||
     pool&&(!q.id||!pool.some(x=>x.id===q.id))||['border','borderWars'].includes(q.type)&&!s.nation.army.frontiers.some(b=>b.dir===q.dir)||
     fields[q.type]&&!fields[q.type].includes(q.field)||q.posts&&(!Array.isArray(q.posts)||!q.posts.length||!q.posts.every(id=>s.court.posts.some(p=>p.id===id))))throw new Error('专属宏愿对象损坏');
   }else if(!['governance','morale','treasury','virtue','prestige','reignYears','arrears','rebellions','minMorale','maxDisaster','grainMonths','personalRule','livingHeir','heirTutored','heirEducation','talent:文采','talent:政略','project:编修大典','project:整饬吏治','project:修河','project:修园'].includes(o.key))throw new Error('专属宏愿条件无效');
  }
 }
}
