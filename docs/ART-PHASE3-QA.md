# 美术三期第一批 · 唐制验收

## 最终三张修订 · 2026-11-08 · 发布准备

玩家通过62张后要求：皇子少年池01、李承乾幼年像去掉发带，改为男童总角或小幞头；高士廉51岁画成熟些、鬓发花白。已用内置imagegen仅替换这三张：两男童均改小型黑色软脚幞头，保留各自13／8岁原脸、眉痣与衣色；高士廉保留朝右和原宽上窄下脸型，补花白鬓须、成熟眼周与额纹，和35岁李孝恭分开。提示词与长相卡同步更新。

相对`6a92b32`恰好替换3个WebP，其他283个逐字节相同；Tang仍62张／530,882字节，全目录286个WebP／4,209,272字节。源码、HTML、取图清单、测试与存档规则不变，仍v25。[替换散列与构图](art-phase3-tang-review/revision-20261108-release/asset-checks.json)。最终全池、每池44px、唐太宗完整44px和年龄对照已在本页下方更新。

![三张逐项修订前后及44px](art-phase3-tang-review/revision-20261108-release/three-before-after.png)

![高士廉与李孝恭44px区别](art-phase3-tang-review/revision-20261108-release/gaoshilian-xiaogong-44.png)

本轮608／608测试、200年／7200旬mock模拟、构建通过；最终三张导出后追加美术测试通过。应用内浏览器通过localhost真实唐局查看宗室李承乾、朝堂高士廉，1280／390图像400×500正常，360无横向溢出；生产取图只读投影124个头像／人物卡、62源全部正常显示。Lighthouse沿用完整批次六次100，本轮未重跑（HTML／CSS／源码逐字节不变）。[本轮测试摘要](art-phase3-tang-review/revision-20261108-release/test-summary.json)、[浏览器读数](art-phase3-tang-review/revision-20261108-release/local-browser-results.json)。

![宗室李承乾390](art-phase3-tang-review/revision-20261108-release/children-390.jpg)

![朝堂高士廉1280](art-phase3-tang-review/revision-20261108-release/court-gao-1280.jpg)

![皇子少年池44px生产样式投影](art-phase3-tang-review/revision-20261108-release/boy-pool-44-browser.jpg)

玩家已明确授权本轮完成后合并PR #7并发布Pages；发布结果与线上抽查将在完成后补录。线上既有第3卷万历0旬已先通过正常导出功能备份到本机，不推进、不覆盖该档。

## 全批完成 · 2026-11-08

