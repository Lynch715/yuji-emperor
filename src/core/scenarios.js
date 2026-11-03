// 历史剧本：只提供开局的人物、官制显示名与局势，一切数值变化仍由引擎结算。
// 史实只决定开局；之后的生死成败按引擎推进，不按史实预演。
import { clone } from "./state.js";
import { clamp } from "./effects.js";
import { factionPowers } from "./politics.js";
// 官职显示名：引擎内部仍按原职名（内阁首辅、户部尚书……）匹配规则，只换给人看的名字。
// 下标与 POST_NAMES 0–28 对应；省级职官另由 governor 拼接。
const POSTS = {
  han: "丞相 大农令 太尉 丞相司直 奉常 廷尉 将作少府 御史大夫 郎中令 中尉 中书谒者令 侍中 尚书令 大农丞 太尉长史 丞相长史 博士祭酒 廷尉正 少府 博士 太子太傅 廷尉监 太常丞 谒者 宗正 北地将军 陇西将军 南境校尉 东境将军",
  tang: "尚书左仆射 户部尚书 兵部尚书 吏部尚书 礼部尚书 刑部尚书 工部尚书 御史大夫 内侍监 左右卫大将军 中书令 侍中 尚书右仆射 户部侍郎 兵部侍郎 吏部侍郎 礼部侍郎 刑部侍郎 工部侍郎 弘文馆学士 太子太傅 大理寺卿 太常寺卿 谏议大夫 宗正卿 朔方道行军总管 凉州都督 岭南道总管 营州都督",
  song: "同中书门下平章事 三司使 枢密使 吏部尚书 礼部尚书 刑部尚书 工部尚书 御史中丞 入内内侍省都知 殿前都指挥使 参知政事 枢密副使 尚书左丞 盐铁副使 同知枢密院事 吏部侍郎 礼部侍郎 刑部侍郎 工部侍郎 翰林学士 太子太傅 大理寺卿 太常博士 知谏院 大宗正 河北路安抚使 陕西路经略安抚使 广南路安抚使 河东路安抚使",
  ming: "内阁首辅 户部尚书 兵部尚书 吏部尚书 礼部尚书 刑部尚书 工部尚书 左都御史 司礼监掌印 京营戎政 内阁次辅 内阁大学士 詹事府詹事 户部侍郎 兵部侍郎 吏部侍郎 礼部侍郎 刑部侍郎 总理河道 翰林学士 太子太傅 大理寺卿 太常寺卿 通政使 宗人令 宣大总兵 甘肃总兵 两广总兵 蓟辽总兵",
  qing: "首席大学士 户部尚书 兵部尚书 吏部尚书 礼部尚书 刑部尚书 工部尚书 左都御史 内务府总管 领侍卫内大臣 议政大臣 大学士 协办大学士 户部侍郎 兵部侍郎 吏部侍郎 礼部侍郎 刑部侍郎 工部侍郎 翰林院掌院学士 太子太傅 大理寺卿 钦天监监正 通政使 宗人府宗令 北路将军 西路将军 南路将军 东路将军",
};
// 官员：姓名｜职位下标｜派系下标｜年龄｜性格｜秘密｜能力（政军才德忠谋）｜野心
// 后宫：姓名｜位分｜家世｜年龄｜派系下标｜宠眷｜秘密
// 皇嗣：姓名｜性别｜年龄｜母（后宫下标，可空）｜资质
// 外邦：国名｜君主｜关系｜态度｜边境｜诉求
export const SCENARIOS = [
  {
    id: "han-wudi", power: "0 0 15 0 0 0", title: "汉武帝 · 建元新政", difficulty: "常制", dynasty: "汉", era: "建元", year: "前140年",
    emperor: ["刘彻", 16, "70 72 80 85 82", "多疑"], posts: "han", governor: "刺史",
    provinces: "司隶 豫州 扬州 荆州 青州 并州 凉州 益州 会稽 长沙 冀州 幽州",
    factions: "儒生:纳谏清议 军功列侯:军功封赏 外戚:家族恩荫 近侍郎官:亲近信任 郡国守相:钱粮自主 诸侯王:宗藩安稳",
    nation: { treasury: 620, morale: 66, governance: 58, prestige: 48 }, threat: [55, 30, 25, 25],
    dowager: "窦太皇太后",
    blurb: "少年天子初立，欲兴儒术、立明堂；太皇太后崇黄老，东宫一句话便能让新政夭折。北边匈奴岁岁索要和亲。",
    officials: [
      "窦婴|0|2|50|好儒术，任侠自喜|与太皇太后同族，却力推儒术，夹在两宫之间。|70 60 70 70 75 55|55",
      "田蚡|2|2|40|善辩，贪财好名|暗中收受诸侯馈赠，与淮南王有书信往来。|55 35 70 30 45 75|85",
      "赵绾|7|0|45|儒生，锐意更化|上书请勿奏事东宫，已触怒太皇太后。|65 30 75 75 80 40|50",
      "王臧|8|0|50|鲁诗名家，帝之旧师|与赵绾共议立明堂，东宫耳目已在查访。|60 25 80 75 80 40|45",
      "董仲舒|19|0|39|治公羊春秋，三年不窥园|私撰灾异之书，言辞多有讥刺。|70 20 90 85 80 40|35",
      "汲黯|23|0|40|好直谏，不拘礼|素轻田蚡，曾当众斥之。|70 30 65 85 85 35|30",
      "韩安国|1|1|45|多大略，善为人谋|旧为梁王属吏，曾以重金求官。|75 65 70 55 65 70|60",
      "李广|25|1|44|善射，爱士卒，不善治军簿|屡战而功不得封侯，心有不平。|35 85 50 70 80 30|60",
      "程不识|26|1|45|治军严整，号令分明|与李广治军之道相左，常受同僚讥其苛细。|50 80 50 70 80 40|40",
      "庄助|11|3|30|辩博，帝之近臣|与淮南王门客有旧交。|60 40 80 55 70 60|55",
    ],
    consorts: ["陈阿娇|皇后|馆陶长公主之女|18|2|55|多年无子，心事渐重。", "卫子夫|嫔|平阳公主府讴者|17|3|60|其弟卫青在平阳侯家为骑奴。"],
    foreign: ["匈奴|军臣单于|冷淡|30|北|和亲岁币", "乌孙|猎骄靡|通好|45|西|远交共击匈奴", "南越|赵佗|通好|50|南|自治如故", "闽越|驺郢|冷淡|35|东|吞并东瓯", "东瓯|驺望|通好|55|东|求内附避闽越"],
    facts: ["太皇太后|好恶|崇黄老，不喜儒生", "明堂|议立|赵绾、王臧议立明堂，事在未定"],
  },
  {
    id: "tang-taizong", power: "0 0 0 10 0 0", title: "唐太宗 · 渭水之盟", difficulty: "常制", dynasty: "唐", era: "贞观", year: "626年",
    emperor: ["李世民", 28, "82 85 92 72 85", "勤政"], posts: "tang", governor: "刺史",
    provinces: "京畿 河南道 江南道 山南道 河北道 河东道 关内道 剑南道 淮南道 岭南道 陇右道 幽州",
    factions: "谏官清议:纳谏清议 秦府将帅:军功封赏 长孙外戚:家族恩荫 秦府谋臣:亲近信任 关陇勋旧:钱粮自主 宗室诸王:宗藩安稳",
    nation: { treasury: 280, morale: 55, governance: 56, prestige: 55, virtue: 50 }, threat: [92, 50, 20, 30],
    dowager: "",
    blurb: "玄武门之变方过两月，东宫旧臣惶惶不安；突厥颉利可汗率十余万骑直抵渭水便桥之北，长安震动。",
    officials: [
      "房玄龄|10|3|47|善谋，处事周密|玄武门前夜曾力劝先发制人。|90 40 80 75 90 80|40",
      "杜如晦|2|3|41|临机善断|体弱多病，自知天年不永。|85 55 80 75 90 75|35",
      "长孙无忌|3|2|32|通悟，有筹略|玄武门之变首谋之一，深知许多不可言之事。|75 50 75 60 85 85|65",
      "魏征|23|0|46|犯颜直谏|曾劝隐太子早除秦王。|80 30 85 90 70 55|30",
      "王珪|11|0|56|恬淡守正|原为东宫属官，曾因杨文干事流放。|75 25 75 85 75 40|30",
      "萧瑀|0|4|52|刚直，好佛|与房玄龄、杜如晦素来不睦。|70 30 70 75 70 50|50",
      "封德彝|12|4|58|阴持两端|曾私下替隐太子说话，事未泄露。|75 30 75 30 40 80|60",
      "高士廉|4|2|51|涉猎文史，持重|长孙皇后之舅，与外戚往来最密。|70 30 75 70 80 50|40",
      "戴胄|21|0|53|明于法令，敢于执法|常为断狱与上意相争。|80 25 70 80 80 40|30",
      "尉迟敬德|9|1|41|勇猛，性直好讼功|玄武门之日亲手斩杀齐王元吉。|30 90 40 60 85 40|60",
      "李靖|25|1|55|沉毅有谋|曾在隋末欲告发高祖起兵。|60 95 75 75 80 70|35",
      "李勣|28|1|32|善用兵，处事谨慎|玄武门之变时袖手不言，两不相助。|60 88 65 65 75 75|50",
      "李孝恭|24|5|35|宽恕退让|宗室中战功最著，难免招人猜忌。|55 80 55 60 80 45|45",
    ],
    consorts: ["长孙氏|皇后|河南长孙氏|25|2|85|体有气疾，常隐忍不言。", "杨氏|妃|隋炀帝之女|26|5|65|前朝公主身份使她处处谨慎。", "韦珪|妃|京兆韦氏|29|4|55|曾嫁李珉，再入秦府。"],
    children: ["李承乾|男|8|0|60", "李泰|男|7|0|75", "李恪|男|7|1|70"], heir: 0,
    foreign: ["东突厥|颉利可汗|冷淡|15|北|岁币与劫掠", "吐谷浑|伏允|冷淡|35|西|互市与边地", "高句丽|高建武|通好|45|东|保辽东旧界", "百济|扶余璋|通好|50|东|求援以抗新罗", "薛延陀|夷男|通好|50|北|脱离突厥"],
    facts: ["颉利可汗|兵临|突厥大军已至渭水便桥北", "太上皇李渊|居处|退居太安宫，不复问政"],
  },
  {
    id: "song-renzong", power: "0 0 25 0 0 0", title: "宋仁宗 · 太后垂帘", difficulty: "宽和", dynasty: "宋", era: "天圣", year: "1022年",
    emperor: ["赵祯", 12, "60 50 40 70 75", "仁厚"], aptitude: 75, posts: "song", governor: "转运使",
    provinces: "开封府 京西路 两浙路 荆湖路 京东路 河东路 陕西路 川峡路 福建路 广南路 江南路 河北路",
    factions: "台谏清议:纳谏清议 将门勋旧:军功封赏 刘氏外戚:家族恩荫 内侍近臣:亲近信任 三司计臣:钱粮自主 宗室:宗藩安稳",
    nation: { treasury: 900, morale: 66, governance: 60, prestige: 50 }, threat: [35, 40, 20, 25],
    dowager: "刘太后", regent: "dowager", wedding: ["郭氏", "曹氏", "张氏"],
    blurb: "真宗新丧，十二岁的天子即位，刘太后垂帘听政。权相丁谓与内侍雷允恭擅移先帝陵穴，王曾正等一个开口的机会。",
    officials: [
      "丁谓|0|2|56|机敏多智，善揣上意|与内侍雷允恭擅移先帝陵穴，事将败露。|80 30 85 20 30 90|90",
      "王曾|10|0|44|端厚持重|已暗中搜集丁谓擅移皇陵的证据。|85 30 80 85 85 70|40",
      "吕夷简|12|4|43|深沉有城府|知道陛下生母实为李宸妃，此事宫中无人敢言。|85 30 75 60 70 85|60",
      "晏殊|19|0|31|文章典丽，少年神童|曾在东宫侍读，深知天子性情。|70 20 90 75 80 50|35",
      "鲁宗道|7|0|56|刚正，人称鱼头参政|屡与太后亲族争执，已结怨刘氏。|75 20 70 90 85 40|25",
      "曹利用|2|1|50|恃功骄横|家人仗势横行乡里。|60 70 55 40 60 65|75",
      "钱惟演|14|2|45|附势善文|以妹嫁太后之兄刘美，结为姻亲。|60 30 85 40 50 70|70",
      "张士逊|3|0|58|和易宽厚|曾为天子东宫旧臣。|65 25 65 70 75 45|40",
      "雷允恭|8|3|40|骄纵专擅|擅移山陵，罪证已在王曾手中。|30 10 30 15 40 60|80",
      "范仲淹|22|0|33|先忧后乐，慷慨敢言|幼年随母改嫁，长大后方知身世。|80 60 80 90 85 45|35",
    ],
    foreign: ["辽|耶律隆绪|通好|60|北|岁币如约", "西夏|李德明|通好|50|西|互市与封爵", "唃厮啰|唃厮啰|通好|60|西|联宋抗夏", "交趾|李公蕴|通好|55|南|册封", "高丽|王询|通好|60|东|通使求书"],
    facts: ["李宸妃|身世|宫中讳言天子生母，众人皆以太后为母", "真宗|山陵|陵穴移位一事尚未查明"],
  },
  {
    id: "ming-wanli", power: "0 0 0 10 25 0", title: "明神宗 · 江陵柄国", difficulty: "常制", dynasty: "明", era: "万历", year: "1572年",
    emperor: ["朱翊钧", 9, "55 55 35 65 55", "节俭"], aptitude: 72, posts: "ming", governor: "巡抚",
    provinces: "北直隶 河南 南直隶 湖广 山东 山西 陕西 四川 福建 广东 云南 辽东",
    factions: "清流言官:纳谏清议 勋贵边将:军功封赏 外戚李氏:家族恩荫 司礼监:亲近信任 考成实务:钱粮自主 宗藩:宗藩安稳",
    nation: { treasury: 380, morale: 58, governance: 52, prestige: 50 }, threat: [30, 20, 25, 45],
    dowager: "李太后", regent: "张居正", wedding: ["王喜姐", "王氏", "郑氏"],
    blurb: "隆庆帝崩，十岁太子即位。张居正联手冯保逐走高拱，独掌内阁；李太后严于管教，考成、清丈、一条鞭，都在等一道旨意。",
    officials: [
      "张居正|0|4|47|刚毅果决，综核名实|与冯保内外相结，逐高拱出京。|95 60 85 60 75 90|85",
      "冯保|8|3|40|知书善琴，贪而有才|矫遗诏与内阁同受顾命，自加顾命之名。|60 20 70 30 60 80|80",
      "吕调阳|10|0|56|谨厚，凡事唯首辅是听|私下以为考成法太急。|70 20 75 75 75 40|30",
      "张四维|15|0|46|工于心计|家族世代经营盐业，与晋商往来密切。|75 25 75 50 60 80|75",
      "申时行|19|0|37|温和圆融|状元出身，与言官、阁臣皆不愿结怨。|80 25 85 70 70 70|55",
      "王锡爵|16|0|38|刚直有守|曾在高拱、张居正之间两不依附。|75 25 80 80 75 60|50",
      "王国光|1|4|60|精于理财|正着手编订《万历会计录》。|85 25 75 70 75 55|40",
      "杨博|3|1|70|老成知兵|年事已高，屡请致仕。|80 75 70 75 80 60|20",
      "谭纶|2|1|52|知兵，能任事|与戚继光同在东南抗倭，交情深厚。|70 85 70 70 80 55|40",
      "潘季驯|18|4|51|精于治河，主束水攻沙|屡被言官弹劾治河耗费。|80 30 80 75 75 45|35",
      "戚继光|28|1|44|治军严明|以重礼结交张居正，求在蓟镇专权练兵。|50 95 70 70 85 55|50",
      "李成梁|25|1|46|骁勇，善养家丁|冒功邀赏、纵容家丁之事不在少数。|50 88 50 40 65 70|70",
    ],
    foreign: ["蒙古|俺答汗|朝贡|60|北|互市与封贡", "建州女真|王杲|冷淡|30|东|抚赏与马市", "朝鲜|李昖|朝贡|70|东|册封与书籍", "安南|莫茂洽|朝贡|50|南|册封", "日本|织田信长|冷淡|35|东|勘合贸易"],
    facts: ["高拱|去职|被逐出京，回籍闲住", "张居正|新政|拟行考成法，以六科稽查六部"],
  },
  {
    id: "ming-chongzhen", power: "-10 0 0 10 0 0", title: "明思宗 · 天启七年", difficulty: "艰危", dynasty: "明", era: "崇祯", year: "1627年",
    emperor: ["朱由检", 17, "65 60 45 65 50", "多疑"], posts: "ming", governor: "巡抚",
    provinces: "北直隶 河南 南直隶 湖广 山东 山西 陕西 四川 福建 广东 云南 辽东",
    factions: "东林清流:纳谏清议 勋戚边将:军功封赏 外戚:家族恩荫 阉党:亲近信任 督抚:钱粮自主 宗藩:宗藩安稳",
    nation: { treasury: 120, morale: 36, governance: 30, prestige: 42, grain: 140 }, threat: [60, 45, 20, 85],
    dowager: "懿安皇后",
    blurb: "天启帝崩，信王入继大统。魏忠贤的生祠遍布天下，阉党把持内外；陕西大旱，辽东后金虎视，国库几乎见底。",
    officials: [
      "魏忠贤|8|3|59|目不识丁而权倾朝野|生祠遍天下，各地督抚多有馈遗。|40 30 30 10 20 85|95",
      "崔呈秀|2|3|50|依附魏珰，人称五虎之首|贪墨军饷，账目可查。|50 40 55 15 25 75|85",
      "黄立极|0|3|62|庸懦依违|曾为魏忠贤生祠撰写颂词。|55 20 60 30 40 55|45",
      "温体仁|16|4|54|外示温谨，内实阴狠|欲借攻讦东林以邀圣眷。|75 20 75 35 50 90|85",
      "周延儒|15|0|34|机敏善揣|状元出身，与东林若即若离。|70 25 85 45 50 80|80",
      "毕自严|1|4|58|精于钱谷|深知太仓银库已入不敷出。|85 30 75 75 80 50|35",
      "王永光|3|3|66|圆滑持禄|曾附阉党，如今正四处撇清。|60 20 60 40 45 65|50",
      "袁崇焕|28|4|43|慷慨负胆略|曾私遣使与后金议和。|65 85 75 60 70 60|70",
      "洪承畴|26|4|34|沉毅多谋|在陕西督粮，眼见饥民渐成流寇。|75 85 75 55 60 75|60",
      "卢象升|25|1|27|文武兼资，忠勇|治大名府，练兵颇有成效。|70 85 70 85 95 50|40",
    ],
    consorts: ["周氏|皇后|苏州周氏|16|0|80|出身寒微，家中曾以卖卜为生。", "田氏|妃|扬州田氏|18|2|70|多才艺，其父田弘遇骄横。", "袁氏|嫔|宛平袁氏|17|1|55|性情温顺，少与人争。"],
    foreign: ["察哈尔|林丹汗|冷淡|30|北|抚赏", "后金|皇太极|冷淡|5|东|入关劫掠", "朝鲜|李倧|朝贡|55|东|乞援抗金", "日本|德川家光|冷淡|30|东|闭关自守"],
    facts: ["陕西|灾情|连年大旱，饥民聚众", "魏忠贤|权势|东厂与锦衣卫皆在其手"],
  },
  {
    id: "qing-kangxi", power: "0 30 0 0 0 0", title: "清圣祖 · 四辅臣", difficulty: "常制", dynasty: "清", era: "康熙", year: "1661年",
    emperor: ["玄烨", 7, "50 50 50 60 55", "勤政"], aptitude: 88, surname: "爱新觉罗", children: [], posts: "qing", governor: "巡抚",
    provinces: "直隶 河南 江南 湖广 山东 山西 陕西 四川 福建 广东 云南 奉天",
    childNaming: { 男: "胤", 女: "和" },
    factions: "汉臣清议:纳谏清议 两黄旗勋旧:军功封赏 赫舍里外戚:家族恩荫 正白旗旧部:亲近信任 督抚:钱粮自主 宗室王公:宗藩安稳",
    nation: { treasury: 500, morale: 52, governance: 50, prestige: 45 }, threat: [35, 30, 40, 55],
    dowager: "孝庄太皇太后", regent: "索尼", wedding: ["赫舍里氏", "钮祜禄氏", "纳喇氏"],
    blurb: "顺治帝崩于天花，八岁的玄烨即位。索尼、苏克萨哈、遏必隆、鳌拜四人辅政，鳌拜日渐跋扈；南方三藩坐大，台湾郑氏尚在。",
    officials: [
      "索尼|0|2|61|老成，持重|年老多病，暗中为孙女谋后位。|80 50 70 70 80 80|50",
      "苏克萨哈|10|3|50|刚愎，与鳌拜积怨|曾首告多尔衮，两黄旗视之为仇。|65 70 55 55 70 60|60",
      "遏必隆|11|1|50|依违两可|女儿正待选入宫。|55 60 50 55 60 50|40",
      "鳌拜|9|1|51|骁勇善战，专横跋扈|已在暗中撤换两白旗圈地的官员。|60 90 50 35 35 75|95",
      "索额图|15|2|25|骄纵，好揽权|索尼之子，自视为天子外家。|65 40 65 40 70 75|75",
      "明珠|8|3|26|通敏，善揣上意|结交满汉士人，门下已有不少人。|75 40 75 45 65 85|80",
      "熊赐履|19|0|26|理学名儒|对辅臣专断多有腹诽。|75 20 85 85 85 40|35",
      "魏裔介|7|0|45|敢言，持论平正|屡上疏请减圈地之害。|75 20 75 80 80 45|35",
      "汤若望|22|0|69|精于历算|杨光先已在罗织历法之狱。|70 10 90 75 75 30|10",
      "杰书|24|5|16|宽厚，少年袭爵|康亲王府与诸王旧怨未解。|50 60 50 65 75 45|40",
    ],
    foreign: ["沙俄|阿列克谢|冷淡|30|北|侵占黑龙江", "准噶尔|僧格|通好|45|西|贸易与西藏", "平西藩|吴三桂|通好|50|南|钱粮自主", "台湾郑氏|郑成功|冷淡|10|东|奉明正朔", "朝鲜|李棩|朝贡|60|东|册封"],
    facts: ["四辅臣|共政|先帝遗诏四大臣辅政", "圈地|旧事|两黄旗与两白旗为圈地积怨"],
  },
  {
    id: "qing-yongzheng", power: "0 0 10 0 0 15", title: "清世宗 · 九子夺嫡之后", difficulty: "常制", dynasty: "清", era: "雍正", year: "1722年",
    emperor: ["胤禛", 44, "88 85 55 70 50", "勤政"], surname: "爱新觉罗", posts: "qing", governor: "巡抚",
    provinces: "直隶 河南 江南 湖广 山东 山西 陕西 四川 福建 广东 云南 奉天",
    childNaming: { 男: "弘", 女: "和" },
    factions: "汉臣清流:纳谏清议 西北军功:军功封赏 佟佳外戚:家族恩荫 藩邸旧人:亲近信任 督抚:钱粮自主 八爷党:宗藩安稳",
    nation: { treasury: 800, morale: 55, governance: 38, prestige: 50 }, threat: [30, 70, 25, 20],
    dowager: "仁寿皇太后",
    blurb: "康熙帝崩于畅春园，四阿哥继位。八爷党党羽遍布六部，十四阿哥手握西北大军；国库虽有八百万两，亏空与积欠却查不胜查。",
    officials: [
      "允禩|0|5|41|宽仁得士心|党羽遍布六部，暗中仍有人称其八贤王。|80 50 80 60 40 85|90",
      "允祥|10|3|36|忠勤明练|曾被先帝圈禁多年，旧伤未愈。|85 70 75 80 95 60|20",
      "马齐|11|0|70|老成谨慎|先帝时曾因附议允禩被斥。|70 30 70 65 70 55|30",
      "隆科多|9|2|55|居功自傲|传位诏书一事，只有他最清楚。|65 60 55 40 55 80|85",
      "张廷玉|4|0|50|谨慎周密，过目不忘|从不留片纸私稿。|90 20 90 80 85 70|40",
      "年羹尧|26|1|43|才气凌厉，恃功而骄|与九阿哥门人有旧交。|70 92 75 40 60 75|85",
      "鄂尔泰|15|3|42|有识断，敢任事|久在内务府，四十余仍是员外郎。|85 70 75 70 85 60|50",
      "田文镜|13|3|60|苛察，勇于任事|监生出身，被科甲同僚视为异类。|85 30 55 65 85 50|50",
      "李卫|23|3|35|不学而有吏才|捐纳出身，常遭言官讥讽。|80 45 45 65 90 60|55",
      "允禟|24|5|39|富而好结纳|暗中经营商号，与西洋传教士往来。|55 30 70 40 30 80|75",
      "允禵|25|5|34|大将军王，素有人望|以为大位本该属于自己。|60 85 70 55 30 70|90",
      "岳钟琪|27|1|36|善用兵，持重|岳飞之后，在川陕军中声望日隆。|60 88 65 70 80 55|40",
    ],
    consorts: ["乌拉那拉氏|皇后|乌拉那拉氏|41|0|60|嫡子早殇，膝下无子。", "年氏|妃|年羹尧之妹|25|1|85|兄长权势日重，她夜里常难安睡。", "钮祜禄氏|嫔|钮祜禄氏|30|3|55|处事极为低调，一心教子。", "李氏|嫔|知府李文烨之女|45|4|40|长子早年夭折，所余之子性情孤僻。"],
    children: ["弘时|男|18|3|50", "弘历|男|11|2|85", "福惠|男|1|1|60"],
    foreign: ["沙俄|彼得一世|冷淡|35|北|划界与通商", "准噶尔|策妄阿拉布坦|冷淡|20|西|西藏与哈密", "青海和硕特|罗卜藏丹津|通好|40|西|总管青海", "安南|黎维祹|朝贡|55|南|册封", "朝鲜|李昀|朝贡|60|东|册封"],
    facts: ["康熙|传位|遗诏传位四阿哥，朝野多有私议", "户部|亏空|各省钱粮亏空积年未清"],
  },
];
export function scenarioById(id) {
  return SCENARIOS.find((x) => x.id === id) || null;
}
// 开局局势预览（开局界面使用）。
export function scenarioPreview(sc) {
  return {
    id: sc.id, title: sc.title, difficulty: sc.difficulty, year: sc.year, blurb: sc.blurb,
    emperor: sc.emperor[0], age: sc.emperor[1], era: sc.era, dynasty: sc.dynasty,
    cast: sc.officials.slice(0, 6).map((x) => x.split("|")[0]),
  };
}
export function postTitle(state, post) {
  if (!post) return "";
  if (post.provinceId && state.governorTitle)
    return (state.nation.provinces.find((z) => z.id === post.provinceId)?.name || "") + state.governorTitle;
  return state.postNames?.[post.id] || post.title;
}
const split = (x) => x.split("|");
const nums = (x) => x.trim().split(/\s+/).map(Number);
export function applyScenario(state, id) {
  const sc = scenarioById(id);
  if (!sc) throw new Error("未知剧本");
  let s = clone(state);
  s.scenario = sc.id;
  s.dynasty = sc.dynasty;
  s.imperialSurname = sc.surname || sc.emperor[0][0];
  s.childNaming = sc.childNaming || null;
  s.backstory = sc.blurb;
  s.era.name = s.reign.eraName = sc.era;
  // 官制与州郡
  const titles = POSTS[sc.posts].split(" ");
  s.postNames = Object.fromEntries(titles.map((t, i) => ["p" + i, t]));
  s.governorTitle = sc.governor;
  sc.provinces.split(" ").forEach((name, i) => { if (s.nation.provinces[i]) s.nation.provinces[i].name = name; });
  const mods = nums(sc.power || "0 0 0 0 0 0");
  sc.factions.split(" ").forEach((x, i) => { const [name, demand] = x.split(":"); Object.assign(s.court.factions[i], { name, demand, powerModifier: mods[i] }); });
  // 天子
  const [name, age, talents, tag] = sc.emperor;
  const t = nums(talents);
  s.emperor.name = name;
  s.emperor.age = age;
  s.emperor.lifespan = Math.max(s.emperor.lifespan, age + 25);
  s.emperor.talents = Object.fromEntries(Object.keys(s.emperor.talents).map((k, i) => [k, t[i]]));
  s.emperor.tags = [tag];
  for (const k of ["prestige", "virtue"]) if (sc.nation[k] !== undefined) s.emperor[k] = sc.nation[k];
  for (const k of ["treasury", "morale", "governance", "grain"]) if (sc.nation[k] !== undefined) s.nation[k] = sc.nation[k];
  s.reign.initialTreasury = s.stats.initialTreasury = s.nation.treasury;
  for (const z of s.nation.provinces) z.morale = clamp(s.nation.morale + (z.morale - 62));
  s.nation.army.frontiers.forEach((f, i) => { f.threat = sc.threat[i]; });
  // 官员：剧本人物按指定职位就任，其余原有官员依次补齐空缺
  const cast = sc.officials.map(split), taken = new Set(cast.map((c) => "p" + c[1]));
  const free = s.court.posts.filter((p) => !p.provinceId && !taken.has(p.id) && Number(p.id.slice(1)) < 25).map((p) => p.id);
  for (const p of s.court.posts) if (!p.provinceId) p.holder = null;
  s.court.officials.forEach((o, i) => {
    const c = cast[i];
    if (c) {
      const [n, post, faction, oage, personality, secret, abil, ambition] = c, a = nums(abil);
      Object.assign(o, { name: n, post: "p" + post, faction: "f" + faction, age: Number(oage), personality, secret, ambition: Number(ambition),
        abilities: { 政: a[0], 军: a[1], 才: a[2], 德: a[3], 忠: a[4], 权谋: a[5] } });
      o.life = [personality];
    } else {
      // 补缺的无名官员不抢剧本人物的戏：野心与权谋压低。
      o.post = free.shift() || null;
      o.ambition = Math.min(o.ambition, 35);
      o.abilities.权谋 = Math.min(o.abilities.权谋, 60);
    }
    if (o.post) s.court.posts.find((p) => p.id === o.post).holder = o.id;
  });
  // 后宫与皇嗣
  const child = age < 16;
  s.harem.consorts = (sc.consorts || []).map(split).map(([n, rank, family, cage, faction, favor, secret], i) => ({
    ...s.harem.consorts[Math.min(i, s.harem.consorts.length - 1)], id: "c" + i, name: n, rank, family, age: Number(cage),
    faction: "f" + faction, favor: Number(favor), secret, preg: null, relations: {},
  }));
  s.harem.children = (sc.children || []).map(split).map(([n, sex, cage, mother, aptitude], i) => ({
    id: "child-" + s.runId + "-s" + i, name: n, sex, mother: mother === "" ? null : "c" + mother, fatherId: s.runId,
    legit: s.harem.consorts[Number(mother)]?.rank === "皇后", born: -Number(cage) * 36, aptitude: Number(aptitude), health: 85,
    tutor: null, education: Math.min(60, Number(cage) * 4), faction: s.harem.consorts[Number(mother)]?.faction || "f0", party: false,
  }));
  s.harem.heir = sc.heir !== undefined ? s.harem.children[sc.heir]?.id || null : null;
  s.harem.royalWomen = [];
  s.dowager = sc.dowager || null;
  s.weddingNames = sc.wedding || null;
  if (child) {
    // 幼帝以皇嗣身份记年龄，亲政时由 advanceRegency 撤摄政、行大婚。
    const id = "emperor-" + s.runId;
    s.harem.children.push({ id, name, sex: "男", mother: null, fatherId: "prior", legit: true, born: -age * 36,
      aptitude: sc.aptitude || 60, health: 85, tutor: null, education: age * 3, faction: "f0", party: false });
    s.reign.emperorId = id;
    s.reign.married = false;
    const regent = sc.regent === "dowager" ? "dowager" : s.court.officials.find((o) => o.name === sc.regent)?.id;
    s.regency = { regentId: regent || "dowager", until: (16 - age) * 36 };
  } else s.reign.married = s.harem.consorts.length > 0;
  // 外邦
  s.foreign = sc.foreign.map(split).map(([n, ruler, status, attitude, dir, demand], i) => ({
    ...s.foreign[Math.min(i, s.foreign.length - 1)], id: "w" + i, name: n, ruler, status, attitude: Number(attitude), frontier: dir, demand, trade: null,
  }));
  s.court.factions = factionPowers(s);
  s.facts = (sc.facts || []).map((x) => { const [subject, key, value] = split(x); return { subject, key, value, turn: 0 }; });
  return s;
}
