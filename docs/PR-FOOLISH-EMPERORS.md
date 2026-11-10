# 昏君预设：汉灵帝、宋徽宗、明熹宗

在原七个历史剧本之外，新增三个可以改写结局的开局：汉灵帝·西邸卖官（178年）、宋徽宗·宣和花石（1119年）、明熹宗·天启危局（1621年）。史实只规定开局关系与处境，后续仍由玩家和引擎推进，不强制重演亡国或清洗。

## 实施前说明

- 为容纳三个完整人物班底与十二个专属目标，单文件 HTML 的回归预算从 860,000 字节扩至 900,000 字节。原发布页面已达 854,145 字节，仅余 5,855 字节，无法容纳这次内容；继续内联剧本，保证离线单文件可玩，不引入外部剧本请求或构建依赖。图标和 WebP 预算不变。这是内容扩展带来的工程预算调整。
- ART-SPEC 的七剧本专属像及 377 张原画属于已验收的美术一期至三期范围。新增三剧本本次使用同朝代池图，未画的太后保留首字圆章，不冒用别人的专属肖像；既有 390 个 WebP 不增删、不修改。后续如要专属美术，另开批次。
- DESIGN 的七位皇帝／28 项专属目标扩展为十位／40 项；不增加存档字段，不改原目标或既有存档。新角色的属性、派系权重与钱粮为游戏设定，不声称是史料量化结果。
- 官制仍映射引擎原有职位槽，仅允许剧本覆盖显示名；宋制另列两个宦官职位供 UI 取图，避免梁师成误取有须文官。规则仍由原核心执行。

## 开局资料依据

年龄统一采用开局年份减出生年份的近似周岁；史料未确记生年的人物使用估龄。官职槽按实际职掌合并，不能把这张有限名册当作某日完整朝班。

- [《后汉书》卷八·孝灵帝纪](https://zh.wikisource.org/wiki/後漢書/卷8)：光和元年西邸卖官、党锢未解及灾异；[卷七十八·宦者列传](https://zh.wikisource.org/wiki/後漢書/卷78)：张让、赵忠与近侍权势。张角当时尚在传教，不提前写黄巾起事或何进大将军。
- [《宋史》卷二十二·徽宗四](https://zh.wikisource.org/wiki/宋史/卷022)：宣和元年王黼进用、刘法败亡、花石纲扰民以及宋金互使；[卷四百七十](https://zh.wikisource.org/wiki/宋史/卷470)：王黼等人物关系。方腊起事、联金攻辽的结果不作为已发生事实。
- [《明史》卷二十二·熹宗](https://zh.wikisource.org/wiki/明史/卷22)：天启元年沈辽失守、熊廷弼复出、张后册立、叶向高入阁及魏忠贤与客氏得宠。开局不提前写杨涟二十四罪、生祠遍天下或宁远之战。

## 验证

各局的两项宏愿与两项心事如下。全部条件由引擎按真实人物 ID、职位、钱粮、军备或已完成项目核对，不凭模型一句话达成；玩家也可改选通用目标或随机。

| 开局 | 宏愿 | 心事 |
| --- | --- | --- |
| 汉灵帝 | 重振汉室；不再事事问张让 | 听蔡邕说经论乐；为刘辩定储育才 |
| 宋徽宗 | 宣和真正太平；不以边军赌国运 | 宣和文墨传世；与郑后长相伴 |
| 明熹宗 | 内廷不代天子；守住辽东门户 | 木石之外有分寸；听懂孙承宗的辽事 |

- `npm test`：621／621通过，0失败；包含三局目标可达性、每项必要条件、历史开局不请求模型铸世、旧待续原样迁移与重复提交幂等、宋两位宦官取图回归。
- 三局各跑200年／7200旬无模型模拟；分别经历10、6、5朝，均完整跑完、无异常。模拟结论只适用于记录中的种子与“尽职”策略，不代表所有玩法都能保住国祚。
- 对照已发布main `3235bb4`，用同种子新建原七剧本，完整状态JSON的SHA-256全部一致；390个既有WebP逐字节一致。证据：[汇总](../qa/foolish-emperors/summary.json)。
- Codex In-app Browser经localhost验收：1280与390下三个预览均正常显示皇帝池图、局势与四个推荐目标；三局在全新本机端口新建三卷，明、汉刷新续读正常，宋局实际推进一旬后重新打开仍保留赵佶、第2旬与原章。360／390无横向溢出，console warn／error为空。朝堂头像按需加载，可见头像正常；所有新剧本取图路径另经Node验证存在。没有访问或改变线上存档。[浏览器记录](../qa/foolish-emperors/browser.json)。
- 构建HTML 867,216字节；存档v25、无新依赖。更新CHANGELOG。分支试玩，不合并、不发布。

| 截图 | 桌面 | 手机 |
| --- | --- | --- |
| 汉灵帝选局 | [1280](../qa/foolish-emperors/han-lingdi-preview-1280.png) | [390](../qa/foolish-emperors/han-lingdi-preview-390.png) |
| 宋徽宗选局 | [1280](../qa/foolish-emperors/song-huizong-preview-1280.png) | [390](../qa/foolish-emperors/song-huizong-preview-390.png) |
| 明熹宗选局 | [1280](../qa/foolish-emperors/ming-xizong-preview-1280.png) | [390](../qa/foolish-emperors/ming-xizong-preview-390.png) |
| 汉灵帝实际开局 | [1280](../qa/foolish-emperors/han-lingdi-opening-1280.png) | [360](../qa/foolish-emperors/han-lingdi-opening-360.png) |
| 朝堂与续读 | [天启朝堂](../qa/foolish-emperors/ming-xizong-court-1280.png)；[徽宗推进后续读](../qa/foolish-emperors/song-huizong-reloaded-1280.png) | [宋制朝堂390](../qa/foolish-emperors/song-huizong-court-390.png)；[天启开局390](../qa/foolish-emperors/ming-xizong-opening-390.png) |

完整模拟：[汉灵帝](../qa/foolish-emperors/han-lingdi-200y.json)、[宋徽宗](../qa/foolish-emperors/song-huizong-200y.json)、[明熹宗](../qa/foolish-emperors/ming-xizong-200y.json)。