玩家已确认唐制画风，本轮完成其余58张，并重出正位池01：更高、更大的纵向高髻，凤钗与三串垂珠；44px仍明显隆重于常位。当前唐制**62／62**，[PR #7](https://github.com/Lynch715/yuji-emperor/pull/7)已获玩家批准；本段记录完整批次验收，最终修订与发布进度见本页首节。

分支`feat/art-phase3-tang`；主线基准`97f80a4`，定调样张基准`79bace9`。原工作区未提交内容保留。全部素材使用内置imagegen；一期四张与更新后的唐制四张以两块完整参照板随每次生成传入，未减少参考画面。池图先写卡再按2×2出稿，尾组空格不导出；专属像单张，年龄变体另加本人底像。构图不合格的稿件在生成端保留原脸校正，未接入未合格原稿。实际提示词、史料索引、脸卡及修订过程见[ART-PROMPTS](ART-PROMPTS.md)。原始PNG与失败稿仅留本机`art-source/phase3-tang/bulk/`。

### 数量、体积与兼容

| 范围 | 张数 | WebP字节 |
| --- | ---: | ---: |
| 唐制池：文官壮10、老6、武将3、宦官1、正位2、常位5、皇帝青老各1、皇子少成各1、公主少成各1 | 33 | 299,602 |
| 唐太宗专属：25位历史开局人物＋李世民老年＋李承乾／李泰／李恪成年 | 29 | 231,280 |
| 本批唐制合计 | **62** | **530,882** |
| `assets/art/`全目录 | **286个WebP** | **4,209,272（约4.21 MB）** |

全部唐像400×500、WebP q75，最大16,378字节，低于每张30 KB；总目录低于12 MB。逐张导出记录的完整髻／帽顶距为10–14%，眼高为36.02–40%；构图探针与全图人工复检结合。前两期224个WebP逐字节保持，唐制其余三个已确认定调样张逐字节保持，仅正位01按反馈替换。[资产及构图记录](art-phase3-tang-review/final/asset-checks.json)。

仅填唐制33池槽和唐太宗29专属槽，其他朝代、其他剧本、共用池、场景／殿阁、焦点配置逐项比对不变。`src/core`没有修改，存档仍v25；既有脸号、随机数、迁移与提交规则保持。[保持性核对](art-phase3-tang-review/final/preservation.json)。

### 长相、44px与年龄复检

同池长相卡74组两两组合均至少四维不同，脸型或胡须／发际线维度不同；最终全图与44px逐池检查。唐制软脚下垂、圆领无补子、文武区别以及后妃两档头饰继续沿用已确认规范。正位01保留原脸与衣色，只加强高髻、凤钗、垂珠：

![正位01修订前后与常位44px对照](art-phase3-tang-review/high-regalia-before-after.png)

![唐池33张原图与44px](art-phase3-tang-review/final/tang-pool-full.png)

![唐池33张44px完整条](art-phase3-tang-review/final/tang-pool-44.png)

逐池44px条也保存在本机`qa/art/`，仓库镜像：[文官壮](art-phase3-tang-review/final/pools-44/tang-official-mature-44.png)、[文官老](art-phase3-tang-review/final/pools-44/tang-official-old-44.png)、[武将](art-phase3-tang-review/final/pools-44/tang-general-all-44.png)、[宦官](art-phase3-tang-review/final/pools-44/tang-eunuch-all-44.png)、[正位](art-phase3-tang-review/final/pools-44/tang-consort-high-44.png)、[常位](art-phase3-tang-review/final/pools-44/tang-consort-regular-44.png)、[皇帝青](art-phase3-tang-review/final/pools-44/tang-emperor-young-44.png)、[皇帝老](art-phase3-tang-review/final/pools-44/tang-emperor-old-44.png)、[皇子少](art-phase3-tang-review/final/pools-44/tang-prince-teen-44.png)、[皇子成](art-phase3-tang-review/final/pools-44/tang-prince-adult-44.png)、[公主少](art-phase3-tang-review/final/pools-44/tang-princess-teen-44.png)、[公主成](art-phase3-tang-review/final/pools-44/tang-princess-adult-44.png)。

专属像依据scenarios.js的年龄、性格与秘密，并参考《旧唐书》相关卷目及韦贵妃墓志；未有可靠记载的具体五官、痣和体态明确作为创作设定，外邦绘制年龄不写入游戏状态。用长短脸、全须／三绺／短颏／无须、胖瘦颈肩与神情区分；外邦冠服各异。李恪幼年稿在复检时改回明确7岁儿童比例。李世民老年为约50岁，三位皇子成年为约20岁，分别保留本人五官特征。

![唐太宗专属29张](art-phase3-tang-review/final/tang-taizong-full.png)

![唐太宗专属29张44px完整条](art-phase3-tang-review/final/tang-taizong-44.png)

![本人幼年／成年及皇帝青老对照](art-phase3-tang-review/final/age-variants.png)

### 自动检查与应用内浏览器

- `npm test`：**608／608通过**。扩展现有测试覆盖唐、明、清五剧本全部历史开局人物，皇帝39／40切档、跨剧本同名隔离；唐清五位皇子6／7／15／16／20岁切档且取图不修改存档。
- `node scripts/simulate.mjs 200`：**200年／7200旬**，五次继位，未崩盘，最终国库2040；mock路径不请求模型。
- `npm run build`：`index.html` **858,090字节**，低于860,000预算。[测试与模拟摘要](art-phase3-tang-review/final/test-summary.json)。
- 新版Codex In-app Browser，经`http://127.0.0.1:4211`查看独立第1卷试读唐局；仅查看和打开召见预览，没有垂询模型或推进旬，没有访问线上存档。真实游戏1280×900、768×1024、390×844截图齐全，360×800无横向溢出，360时后宫弹窗scrollWidth／clientWidth均342。
- 真实召见纸面头像400×500正常；390行动头图为340×112，使用720档、object-fit:cover，完整覆盖无画边。首屏仅**3个**新增图片请求（章节、杜如晦、池文官09），不超过6。[首屏请求记录](art-phase3-tang-review/final/first-screen-requests.json)。
- 生产取图函数逐一核对62个路径；只读投影页复用生产头像HTML与CSS，初始化加载监听后再挂载，124个头像／人物卡、62个不同源均400×500解码且opacity=1。此投影页为全批解码与44px补充验证，不等同于真实游戏操作截图。[取图记录](art-phase3-tang-review/final/portrait-resolution.json)、[浏览器解码记录](art-phase3-tang-review/final/gallery-load-results.json)。

![真实游戏章节1280](art-phase3-tang-review/final/game-1280.jpg)

![真实朝堂1280](art-phase3-tang-review/final/court-1280.jpg)

![真实后宫1280](art-phase3-tang-review/final/harem-1280.jpg)

![真实游戏章节768](art-phase3-tang-review/final/game-768.jpg)

![真实朝堂768](art-phase3-tang-review/final/court-768.jpg)

![真实后宫768](art-phase3-tang-review/final/harem-768.jpg)

![真实游戏章节390](art-phase3-tang-review/final/game-390.jpg)

![真实朝堂390](art-phase3-tang-review/final/court-390.jpg)

![真实后宫正位390](art-phase3-tang-review/final/harem-high-390.jpg)

![真实后宫常位390](art-phase3-tang-review/final/harem-regular-390.jpg)

![真实召见纸面及112px头图390](art-phase3-tang-review/final/audience-390.jpg)

![生产取图44px及人物卡的只读投影](art-phase3-tang-review/final/regalia-in-browser-1280.jpg)

### 退回、对比度与Lighthouse

关闭「显示插图」后，img src为0、场景隐藏，人物退回44px首字圆章；刷新后仍关闭，复验后恢复开启。通过隔离localhost服务器中断所有WebP连接来模拟图片不可达，章节退回#EFE6D3纯色，人物naturalWidth=0时均标记art-failed并退回首字圆章，文字与导航仍可用；恢复连接后图片正常。此项是资源断网模拟，不宣称整机物理断网。正常与断图期间捕获的warn/error均为空。[浏览器读数](art-phase3-tang-review/final/browser-results.json)。

![关闭插图人物退回](art-phase3-tang-review/final/illustrations-off.jpg)

![关闭插图章节退回](art-phase3-tang-review/final/chapter-off.jpg)

![连接中断章节退回](art-phase3-tang-review/final/image-network-failure-chapter.jpg)

![连接中断人物退回](art-phase3-tang-review/final/image-network-failure-portraits.jpg)

场景渐变包装不含文字，标题位于图外；实际读取当前CSS并计算美术相邻的纸面、暗底与圆章文字组合，最低**4.8314:1**，满足普通文字4.5门槛，不宣称覆盖站内任意颜色组合。[对比度记录](art-phase3-tang-review/final/contrast.json)。

官方Lighthouse使用生产朝堂、后宫与召见纸面HTML／CSS的只读投影，1280／390各三页共六次，可访问性均**100**。修正验收页早于监听器加载的静态图片时序后，六次已重新完整运行；原始报告留本机，仓库保留版本、时间、失败项与SHA-256摘要。真实交互和截图均使用应用内浏览器，Lighthouse的无头Chrome仅用于该审计。[Lighthouse摘要](art-phase3-tang-review/final/lighthouse-summary.json)。

完整批次初验时未发布Pages；玩家现已授权最终修订后合并发布，线上验证见本页首节。

<details>
<summary>历史：第1步定调样张与当时的待办（现已获确认并完成）</summary>


日期：2026-11-07。分支`feat/art-phase3-tang`，从最新main／`97f80a4`建立；原工作区的未提交内容保留。本轮**只完成第1步四张定调样张，停下等待画风确认**。唐制总范围62张（池33＋唐太宗专属29），已出池图4张，其余58张尚未生成。草稿PR仅供审阅，不合并、不发布。

## 四张样张与朝代辨识

| 文件 | 长相与服饰要件 |
| --- | --- |
| `tang/official-mature-01` | 42岁虚构池图，瘦长三角脸、三绺细髯、沉思神情；紫色圆领袍、软脚幞头，两脚向脑后下垂，胸前无补子 |
| `tang/consort-regular-01` | 24岁虚构池图，心形脸、细颈、温柔眉眼；较小高环髻、花钿、珊瑚色襦裙与石绿披帛 |
| `tang/consort-high-01` | 32岁虚构池图，丰满宽鹅蛋脸、丰润体态、沉静仪态；较大宽双环髻、步摇金钗、花钿、朱色襦裙与赭金披帛 |
| `tang/emperor-young-01` | 33岁虚构池图，宽五角脸、浓短髭与短颏须、警醒神情；赭黄圆领袍、软脚幞头 |

四张均为池图，不是截图中历史人物的专属面貌。当前唐太宗剧本按原取图规则暂用这些池图或首字圆章；29张专属像待画风确认后，依据scenarios.js与史料另写长相卡。本轮只写四张样张长相卡，各池余卡在该池开始前补齐。

![四张定调及44px圆章](art-phase3-tang-review/tang-tone-samples.png)

按用户要求将唐、明、清文官各一张并排，附实际44px圆章：唐为下垂软脚和无补子圆领，明为平伸硬展角与补服，清为顶珠暖帽、朝珠补褂。没有生成宋制人物；后续唐制共同约束继续禁止宋式长平硬脚。

![唐明清文官并排](art-phase3-tang-review/tang-ming-qing-officials.png)

![四张44px原尺寸条](art-phase3-tang-review/tang-tone-44.png)

## 生成与接入

- 全部使用内置imagegen。每次初稿显式传入已批准的一期四张（明壮官01、明常位01、desk-night、court），仅参考画风。四张唐制出齐后已保存本机唐制参照板；确认后每次同时传入一期四张板＋唐四张板，八张画面全部保留，编辑时另传目标，沿用二期的参照方式。
- 按前两期定调做法逐张生成。两位后妃初稿髻顶偏高，在生成端修正上部发髻与眼位后再导出；正位第二次只压紧发髻上部，保留面貌、步摇、金钗和衣色。所有长相卡、实际提示词及修订原因已先记入[ART-PROMPTS](ART-PROMPTS.md)。后续池图按同池2×2、专属像按单张生成。
- 导出仅裁切、等比缩放和WebP转换，无手工修脸、调色或补画。原始PNG、未选稿、参照板保留本机`art-source/phase3-tang`，不提交生成原图；仓库美术资产只新增四个WebP。此页的带标签拼图与浏览器截图是验收证据。
- `art-manifest.js`仅填四个唐池的第01槽，其余64个池键、全部专属映射、场景／殿阁／焦点与97f80a4一致；未出图槽位继续为空。[清单比对](art-phase3-tang-review/manifest-checks.json)。没有改取图函数、core、LLM或存档，仍v25。
- 四张均**400×500／q75／≤30KB**；帽／发顶10.00–12.55%，双眼37.38–39.82%，朝向两左两右。新增**34,534字节**，最大单张9,678字节；assets/art共**228个WebP／3,712,924字节**，原一期、二期224个文件逐字节一致。[构图、尺寸、散列和体积](art-phase3-tang-review/asset-checks.json)、[长相卡](art-phase3-tang-review/face-cards.json)。

## 本步验证

**608／608测试、200年／7200旬mock模拟、构建通过**。模拟6朝、5次传承、无亡国，终局国库2040；HTML855,190字节，在860,000字节预算内。仅更新既有清单文件数断言到228，没有新增与画面实现同义的单元测试。[测试与模拟摘要](art-phase3-tang-review/test-summary.json)。

应用内浏览器经`http://127.0.0.1:4211`新建独立第1卷试读局，分别查看开局、朝堂和后宫。皇帝、文官、两档后妃样张均按生产取图规则正常加载为400×500。1280／390截图已保存，360宽scrollWidth=360，无横向溢出。390场景使用720档。仅查看，没有推进旬或请求模型；不接触线上存档。读取中折叠区／屏外懒加载副本可能尚未complete，不计为图片错误；可见样张均已实看。

关闭「显示插图」后，人物退回首字圆章、场景隐藏且无图片src；随后已恢复开启。浏览器warn/error为空，视口已恢复默认。[浏览器读数](art-phase3-tang-review/browser-results.json)。

### 1280档

![开局皇帝预览1280](art-phase3-tang-review/opening-1280.jpg)

![朝堂文官1280](art-phase3-tang-review/court-1280.jpg)

![后宫正位与常位1280](art-phase3-tang-review/harem-1280.jpg)

### 390档

![开局皇帝预览390](art-phase3-tang-review/opening-390.jpg)

![朝堂文官390](art-phase3-tang-review/court-390.jpg)

![后宫正位390](art-phase3-tang-review/harem-high-390.jpg)

![后宫常位390](art-phase3-tang-review/harem-regular-390.jpg)

![关闭插图退回](art-phase3-tang-review/illustrations-off.jpg)

## 确认后待做

本步停在定调样张，未开展其余58张。确认后先补每池长相卡，再出其余池图29张与唐太宗专属29张（25位开局人物、李世民老年像、李承乾／李泰／李恪成年像）。每池、同剧本均做44px全条检查。

完整§9验收在批量完成后执行：唐剧本开局全员专属取图、完整1280／768／390三档、断网退回、首屏请求预算、对比度与Lighthouse均尚未在本批宣称通过；本步已完成的测试、模拟、体积、两档截图、360溢出和插图开关结果如上。分支阶段不做Pages线上发布验收。

</details>
