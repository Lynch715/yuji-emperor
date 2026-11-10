// 固定的是主题和窗口；不存在史书式强制结局。触发时间为开局后旬数。
const choice=(label,effects={},extra={})=>({label,effects,...extra});
const care=(cost=12)=>choice('拨款核办，先解民困',{treasury:-cost,morale:3,governance:2});
const save=()=>choice('暂缓支出，责成有司复核',{governance:1,prestige:-1});
const event=(title,cause,choices,extra={})=>({title,cause,choices,...extra});
const publicWork=(title,cause,cost=12)=>event(title,cause,[care(cost),save()]);
const remonstrance=(name,title,cause)=>event(title,cause,[choice('召对听取实情',{governance:3,virtue:2},{favor:{name,amount:8}}),choice('仍依旧议，责其具报',{prestige:2,governance:-1})],{requires:name});
export const SCENARIO_EVENTS={
 'han-wudi':[
  event('儒术与黄老之争','新政触及东宫习惯，儒臣请求天子定夺。',[choice('先与东宫商议，保留用人',{governance:2,virtue:2}),choice('坚持新政，拨资兴学',{treasury:-18,governance:4,prestige:2})]),
  remonstrance('汲黯','汲黯犯颜言事','汲黯要求天子亲听州郡积弊，不许近臣粉饰。'),
  event('匈奴使者议和亲','北境使者索求财帛，朝臣争论应战还是守约。',[choice('给付财帛，稳住互市',{treasury:-20,army:{id:'北',threat:-12}},{country:{name:'匈奴',attitude:8}}),choice('拨饷备边，以兵待使',{treasury:-25,army:{id:'北',readiness:12},prestige:3})]),
 ],
 'tang-taizong':[
  event('便桥来使','突厥兵临渭水，朝臣请求先定议和与备战方略。',[choice('交涉息兵，守备不撤',{treasury:-20,army:{id:'北',threat:-18}},{country:{name:'东突厥',attitude:12}}),choice('整军列阵，以战逼和',{treasury:-28,army:{id:'北',readiness:15},prestige:4})]),
  remonstrance('魏征','魏征直言新朝','魏征请求容纳旧东宫之臣，免以旧怨误国。'),
  publicWork('储君讲读之议','东宫请定经筵与教养用度，不能只择近幸陪侍。',15),
 ],
 'song-renzong':[
  event('山陵移穴案','王曾请求查核丁谓与雷允恭移陵之议。',[choice('交有司公开核查',{governance:5,virtue:3},{dismiss:'丁谓'}),choice('先责成自陈，保留朝班',{governance:1,prestige:2})],{requires:'丁谓'}),
  remonstrance('鲁宗道','垂帘与外家','鲁宗道请求约束外家请托，向两宫同陈利害。'),
  publicWork('台谏与地方备览','地方赈济与台谏员额需有固定财用，朝中请求立例。'),
 ],
 'ming-wanli':[
  event('考成法试行','张居正请求按期核查六部办事，阁臣与言官议论不一。',[choice('准予试行，明列考核',{treasury:-12,governance:5}),choice('先试两部，再议推广',{treasury:-5,governance:2,virtue:1})],{requires:'张居正'}),
  publicWork('清丈田亩的经费','清丈须给州县实费，否则册中数字未必可信。',20),
  event('司礼监转来请托','冯保门下有人为亲族求差，天子须定内外界限。',[choice('退回请托，循例选任',{governance:4,virtue:2},{favor:{name:'冯保',amount:-8}}),choice('准其一人，命有司登记',{prestige:2,governance:-2},{favor:{name:'冯保',amount:8}})],{requires:'冯保'}),
 ],
 'ming-chongzhen':[
  event('魏珰去留','朝臣请议魏忠贤及其党羽，内廷仍有旧势。',[choice('收回职权，分案核查',{governance:5,prestige:4},{dismiss:'魏忠贤'}),choice('暂留其职，限期交账',{governance:1,prestige:-2})],{requires:'魏忠贤'}),
  publicWork('辽饷催解','军镇催饷，户部须在救急与积欠之间取舍。',28),
  event('陕西饥民的去处','灾后流民请安置，军镇担忧聚众成患。',[choice('开仓赈济，给资安置',{treasury:-15,grain:-12,morale:5}),choice('拨费编户，缓征旧赋',{treasury:-8,morale:3,governance:2})]),
 ],
 'qing-kangxi':[
  event('四辅臣议事章程','辅臣请求明定奏事次序，内外担忧权力归于一人。',[choice('两宫留副本，辅臣合议',{governance:3,virtue:2}),choice('便于办事，授首辅总核',{governance:2,prestige:-2})]),
  event('圈地与旗民之争','鳌拜旧部与州县争田，清议请求核查界址。',[choice('核旧籍，退还侵地',{treasury:-10,morale:4,governance:3},{favor:{name:'鳌拜',amount:-10}}),choice('先给补偿，缓议旧案',{treasury:-18,morale:2})],{requires:'鳌拜'}),
  publicWork('南方藩镇的军饷','三藩与沿海需银，户部请分清常额与额外支给。',22),
 ],
 'qing-yongzheng':[
  publicWork('清查各省亏空','新君欲清库银，督抚请求宽限与核销办法。',16),
  event('年羹尧军中请赏','边帅以军功求赏，朝臣担忧赏典成为私人恩威。',[choice('核功赏军，收回私授',{treasury:-18,governance:4},{favor:{name:'年羹尧',amount:-8}}),choice('加给军赏，先安军心',{treasury:-30,prestige:3},{favor:{name:'年羹尧',amount:10}})],{requires:'年羹尧'}),
  remonstrance('允祥','怡亲王议钱谷','允祥请求把钱粮核查与用人考成一并办理。'),
 ],
 'han-lingdi':[
  event('西邸官价簿','卖官的价簿送到内廷，公卿请问官爵究竟从何而来。',[choice('封存价簿，循才授官',{governance:6,virtue:4,treasury:-10}),choice('仍收官价，先解库需',{treasury:35,governance:-4,morale:-2})]),
  event('党锢士人的归途','蔡邕等请宽禁锢，近侍称清议将乱朝政。',[choice('解其禁锢，择才起用',{treasury:-10,governance:4,virtue:4}),choice('逐人复核，先留清议',{governance:2,prestige:1})]),
  event('河北太平道聚众','地方报告太平道聚众，尚须分清治病结社与谋乱。',[choice('遣廉吏查访，同时赈济',{treasury:-18,morale:4,governance:3}),choice('约束州县，严核聚众',{treasury:-8,prestige:3,morale:-1})]),
 ],
 'song-huizong':[
  event('花石纲扰民','两浙转运报告舟役疲敝，供奉之物仍源源入京。',[choice('停额外征取，拨费补偿',{treasury:-20,morale:5,governance:3}),choice('减半征取，留供奉常额',{treasury:-8,morale:2,governance:1})]),
  event('西军败报的核查','刘法败亡之后，朝中收到彼此不一的军报。',[choice('听宿将复核，补足军储',{treasury:-25,army:{id:'西',readiness:15}}),choice('先问责报功，整顿文移',{governance:4,prestige:2})]),
  event('金使议联兵','金使希望联兵攻辽，是否出兵仍待御断。',[choice('暂不出兵，先固边备',{treasury:-18,army:{id:'北',readiness:10},virtue:1}),choice('议定互使，先探实情',{treasury:-10,prestige:2},{country:{name:'金',attitude:10}})]),
 ],
 'ming-xizong':[
  event('魏客干预内外','言官请求限制魏忠贤与客氏传达私意。',[choice('明定传旨章程，内外留底',{governance:5,prestige:3},{favor:{name:'魏忠贤',amount:-10}}),choice('先听内廷自陈，再议章程',{governance:1,prestige:-1})],{requires:'魏忠贤'}),
  event('熊王守战之争','经略与巡抚的军书互相矛盾，御前须定统属。',[choice('统一节制，拨饷固守',{treasury:-22,army:{id:'东',readiness:15},governance:2}),choice('命两人会勘，先查实数',{treasury:-10,governance:4})]),
  remonstrance('孙承宗','经筵讲到辽东','孙承宗把军图带进经筵，请天子亲看道路与兵粮。'),
 ],
 'ming-yingzong':[
  event('王振请天子亲征','边警骤至，王振请求天子立刻出塞。',[choice('先整军储，留京决策',{treasury:-20,army:{id:'北',readiness:12}}),choice('采亲征之议，急筹行粮',{treasury:-30,prestige:4,army:{id:'北',readiness:-8}})],{requires:'王振'}),
  remonstrance('于谦','于谦请固京师','于谦请求留兵护京，不可尽抽精锐随驾。'),
  event('土木方向的军粮警报','亲征议已动，边将报告行粮与道路不继。',[choice('听将帅改线，及时收军',{treasury:-18,army:{id:'北',readiness:12},prestige:-2}),choice('严令集结，增给补给',{treasury:-35,grain:-15,army:{id:'北',readiness:8}})],{requires:'王振',requiresChoice:{event:0,choice:1},alternative:publicWork('边军整备复报','出塞急议已经改变，边军请求按新方略补足守备。',20)}),
 ],
 'tang-xuanzong':[
  event('安禄山入朝之议','杨国忠请召安禄山入朝，边镇却以军务推托。',[choice('收回兼领，分镇核兵',{treasury:-20,governance:4,army:{id:'北',readiness:8}},{dismiss:'安禄山'}),choice('遣使犒军，要求具报',{treasury:-25,army:{id:'北',threat:-8}})],{requires:'安禄山'}),
  event('杨氏供奉的账目','有司请求查核杨氏所涉供奉与额外支出。',[choice('公开核账，停额外供奉',{governance:5,virtue:2},{favor:{name:'杨国忠',amount:-10}}),choice('先清地方，宫中另议',{treasury:-12,governance:2})],{requires:'杨国忠'}),
  event('河北军镇异动','边镇仍有重兵，朝臣请求辨明传闻、加强关防。',[choice('先固关防，核查兵籍',{treasury:-30,army:{id:'北',readiness:15},governance:3}),choice('使者往返，分散疑惧',{treasury:-18,army:{id:'北',threat:-12},virtue:2})]),
 ],
 'song-qinzong':[
  event('李纲请守京城','迁避与守城两议并起，李纲愿领守备。',[choice('听李纲固守，拨饷整军',{treasury:-20,army:{id:'北',readiness:15},prestige:4},{favor:{name:'李纲',amount:10}}),choice('先遣使谈判，城防不撤',{treasury:-15,army:{id:'北',threat:-8}})],{requires:'李纲'}),
  publicWork('勤王兵马的粮饷','各路勤王军陆续请调，须统一供给与号令。',25),
  event('金营再索金帛','金使提出新的索求，朝中有人主张一概答允。',[choice('据约交涉，拒绝无穷加索',{treasury:-10,prestige:4,army:{id:'北',readiness:8}}),choice('给付一笔，争取整军时日',{treasury:-35,army:{id:'北',threat:-15}},{country:{name:'金',attitude:10}})]),
 ],
 'qing-jiaqing':[
  event('和珅家产与旧案','太上皇新丧，朝臣请求查核和珅及其账册。',[choice('收回职权，按册查核',{treasury:45,governance:6,prestige:4},{dismiss:'和珅'}),choice('先封存账册，分案听审',{treasury:15,governance:3})],{requires:'和珅'}),
  publicWork('川楚军务的真账','督抚催饷，军功与支出却常对不上实数。',25),
  remonstrance('朱珪','帝师论新政用人','朱珪请求从用人与核账做起，不止惩办一人。'),
 ],
};
for(const [id,events]of Object.entries(SCENARIO_EVENTS))events.forEach((e,i)=>Object.assign(e,{id:id+'-'+i,at:[0,6,18][i]}));
