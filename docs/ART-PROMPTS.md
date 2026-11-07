# 御极 · 美术实际提示词

工具：内置 `imagegen`，未使用 CLI / 外部 API。画风方向已确认；先修订四张定调样张与明制服饰约束，再继续一期批量生成。历史提示词保留以便追溯。

## 美术二期 · 清制定调样张（第1步，待确认）

从最新main／34bdb82建立feat/art-phase2。二期79张，本步只出4张池图定调样张，不生成其余75张；待玩家确认后才继续。定调样张逐张生成，批量池图继续按一期2×2同池四人、专属像单张执行。每池未开始的其余长相卡在确认后、该池生成前补齐。

### 清制服饰要点（全部清制生成共同约束）

- 文官：暖帽或凉帽，帽顶有顶珠；石青色补褂，胸前方补，挂朝珠。官服深色可以统一，长相差异靠脸型、胡须、体态、神情拉开。
- 武将：甲胄或补褂，戴顶戴。
- 皇帝：明黄龙袍、吉服冠；不戴明制翼善冠。
- 后妃正位戴钿子或朝冠；常位梳两把头，配扁方和簪花，穿立领旗装。正位冠体和常位横向发髻一眼可辨，女性眉眼柔和、面貌明确。
- 皇子：马褂或袍，戴小帽；公主穿旗装，梳两把头或小两把头。
- 男子头肩像只露前额剃发的轮廓，不画辫子垂到胸前，不夸张、不丑化。
- 所有画面禁用满文、汉字、匾额等任何文字。服饰只保留朝代辨识要件，不铺繁复刺绣、珠串或灯光特效。
- 清制不建宦官池、太后池：内务府总管共用文官池；两剧本太后各用专属像。

### 参考与构图

沿用一期批准四张的最新版：明文官壮01、明常位后妃01、style-v2/desk-night、style-v2/court，只作线条、平涂和纸底参考，不复制明制服饰或人物。四张清制定调样张确认后，后续每次调用都显式传入含这四张一期参照与四张清制参照的两块参照板，完整保留8张画面。内置工具最多接收5个参照文件，因而各4张仅缩放拼接成一板，单张编辑另传目标；此技术处理先在草稿PR说明，不修图，不减少参考内容。头顶10–14%、眼位36–40%（目标38%）、4:5头肩像、四分之三侧、底色#E3D7BE；导出仅裁切、等比缩放、转WebP，不修图。人物400×500/q75。

### 四张样张长相卡

| 池／编号 | 脸型 | 胡须／发型与发际线 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情／朝向 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| qing/official-mature/01 | 宽方脸，厚下颌 | 短浓圆形络腮须连短髭 | 平直浓眉、小而略垂的深眼 | 宽圆鼻、厚下唇紧合 | 富态厚颈、宽肩 | 暖黄偏麦肤 | 左颊一颗小痣 | 沉着持重／向左 |
| qing/consort-regular/01 | 心形脸，细尖圆下巴 | 低平圆发际线、低两把头 | 细平眉、柔和宽杏眼 | 小直鼻、较丰圆唇 | 纤细挺直肩颈 | 暖白肤 | 右眉尾小痣 | 温柔含蓄／向右 |
| qing/consort-high/01 | 饱满宽鹅蛋脸、圆下颌 | 较高圆弧发际线、紧整高髻藏钿子下 | 柔弯长眉、细长沉静眼 | 高而小的鼻梁、薄弓唇 | 丰润端正肩颈 | 浅米偏冷肤 | 左嘴角浅酒窝 | 端庄自持／向左 |
| qing/emperor-young/01 | 修长卵圆脸、收窄下巴 | 淡短八字髭、下巴无须 | 清晰微挑眉、较大细长眼 | 高直鼻、薄唇紧合 | 瘦长挺拔肩颈 | 浅金米肤 | 右眉间一条浅竖纹 | 警醒而有决断／向右 |

本步每池仅一人，四张为虚构池图，不作为历史人物长相史料。后续同池长相卡逐对校验至少四维不同，男性脸型或胡须不同，女性脸型、发际线或发髻高低不同。

### 定调样张实际提示词

#### qing/official-mature/01

内置imagegen，逐张生成；参照上述一期四张，均仅作画风参考。原始PNG：`art-source/phase2/official-mature-01.png`。

```text
Use case: historical-scene. Asset type: one game character portrait for 御极, Chinese Qing dynasty. The FOUR supplied images are the approved Phase1 STYLE AND FRAMING references ONLY: image1 Ming official, image2 Ming consort, image3 night desk, image4 court. Do not copy their people, Ming hats, hair or clothing, and do not depict a setting. Match the same clean restrained Chinese BAIMIAO ink outlines, light FLAT muted washes, at most one very faint flat shading layer and nearly smooth pale paper. Simple illustrated character atlas, not concept art. One SINGLE distinct person, HEAD AND SHOULDERS ONLY, crop just below shoulders; no hands, props or full torso. Face horizontally centered. The very TOP of the hat/headdress is exactly12% down from the canvas top (allowed10–14%). BOTH eye centers are exactly38% down (strict36–40%). Adjust the COMPACT height of headdress to satisfy both lines, never push eyes to the middle. Three-quarter view, gaze slightly off-camera, never directly at viewer. Plain solid #E3D7BE background to every edge with EXTREMELY faint paper grain. No perspective frame, no scenery, no border. Do NOT draw composition guides. No Chinese or Manchu writing or ANY text, insignia lettering, plaques, seals, signature, watermark, glow, photo, 3D, anime, cinematic light, detailed embroidery, actor or TV likeness. Portrait4:5,1024x1280.
Subject / face card: 44-year-old mature adult male, BROAD SQUARE face and heavy jaw, short dense rounded full beard connected to a short moustache, thick level eyebrows, small deep-set slightly downturned eyes, broad rounded nose, thick lower lip softly closed, distinctly PLUMP thick neck and broad shoulders, warm wheat-beige skin, one tiny mole on left cheek, composed steady patience, facing LEFT.
Period costume: Clearly QING civil official: compact winter court WARM HAT with black fur rolled rim, low rounded red tassel crown and one small round RED FINIAL BEAD at its top; no horizontal Ming wings. The hat allows a restrained curved SHAVEN FRONT-FOREHEAD outline just above the brows, no hair hanging on chest, no exaggerated baldness. Dark STONE-BLUE (near navy) BUFU overrobe with standing neckline, upper portion of a clear SQUARE CIVIL RANK PATCH on the upper chest at the bottom of portrait, simply suggested pale bird/cloud motif with no characters. A clear COURT BEAD NECKLACE drapes over both shoulders as discrete small subdued pale beads, simplified, partly cropped at lower edge. The rank patch and beads must be readable while remaining head-and-shoulders framing; no full-length robe or elaborate embroidery.
```

#### qing/consort-regular/01

内置imagegen，逐张生成；参照上述一期四张，均仅作画风参考。原始PNG：`art-source/phase2/consort-regular-01.png`。

```text
Use case: historical-scene. Asset type: one game character portrait for 御极, Chinese Qing dynasty. The FOUR supplied images are the approved Phase1 STYLE AND FRAMING references ONLY: image1 Ming official, image2 Ming consort, image3 night desk, image4 court. Do not copy their people, Ming hats, hair or clothing, and do not depict a setting. Match the same clean restrained Chinese BAIMIAO ink outlines, light FLAT muted washes, at most one very faint flat shading layer and nearly smooth pale paper. Simple illustrated character atlas, not concept art. One SINGLE distinct person, HEAD AND SHOULDERS ONLY, crop just below shoulders; no hands, props or full torso. Face horizontally centered. The very TOP of the hat/headdress is exactly12% down from the canvas top (allowed10–14%). BOTH eye centers are exactly38% down (strict36–40%). Adjust the COMPACT height of headdress to satisfy both lines, never push eyes to the middle. Three-quarter view, gaze slightly off-camera, never directly at viewer. Plain solid #E3D7BE background to every edge with EXTREMELY faint paper grain. No perspective frame, no scenery, no border. Do NOT draw composition guides. No Chinese or Manchu writing or ANY text, insignia lettering, plaques, seals, signature, watermark, glow, photo, 3D, anime, cinematic light, detailed embroidery, actor or TV likeness. Portrait4:5,1024x1280.
Subject / face card: 24-year-old ADULT WOMAN, clearly feminine HEART-SHAPED face with a softly tapered small rounded chin, LOW smooth rounded hairline, fine level eyebrows and soft wide almond eyes, small straight nose, softly full rounded closed lips, slender straight shoulders and fine neck, pale WARM skin, tiny beauty mark near RIGHT eyebrow tail, gentle thoughtful reserve, facing RIGHT. Soft brows and eyes, no angular masculine jaw, no moustache or beard.
Period costume: Clearly QING regular-rank palace consort: LOW and COMPACT authentic LIANGBATOU / TWO-HANDLE HAIRSTYLE, hair swept into TWO NEAT HORIZONTAL lateral hair rolls built around one visible flat BI ANFANG horizontal hairpin, not a towering winged theatre headdress or a huge late-Qing board. One small plain gold pin and one muted rose-colored flower on one side, no crown. Fully covered muted PALE JADE standing-collar QING QIPAO / banner robe, asymmetric side fastening indicated at collar and shoulder, restrained dark green edging and tiny simple knots. No Ming jiujibun or small Ming crown, no Ming crossed-collar ao, no phoenix crown. Only shoulders and collar visible.
```

#### qing/consort-high/01

内置imagegen，逐张生成；参照上述一期四张，均仅作画风参考。原始PNG：`art-source/phase2/consort-high-01.png`。

```text
Use case: historical-scene. Asset type: one game character portrait for 御极, Chinese Qing dynasty. The FOUR supplied images are the approved Phase1 STYLE AND FRAMING references ONLY: image1 Ming official, image2 Ming consort, image3 night desk, image4 court. Do not copy their people, Ming hats, hair or clothing, and do not depict a setting. Match the same clean restrained Chinese BAIMIAO ink outlines, light FLAT muted washes, at most one very faint flat shading layer and nearly smooth pale paper. Simple illustrated character atlas, not concept art. One SINGLE distinct person, HEAD AND SHOULDERS ONLY, crop just below shoulders; no hands, props or full torso. Face horizontally centered. The very TOP of the hat/headdress is exactly12% down from the canvas top (allowed10–14%). BOTH eye centers are exactly38% down (strict36–40%). Adjust the COMPACT height of headdress to satisfy both lines, never push eyes to the middle. Three-quarter view, gaze slightly off-camera, never directly at viewer. Plain solid #E3D7BE background to every edge with EXTREMELY faint paper grain. No perspective frame, no scenery, no border. Do NOT draw composition guides. No Chinese or Manchu writing or ANY text, insignia lettering, plaques, seals, signature, watermark, glow, photo, 3D, anime, cinematic light, detailed embroidery, actor or TV likeness. Portrait4:5,1024x1280.
Subject / face card: 36-year-old ADULT WOMAN, clearly feminine FULL BROAD OVAL face with rounded cheeks and chin, HIGH smooth arched hairline, gently curved long eyebrows and narrow serene almond eyes, fine high nose bridge, thin softly shaped cupid-bow closed lips, full graceful neck and rounded upright shoulders, pale COOL beige skin, shallow dimple near left mouth corner, calm dignified self-possession, facing LEFT. Feminine gentle eyes and mouth, no masculine beard or angular male jaw.
Period costume: Clearly QING HIGH-RANK QUEEN CONSORT: a COMPACT BLACK SATIN DIANZI crown, a visibly arched rounded FAN-SHAPED diadem covering the tidy raised bun, with THREE simple turquoise-and-dull-gold floral shapes across the front and TWO SHORT tiny pearl pendant strands by the temples. Headdress top at12%, EYES at38%; keep the diadem compact and naturally fitted. This upright CROWN silhouette must be immediately distinct from the regular consort horizontal two-handle hair; no two-handle hairstyle, no Ming phoenix bird crown. Fully covered muted plum-red STANDING-COLLAR QING banner robe with stone-blue collar edge and simple side fastening. Jewelry restrained and flat, no intricate embroidery or excessive beadwork.
```

#### qing/emperor-young/01

内置imagegen，逐张生成；参照上述一期四张，均仅作画风参考。原始PNG：`art-source/phase2/emperor-young-01.png`。

```text
Use case: historical-scene. Asset type: one game character portrait for 御极, Chinese Qing dynasty. The FOUR supplied images are the approved Phase1 STYLE AND FRAMING references ONLY: image1 Ming official, image2 Ming consort, image3 night desk, image4 court. Do not copy their people, Ming hats, hair or clothing, and do not depict a setting. Match the same clean restrained Chinese BAIMIAO ink outlines, light FLAT muted washes, at most one very faint flat shading layer and nearly smooth pale paper. Simple illustrated character atlas, not concept art. One SINGLE distinct person, HEAD AND SHOULDERS ONLY, crop just below shoulders; no hands, props or full torso. Face horizontally centered. The very TOP of the hat/headdress is exactly12% down from the canvas top (allowed10–14%). BOTH eye centers are exactly38% down (strict36–40%). Adjust the COMPACT height of headdress to satisfy both lines, never push eyes to the middle. Three-quarter view, gaze slightly off-camera, never directly at viewer. Plain solid #E3D7BE background to every edge with EXTREMELY faint paper grain. No perspective frame, no scenery, no border. Do NOT draw composition guides. No Chinese or Manchu writing or ANY text, insignia lettering, plaques, seals, signature, watermark, glow, photo, 3D, anime, cinematic light, detailed embroidery, actor or TV likeness. Portrait4:5,1024x1280.
Subject / face card: 28-year-old young ADULT MALE emperor, LONG SLIM OVAL face and neat tapered chin, delicate SHORT SEPARATED MOUSTACHE tips, no chin beard, clearly masculine but youthful, clean lifted fine eyebrows, larger long observant eyes, high STRAIGHT NARROW nose and thin firmly closed lips, lean long neck and upright narrow shoulders, light golden-beige skin, one faint short vertical crease between right brow and bridge, alert disciplined resolve, facing RIGHT. Must look distinctly different from the broad plump full-bearded official.
Period costume: Unmistakably QING emperor: compact QING JIFUGUAN auspicious crown, low black rounded rim with RED TASSEL cap above, a small GOLD finial with modest red jewel at its very top. No Ming Yishanguan, no folded rear wings, no horizontal wings, no western crown. Show only a restrained curved SHAVEN FRONT-FOREHEAD outline under the hat, no braid on chest, no exaggerated baldness. Muted but unmistakably BRIGHT IMPERIAL YELLOW standing-collar QING DRAGON ROBE, dark blue collar and a few simple coiling dragon/cloud outline marks on shoulder and upper chest, clearly decorative unlettered motifs, not detailed embroidery. One simplified discreet amber court-bead arc can show near lower crop. Head-and-shoulders only.
```

### 定调男像帽顶留白复检

首稿两张男像眼位合格、顶珠上沿留白偏小，使用内置imagegen只压缩帽冠及顶珠的竖向高度，脸部与眼位不动；首次尝试直接传入8张被工具以最多5文件拒绝，未生成图；改以一期4张、清制首稿4张各拼成一块参照板并另传编辑目标，全部8张画面仍在。下列为首次尝试提示词，后附实际采用的参照板版。女性样张采用裁切调整，不修脸或补画。

#### official-mature-01 帽顶修订

```text
Use case: precise-object-edit. There are EIGHT references: images1–4 approved Phase1 STYLE references, images5–8 Qing tone samples (official,regularconsort,highconsort,youngemperor). Image5 is the ONLY EDIT TARGET; preserve its exact same face identity, facial hair, forehead, gaze, shoulders, costume, collar, necklace, skin, flat baimiao style and #E3D7BE paper background. Other seven images are style references ONLY, never copy their people or dress.
Change ONLY the VERTICAL HEIGHT of the red warm hat and round finial. The current very top of the finial is too high, near8% of canvas height. Make the UPPER CAP / FINIAL more COMPACT vertically, bringing its very top DOWN to12% of total image height (strict10–14%, target12%). Keep the LOWER edge of the hat next to forehead fixed. Keep both eye centers exactly where they are, at38% image height (strict36–40%), keep head anatomy and all face/body positions fixed. Do not move the person down or enlarge the face. This is a compact Qing hat, no Ming wings, no continuous wide Western hat brim. Retain the existing period costume, rank patch/dragon outline and court beads unchanged. No new elements or text, no composition lines, no Manchu or Han writing,seals,watermarks,frames,photo,3D,glow. Single4:5 portrait,1024x1280.
```

#### emperor-young-01 帽顶修订

```text
Use case: precise-object-edit. There are EIGHT references: images1–4 approved Phase1 STYLE references, images5–8 Qing tone samples (official,regularconsort,highconsort,youngemperor). Image8 is the ONLY EDIT TARGET; preserve its exact same face identity, facial hair, forehead, gaze, shoulders, costume, collar, necklace, skin, flat baimiao style and #E3D7BE paper background. Other seven images are style references ONLY, never copy their people or dress.
Change ONLY the VERTICAL HEIGHT of the red JIFUGUAN upper cap and gold/red finial. The current very top of the finial is too high, near8% of canvas height. Make the UPPER CAP / FINIAL more COMPACT vertically, bringing its very top DOWN to12% of total image height (strict10–14%, target12%). Keep the LOWER edge of the hat next to forehead fixed. Keep both eye centers exactly where they are, at38% image height (strict36–40%), keep head anatomy and all face/body positions fixed. Do not move the person down or enlarge the face. This is a compact Qing hat, no Ming wings, no continuous wide Western hat brim. Retain the existing period costume, rank patch/dragon outline and court beads unchanged. No new elements or text, no composition lines, no Manchu or Han writing,seals,watermarks,frames,photo,3D,glow. Single4:5 portrait,1024x1280.
```

## 明制服饰要点（本轮修订，后续明 / 大晟人物全部沿用）

- 文官乌纱帽统一参照 unique/ming-wanli/official-01.webp：平顶、前低后高，前部贴额，后帽身为较高的平顶方圆结构；两片扁平椭圆展角从帽后水平伸出。禁止圆顶、礼帽式连续帽檐。
- 明制文官袍服只用降饱和朱红、石青、墨绿；禁用黄色、赭黄、金黄袍。适用于全部明／大晟文官池及后续历史文官。
- 常位后妃：鬏髻或小发冠，搭配明制竖领或交领袄；不画通用高髻配圆领衫。正位必须有可辨凤形冠体、展翼和珠串轮廓，与常位小发冠明显区分，线条仍简化。所有人物眼线固定在画高36–40%，目标38%。
- 场景满幅画到四边：desk-night上方梁枋、下方案腿地面，用竹帘或中式帷幔；court上方梁枋或藻井。不得留纯色遮幅或画面外白边。

## 四张样张修订 · 2026-11-05

### official-v2

- 编辑目标：`art-source/official-mature-01.png`
- 工具：内置imagegen；保持人物身份和白描淡彩，只按玩家要求修订服饰或建筑。

```text
Use case: historical-scene. Edit target: the attached fictional Ming civil official portrait. Preserve the same man's face, mole, short moustache and goatee, left-facing three-quarter pose, muted red round-collar robe, baimiao clean ink outlines, light flat muted colors and plain #E3D7BE paper background. Replace ONLY the incorrect hat with a clearly Ming-dynasty WUSHAMAO: a LOW FRONT cap panel above the forehead and a distinctly TALLER REAR crown behind the head, a stepped two-level silhouette; two separate THIN FLAT OVAL wings emerge from the BACK of the cap and extend horizontally left and right. Wings are flat oval gauze paddles, not a continuous brim around the head. Absolutely no bowler hat, fedora, top hat, rounded dome with brim, turban or Qing hat. Keep the hat compact enough that its top is 10–14% from the canvas top and BOTH EYES are at 38% of image height (allowed 36–40%). Head-and-shoulders cropped just below shoulders, face centered horizontally, no hands or props. Faint paper grain only. No text, seals, watermark, border, glow, realistic dramatic shading. Single 4:5 portrait, 1024x1280.
```

### consort-v2

- 编辑目标：`art-source/consort-regular-01.png`
- 工具：内置imagegen；保持人物身份和白描淡彩，只按玩家要求修订服饰或建筑。

```text
Use case: historical-scene. Edit target: the attached fictional adult Ming consort portrait. Preserve the same adult woman's face, beauty mark beside eyebrow, right-facing three-quarter pose, gentle expression, baimiao ink outlines, light flat muted washes, plain #E3D7BE paper background. Correct period dress so it is immediately recognizable as MING: replace the tall swept-up generic hairstyle with a compact ROUND JIUJI bun, a small dark rounded Ming woman's hair crown resting over the bun, held with one modest simple gold pin; no large swept-back towering hairstyle, no Qing two-wing hair. Replace the round-neck outer robe with a muted pale jade-green Ming AO JACKET with a clearly VERTICAL STANDING COLLAR at the neck and a narrow front opening with two simple small ties, ivory collar and muted rose inner edge; NOT a round-neck T-shirt shape, NOT Qing or Korean costume. Modest fully covered shoulders. Keep head and shoulders only. Top of hair crown at 12% of total height; BOTH EYES exactly on the 38% horizontal line (must be within 36–40%); adjust head placement to ensure this, do not let eyes fall near the middle of the canvas. Gaze off-camera, face horizontally centered. No text, seals, signature, watermark, border, glow or intricate jewelry. Single 4:5 portrait, 1024x1280.
```

### desk-night-v2

- 编辑目标：`art-source/desk-night.png`
- 工具：内置imagegen；保持人物身份和白描淡彩，只按玩家要求修订服饰或建筑。

```text
Use case: historical-scene. Edit the attached night imperial writing-desk illustration. Preserve the desk objects, unmarked folded memorial stacks, brushes, candle, lattice window, restrained baimiao ink-outline / flat muted wash style, dark brown palette close to #1C1714 and small warm gold candle light. Correct THREE things: (1) remove both Western-style draped window curtains with tiebacks; replace with simple Chinese bamboo roller blinds under the window frame, no curved side swags or Western curtains; (2) fill the entire upper black letterbox band with DRAWN dark wooden beams, crossbars and shadowed ceiling, continuing the architecture naturally to the top edge; (3) fill the entire lower black letterbox band with DRAWN desk legs, a cross brace and dark flagstone floor continuing all the way to the bottom edge. The image must be full-bleed illustrated architecture edge-to-edge, with visible restrained ink contours even in the darkest areas, no blank strips or masking bars. Keep the overall scene VERY DARK and calm; do not brighten it to daytime. Key objects remain in the horizontal middle band 30–70% for a narrow header crop. No people. No text, plaques with writing, seals, watermark, border, photorealism, 3D, glow or dramatic light beams. Landscape 16:9, 1536x864.
```

### court-v2

- 编辑目标：`art-source/court.png`
- 工具：内置imagegen；保持人物身份和白描淡彩，只按玩家要求修订服饰或建筑。

```text
Use case: historical-scene. Edit the attached generic Chinese imperial court hall. Preserve the empty throne, dais, red columns, central aisle, empty standing mats, symmetric perspective, clean baimiao ink outlines and muted flat color washes. Fill the WHOLE blank pale beige horizontal band at the TOP with the hall's wooden BEAMS, cross-beams, simple bracket sets or a restrained coffered ceiling continuing the existing architecture naturally to the top edge. NO blank paper band, letterbox bar, frame or border anywhere; the entire 16:9 canvas must contain the illustrated interior. Keep the throne and steps in the central horizontal band 30–70% so they survive a 112px mobile header crop. Keep daytime pale even light, minimal one-layer shading, simple large architectural forms, no added ornament or glow. No people, no text, seals, signature, watermark, real building replica, photorealism or 3D. Landscape 16:9, 1536x864.
```

## 样张长相卡

| 池 / 编号 | 脸型 | 胡须 / 发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 / 朝向 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ming/official-mature/01 | 宽方脸 | 短髭、小山羊须 | 浓直眉、细长略吊眼 | 宽鼻、薄唇紧抿 | 结实端正 | 风霜黄肤 | 左颊小痣 | 沉稳刚直 / 向左 |
| ming/consort-regular/01 | 长鹅蛋脸、圆尖下颌 | 低圆发际线、端正狄髻 | 细弯眉、略垂杏眼 | 小直鼻、丰唇轻合 | 清瘦挺秀 | 暖白 | 右眉旁小痣 | 温厚若有所思 / 向右 |

每个池当前只有一张。后续池图在生成前补齐全部长相卡，并逐对检查至少四维不同与脸型 / 胡须或发际线差异。

## 源图与导出

原始 PNG 保存在本机忽略目录 `art-source/`；WebP 在 `assets/art/`。实际生成像素由工具决定，导出仅按构图裁切到规定比例、等比缩放、格式转换；不做调色、修脸、补画。人物 400×500 / q75，场景 1440×810、720×405 / q72。

## 明制文官（壮）01

- 标识：`official-mature-01`
- 源图：`art-source/official-mature-01-v1.png`
- 参考：无；首版眼位偏低，已舍弃

```text
Use case: historical-scene. Asset type: game character portrait for 御极.
One SINGLE middle-aged Ming-dynasty Chinese civil official, age 42, head-and-shoulders only, cropped just below shoulders. Chinese baimiao line drawing with light flat color washes: clean ink outlines of gently varied weight, flat muted colors (ochre, cinnabar, azurite, malachite, beige, ink gray), at most one faint shading layer. An elegant simple illustrated character atlas, not concept art or a poster.
Subject / face card: broad square face; short separated moustache and small pointed goatee; thick straight eyebrows, narrow upturned eyes; broad nose and thin tightly closed lips; solid upright build; weathered yellow-ochre skin; a small mole on his left cheek; calm, honest and firm expression. Wearing a black Ming wushamao with modest horizontal side wings and a muted dark red round-collar official robe; only the collar, shoulders and upper edge of a very simply suggested rank patch show. No elaborate embroidery.
Three-quarter view facing LEFT, gaze slightly off-camera. Face horizontally centered. The top of the HAT is exactly 12% of canvas height from the top; the EYES sit at 38% canvas height. Leave enough breathing room above the hat. Head and shoulders fill the remaining lower canvas; do not include hands, chest-length body or props. Plain solid #E3D7BE background with extremely faint paper grain. No background scene, no border.
Avoid: ANY text, Chinese characters, seals, signatures, watermark, border; anime, 3D render, photography, glow, rim light, dramatic lighting, intricate jewelry; resemblance to any real actor or TV drama still; western crown, Japanese or Korean costume, fantasy.
Portrait 4:5, 1024x1280.
```

## 明制文官构图修订

- 标识：`official-mature-01-final`
- 源图：`art-source/official-mature-01.png`
- 参考：首版文官，仅作编辑目标

```text
Edit this portrait for strict game-avatar framing. Keep the SAME fictional Ming civil official identity, facial features, pose, costume colors, simple baimiao ink-outline flat-color style and plain #E3D7BE paper background. Change only composition and simplify grain: the eyes MUST lie on the horizontal line at 38% of total image height (not near 45%). Keep the top of the black hat at 12% of image height by making the hat noticeably lower and more compact vertically. Head and neck move upward accordingly, shoulders fill the lower area, crop just below shoulders. No hat or shoulder clipping. Faint paper grain only, no mottled texture. Three-quarter facing left, gaze off-camera. No text, characters, seals, signature, watermark, border, props, realism, glow. Output a single 4:5 portrait, 1024x1280.
```

## 明制后妃（常位）01

- 标识：`consort-regular-01`
- 源图：`art-source/consort-regular-01.png`
- 参考：定调文官，仅作画风与构图参考

```text
Use case: historical-scene. Asset type: one game character portrait. The attached official portrait is a STYLE AND FRAMING REFERENCE ONLY, not an identity to preserve.
One SINGLE adult Chinese woman, age 25, a regular-rank Ming-dynasty imperial consort. Simple Chinese baimiao ink line drawing with light flat color washes, matching the reference's clean restrained outlines, muted flat ochre/cinnabar/azurite/malachite/beige colors and minimal shading. Simplify costume to a few main folds, no intricate jewelry or embroidery.
Subject / face card: oval-long face with narrow rounded chin; low rounded hairline and a modest high Ming diji hair arrangement, NOT a queen's phoenix crown and not Qing two-wing hair; slender arched eyebrows, slightly downturned almond eyes; small straight nose and full softly closed lips; slender upright shoulders; pale warm skin; a tiny beauty mark beside the right eyebrow; thoughtful gentle expression, visibly an individual adult rather than an idealized generic beauty. Modest fully covered pale jade-green Ming ao jacket with ivory standing collar and muted rose inner collar; only collar and shoulders visible. Tiny simple gold hairpin, no dangling beads.
Head-and-shoulders cropped just below shoulders, THREE-QUARTER view facing RIGHT, gaze slightly off-camera. Face centered horizontally. Top of the HAIR at 12% canvas height. EYES sit precisely at 38% of total canvas height, so upper face is relatively high, consistent with reference. Plain solid #E3D7BE background, extremely faint paper grain. No props, setting, hands or frame.
Avoid: any text, seals, signatures, watermark, borders; anime, 3D, photography, glow, dramatic lighting; resemblance to a real actor or TV drama still; western, Japanese, Korean or Qing dress; exposed body or seductive pose.
Portrait 4:5, 1024x1280.
```

## 夜御案

- 标识：`desk-night`
- 源图：`art-source/desk-night.png`
- 参考：定调文官，仅作画风参考

```text
Use case: historical-scene. Asset type: game background illustration, key desk-night.
Chinese imperial writing desk at night, drawn in SIMPLE baimiao line art with light FLAT color washes, clean restrained ink contours, at most one muted shadow layer, faint paper grain. Match the accompanying portrait reference's illustrated atlas ink-and-flat-color medium, do not depict its person.
Scene: a broad dark wooden imperial desk, simple brush rack with three brushes, modest piles of CLOSED unmarked folded memorial booklets, plain stone paperweight, a small candle in an unadorned holder; behind, a latticed window with a glimpse of a red palace wall. No readable marks on paper or objects.
Time: night, overall VERY DARK brown close to #1C1714. ONLY a few subdued warm candle/palace-lantern colors close to #C8A35A, represented as simple flat warm areas, no radiant halo, no glow effects or realistic dramatic light.
Generic Chinese palace architecture, not an identifiable real building. Keep the important desk objects, candle and window lattice inside the central HORIZONTAL BAND between 30% and 70% of image height so a 4:1 chapter-header crop remains legible. Plenty of calm dark breathing space at the top and bottom. No people or human silhouettes in this scene.
Avoid: ANY text, calligraphy, characters, plaques with writing, seals, signatures, watermark, border; photorealism, 3D render, fantasy glow, complex light effects, ornate gold decoration, blood or battle.
Landscape 16:9, 1536x864.
```

## 朝会大殿

- 标识：`court`
- 源图：`art-source/court.png`
- 参考：夜御案，仅作画风参考

```text
Use case: historical-scene. Asset type: game background illustration, key court.
A generic Chinese imperial audience hall for court assembly, drawn in SIMPLE baimiao ink line art with light FLAT muted color washes on pale paper. Match the accompanying reference's clean restrained ink contours, simple geometric architectural shapes, muted cinnabar/ochre/ink-gray palette and at most one flat shading layer. This is an illustrated game atlas, not cinematic concept art.
Location: a spacious hall, a small EMPTY imperial throne on a distant low dais in the center, broad vermilion steps, modest plain screen behind it, red wooden columns and simplified bracket sets, two orderly rows of EMPTY court standing positions suggested by floor lines and small plain mats on either side of the central aisle. No people, no identifiable human figures. No ornate dragon sculptures or detailed filigree. All plaques and screens blank, no writing.
Time: daytime, pale even light, no strong sunbeams or lighting effects. Generic palace architecture, not a specific real monument. Symmetric wide perspective with generous calm space. Place the throne, steps and lower red columns inside the horizontal MIDDLE band from 30% to 70% of canvas height, for a later 4:1 header crop. Main details remain readable when reduced to a narrow strip. Do not add letterbox bars.
Avoid: ANY text, Chinese characters, plaques with writing, seals, signature, watermark, borders; people, actor likeness, photorealism, 3D render, fantasy glow, dramatic lighting, complex ornament, blood or battle.
Landscape 16:9, 1536x864.
```

## 批次 01–10 · 长相卡与实际提示词

### 批量眼位复检修订提示词（用于偏低批次，保持身份与服饰）

```text
Edit the attached 2x2 grid ONLY to correct portrait framing. Preserve the exact FOUR distinct people, their faces, facial hair, marks, clothing colors, directions and simple baimiao flat-color style. Keep the SAME even 2x2 grid and plain #E3D7BE backgrounds. Do not create or remove people.
In EACH cell, the eyes are currently too LOW. Move the whole face and head UP enough that the horizontal line through BOTH EYES is at 37.5% of that cell's height, never lower than 40%. Maintain anatomically natural faces and do not move eyes alone within the face. SHORTEN the tall cap vertically to keep the TOP of each cap at 12% of its cell height, while retaining true Ming front-low / rear-high shape and thin flat oval wings from the back.
On the whole approximately1122x1402 canvas this means top-row eye lines near y=263 and bottom-row eye lines near y=964; cap tops near y=84 and y=785. These are composition coordinates ONLY: DO NOT draw guides, rulers, lines, numbers or text. Faces move upward; compact hats fill less vertical space. Shoulders and robe continue naturally to the cell bottom. No borders, seals, signature or watermark. Single 4:5 canvas containing an unchanged equal 2x2 grid.
```

本轮限定10批，共新增34张池图：壮年文官15、老年文官10、武将4、宦官2、正位后妃3。首张壮年文官使用修订定调图。尾组不足四人的格子留空，避免生成清单外人物。五个池生成前，已逐对验证长相卡至少四个维度不同，且脸型或胡须 / 发际线不同。外貌是依角色而作的创作设定，不当作史实外貌证据。

### ming/official-mature 长相卡

| 编号 | 脸型 | 胡须或发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01 | broad square face | short separated moustache and small pointed goatee | thick straight eyebrows and narrow upturned eyes | broad nose and thin tightly closed lips | solid upright shoulders | weathered yellow-ochre skin | small mole on the left cheek | calm honest firmness |
| 02 | long rectangular face with full rounded cheeks and a soft double chin | dense full dark cheek-and-jaw beard joined to short moustache | fine level brows and large open eyes | long high nose and a broad soft mouth | distinctly plump broad shoulders and thick neck | pale warm skin | one deep vertical line between brows | warm patient kindness |
| 03 | full round face | thick straight moustache only | arched heavy brows and drooping eyelids | short rounded nose and full lips | plump rounded shoulders | sun-darkened brown skin | no facial mark and a smooth forehead | stern uncompromising resolve |
| 04 | narrow triangular face | three thin strands of a long beard | slanting long brows and small deep-set eyes | narrow hooked nose and tightly pursed lips | lean slightly stooped shoulders | cool pale skin | deep smile lines beside the mouth | quiet suspicion |
| 05 | wide cheekbones with a pointed chin | short neat full beard | bushy brows and wide-set round eyes | flat broad nose and small curved mouth | broad muscular shoulders | ruddy warm skin | a small mole near the right temple | bright scholarly curiosity |
| 06 | soft oval face | sparse forked chin beard | short sparse brows and hooded eyes | small straight nose and full softly closed lips | narrow delicate shoulders | olive-golden skin | clear cheek dimples | relaxed sociable ease |
| 07 | short broad face with a heavy jaw | heavy downturned moustache and cropped chin beard | high curved brows and very narrow eyes | large rounded nose and a wide thin mouth | stocky shoulders and thick neck | freckled tan skin | a broad crease above the nose | self-assured pride |
| 08 | very long thin face | long wispy beard | downturned brows and slightly tired eyes | long narrow nose and drooping mouth corners | thin neck and gently sloping shoulders | soft medium beige skin | a small age spot at the left jaw | tired but attentive patience |
| 09 | pear-shaped face with a broad lower jaw | short rough stubble | flat broad brows and a close-set steady gaze | high broad bridge and thick closed lips | solid upright shoulders | weathered yellow-ochre skin | several horizontal forehead creases | calm honest firmness |
| 10 | heart-shaped face and tapered chin | thin pencil moustache with no chin hair | uneven brows and long almond eyes | short wide nose and a compact thin mouth | slender straight shoulders | pale warm skin | a shallow dimple in the chin | warm patient kindness |
| 11 | broad diamond face | broad fan-shaped beard | strong angular brows and alert small eyes | large straight nose and pronounced upper lip | plump rounded shoulders | sun-darkened brown skin | one visible dark freckle below the right eye | stern uncompromising resolve |
| 12 | narrow oval face with hollow cheeks | small tuft directly under lower lip | soft curved brows and heavy lower eyelids | slender low nose and a long straight mouth | lean slightly stooped shoulders | cool pale skin | a pronounced crease at one mouth corner | quiet suspicion |
| 13 | high narrow forehead and square chin | pointed triangular beard and no moustache | straight fine brows and wide-set long eyes | narrow blunt nose and a broad lower lip | broad muscular shoulders | ruddy warm skin | a slightly uneven eyebrow edge | bright scholarly curiosity |
| 14 | round forehead and tapered jaw | sparse gray-flecked two long moustache tips and sparse gray chin hair | high sparse brows and compact round eyes | wide low bridge and sharply shaped lips | narrow delicate shoulders | olive-golden skin | clear crow-feet, forehead age lines, gray temples and faint nose freckles; visibly53years old | relaxed sociable ease |
| 15 | wide forehead and long straight jaw | close-cropped rounded beard | low heavy brows and a calm sideways gaze | long convex nose and a small tight mouth | stocky shoulders and thick neck | freckled tan skin | gray streaks at both temples | self-assured pride |
| 16 | short angular face with a small chin | sparse irregular cheek and chin hair | light short brows and deep-set downturned eyes | small pointed nose and slightly uneven lips | thin neck and gently sloping shoulders | soft medium beige skin | a small mole just beside the upper lip | tired but attentive patience |

### ming/official-old 长相卡

| 编号 | 脸型 | 胡须或发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01 | broad square face | gray-white short separated moustache and small pointed goatee | slanting long brows and small deep-set eyes | short rounded nose and full lips | solid upright shoulders | weathered yellow-ochre skin | age wrinkles; small mole on the left cheek | calm honest firmness |
| 02 | long rectangular face | clean-shaven with white temples | bushy brows and wide-set round eyes | narrow hooked nose and tightly pursed lips | slender straight shoulders | pale warm skin | age wrinkles; one deep vertical line between brows | warm patient kindness |
| 03 | full round face | gray-white thick straight moustache only | short sparse brows and hooded eyes | flat broad nose and small curved mouth | plump rounded shoulders | sun-darkened brown skin | age wrinkles; no facial mark and a smooth forehead | stern uncompromising resolve |
| 04 | narrow triangular face | gray-white three thin strands of a long beard | high curved brows and very narrow eyes | small straight nose and full softly closed lips | lean slightly stooped shoulders | cool pale skin | age wrinkles; deep smile lines beside the mouth | quiet suspicion |
| 05 | wide cheekbones with a pointed chin | gray-white short neat full beard | downturned brows and slightly tired eyes | large rounded nose and a wide thin mouth | broad muscular shoulders | ruddy warm skin | age wrinkles; a small mole near the right temple | bright scholarly curiosity |
| 06 | soft oval face | gray-white sparse forked chin beard | flat broad brows and a close-set steady gaze | long narrow nose and drooping mouth corners | narrow delicate shoulders | olive-golden skin | age wrinkles; clear cheek dimples | relaxed sociable ease |
| 07 | short broad face with a heavy jaw | gray-white heavy downturned moustache and cropped chin beard | uneven brows and long almond eyes | high broad bridge and thick closed lips | stocky shoulders and thick neck | freckled tan skin | age wrinkles; a broad crease above the nose | self-assured pride |
| 08 | very long thin face | gray-white long wispy beard | strong angular brows and alert small eyes | short wide nose and a compact thin mouth | thin neck and gently sloping shoulders | soft medium beige skin | age wrinkles; a small age spot at the left jaw | tired but attentive patience |
| 09 | pear-shaped face with a broad lower jaw | gray-white short rough stubble | soft curved brows and heavy lower eyelids | large straight nose and pronounced upper lip | solid upright shoulders | weathered yellow-ochre skin | age wrinkles; several horizontal forehead creases | calm honest firmness |
| 10 | heart-shaped face and tapered chin | gray-white thin pencil moustache with no chin hair | straight fine brows and wide-set long eyes | slender low nose and a long straight mouth | slender straight shoulders | pale warm skin | age wrinkles; a shallow dimple in the chin | warm patient kindness |

### ming/general-all 长相卡

| 编号 | 脸型 | 胡须或发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01 | broad square face | short separated moustache and small pointed goatee | thick straight brows and narrow upturned eyes | broad nose and thin tightly closed lips | solid upright shoulders | weathered yellow-ochre skin | short old scar across the left brow | calm honest firmness |
| 02 | long rectangular face | clean-shaven | fine level brows and large open eyes | long high nose and a broad soft mouth | slender straight shoulders | pale warm skin | faint healed scar on the right cheek | warm patient kindness |
| 03 | full round face | thick straight moustache only | arched heavy brows and drooping eyelids | short rounded nose and full lips | plump rounded shoulders | sun-darkened brown skin | small notch in the left eyebrow | stern uncompromising resolve |
| 04 | narrow triangular face | three thin strands of a long beard | slanting long brows and small deep-set eyes | narrow hooked nose and tightly pursed lips | lean slightly stooped shoulders | cool pale skin | dark mole beside the left ear | quiet suspicion |

### ming/eunuch-all 长相卡

| 编号 | 脸型 | 胡须或发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01 | broad square face | clean-shaven | thick straight brows and narrow upturned eyes | broad nose and thin tightly closed lips | solid upright shoulders | weathered yellow-ochre skin | small mole on the left cheek | calm honest firmness |
| 02 | long rectangular face | clean-shaven | fine level brows and large open eyes | long high nose and a broad soft mouth | slender straight shoulders | pale warm skin | one deep vertical line between brows | warm patient kindness |

### ming/consort-high 长相卡

| 编号 | 脸型 | 胡须或发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01 | broad oval face | low straight hairline; low compact bun under a small outlined Ming phoenix crown | thick gently curved eyebrows and wide almond eyes | broad straight nose and full firmly closed lips | full dignified shoulders | warm ivory skin | small mole under left eye | quiet authoritative composure |
| 02 | long narrow face | high rounded hairline; medium-height bun under a low simple Ming phoenix crown | fine level brows and long slightly downturned eyes | small high nose and thin soft lips | slender upright shoulders | pale beige skin | a shallow dimple beside the mouth | thoughtful reserve |
| 03 | round face with a short chin | widow peak hairline; high round bun with an airy outline of a Ming phoenix crown | short angular brows and large bright eyes | short rounded nose and broad small mouth | stocky graceful shoulders | soft golden tan skin | no marks, smooth cheeks | warm confident openness |

### batch-01 · ming/official-mature · 2–5

```text
Use case: game character portraits. A STRICT 2x2 GRID on a 1024x1280 portrait canvas, each cell exactly half the width and half the height (512x640), with narrow plain #E3D7BE gaps only. The four attached images are STYLE REFERENCES ONLY: official, consort and two scenes. Do NOT copy their identities or paint architecture into the portraits. Chinese baimiao line drawing with light FLAT muted color washes, clean ink outlines with gently varied weight, at most one faint shading layer, simplified costume with a few major folds. Palette ochre, cinnabar, azurite, malachite, beige and ink gray. Plain solid #E3D7BE background with extremely faint paper grain. Head-and-shoulders cropped just below shoulders, no hands or props. In EACH occupied cell: top of hat/hair is 12% from its cell top, both eyes exactly at 38% of cell height (allowed 36–40%), face horizontally centered, gaze slightly off-camera. Faces must be visibly unrelated individuals and readable as different people at 44px. All occupied cells: Ming-dynasty Chinese civil officials, mature adults aged 32–54, wearing a true Ming WUSHAMAO with LOW FRONT panel and distinctly HIGHER REAR crown; two THIN FLAT OVAL wings emerge from the BACK and extend horizontally. A stepped two-level cap, never a rounded bowler/fedora/top-hat dome with a continuous brim. Muted round-collar official robe; rank patch only a few simple suggestive strokes, no intricate embroidery.
Cell 1, TOP LEFT, facing LEFT: long rectangular face; clean-shaven; fine level brows and large open eyes; long high nose and a broad soft mouth; slender straight shoulders; pale warm skin; one deep vertical line between brows; warm patient kindness.
Cell 2, TOP RIGHT, facing RIGHT: full round face; thick straight moustache only; arched heavy brows and drooping eyelids; short rounded nose and full lips; plump rounded shoulders; sun-darkened brown skin; no facial mark and a smooth forehead; stern uncompromising resolve.
Cell 3, BOTTOM LEFT, facing RIGHT: narrow triangular face; three thin strands of a long beard; slanting long brows and small deep-set eyes; narrow hooked nose and tightly pursed lips; lean slightly stooped shoulders; cool pale skin; deep smile lines beside the mouth; quiet suspicion.
Cell 4, BOTTOM RIGHT, facing LEFT: wide cheekbones with a pointed chin; short neat full beard; bushy brows and wide-set round eyes; flat broad nose and small curved mouth; broad muscular shoulders; ruddy warm skin; a small mole near the right temple; bright scholarly curiosity.
All faces have DIFFERENT face shapes, facial hair/hairlines, eyebrows, eyes, noses, builds and expressions. No text, numbers, labels, seals, watermark, signatures, frames, anime, photography, 3D, glow, actor likeness, intricate embroidery or anachronistic court dress. Keep each head entirely within its own cell. Render an even grid with no tilt or perspective. 1024x1280.
```

### batch-02 · ming/official-mature · 6–9

```text
Use case: game character portraits. A STRICT 2x2 GRID on a 1024x1280 portrait canvas, each cell exactly half the width and half the height (512x640), with narrow plain #E3D7BE gaps only. The four attached images are STYLE REFERENCES ONLY: official, consort and two scenes. Do NOT copy their identities or paint architecture into the portraits. Chinese baimiao line drawing with light FLAT muted color washes, clean ink outlines with gently varied weight, at most one faint shading layer, simplified costume with a few major folds. Palette ochre, cinnabar, azurite, malachite, beige and ink gray. Plain solid #E3D7BE background with extremely faint paper grain. Head-and-shoulders cropped just below shoulders, no hands or props. In EACH occupied cell: top of hat/hair is 12% from its cell top, both eyes exactly at 38% of cell height (allowed 36–40%), face horizontally centered, gaze slightly off-camera. Faces must be visibly unrelated individuals and readable as different people at 44px. All occupied cells: Ming-dynasty Chinese civil officials, mature adults aged 32–54, wearing a true Ming WUSHAMAO with LOW FRONT panel and distinctly HIGHER REAR crown; two THIN FLAT OVAL wings emerge from the BACK and extend horizontally. A stepped two-level cap, never a rounded bowler/fedora/top-hat dome with a continuous brim. Muted round-collar official robe; rank patch only a few simple suggestive strokes, no intricate embroidery.
Cell 1, TOP LEFT, facing LEFT: soft oval face; sparse forked chin beard; short sparse brows and hooded eyes; small straight nose and full softly closed lips; narrow delicate shoulders; olive-golden skin; clear cheek dimples; relaxed sociable ease.
Cell 2, TOP RIGHT, facing RIGHT: short broad face with a heavy jaw; heavy downturned moustache and cropped chin beard; high curved brows and very narrow eyes; large rounded nose and a wide thin mouth; stocky shoulders and thick neck; freckled tan skin; a broad crease above the nose; self-assured pride.
Cell 3, BOTTOM LEFT, facing RIGHT: very long thin face; long wispy beard; downturned brows and slightly tired eyes; long narrow nose and drooping mouth corners; thin neck and gently sloping shoulders; soft medium beige skin; a small age spot at the left jaw; tired but attentive patience.
Cell 4, BOTTOM RIGHT, facing LEFT: pear-shaped face with a broad lower jaw; short rough stubble; flat broad brows and a close-set steady gaze; high broad bridge and thick closed lips; solid upright shoulders; weathered yellow-ochre skin; several horizontal forehead creases; calm honest firmness.
All faces have DIFFERENT face shapes, facial hair/hairlines, eyebrows, eyes, noses, builds and expressions. No text, numbers, labels, seals, watermark, signatures, frames, anime, photography, 3D, glow, actor likeness, intricate embroidery or anachronistic court dress. Keep each head entirely within its own cell. Render an even grid with no tilt or perspective. 1024x1280.
```

### batch-03 · ming/official-mature · 10–13

```text
Use case: game character portraits. A STRICT 2x2 GRID on a 1024x1280 portrait canvas, each cell exactly half the width and half the height (512x640), with narrow plain #E3D7BE gaps only. The four attached images are STYLE REFERENCES ONLY: official, consort and two scenes. Do NOT copy their identities or paint architecture into the portraits. Chinese baimiao line drawing with light FLAT muted color washes, clean ink outlines with gently varied weight, at most one faint shading layer, simplified costume with a few major folds. Palette ochre, cinnabar, azurite, malachite, beige and ink gray. Plain solid #E3D7BE background with extremely faint paper grain. Head-and-shoulders cropped just below shoulders, no hands or props. In EACH occupied cell: top of hat/hair at cell y=77px (12% of 640px); BOTH EYES on cell y=240px (37.5%), never below y=256px; compact, low-height cap silhouette so its rear crown fits BETWEEN y=77 and y=205, no excessively tall cap, face horizontally centered, gaze slightly off-camera. Faces must be visibly unrelated individuals and readable as different people at 44px. All occupied cells: Ming-dynasty Chinese civil officials, mature adults aged 32–54, wearing a true Ming WUSHAMAO with LOW FRONT panel and distinctly HIGHER REAR crown; two THIN FLAT OVAL wings emerge from the BACK and extend horizontally. A stepped two-level cap, never a rounded bowler/fedora/top-hat dome with a continuous brim. Muted round-collar official robe; rank patch only a few simple suggestive strokes, no intricate embroidery.
Cell 1, TOP LEFT, facing RIGHT (nose visibly pointing toward the RIGHT edge of its own cell, ear on the LEFT side of the face): heart-shaped face and tapered chin; thin pencil moustache with no chin hair; uneven brows and long almond eyes; short wide nose and a compact thin mouth; slender straight shoulders; pale warm skin; a shallow dimple in the chin; warm patient kindness.
Cell 2, TOP RIGHT, facing RIGHT (nose visibly pointing toward the RIGHT edge of its own cell, ear on the LEFT side of the face): broad diamond face; broad fan-shaped beard; strong angular brows and alert small eyes; large straight nose and pronounced upper lip; plump rounded shoulders; sun-darkened brown skin; one visible dark freckle below the right eye; stern uncompromising resolve.
Cell 3, BOTTOM LEFT, facing RIGHT (nose visibly pointing toward the RIGHT edge of its own cell, ear on the LEFT side of the face): narrow oval face with hollow cheeks; small tuft directly under lower lip; soft curved brows and heavy lower eyelids; slender low nose and a long straight mouth; lean slightly stooped shoulders; cool pale skin; a pronounced crease at one mouth corner; quiet suspicion.
Cell 4, BOTTOM RIGHT, facing RIGHT (nose visibly pointing toward the RIGHT edge of its own cell, ear on the LEFT side of the face): high narrow forehead and square chin; pointed triangular beard and no moustache; straight fine brows and wide-set long eyes; narrow blunt nose and a broad lower lip; broad muscular shoulders; ruddy warm skin; a slightly uneven eyebrow edge; bright scholarly curiosity.
All faces have DIFFERENT face shapes, facial hair/hairlines, eyebrows, eyes, noses, builds and expressions. No text, numbers, labels, seals, watermark, signatures, frames, anime, photography, 3D, glow, actor likeness, intricate embroidery or anachronistic court dress. Keep each head entirely within its own cell. Render an even grid with no tilt or perspective. 1024x1280.
```

### batch-04 · ming/official-mature · 14–16

```text
Use case: game character portraits. A STRICT 2x2 GRID on a 1024x1280 portrait canvas, each cell exactly half the width and half the height (512x640), with narrow plain #E3D7BE gaps only. The four attached images are STYLE REFERENCES ONLY: official, consort and two scenes. Do NOT copy their identities or paint architecture into the portraits. Chinese baimiao line drawing with light FLAT muted color washes, clean ink outlines with gently varied weight, at most one faint shading layer, simplified costume with a few major folds. Palette ochre, cinnabar, azurite, malachite, beige and ink gray. Plain solid #E3D7BE background with extremely faint paper grain. Head-and-shoulders cropped just below shoulders, no hands or props. In EACH occupied cell: top of hat/hair at cell y=77px (12% of 640px); BOTH EYES on cell y=240px (37.5%), never below y=256px; compact, low-height cap silhouette so its rear crown fits BETWEEN y=77 and y=205, no excessively tall cap, face horizontally centered, gaze slightly off-camera. Faces must be visibly unrelated individuals and readable as different people at 44px. All occupied cells: Ming-dynasty Chinese civil officials, mature adults aged 32–54, wearing a true Ming WUSHAMAO with LOW FRONT panel and distinctly HIGHER REAR crown; two THIN FLAT OVAL wings emerge from the BACK and extend horizontally. A stepped two-level cap, never a rounded bowler/fedora/top-hat dome with a continuous brim. Muted round-collar official robe; rank patch only a few simple suggestive strokes, no intricate embroidery.
Cell 1, TOP LEFT, facing RIGHT (nose visibly pointing toward the RIGHT edge of its own cell, ear on the LEFT side of the face): round forehead and tapered jaw; two long separate moustache tips and bare chin; high sparse brows and compact round eyes; wide low bridge and sharply shaped lips; narrow delicate shoulders; olive-golden skin; faint freckles across the nose; relaxed sociable ease.
Cell 2, TOP RIGHT, facing RIGHT (nose visibly pointing toward the RIGHT edge of its own cell, ear on the LEFT side of the face): wide forehead and long straight jaw; close-cropped rounded beard; low heavy brows and a calm sideways gaze; long convex nose and a small tight mouth; stocky shoulders and thick neck; freckled tan skin; gray streaks at both temples; self-assured pride.
Cell 3, BOTTOM LEFT, facing LEFT (nose visibly pointing LEFT): short angular face with a small chin; sparse irregular cheek and chin hair; light short brows and deep-set downturned eyes; small pointed nose and slightly uneven lips; thin neck and gently sloping shoulders; soft medium beige skin; a small mole just beside the upper lip; tired but attentive patience.
IMPORTANT: Cell 4 (bottom right) MUST remain EMPTY plain #E3D7BE paper, no person or object. Do not generate any additional face.
All faces have DIFFERENT face shapes, facial hair/hairlines, eyebrows, eyes, noses, builds and expressions. No text, numbers, labels, seals, watermark, signatures, frames, anime, photography, 3D, glow, actor likeness, intricate embroidery or anachronistic court dress. Keep each head entirely within its own cell. Render an even grid with no tilt or perspective. 1024x1280.
```

### batch-05 · ming/official-old · 1–4

```text
Use case: game character portraits. A STRICT 2x2 GRID on a 1024x1280 portrait canvas, each cell exactly half the width and half the height (512x640), with narrow plain #E3D7BE gaps only. The four attached images are STYLE REFERENCES ONLY: official, consort and two scenes. Do NOT copy their identities or paint architecture into the portraits. Chinese baimiao line drawing with light FLAT muted color washes, clean ink outlines with gently varied weight, at most one faint shading layer, simplified costume with a few major folds. Palette ochre, cinnabar, azurite, malachite, beige and ink gray. Plain solid #E3D7BE background with extremely faint paper grain. Head-and-shoulders cropped just below shoulders, no hands or props. In EACH occupied cell: top of hat/hair at cell y=77px (12% of 640px); BOTH EYES on cell y=240px (37.5%), never below y=256px; compact, low-height cap silhouette so its rear crown fits BETWEEN y=77 and y=205, no excessively tall cap, face horizontally centered, gaze slightly off-camera. Faces must be visibly unrelated individuals and readable as different people at 44px. All occupied cells: Ming-dynasty Chinese civil officials aged 56–76, wearing a true Ming WUSHAMAO with LOW FRONT panel and distinctly HIGHER REAR crown; two THIN FLAT OVAL wings emerge from the BACK and extend horizontally. A stepped two-level cap, never a rounded bowler/fedora/top-hat dome with a continuous brim. Muted round-collar official robe; rank patch only a few simple suggestive strokes, no intricate embroidery.
Cell 1, TOP LEFT, facing LEFT: broad square face; gray-white short separated moustache and small pointed goatee; slanting long brows and small deep-set eyes; short rounded nose and full lips; solid upright shoulders; weathered yellow-ochre skin; age wrinkles; small mole on the left cheek; calm honest firmness.
Cell 2, TOP RIGHT, facing RIGHT: long rectangular face; clean-shaven with white temples; bushy brows and wide-set round eyes; narrow hooked nose and tightly pursed lips; slender straight shoulders; pale warm skin; age wrinkles; one deep vertical line between brows; warm patient kindness.
Cell 3, BOTTOM LEFT, facing RIGHT: full round face; gray-white thick straight moustache only; short sparse brows and hooded eyes; flat broad nose and small curved mouth; plump rounded shoulders; sun-darkened brown skin; age wrinkles; no facial mark and a smooth forehead; stern uncompromising resolve.
Cell 4, BOTTOM RIGHT, facing LEFT: narrow triangular face; gray-white three thin strands of a long beard; high curved brows and very narrow eyes; small straight nose and full softly closed lips; lean slightly stooped shoulders; cool pale skin; age wrinkles; deep smile lines beside the mouth; quiet suspicion.
All faces have DIFFERENT face shapes, facial hair/hairlines, eyebrows, eyes, noses, builds and expressions. No text, numbers, labels, seals, watermark, signatures, frames, anime, photography, 3D, glow, actor likeness, intricate embroidery or anachronistic court dress. Keep each head entirely within its own cell. Render an even grid with no tilt or perspective. 1024x1280.
```

### batch-06 · ming/official-old · 5–8

```text
Use case: game character portraits. A STRICT 2x2 GRID on a 1024x1280 portrait canvas, each cell exactly half the width and half the height (512x640), with narrow plain #E3D7BE gaps only. The four attached images are STYLE REFERENCES ONLY: official, consort and two scenes. Do NOT copy their identities or paint architecture into the portraits. Chinese baimiao line drawing with light FLAT muted color washes, clean ink outlines with gently varied weight, at most one faint shading layer, simplified costume with a few major folds. Palette ochre, cinnabar, azurite, malachite, beige and ink gray. Plain solid #E3D7BE background with extremely faint paper grain. Head-and-shoulders cropped just below shoulders, no hands or props. In EACH occupied cell: top of hat/hair at cell y=77px (12% of 640px); BOTH EYES on cell y=240px (37.5%), never below y=256px; compact, low-height cap silhouette so its rear crown fits BETWEEN y=77 and y=205, no excessively tall cap, face horizontally centered, gaze slightly off-camera. Faces must be visibly unrelated individuals and readable as different people at 44px. All occupied cells: Ming-dynasty Chinese civil officials aged 56–76, wearing a true Ming WUSHAMAO with LOW FRONT panel and distinctly HIGHER REAR crown; two THIN FLAT OVAL wings emerge from the BACK and extend horizontally. A stepped two-level cap, never a rounded bowler/fedora/top-hat dome with a continuous brim. Muted round-collar official robe; rank patch only a few simple suggestive strokes, no intricate embroidery.
Cell 1, TOP LEFT, facing LEFT: wide cheekbones with a pointed chin; gray-white short neat full beard; downturned brows and slightly tired eyes; large rounded nose and a wide thin mouth; broad muscular shoulders; ruddy warm skin; age wrinkles; a small mole near the right temple; bright scholarly curiosity.
Cell 2, TOP RIGHT, facing RIGHT: soft oval face; gray-white sparse forked chin beard; flat broad brows and a close-set steady gaze; long narrow nose and drooping mouth corners; narrow delicate shoulders; olive-golden skin; age wrinkles; clear cheek dimples; relaxed sociable ease.
Cell 3, BOTTOM LEFT, facing RIGHT: short broad face with a heavy jaw; gray-white heavy downturned moustache and cropped chin beard; uneven brows and long almond eyes; high broad bridge and thick closed lips; stocky shoulders and thick neck; freckled tan skin; age wrinkles; a broad crease above the nose; self-assured pride.
Cell 4, BOTTOM RIGHT, facing LEFT: very long thin face; gray-white long wispy beard; strong angular brows and alert small eyes; short wide nose and a compact thin mouth; thin neck and gently sloping shoulders; soft medium beige skin; age wrinkles; a small age spot at the left jaw; tired but attentive patience.
All faces have DIFFERENT face shapes, facial hair/hairlines, eyebrows, eyes, noses, builds and expressions. No text, numbers, labels, seals, watermark, signatures, frames, anime, photography, 3D, glow, actor likeness, intricate embroidery or anachronistic court dress. Keep each head entirely within its own cell. Render an even grid with no tilt or perspective. 1024x1280.
```

### batch-07 · ming/official-old · 9–10

```text
Use case: game character portraits. A STRICT 2x2 GRID on a 1024x1280 portrait canvas, each cell exactly half the width and half the height (512x640), with narrow plain #E3D7BE gaps only. The four attached images are STYLE REFERENCES ONLY: official, consort and two scenes. Do NOT copy their identities or paint architecture into the portraits. Chinese baimiao line drawing with light FLAT muted color washes, clean ink outlines with gently varied weight, at most one faint shading layer, simplified costume with a few major folds. Palette ochre, cinnabar, azurite, malachite, beige and ink gray. Plain solid #E3D7BE background with extremely faint paper grain. Head-and-shoulders cropped just below shoulders, no hands or props. In EACH occupied cell: top of hat/hair at cell y=77px (12% of 640px); BOTH EYES on cell y=240px (37.5%), never below y=256px; compact, low-height cap silhouette so its rear crown fits BETWEEN y=77 and y=205, no excessively tall cap, face horizontally centered, gaze slightly off-camera. Faces must be visibly unrelated individuals and readable as different people at 44px. All occupied cells: Ming-dynasty Chinese civil officials aged 56–76, wearing a true Ming WUSHAMAO with LOW FRONT panel and distinctly HIGHER REAR crown; two THIN FLAT OVAL wings emerge from the BACK and extend horizontally. A stepped two-level cap, never a rounded bowler/fedora/top-hat dome with a continuous brim. Muted round-collar official robe; rank patch only a few simple suggestive strokes, no intricate embroidery.
Cell 1, TOP LEFT, facing LEFT: pear-shaped face with a broad lower jaw; gray-white short rough stubble; soft curved brows and heavy lower eyelids; large straight nose and pronounced upper lip; solid upright shoulders; weathered yellow-ochre skin; age wrinkles; several horizontal forehead creases; calm honest firmness.
Cell 2, TOP RIGHT, facing RIGHT: heart-shaped face and tapered chin; gray-white thin pencil moustache with no chin hair; straight fine brows and wide-set long eyes; slender low nose and a long straight mouth; slender straight shoulders; pale warm skin; age wrinkles; a shallow dimple in the chin; warm patient kindness.
IMPORTANT: Cell 3 (bottom left) MUST remain EMPTY plain #E3D7BE paper, no person or object, Cell 4 (bottom right) MUST remain EMPTY plain #E3D7BE paper, no person or object. Do not generate any additional face.
All faces have DIFFERENT face shapes, facial hair/hairlines, eyebrows, eyes, noses, builds and expressions. No text, numbers, labels, seals, watermark, signatures, frames, anime, photography, 3D, glow, actor likeness, intricate embroidery or anachronistic court dress. Keep each head entirely within its own cell. Render an even grid with no tilt or perspective. 1024x1280.
```

### batch-08 · ming/general-all · 1–4

```text
Use case: game character portraits. A STRICT 2x2 GRID on a 1024x1280 portrait canvas, each cell exactly half the width and half the height (512x640), with narrow plain #E3D7BE gaps only. The four attached images are STYLE REFERENCES ONLY: official, consort and two scenes. Do NOT copy their identities or paint architecture into the portraits. Chinese baimiao line drawing with light FLAT muted color washes, clean ink outlines with gently varied weight, at most one faint shading layer, simplified costume with a few major folds. Palette ochre, cinnabar, azurite, malachite, beige and ink gray. Plain solid #E3D7BE background with extremely faint paper grain. Head-and-shoulders cropped just below shoulders, no hands or props. In EACH occupied cell: top of hat/hair at cell y=77px (12% of 640px); BOTH EYES on cell y=240px (37.5%), never below y=256px; compact, low-height cap silhouette so its rear crown fits BETWEEN y=77 and y=205, no excessively tall cap, face horizontally centered, gaze slightly off-camera. Faces must be visibly unrelated individuals and readable as different people at 44px. All occupied cells: Ming-dynasty Chinese military commanders, adults aged 32–56, wearing Ming phoenix-wing helmets and simply drawn lamellar armor at neck and shoulders; no weapons, battle or injuries beyond the tiny healed facial mark on each card.
Cell 1, TOP LEFT, facing LEFT: broad square face; short separated moustache and small pointed goatee; thick straight brows and narrow upturned eyes; broad nose and thin tightly closed lips; solid upright shoulders; weathered yellow-ochre skin; short old scar across the left brow; calm honest firmness.
Cell 2, TOP RIGHT, facing RIGHT: long rectangular face; clean-shaven; fine level brows and large open eyes; long high nose and a broad soft mouth; slender straight shoulders; pale warm skin; faint healed scar on the right cheek; warm patient kindness.
Cell 3, BOTTOM LEFT, facing RIGHT: full round face; thick straight moustache only; arched heavy brows and drooping eyelids; short rounded nose and full lips; plump rounded shoulders; sun-darkened brown skin; small notch in the left eyebrow; stern uncompromising resolve.
Cell 4, BOTTOM RIGHT, facing LEFT: narrow triangular face; three thin strands of a long beard; slanting long brows and small deep-set eyes; narrow hooked nose and tightly pursed lips; lean slightly stooped shoulders; cool pale skin; dark mole beside the left ear; quiet suspicion.
All faces have DIFFERENT face shapes, facial hair/hairlines, eyebrows, eyes, noses, builds and expressions. No text, numbers, labels, seals, watermark, signatures, frames, anime, photography, 3D, glow, actor likeness, intricate embroidery or anachronistic court dress. Keep each head entirely within its own cell. Render an even grid with no tilt or perspective. 1024x1280.
```

### batch-09 · ming/eunuch-all · 1–2

```text
Use case: game character portraits. A STRICT 2x2 GRID on a 1024x1280 portrait canvas, each cell exactly half the width and half the height (512x640), with narrow plain #E3D7BE gaps only. The four attached images are STYLE REFERENCES ONLY: official, consort and two scenes. Do NOT copy their identities or paint architecture into the portraits. Chinese baimiao line drawing with light FLAT muted color washes, clean ink outlines with gently varied weight, at most one faint shading layer, simplified costume with a few major folds. Palette ochre, cinnabar, azurite, malachite, beige and ink gray. Plain solid #E3D7BE background with extremely faint paper grain. Head-and-shoulders cropped just below shoulders, no hands or props. In EACH occupied cell: top of hat/hair at cell y=77px (12% of 640px); BOTH EYES on cell y=240px (37.5%), never below y=256px; compact, low-height cap silhouette so its rear crown fits BETWEEN y=77 and y=205, no excessively tall cap, face horizontally centered, gaze slightly off-camera. Faces must be visibly unrelated individuals and readable as different people at 44px. All occupied cells: Ming-dynasty Chinese court eunuchs, adults aged 35–52, wearing simple Ming yesā / yesa service robe with crossed collar, modest black gauze service cap, no official side wings, no beard, no Qing topknot or Western hat.
Cell 1, TOP LEFT, facing LEFT: broad square face; clean-shaven; thick straight brows and narrow upturned eyes; broad nose and thin tightly closed lips; solid upright shoulders; weathered yellow-ochre skin; small mole on the left cheek; calm honest firmness.
Cell 2, TOP RIGHT, facing RIGHT: long rectangular face; clean-shaven; fine level brows and large open eyes; long high nose and a broad soft mouth; slender straight shoulders; pale warm skin; one deep vertical line between brows; warm patient kindness.
IMPORTANT: Cell 3 (bottom left) MUST remain EMPTY plain #E3D7BE paper, no person or object, Cell 4 (bottom right) MUST remain EMPTY plain #E3D7BE paper, no person or object. Do not generate any additional face.
All faces have DIFFERENT face shapes, facial hair/hairlines, eyebrows, eyes, noses, builds and expressions. No text, numbers, labels, seals, watermark, signatures, frames, anime, photography, 3D, glow, actor likeness, intricate embroidery or anachronistic court dress. Keep each head entirely within its own cell. Render an even grid with no tilt or perspective. 1024x1280.
```

### batch-10 · ming/consort-high · 1–3

```text
Use case: game character portraits. A STRICT 2x2 GRID on a 1024x1280 portrait canvas, each cell exactly half the width and half the height (512x640), with narrow plain #E3D7BE gaps only. The four attached images are STYLE REFERENCES ONLY: official, consort and two scenes. Do NOT copy their identities or paint architecture into the portraits. Chinese baimiao line drawing with light FLAT muted color washes, clean ink outlines with gently varied weight, at most one faint shading layer, simplified costume with a few major folds. Palette ochre, cinnabar, azurite, malachite, beige and ink gray. Plain solid #E3D7BE background with extremely faint paper grain. Head-and-shoulders cropped just below shoulders, no hands or props. In EACH occupied cell: top of hat/hair at cell y=77px (12% of 640px); BOTH EYES on cell y=240px (37.5%), never below y=256px; compact, low-height cap silhouette so its rear crown fits BETWEEN y=77 and y=205, no excessively tall cap, face horizontally centered, gaze slightly off-camera. Faces must be visibly unrelated individuals and readable as different people at 44px. All occupied cells: Ming-dynasty Chinese high-ranking imperial consorts, adults aged 26–39, wearing simplified Ming phoenix crowns as a few clean outline strokes, compact buns; Ming standing-collar or crossed-collar AO jackets, fully covered shoulders. No generic round-neck shirt, no Qing two-wing hair, no dangling bead curtains or intricate jewelry.
Cell 1, TOP LEFT, facing LEFT: broad oval face; low straight hairline; low compact bun under a small outlined Ming phoenix crown; thick gently curved eyebrows and wide almond eyes; broad straight nose and full firmly closed lips; full dignified shoulders; warm ivory skin; small mole under left eye; quiet authoritative composure.
Cell 2, TOP RIGHT, facing RIGHT: long narrow face; high rounded hairline; medium-height bun under a low simple Ming phoenix crown; fine level brows and long slightly downturned eyes; small high nose and thin soft lips; slender upright shoulders; pale beige skin; a shallow dimple beside the mouth; thoughtful reserve.
Cell 3, BOTTOM LEFT, facing RIGHT: round face with a short chin; widow peak hairline; high round bun with an airy outline of a Ming phoenix crown; short angular brows and large bright eyes; short rounded nose and broad small mouth; stocky graceful shoulders; soft golden tan skin; no marks, smooth cheeks; warm confident openness.
IMPORTANT: Cell 4 (bottom right) MUST remain EMPTY plain #E3D7BE paper, no person or object. Do not generate any additional face.
All faces have DIFFERENT face shapes, facial hair/hairlines, eyebrows, eyes, noses, builds and expressions. No text, numbers, labels, seals, watermark, signatures, frames, anime, photography, 3D, glow, actor likeness, intricate embroidery or anachronistic court dress. Keep each head entirely within its own cell. Render an even grid with no tilt or perspective. 1024x1280.
```

## 第7–10批复检修订提示词

### batch-07 修订

```text
Edit the attached 2x2 grid ONLY to correct portrait framing. Preserve the exact TWO distinct people, their faces, facial hair, marks, clothing colors, directions and simple baimiao flat-color style. Keep the SAME even 2x2 grid and plain #E3D7BE backgrounds. Do not create or remove people.
In EACH cell, the eyes are currently too LOW. Move the whole face and head UP enough that the horizontal line through BOTH EYES is at 37.5% of that cell's height, never lower than 40%. Maintain anatomically natural faces and do not move eyes alone within the face. SHORTEN the tall cap vertically to keep the TOP of each cap at 12% of its cell height, while retaining true Ming front-low / rear-high shape and thin flat oval wings from the back.
On the whole approximately1122x1402 canvas this means top-row eye lines near y=263 and bottom-row eye lines near y=964; cap tops near y=84 and y=785. These are composition coordinates ONLY: DO NOT draw guides, rulers, lines, numbers or text. Faces move upward; compact hats fill less vertical space. Shoulders and robe continue naturally to the cell bottom. No borders, seals, signature or watermark. Single 4:5 canvas containing an unchanged equal 2x2 grid. Only cells 1 and 2 contain people. Cells 3 and 4 MUST stay blank.
```

### batch-08 修订

```text
Edit the attached 2x2 grid of FOUR Ming military commanders. Keep all four faces, facial hair, scars, orientations and simple baimiao flat-color style. Their black civil-service hats are WRONG: REMOVE every black gauze cap and every horizontal oval hat wing. Replace each with a Ming PHOENIX-WING METAL HELMET: a low rounded dull steel/brass crown with a narrow raised central ridge and TWO short upward-swept phoenix-wing metal plates attached at the temples, with simple neck plates. It must look like armor, absolutely not a scholar's wushamao. Preserve the lamellar shoulder armor. No weapons or battle.
Also reframe each portrait so both eyes are at 37.5% of its cell height (within36–40%), head centered. Top of helmet at12%. Use compact helmets, no tall plume. Keep a strict equal 2x2 grid, plain #E3D7BE gaps and backgrounds, heads and shoulders only. No text, guides, seals, watermark or border. Preserve all four distinct identities. 1024x1280.
```

### batch-09 修订

```text
Edit the attached 2x2 grid containing exactly TWO Ming court eunuchs in the top two cells and EMPTY paper in the bottom two cells. Preserve their distinct faces, fully clean-shaven cheeks, modest gauze service caps WITHOUT side wings, crossed-collar yesā service robes, directions, colors and baimiao flat washes. Correct framing ONLY: move each whole face and head upward so both eyes are at37.5% of its cell height, within36–40%; top of service cap at12%. Keep cap compact, shoulders fill lower portion. Maintain equal2x2 grid, do not generate people in the empty bottom cells. Plain #E3D7BE paper, no text, guide lines, numbers, seals, signature or watermark. 1024x1280.
```

### batch-10 修订

```text
Edit the attached 2x2 grid containing exactly THREE distinct Ming high-ranking consorts; bottom-right cell is EMPTY plain paper. Preserve their different faces, hairlines, small phoenix crowns, hairstyles, mature dignified expressions, Ming standing/crossed-collar ao jackets, clothing colors and baimiao flat washes. Correct framing ONLY: move each whole face and head upward so both eyes are at37.5% of its own cell height, within36–40%; top of crown at12%. Slightly reduce the crown/bun height as needed without changing the small simplified Ming phoenix-crown shape. Shoulders fill lower portion. Maintain an equal2x2 grid, do not generate a fourth person. Plain #E3D7BE background and gaps, no text, guides, numbers, seals, signature or watermark. 1024x1280.
```

## 批次11–20 · 长相卡与实际提示词

按追加授权继续10批，共新增24张：明制常位后妃7、太后1、皇帝青老各2、皇子少成各2、公主少成各2、共用青年士子4。生成前逐对验证至少四维差异，脸型或胡须 / 发际线不同。所有儿童按真实年龄面貌和端庄衣着绘制。

### ming/consort-regular 长相卡

| 编号 | 脸型 | 胡须或发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01 | long oval face with a narrow rounded chin | low rounded hairline; compact round Ming jiuji bun with one small gold hairpin | slender arched brows and slightly downturned almond eyes | small straight nose and full softly closed lips | slender upright shoulders | pale warm skin | tiny beauty mark beside the right eyebrow | thoughtful gentle expression |
| 02 | soft oval face | high arched hairline; low compact bun under a small Ming hair crown | soft long curved feminine brows and small gently hooded almond eyes | long narrow nose and drooping mouth corners | plump rounded shoulders | sun-darkened brown skin | a broad crease above the nose | stern uncompromising resolve |
| 03 | short broad face with a heavy jaw | straight low hairline; twin small rounded bun loops under a tiny hair crown | short fine softly arched feminine brows and soft hooded eyes | short wide nose and a compact thin mouth | lean slightly stooped shoulders | cool pale skin | several horizontal forehead creases | quiet suspicion |
| 04 | very long thin face | widow-peak hairline; medium-height round jiuji bun | downturned brows and slightly tired eyes | slender low nose and a long straight mouth | broad muscular shoulders | ruddy warm skin | one visible dark freckle below the right eye | bright scholarly curiosity |
| 05 | pear-shaped face with a broad lower jaw | soft M-shaped hairline; small low rear bun with a plain gold pin | uneven brows and long almond eyes | wide low bridge and sharply shaped lips | narrow delicate shoulders | olive-golden skin | a slightly uneven eyebrow edge | relaxed sociable ease |
| 06 | heart-shaped face and tapered chin | rounded high forehead; a compact oval bun with a low Ming hair crown | soft curved feminine brows and rounder gently lowered almond eyes | small pointed nose and slightly uneven lips | stocky shoulders and thick neck | freckled tan skin | gray streaks at both temples | self-assured pride |
| 07 | broad diamond face | low curved hairline; two small side buns joined at the rear | high sparse brows and compact round eyes | long high nose and a broad soft mouth | thin neck and gently sloping shoulders | soft medium beige skin | small mole on the left cheek | tired but attentive patience |
| 08 | narrow oval face with hollow cheeks | angled hairline at the temples; neat low round jiuji bun | light short brows and deep-set downturned eyes | narrow hooked nose and tightly pursed lips | solid upright shoulders | weathered yellow-ochre skin | no facial mark and a smooth forehead | calm honest firmness |

### ming/dowager-all 长相卡

| 编号 | 脸型 | 胡须或发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01 | wide oval face with a firm rounded chin | graying hair at a low rounded hairline; compact bun and modest small Ming ceremonial crown | short strong brows and small hooded eyes with clear age lines | straight broad nose and thin firmly closed lips | full upright shoulders | pale golden skin with age spots | deep smile lines and a fine vertical brow crease | patient authority and restrained warmth |

### ming/emperor-young 长相卡

| 编号 | 脸型 | 胡须或发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01 | narrow triangular face | three thin strands of a long beard | slanting long brows and small deep-set eyes | narrow hooked nose and tightly pursed lips | lean slightly stooped shoulders | cool pale skin | deep smile lines beside the mouth | quiet suspicion |
| 02 | broad diamond face | broad fan-shaped beard | strong angular brows and alert small eyes | large straight nose and pronounced upper lip | plump rounded shoulders | sun-darkened brown skin | one visible dark freckle below the right eye | stern uncompromising resolve |

### ming/emperor-old 长相卡

| 编号 | 脸型 | 胡须或发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01 | wide cheekbones with a pointed chin | gray-white short neat full beard | downturned brows and slightly tired eyes | large rounded nose and a wide thin mouth | broad muscular shoulders | ruddy warm skin | age wrinkles; a small mole near the right temple | bright scholarly curiosity |
| 02 | narrow oval face with hollow cheeks | gray-white small tuft directly under lower lip | low heavy brows and a calm sideways gaze | wide low bridge and sharply shaped lips | lean slightly stooped shoulders | cool pale skin | age wrinkles; a pronounced crease at one mouth corner | quiet suspicion |

### ming/prince-teen 长相卡

| 编号 | 脸型 | 胡须或发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01 | round child face, soft cheeks and a short small chin, visibly8years old | clean-shaven, child hair tied under a small plain Ming princely crown | thick straight brows and large wide-set curious eyes | small round nose and full gently closed lips | small rounded child shoulders | warm ivory skin | a shallow cheek dimple | open curious attention |
| 02 | longer adolescent oval face with a narrow chin, visibly14years old | clean-shaven, tidy topknot under a low plain Ming princely crown | fine slanted brows and narrow slightly downturned eyes | small high nose and a compact thin mouth | slender adolescent shoulders | soft golden tan skin | one small freckle near left temple | shy cautious reserve |

### ming/prince-adult 长相卡

| 编号 | 脸型 | 胡须或发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01 | soft oval face | clean-shaven; neat tied hair under a small Ming princely crown | short sparse brows and hooded eyes | small straight nose and full softly closed lips | narrow delicate shoulders | olive-golden skin | clear cheek dimples | relaxed sociable ease |
| 02 | pear-shaped face with a broad lower jaw | clean-shaven; neat tied hair under a small Ming princely crown | flat broad brows and a close-set steady gaze | high broad bridge and thick closed lips | solid upright shoulders | weathered yellow-ochre skin | several horizontal forehead creases | calm honest firmness |

### ming/princess-teen 长相卡

| 编号 | 脸型 | 胡须或发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01 | full round child face with chubby cheeks, visibly8years old | rounded low child hairline and two small symmetrical Ming girl buns | short soft brows and large bright eyes | small low nose and a full tiny mouth | small soft child shoulders | warm pale beige skin | small cheek dimple | quiet playful curiosity |
| 02 | slender oval adolescent face with a short chin, visibly14years old | high curved hairline and a low compact braided Ming girl bun with one plain pin | fine level brows and long gently downturned eyes | small straight nose and thin closed lips | thin adolescent shoulders | pale olive skin | a tiny freckle beside the right brow | thoughtful shy composure |

### ming/princess-adult 长相卡

| 编号 | 脸型 | 胡须或发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01 | short broad face with a heavy jaw | straight low hairline; twin small rounded bun loops under a tiny hair crown | short fine softly arched feminine brows and soft hooded almond eyes | short wide nose and a compact thin mouth | lean slightly stooped shoulders | cool pale skin | tiny mole near left outer brow; smooth youthful forehead, no age wrinkles | quiet suspicion |
| 02 | heart-shaped face and tapered chin | rounded high forehead; a compact oval bun with a low Ming hair crown | soft curved brows and heavy lower eyelids | small pointed nose and slightly uneven lips | stocky shoulders and thick neck | freckled tan skin | gray streaks at both temples | self-assured pride |

### shared/scholar-young 长相卡

| 编号 | 脸型 | 胡须或发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01 | long rectangular face | fully clean-shaven; soft folded cloth rujin only | fine level brows and large open eyes | long high nose and a broad soft mouth | slender straight shoulders | pale warm skin | one deep vertical line between brows | warm patient kindness |
| 02 | wide cheekbones with a pointed chin | clean-shaven; neat tied hair under a small Ming princely crown | bushy brows and wide-set round eyes | flat broad nose and small curved mouth | broad muscular shoulders | ruddy warm skin | a small mole near the right temple | bright scholarly curiosity |
| 03 | short broad face with a heavy jaw | heavy downturned moustache and cropped chin beard | high curved brows and very narrow eyes | large rounded nose and a wide thin mouth | stocky shoulders and thick neck | freckled tan skin | a broad crease above the nose | self-assured pride |
| 04 | broad square face with wide heavy lower jaw | short dense rounded full cheek-and-chin beard with small joined moustache; soft cloth rujin | straight fine brows and wide-set long eyes | narrow blunt nose and a broad lower lip | very stocky broad shoulders and thick neck | deep warm brown tan skin | a slightly uneven eyebrow edge | bright scholarly curiosity |

### batch-11 · ming/consort-regular · 2–5

```text
Use case: game character portraits. STRICT EVEN2x2 GRID on a1024x1280 portrait canvas, each cell512x640, narrow plain #E3D7BE gaps. The FOUR attached images are STYLE REFERENCES ONLY, not identities or costumes to copy. DO NOT paint scenery. Chinese baimiao line drawing with light FLAT muted color washes, clean ink outlines with gently varied weight, at most one faint shading layer, simplified costume with a few major folds. Palette ochre, cinnabar, azurite, malachite, beige and ink gray. Plain solid #E3D7BE background with extremely faint paper grain. Head-and-shoulders cropped just below shoulders, no hands or props. In EACH occupied cell: top of hat/hair is 12% from its cell top, both eyes exactly at 38% of cell height (allowed 36–40%), face horizontally centered, gaze slightly off-camera. Faces must be visibly unrelated individuals and readable as different people at 44px. All occupied cells: adult Chinese Ming regular-rank consorts, ages20–38, wearing Compact round Ming JIUJI buns or small Ming hair crowns. A clearly Ming standing-collar or crossed-collar AO JACKET in muted jade, blue, rose or ochre, fully covered shoulders. Never a generic round-neck shirt, never Qing hair or clothing; one simple gold hairpin, no elaborate jewels.
GEOMETRY: in every occupied cell, eye line must be at y=240px (37.5% of640), never below256px. Top of hair/crown at y=77px (12%); choose COMPACT headwear to leave space for eyes high in frame. Only head, neck and shoulders, no long upper body.
Cell1, TOP LEFT, facingLEFT: soft oval face; high arched hairline; low compact bun under a small Ming hair crown; slanting long brows and small deep-set eyes; long narrow nose and drooping mouth corners; plump rounded shoulders; sun-darkened brown skin; a broad crease above the nose; stern uncompromising resolve.
Cell2, TOP RIGHT, facingRIGHT: short broad face with a heavy jaw; straight low hairline; twin small rounded bun loops under a tiny hair crown; short sparse brows and hooded eyes; short wide nose and a compact thin mouth; lean slightly stooped shoulders; cool pale skin; several horizontal forehead creases; quiet suspicion.
Cell3, BOTTOM LEFT, facingRIGHT: very long thin face; widow-peak hairline; medium-height round jiuji bun; downturned brows and slightly tired eyes; slender low nose and a long straight mouth; broad muscular shoulders; ruddy warm skin; one visible dark freckle below the right eye; bright scholarly curiosity.
Cell4, BOTTOM RIGHT, facingLEFT: pear-shaped face with a broad lower jaw; soft M-shaped hairline; small low rear bun with a plain gold pin; uneven brows and long almond eyes; wide low bridge and sharply shaped lips; narrow delicate shoulders; olive-golden skin; a slightly uneven eyebrow edge; relaxed sociable ease.
Faces must be clearly DIFFERENT people: different face shapes, hairlines/facial hair, brows, eyes, noses, builds, skins and expressions, readable at44px. No text, numbers, guide lines, seals, watermark, frames, actor likeness, anime, photography,3D, glow, intricate embroidery or misplaced costume. Keep each head within its own cell, no perspective or tilt.1024x1280.
```

### batch-12 · ming/consort-regular · 6–8

```text
Use case: game character portraits. STRICT EVEN2x2 GRID on a1024x1280 portrait canvas, each cell512x640, narrow plain #E3D7BE gaps. The FOUR attached images are STYLE REFERENCES ONLY, not identities or costumes to copy. DO NOT paint scenery. Chinese baimiao line drawing with light FLAT muted color washes, clean ink outlines with gently varied weight, at most one faint shading layer, simplified costume with a few major folds. Palette ochre, cinnabar, azurite, malachite, beige and ink gray. Plain solid #E3D7BE background with extremely faint paper grain. Head-and-shoulders cropped just below shoulders, no hands or props. In EACH occupied cell: top of hat/hair is 12% from its cell top, both eyes exactly at 38% of cell height (allowed 36–40%), face horizontally centered, gaze slightly off-camera. Faces must be visibly unrelated individuals and readable as different people at 44px. All occupied cells: adult Chinese Ming regular-rank consorts, ages20–38, wearing Compact round Ming JIUJI buns or small Ming hair crowns. A clearly Ming standing-collar or crossed-collar AO JACKET in muted jade, blue, rose or ochre, fully covered shoulders. Never a generic round-neck shirt, never Qing hair or clothing; one simple gold hairpin, no elaborate jewels.
GEOMETRY: in every occupied cell, eye line must be at y=240px (37.5% of640), never below256px. Top of hair/crown at y=77px (12%); choose COMPACT headwear to leave space for eyes high in frame. Only head, neck and shoulders, no long upper body.
Cell1, TOP LEFT, facingLEFT: heart-shaped face and tapered chin; rounded high forehead; a compact oval bun with a low Ming hair crown; soft curved brows and heavy lower eyelids; small pointed nose and slightly uneven lips; stocky shoulders and thick neck; freckled tan skin; gray streaks at both temples; self-assured pride.
Cell2, TOP RIGHT, facingRIGHT: broad diamond face; low curved hairline; two small side buns joined at the rear; high sparse brows and compact round eyes; long high nose and a broad soft mouth; thin neck and gently sloping shoulders; soft medium beige skin; small mole on the left cheek; tired but attentive patience.
Cell3, BOTTOM LEFT, facingRIGHT: narrow oval face with hollow cheeks; angled hairline at the temples; neat low round jiuji bun; light short brows and deep-set downturned eyes; narrow hooked nose and tightly pursed lips; solid upright shoulders; weathered yellow-ochre skin; no facial mark and a smooth forehead; calm honest firmness.
The remaining cells 4 MUST remain EMPTY #E3D7BE paper, no person or object; do not generate extra faces.
Faces must be clearly DIFFERENT people: different face shapes, hairlines/facial hair, brows, eyes, noses, builds, skins and expressions, readable at44px. No text, numbers, guide lines, seals, watermark, frames, actor likeness, anime, photography,3D, glow, intricate embroidery or misplaced costume. Keep each head within its own cell, no perspective or tilt.1024x1280.
```

### batch-13 · ming/dowager-all · 1–1

```text
Use case: game character portraits. STRICT EVEN2x2 GRID on a1024x1280 portrait canvas, each cell512x640, narrow plain #E3D7BE gaps. The FOUR attached images are STYLE REFERENCES ONLY, not identities or costumes to copy. DO NOT paint scenery. Chinese baimiao line drawing with light FLAT muted color washes, clean ink outlines with gently varied weight, at most one faint shading layer, simplified costume with a few major folds. Palette ochre, cinnabar, azurite, malachite, beige and ink gray. Plain solid #E3D7BE background with extremely faint paper grain. Head-and-shoulders cropped just below shoulders, no hands or props. In EACH occupied cell: top of hat/hair is 12% from its cell top, both eyes exactly at 38% of cell height (allowed 36–40%), face horizontally centered, gaze slightly off-camera. Faces must be visibly unrelated individuals and readable as different people at 44px. All occupied cells: Chinese Ming dowager, age64, wearing A modest small Ming ceremonial crown on a compact graying bun; dignified standing-collar Ming ao jacket with a muted deep cinnabar outer collar. Age must be clearly visible, no youthful beauty face.
GEOMETRY: in every occupied cell, eye line must be at y=240px (37.5% of640), never below256px. Top of hair/crown at y=77px (12%); choose COMPACT headwear to leave space for eyes high in frame. Only head, neck and shoulders, no long upper body.
Cell1, TOP LEFT, facingLEFT: wide oval face with a firm rounded chin; graying hair at a low rounded hairline; compact bun and modest small Ming ceremonial crown; short strong brows and small hooded eyes with clear age lines; straight broad nose and thin firmly closed lips; full upright shoulders; pale golden skin with age spots; deep smile lines and a fine vertical brow crease; patient authority and restrained warmth.
The remaining cells 2,3,4 MUST remain EMPTY #E3D7BE paper, no person or object; do not generate extra faces.
Faces must be clearly DIFFERENT people: different face shapes, hairlines/facial hair, brows, eyes, noses, builds, skins and expressions, readable at44px. No text, numbers, guide lines, seals, watermark, frames, actor likeness, anime, photography,3D, glow, intricate embroidery or misplaced costume. Keep each head within its own cell, no perspective or tilt.1024x1280.
```

### batch-14 · ming/emperor-young · 1–2

```text
Use case: game character portraits. STRICT EVEN2x2 GRID on a1024x1280 portrait canvas, each cell512x640, narrow plain #E3D7BE gaps. The FOUR attached images are STYLE REFERENCES ONLY, not identities or costumes to copy. DO NOT paint scenery. Chinese baimiao line drawing with light FLAT muted color washes, clean ink outlines with gently varied weight, at most one faint shading layer, simplified costume with a few major folds. Palette ochre, cinnabar, azurite, malachite, beige and ink gray. Plain solid #E3D7BE background with extremely faint paper grain. Head-and-shoulders cropped just below shoulders, no hands or props. In EACH occupied cell: top of hat/hair is 12% from its cell top, both eyes exactly at 38% of cell height (allowed 36–40%), face horizontally centered, gaze slightly off-camera. Faces must be visibly unrelated individuals and readable as different people at 44px. All occupied cells: Chinese Ming emperors, adults ages22 and34, wearing yellow round-collar imperial robe, only a few simple suggestive dragon lines, and black Ming YISHANGUAN with upward-folded rear wings, NOT a civil official hat with long flat oval wings. No western crown.
GEOMETRY: in every occupied cell, eye line must be at y=240px (37.5% of640), never below256px. Top of hair/crown at y=77px (12%); choose COMPACT headwear to leave space for eyes high in frame. Only head, neck and shoulders, no long upper body.
Cell1, TOP LEFT, facingLEFT: narrow triangular face; three thin strands of a long beard; slanting long brows and small deep-set eyes; narrow hooked nose and tightly pursed lips; lean slightly stooped shoulders; cool pale skin; deep smile lines beside the mouth; quiet suspicion.
Cell2, TOP RIGHT, facingRIGHT: broad diamond face; broad fan-shaped beard; strong angular brows and alert small eyes; large straight nose and pronounced upper lip; plump rounded shoulders; sun-darkened brown skin; one visible dark freckle below the right eye; stern uncompromising resolve.
The remaining cells 3,4 MUST remain EMPTY #E3D7BE paper, no person or object; do not generate extra faces.
Faces must be clearly DIFFERENT people: different face shapes, hairlines/facial hair, brows, eyes, noses, builds, skins and expressions, readable at44px. No text, numbers, guide lines, seals, watermark, frames, actor likeness, anime, photography,3D, glow, intricate embroidery or misplaced costume. Keep each head within its own cell, no perspective or tilt.1024x1280.
```

### batch-15 · ming/emperor-old · 1–2

```text
Use case: game character portraits. STRICT EVEN2x2 GRID on a1024x1280 portrait canvas, each cell512x640, narrow plain #E3D7BE gaps. The FOUR attached images are STYLE REFERENCES ONLY, not identities or costumes to copy. DO NOT paint scenery. Chinese baimiao line drawing with light FLAT muted color washes, clean ink outlines with gently varied weight, at most one faint shading layer, simplified costume with a few major folds. Palette ochre, cinnabar, azurite, malachite, beige and ink gray. Plain solid #E3D7BE background with extremely faint paper grain. Head-and-shoulders cropped just below shoulders, no hands or props. In EACH occupied cell: top of hat/hair is 12% from its cell top, both eyes exactly at 38% of cell height (allowed 36–40%), face horizontally centered, gaze slightly off-camera. Faces must be visibly unrelated individuals and readable as different people at 44px. All occupied cells: Chinese Ming emperors, older adults ages56 and68, wearing muted yellow round-collar imperial robe, only a few simple suggestive dragon lines, black Ming YISHANGUAN with upward-folded rear wings, NOT a civil official hat. Clear wrinkles and gray facial hair.
GEOMETRY: in every occupied cell, eye line must be at y=240px (37.5% of640), never below256px. Top of hair/crown at y=77px (12%); choose COMPACT headwear to leave space for eyes high in frame. Only head, neck and shoulders, no long upper body.
Cell1, TOP LEFT, facingLEFT: wide cheekbones with a pointed chin; gray-white short neat full beard; downturned brows and slightly tired eyes; large rounded nose and a wide thin mouth; broad muscular shoulders; ruddy warm skin; age wrinkles; a small mole near the right temple; bright scholarly curiosity.
Cell2, TOP RIGHT, facingRIGHT: narrow oval face with hollow cheeks; gray-white small tuft directly under lower lip; low heavy brows and a calm sideways gaze; wide low bridge and sharply shaped lips; lean slightly stooped shoulders; cool pale skin; age wrinkles; a pronounced crease at one mouth corner; quiet suspicion.
The remaining cells 3,4 MUST remain EMPTY #E3D7BE paper, no person or object; do not generate extra faces.
Faces must be clearly DIFFERENT people: different face shapes, hairlines/facial hair, brows, eyes, noses, builds, skins and expressions, readable at44px. No text, numbers, guide lines, seals, watermark, frames, actor likeness, anime, photography,3D, glow, intricate embroidery or misplaced costume. Keep each head within its own cell, no perspective or tilt.1024x1280.
```

### batch-16 · ming/prince-teen · 1–2

```text
Use case: game character portraits. STRICT EVEN2x2 GRID on a1024x1280 portrait canvas, each cell512x640, narrow plain #E3D7BE gaps. The FOUR attached images are STYLE REFERENCES ONLY, not identities or costumes to copy. DO NOT paint scenery. Chinese baimiao line drawing with light FLAT muted color washes, clean ink outlines with gently varied weight, at most one faint shading layer, simplified costume with a few major folds. Palette ochre, cinnabar, azurite, malachite, beige and ink gray. Plain solid #E3D7BE background with extremely faint paper grain. Head-and-shoulders cropped just below shoulders, no hands or props. In EACH occupied cell: top of hat/hair is 12% from its cell top, both eyes exactly at 38% of cell height (allowed 36–40%), face horizontally centered, gaze slightly off-camera. Faces must be visibly unrelated individuals and readable as different people at 44px. All occupied cells: Chinese Ming princes, one8-year-old CHILD and one14-year-old adolescent; never adult faces, wearing simple muted blue/ochre Ming round-collar robes and SMALL plain princely hair crowns/topknots. No imperial winged crown, no civil official hat, no beard. Child proportions appropriate to each age.
GEOMETRY: in every occupied cell, eye line must be at y=240px (37.5% of640), never below256px. Top of hair/crown at y=77px (12%); choose COMPACT headwear to leave space for eyes high in frame. Only head, neck and shoulders, no long upper body.
Cell1, TOP LEFT, facingLEFT: round child face, soft cheeks and a short small chin, visibly8years old; clean-shaven, child hair tied under a small plain Ming princely crown; thick straight brows and large wide-set curious eyes; small round nose and full gently closed lips; small rounded child shoulders; warm ivory skin; a shallow cheek dimple; open curious attention.
Cell2, TOP RIGHT, facingRIGHT: longer adolescent oval face with a narrow chin, visibly14years old; clean-shaven, tidy topknot under a low plain Ming princely crown; fine slanted brows and narrow slightly downturned eyes; small high nose and a compact thin mouth; slender adolescent shoulders; soft golden tan skin; one small freckle near left temple; shy cautious reserve.
The remaining cells 3,4 MUST remain EMPTY #E3D7BE paper, no person or object; do not generate extra faces.
Faces must be clearly DIFFERENT people: different face shapes, hairlines/facial hair, brows, eyes, noses, builds, skins and expressions, readable at44px. No text, numbers, guide lines, seals, watermark, frames, actor likeness, anime, photography,3D, glow, intricate embroidery or misplaced costume. Keep each head within its own cell, no perspective or tilt.1024x1280.
```

### batch-17 · ming/prince-adult · 1–2

```text
Use case: game character portraits. STRICT EVEN2x2 GRID on a1024x1280 portrait canvas, each cell512x640, narrow plain #E3D7BE gaps. The FOUR attached images are STYLE REFERENCES ONLY, not identities or costumes to copy. DO NOT paint scenery. Chinese baimiao line drawing with light FLAT muted color washes, clean ink outlines with gently varied weight, at most one faint shading layer, simplified costume with a few major folds. Palette ochre, cinnabar, azurite, malachite, beige and ink gray. Plain solid #E3D7BE background with extremely faint paper grain. Head-and-shoulders cropped just below shoulders, no hands or props. In EACH occupied cell: top of hat/hair is 12% from its cell top, both eyes exactly at 38% of cell height (allowed 36–40%), face horizontally centered, gaze slightly off-camera. Faces must be visibly unrelated individuals and readable as different people at 44px. All occupied cells: Chinese Ming adult princes, ages19 and28, wearing plain muted blue/ochre Ming round-collar robes and modest princely hair crowns. No imperial winged crown or civil official hat; gentle young adult appearance.
GEOMETRY: in every occupied cell, eye line must be at y=240px (37.5% of640), never below256px. Top of hair/crown at y=77px (12%); choose COMPACT headwear to leave space for eyes high in frame. Only head, neck and shoulders, no long upper body.
Cell1, TOP LEFT, facingLEFT: soft oval face; clean-shaven; neat tied hair under a small Ming princely crown; short sparse brows and hooded eyes; small straight nose and full softly closed lips; narrow delicate shoulders; olive-golden skin; clear cheek dimples; relaxed sociable ease.
Cell2, TOP RIGHT, facingRIGHT: pear-shaped face with a broad lower jaw; clean-shaven; neat tied hair under a small Ming princely crown; flat broad brows and a close-set steady gaze; high broad bridge and thick closed lips; solid upright shoulders; weathered yellow-ochre skin; several horizontal forehead creases; calm honest firmness.
The remaining cells 3,4 MUST remain EMPTY #E3D7BE paper, no person or object; do not generate extra faces.
Faces must be clearly DIFFERENT people: different face shapes, hairlines/facial hair, brows, eyes, noses, builds, skins and expressions, readable at44px. No text, numbers, guide lines, seals, watermark, frames, actor likeness, anime, photography,3D, glow, intricate embroidery or misplaced costume. Keep each head within its own cell, no perspective or tilt.1024x1280.
```

### batch-18 · ming/princess-teen · 1–2

```text
Use case: game character portraits. STRICT EVEN2x2 GRID on a1024x1280 portrait canvas, each cell512x640, narrow plain #E3D7BE gaps. The FOUR attached images are STYLE REFERENCES ONLY, not identities or costumes to copy. DO NOT paint scenery. Chinese baimiao line drawing with light FLAT muted color washes, clean ink outlines with gently varied weight, at most one faint shading layer, simplified costume with a few major folds. Palette ochre, cinnabar, azurite, malachite, beige and ink gray. Plain solid #E3D7BE background with extremely faint paper grain. Head-and-shoulders cropped just below shoulders, no hands or props. In EACH occupied cell: top of hat/hair is 12% from its cell top, both eyes exactly at 38% of cell height (allowed 36–40%), face horizontally centered, gaze slightly off-camera. Faces must be visibly unrelated individuals and readable as different people at 44px. All occupied cells: Chinese Ming princesses, one8-year-old CHILD and one14-year-old adolescent; never adult faces, wearing fully covered Ming small standing/crossed-collar AO jackets and simple skirts implied at shoulders; child twin buns or low braided buns, one plain hairpin. No adult phoenix crown, no makeup or adult glamour, no Qing hair.
GEOMETRY: in every occupied cell, eye line must be at y=240px (37.5% of640), never below256px. Top of hair/crown at y=77px (12%); choose COMPACT headwear to leave space for eyes high in frame. Only head, neck and shoulders, no long upper body.
Cell1, TOP LEFT, facingLEFT: full round child face with chubby cheeks, visibly8years old; rounded low child hairline and two small symmetrical Ming girl buns; short soft brows and large bright eyes; small low nose and a full tiny mouth; small soft child shoulders; warm pale beige skin; small cheek dimple; quiet playful curiosity.
Cell2, TOP RIGHT, facingRIGHT: slender oval adolescent face with a short chin, visibly14years old; high curved hairline and a low compact braided Ming girl bun with one plain pin; fine level brows and long gently downturned eyes; small straight nose and thin closed lips; thin adolescent shoulders; pale olive skin; a tiny freckle beside the right brow; thoughtful shy composure.
The remaining cells 3,4 MUST remain EMPTY #E3D7BE paper, no person or object; do not generate extra faces.
Faces must be clearly DIFFERENT people: different face shapes, hairlines/facial hair, brows, eyes, noses, builds, skins and expressions, readable at44px. No text, numbers, guide lines, seals, watermark, frames, actor likeness, anime, photography,3D, glow, intricate embroidery or misplaced costume. Keep each head within its own cell, no perspective or tilt.1024x1280.
```

### batch-19 · ming/princess-adult · 1–2

```text
Use case: game character portraits. STRICT EVEN2x2 GRID on a1024x1280 portrait canvas, each cell512x640, narrow plain #E3D7BE gaps. The FOUR attached images are STYLE REFERENCES ONLY, not identities or costumes to copy. DO NOT paint scenery. Chinese baimiao line drawing with light FLAT muted color washes, clean ink outlines with gently varied weight, at most one faint shading layer, simplified costume with a few major folds. Palette ochre, cinnabar, azurite, malachite, beige and ink gray. Plain solid #E3D7BE background with extremely faint paper grain. Head-and-shoulders cropped just below shoulders, no hands or props. In EACH occupied cell: top of hat/hair is 12% from its cell top, both eyes exactly at 38% of cell height (allowed 36–40%), face horizontally centered, gaze slightly off-camera. Faces must be visibly unrelated individuals and readable as different people at 44px. All occupied cells: Chinese Ming adult princesses, ages19 and26, wearing fully covered Ming standing/crossed-collar AO jackets, compact jiuji buns or small Ming hair crowns with one plain pin. No phoenix crown, no Qing hair, no generic round-neck blouse.
GEOMETRY: in every occupied cell, eye line must be at y=240px (37.5% of640), never below256px. Top of hair/crown at y=77px (12%); choose COMPACT headwear to leave space for eyes high in frame. Only head, neck and shoulders, no long upper body.
Cell1, TOP LEFT, facingLEFT: short broad face with a heavy jaw; straight low hairline; twin small rounded bun loops under a tiny hair crown; short sparse brows and hooded eyes; short wide nose and a compact thin mouth; lean slightly stooped shoulders; cool pale skin; several horizontal forehead creases; quiet suspicion.
Cell2, TOP RIGHT, facingRIGHT: heart-shaped face and tapered chin; rounded high forehead; a compact oval bun with a low Ming hair crown; soft curved brows and heavy lower eyelids; small pointed nose and slightly uneven lips; stocky shoulders and thick neck; freckled tan skin; gray streaks at both temples; self-assured pride.
The remaining cells 3,4 MUST remain EMPTY #E3D7BE paper, no person or object; do not generate extra faces.
Faces must be clearly DIFFERENT people: different face shapes, hairlines/facial hair, brows, eyes, noses, builds, skins and expressions, readable at44px. No text, numbers, guide lines, seals, watermark, frames, actor likeness, anime, photography,3D, glow, intricate embroidery or misplaced costume. Keep each head within its own cell, no perspective or tilt.1024x1280.
```

### batch-20 · shared/scholar-young · 1–4

```text
Use case: game character portraits. STRICT EVEN2x2 GRID on a1024x1280 portrait canvas, each cell512x640, narrow plain #E3D7BE gaps. The FOUR attached images are STYLE REFERENCES ONLY, not identities or costumes to copy. DO NOT paint scenery. Chinese baimiao line drawing with light FLAT muted color washes, clean ink outlines with gently varied weight, at most one faint shading layer, simplified costume with a few major folds. Palette ochre, cinnabar, azurite, malachite, beige and ink gray. Plain solid #E3D7BE background with extremely faint paper grain. Head-and-shoulders cropped just below shoulders, no hands or props. In EACH occupied cell: top of hat/hair is 12% from its cell top, both eyes exactly at 38% of cell height (allowed 36–40%), face horizontally centered, gaze slightly off-camera. Faces must be visibly unrelated individuals and readable as different people at 44px. All occupied cells: Chinese unappointed young scholars, adults ages18–29, wearing simple plain cloth robes and SOFT CLOTH CONFUCIAN HEADKERCHIEFS (rujin), modest folded fabric headwear with no rigid official wings, no rank patch, no gold crown; culturally neutral premodern Chinese scholar clothing rather than a dynasty-specific official uniform.
GEOMETRY: in every occupied cell, eye line must be at y=240px (37.5% of640), never below256px. Top of hair/crown at y=77px (12%); choose COMPACT headwear to leave space for eyes high in frame. Only head, neck and shoulders, no long upper body.
Cell1, TOP LEFT, facingLEFT: long rectangular face; clean-shaven; neat tied hair under a small Ming princely crown; fine level brows and large open eyes; long high nose and a broad soft mouth; slender straight shoulders; pale warm skin; one deep vertical line between brows; warm patient kindness.
Cell2, TOP RIGHT, facingRIGHT: wide cheekbones with a pointed chin; clean-shaven; neat tied hair under a small Ming princely crown; bushy brows and wide-set round eyes; flat broad nose and small curved mouth; broad muscular shoulders; ruddy warm skin; a small mole near the right temple; bright scholarly curiosity.
Cell3, BOTTOM LEFT, facingRIGHT: short broad face with a heavy jaw; heavy downturned moustache and cropped chin beard; high curved brows and very narrow eyes; large rounded nose and a wide thin mouth; stocky shoulders and thick neck; freckled tan skin; a broad crease above the nose; self-assured pride.
Cell4, BOTTOM RIGHT, facingLEFT: high narrow forehead and square chin; pointed triangular beard and no moustache; straight fine brows and wide-set long eyes; narrow blunt nose and a broad lower lip; broad muscular shoulders; ruddy warm skin; a slightly uneven eyebrow edge; bright scholarly curiosity.
Faces must be clearly DIFFERENT people: different face shapes, hairlines/facial hair, brows, eyes, noses, builds, skins and expressions, readable at44px. No text, numbers, guide lines, seals, watermark, frames, actor likeness, anime, photography,3D, glow, intricate embroidery or misplaced costume. Keep each head within its own cell, no perspective or tilt.1024x1280.
```
## 第 11–20 批验收修订

首次出图后发现部分眼线偏低、老年皇帝帽式错误，且青年人物卡中年龄标记过重。以下修订优先于首次长相卡中的相应标记；其余维度不变，同池任意两人仍至少四维不同：青年皇帝左像的深法令纹改为轻微表情纹；成年皇子右像的多道额纹改为一道极浅表情纹；成年公主左像的额纹改为左眉外小痣，右像的灰鬓改为全黑头发、以脸颊雀斑作标记；士子前两像的头饰统一改为布儒巾，覆盖误写的皇子冠。少年公主按真实 14 岁的短下巴、小鼻、窄肩修订。

### batch-11 修订提示词

```text
Edit the attached 2x2 game portrait grid. Preserve its exact number of people, each cell placement, identity differences, facing directions, ink-line/dilute-flat-color style, solid #E3D7BE paper background, muted palette, plain gaps and empty cells. COMPOSITION CORRECTION IS MANDATORY in EVERY occupied cell: both eye centers must move UP from the present low line to38% of that cell's height (allowed36–40%). On a1122x1402 grid this means eyes around y=264px within each701px-high cell, not290–310px. Top of all hair/crowns remains about11–13% down from each cell top. Compress tall crowns, hair and forehead space as needed to fit the high eye line naturally; retain complete heads, no distorted facial proportions. Crop the drawing at just below shoulders, show less upper torso. Keep all four women visibly adult ages20–38; restrained facial creases are allowed but no elderly appearance. Preserve small Ming hair crowns or compact jiuji buns and standing-collar ao jackets. No text, guides, watermark, seal, added figure, background scenery, actor likeness, photorealism, anime, glow, ornate embroidery or wrong-dynasty clothing. Keep the entire2x2 canvas.
```

### batch-12 修订提示词

```text
Edit the attached 2x2 game portrait grid. Preserve its exact number of people, each cell placement, identity differences, facing directions, ink-line/dilute-flat-color style, solid #E3D7BE paper background, muted palette, plain gaps and empty cells. COMPOSITION CORRECTION IS MANDATORY in EVERY occupied cell: both eye centers must move UP from the present low line to38% of that cell's height (allowed36–40%). On a1122x1402 grid this means eyes around y=264px within each701px-high cell, not290–310px. Top of all hair/crowns remains about11–13% down from each cell top. Compress tall crowns, hair and forehead space as needed to fit the high eye line naturally; retain complete heads, no distorted facial proportions. Crop the drawing at just below shoulders, show less upper torso. Keep three women in the same occupied cells, ages roughly36,30,27. The top-left woman may have only a few early gray hairs at the temples, not broad gray areas or elderly wrinkles. Preserve their different faces, buns, collars and colors. No text, guides, watermark, seal, added figure, background scenery, actor likeness, photorealism, anime, glow, ornate embroidery or wrong-dynasty clothing. Keep the entire2x2 canvas.
```

### batch-13 修订提示词

```text
Edit the attached 2x2 game portrait grid. Preserve its exact number of people, each cell placement, identity differences, facing directions, ink-line/dilute-flat-color style, solid #E3D7BE paper background, muted palette, plain gaps and empty cells. COMPOSITION CORRECTION IS MANDATORY in EVERY occupied cell: both eye centers must move UP from the present low line to38% of that cell's height (allowed36–40%). On a1122x1402 grid this means eyes around y=264px within each701px-high cell, not290–310px. Top of all hair/crowns remains about11–13% down from each cell top. Compress tall crowns, hair and forehead space as needed to fit the high eye line naturally; retain complete heads, no distorted facial proportions. Crop the drawing at just below shoulders, show less upper torso. Preserve this visibly64-year-old Ming dowager, gray hair, small crown, wrinkles and dignified standing-collar ao. No text, guides, watermark, seal, added figure, background scenery, actor likeness, photorealism, anime, glow, ornate embroidery or wrong-dynasty clothing. Keep the entire2x2 canvas.
```

### batch-14 修订提示词

```text
Edit the attached 2x2 game portrait grid. Preserve its exact number of people, each cell placement, identity differences, facing directions, ink-line/dilute-flat-color style, solid #E3D7BE paper background, muted palette, plain gaps and empty cells. COMPOSITION CORRECTION IS MANDATORY in EVERY occupied cell: both eye centers must move UP from the present low line to38% of that cell's height (allowed36–40%). On a1122x1402 grid this means eyes around y=264px within each701px-high cell, not290–310px. Top of all hair/crowns remains about11–13% down from each cell top. Compress tall crowns, hair and forehead space as needed to fit the high eye line naturally; retain complete heads, no distorted facial proportions. Crop the drawing at just below shoulders, show less upper torso. Keep TWO different young adult Ming emperors, top-left visibly22 with only light expression lines and top-right34. Preserve the different beards and faces. Keep black YISHANGUAN: upright folded-back rear wings entirely behind the head, no sideward oval wings. Simplify and compact crown height. No text, guides, watermark, seal, added figure, background scenery, actor likeness, photorealism, anime, glow, ornate embroidery or wrong-dynasty clothing. Keep the entire2x2 canvas.
```

### batch-15 修订提示词

```text
Edit the attached 2x2 game portrait grid. Preserve its exact number of people, each cell placement, identity differences, facing directions, ink-line/dilute-flat-color style, solid #E3D7BE paper background, muted palette, plain gaps and empty cells. COMPOSITION CORRECTION IS MANDATORY in EVERY occupied cell: both eye centers must move UP from the present low line to38% of that cell's height (allowed36–40%). On a1122x1402 grid this means eyes around y=264px within each701px-high cell, not290–310px. Top of all hair/crowns remains about11–13% down from each cell top. Compress tall crowns, hair and forehead space as needed to fit the high eye line naturally; retain complete heads, no distorted facial proportions. Crop the drawing at just below shoulders, show less upper torso. CRITICAL COSTUME REPAIR: both currently wear wrong civil official hats with horizontal oval wings. REMOVE those side wings completely. Replace with Ming imperial black YISHANGUAN, the two rear wings folded UPWARD and BACK behind the crown, visible as two slim upward lobes immediately behind the head. No horizontal side flaps at all. Preserve the two distinctly different older faces, white/gray facial hair, yellow round-collar dragon robes and wrinkles. No text, guides, watermark, seal, added figure, background scenery, actor likeness, photorealism, anime, glow, ornate embroidery or wrong-dynasty clothing. Keep the entire2x2 canvas.
```

### batch-16 修订提示词

```text
Edit the attached 2x2 game portrait grid. Preserve its exact number of people, each cell placement, identity differences, facing directions, ink-line/dilute-flat-color style, solid #E3D7BE paper background, muted palette, plain gaps and empty cells. COMPOSITION CORRECTION IS MANDATORY in EVERY occupied cell: both eye centers must move UP from the present low line to38% of that cell's height (allowed36–40%). On a1122x1402 grid this means eyes around y=264px within each701px-high cell, not290–310px. Top of all hair/crowns remains about11–13% down from each cell top. Compress tall crowns, hair and forehead space as needed to fit the high eye line naturally; retain complete heads, no distorted facial proportions. Crop the drawing at just below shoulders, show less upper torso. Keep an8-year-old boy at top-left and a14-year-old boy at top-right; preserve visibly child/adolescent proportions, clean-shaven faces, small princely crowns and Ming round collars. No text, guides, watermark, seal, added figure, background scenery, actor likeness, photorealism, anime, glow, ornate embroidery or wrong-dynasty clothing. Keep the entire2x2 canvas.
```

### batch-17 修订提示词

```text
Edit the attached 2x2 game portrait grid. Preserve its exact number of people, each cell placement, identity differences, facing directions, ink-line/dilute-flat-color style, solid #E3D7BE paper background, muted palette, plain gaps and empty cells. COMPOSITION CORRECTION IS MANDATORY in EVERY occupied cell: both eye centers must move UP from the present low line to38% of that cell's height (allowed36–40%). On a1122x1402 grid this means eyes around y=264px within each701px-high cell, not290–310px. Top of all hair/crowns remains about11–13% down from each cell top. Compress tall crowns, hair and forehead space as needed to fit the high eye line naturally; retain complete heads, no distorted facial proportions. Crop the drawing at just below shoulders, show less upper torso. Keep the left prince visibly19 and the right prince visibly28. Soften right forehead creases to just one faint expression line; no middle-aged weathering. Preserve face-shape, crown, skin tone, pose and costume differences. No text, guides, watermark, seal, added figure, background scenery, actor likeness, photorealism, anime, glow, ornate embroidery or wrong-dynasty clothing. Keep the entire2x2 canvas.
```

### batch-18 修订提示词

```text
Edit the attached 2x2 game portrait grid. Preserve its exact number of people, each cell placement, identity differences, facing directions, ink-line/dilute-flat-color style, solid #E3D7BE paper background, muted palette, plain gaps and empty cells. COMPOSITION CORRECTION IS MANDATORY in EVERY occupied cell: both eye centers must move UP from the present low line to38% of that cell's height (allowed36–40%). On a1122x1402 grid this means eyes around y=264px within each701px-high cell, not290–310px. Top of all hair/crowns remains about11–13% down from each cell top. Compress tall crowns, hair and forehead space as needed to fit the high eye line naturally; retain complete heads, no distorted facial proportions. Crop the drawing at just below shoulders, show less upper torso. AGE REPAIR: the top-right girl must look like a REAL14-year-old adolescent, not an adult consort. Shorten and soften her jaw/chin, use smaller nose, youthful full upper cheeks, smaller thin neck and narrower child/adolescent shoulders. No eyeliner, lipstick or adult glamour; natural lips and clear young skin. Keep her a different person from the8-year-old top-left child, with the low braided bun and one pin. Both wear fully covered Ming ao jackets. No text, guides, watermark, seal, added figure, background scenery, actor likeness, photorealism, anime, glow, ornate embroidery or wrong-dynasty clothing. Keep the entire2x2 canvas.
```

### batch-19 修订提示词

```text
Edit the attached 2x2 game portrait grid. Preserve its exact number of people, each cell placement, identity differences, facing directions, ink-line/dilute-flat-color style, solid #E3D7BE paper background, muted palette, plain gaps and empty cells. COMPOSITION CORRECTION IS MANDATORY in EVERY occupied cell: both eye centers must move UP from the present low line to38% of that cell's height (allowed36–40%). On a1122x1402 grid this means eyes around y=264px within each701px-high cell, not290–310px. Top of all hair/crowns remains about11–13% down from each cell top. Compress tall crowns, hair and forehead space as needed to fit the high eye line naturally; retain complete heads, no distorted facial proportions. Crop the drawing at just below shoulders, show less upper torso. AGE REPAIR: these are19 and26-year-old adult Ming princesses. The left must have a smooth young forehead with NO age wrinkles: replace forehead crease marker with a tiny mole near the left outer brow. The right must have fully BLACK hair with NO gray temples, retain fine cheek freckles as her marker. Preserve their distinct broad-jaw vs heart-shaped faces, different buns/crowns, complexions and expressions. Youthful natural faces, no glamour makeup. No text, guides, watermark, seal, added figure, background scenery, actor likeness, photorealism, anime, glow, ornate embroidery or wrong-dynasty clothing. Keep the entire2x2 canvas.
```

### batch-20 修订提示词

```text
Edit the attached 2x2 game portrait grid. Preserve its exact number of people, each cell placement, identity differences, facing directions, ink-line/dilute-flat-color style, solid #E3D7BE paper background, muted palette, plain gaps and empty cells. COMPOSITION CORRECTION IS MANDATORY in EVERY occupied cell: both eye centers must move UP from the present low line to38% of that cell's height (allowed36–40%). On a1122x1402 grid this means eyes around y=264px within each701px-high cell, not290–310px. Top of all hair/crowns remains about11–13% down from each cell top. Compress tall crowns, hair and forehead space as needed to fit the high eye line naturally; retain complete heads, no distorted facial proportions. Crop the drawing at just below shoulders, show less upper torso. Preserve FOUR clearly different young adult scholars ages18–29, their different face shapes, beard types and expressions. Keep SOFT CLOTH CONFUCIAN HEADKERCHIEFS and plain crossed-collar cloth robes. No gold crown or rigid official hat/wings. Avoid deep age lines on the young faces. No text, guides, watermark, seal, added figure, background scenery, actor likeness, photorealism, anime, glow, ornate embroidery or wrong-dynasty clothing. Keep the entire2x2 canvas.
```


### batch-14 构图复修

```text
Edit this grid without changing the two emperor identities, left/right gazes, black Ming YISHANGUAN with upright folded rear wings, yellow round collars, facial hair types or white-line dilute-color style. Fix only composition and simplify paper grain. Use an EXACT EVEN2x2 layout: top-row portrait cells occupy the full upper HALF of the canvas, bottom half blank beige. In each top cell, the very top of the crown is12% below cell top; EYES must be at37% below cell top. Move the eyes UP visibly about35pixels from the current image while preserving natural head proportions; shorten crown and forehead space. Keep the full head, and let clothing extend down to the bottom edge of the upper half, no beige strip below the shoulders inside that half. A22-year-old on left,34-year-old on right; no elderly wrinkles. Plain solid #E3D7BE background, no texture engraving on skin, no text/guides, no additional people.
```


### 第 11、15、19 批最终构图复核

#### batch-11

```text
Edit ONLY the LOWER TWO cells of this2x2 portrait grid. Keep the upper two women exactly as they are. Move each lower portrait DOWN about32pixels within its own cell, so the top of each hairstyle is11% of cell height down from the central horizontal divider, and their eye line is38% below that divider. Keep complete shoulders extending to bottom edge. Do not alter faces, styles, colors, Ming buns/pins or ao jackets. Each bottom-row woman must have clear beige headroom instead of her bun almost touching the divider. Preserve four different women, two gazing each way. Plain paper background, no text, no new ornaments or figures.
```

#### batch-15

```text
Edit only the TOPS OF THE TWO BLACK IMPERIAL CROWNS in this2x2 grid. Preserve the two older emperor faces and eyes, all facial hair, yellow robes, left/right gazes, paper background and blank bottom row. The two upward-folded rear wing lobes currently extend too high: make these lobes slightly shorter and more compact so their top edge is10–12% of each occupied cell height down from its top. Keep the eyes at their existing high line around39%. The crowns must remain Ming YISHANGUAN with vertical folded-back wings, never horizontal side wings. Simplify clothing and skin texture to clean ink lines with flat dilute colors; no extra decorative pattern or text.
```

#### batch-19

```text
Redraw the TWO young adult Ming princesses from this reference grid with CORRECT HIGH FACE COMPOSITION, preserving their distinct identities but replacing the low placement. On a2x2 canvas use four EVEN cells, only the TOP TWO occupied, bottom two completely blank #E3D7BE. EACH top cell: top of hair is12% from cell top; EYE CENTER is37% of that cell height, noticeably HIGHER than now (currently almost50%). Faces horizontally centered, complete head and shoulders, crop just below shoulders; clothes fill to cell bottom. Reduce the tall hairstyle/forehead space. LEFT is a19-year-old with short broad face and heavy jaw, low straight hairline with two small bun loops and tiny Ming hair crown, short sparse brows and hooded eyes, short wide nose/thin mouth, cool pale skin, tiny mole near left outer brow, smooth youthful forehead without wrinkles, reserved suspicion. RIGHT is a26-year-old with heart-shaped face/tapered chin, round high hairline with compact oval bun and low Ming crown, curved brows and gently lowered eyelids, small pointed nose and slightly uneven lips, freckled tan skin and all-black hair, proud self-assurance. Both fully covered Ming standing-collar ao jackets, left blue/right muted cinnabar; three-quarter gazes left/right. Clean baimiao ink-line dilute FLAT color matching the reference, solid beige background and very faint paper grain, no skin engraving, text, guides, seals, props, extra faces or makeup glamour.
```


### batch-12 朝向平衡修订

常位后妃 8 张校正为朝左、朝右各 4 张：第 8 张（本批左下）改朝左，其余长相卡不变。

```text
Edit ONLY the BOTTOM-LEFT occupied portrait of this2x2 grid. This woman currently gazes to the right: turn her head and gaze to the LEFT in an equivalent three-quarter view, while preserving her very long narrow oval face, hollow cheeks, narrow hooked nose, small tightly closed mouth, angled temple hairline, neat low round jiuji bun, ochre Ming standing-collar ao and calm firm expression. Preserve her identity, eye line and headroom, merely change facing direction. The top-left and top-right women must remain unchanged, bottom-right remains empty paper. Preserve flat dilute baimiao style, solid #E3D7BE paper, framing and grid spacing. No text, guides, new people, new jewelry or extra shading.
```


## 本轮导出与接入汇总

四张定调图已按确认意见重出。第 1–10 批新增 34 张、第 11–20 批新增 24 张；加上定调人物两张，现有池图 60 张。明／大晟全部 56 张、共用青年士子 4 张接入清单，场景仍为 desk-night 和 court 两张，一期共完成 62／132 个内容位（64 个 WebP，场景各含两档）。尚余共用池 16、万历／崇祯专属像 40、场景及题图 14。

人物均为 400×500 WebP q75，最大 18,098 字节；两场景各导出 1440×810 与 720×405 q72。所有生成原图及分格裁切坐标在本机 art-source/、qa/art/ 留存；审阅用 44px 同池对照条见 docs/art-phase1-review/。服饰、年龄和构图修正均通过内置 imagegen 完成，最终只切格、裁切、缩放和转换格式。

## 批次 21–30 · 共用池补齐与万历专属像开篇

按「继续做一些」继续一组 10 批，共新增 19 张内容：7 批池图补齐共用池余下 16 张，3 批单张专属像为万历开局幼帝、其老年像和张居正。所有池先写卡并逐对验证至少四维不同，脸型或胡须／发际线不同；外邦人物只取服饰大意、仪态平等，不丑化、不用夸张族群面貌。幼童为真实 2、5 岁；万历开局依剧本实际字段为 9 岁。专属像的性格与身份依据 scenarios.js，具体五官为视觉设计，不作为史实外貌证据。

四张已确认修订样张继续作为每次生成的风格参考；万历老年像另传幼年像作为身份参考。池图仍同池同档位 2×2，尾组留空；专属像单张生成。

### batch-21 · shared/foreign-north

| 文件后缀／版本 | 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01 | long narrow face with a square chin | short straight moustache and a small pointed chin beard | level thick brows and small attentive eyes | long straight nose and thin closed lips | slender upright shoulders | medium warm tan skin | one tiny mole on the left cheek | measured thoughtful reserve |
| 02 | broad round face with full cheeks | a short gray-flecked full beard | soft arched brows and broad slightly hooded eyes | short rounded nose and a wide relaxed mouth | broad rounded shoulders | light golden skin | gentle crow-feet at both outer eyes | calm generous authority |

```text
Use case: historical-scene. Asset type: game character portraits for an illustrated Chinese historical atlas. Input images1–4 are STYLE REFERENCES ONLY, never copy their people or costumes. Clean Chinese baimiao ink outlines with light FLAT muted color washes, gently varied line weight, at most one faint shading layer, simplified collar and shoulders, extremely faint paper grain. Palette ochre, cinnabar, azurite, malachite, beige, ink gray. Plain solid #E3D7BE background, no scenery. HEAD AND SHOULDERS only, crop just below shoulders; no hands, props or long torso. Top of hair/hat at12% of EACH portrait height; BOTH EYE CENTERS at38% (strictly36–40%), horizontally centered. Use COMPACT headwear and short forehead space so the eye line is high; keep natural facial anatomy. Three-quarter view, gaze slightly off camera. No text, Chinese characters, labels, guides, seals, signature, watermark, frame, actor likeness, anime, photorealism,3D, glow or intricate embroidery.
STRICT EVEN2x2 grid on a1024x1280 canvas. Every cell512x640, narrow plain beige gaps. Each occupied cell: top of head at y=77px and eye line at y=240px; absolutely not near the middle of the cell. Equal row heights, clothing continues to its cell bottom.
All occupied cells: two adult steppe rulers, ages38 and57, wearing modest FELT CAPS and plain fur-edged muted wool coats; no Chinese official hats or imperial dragon robes.
Cell1, TOP LEFT, facingLEFT: long narrow face with a square chin; short straight moustache and a small pointed chin beard; level thick brows and small attentive eyes; long straight nose and thin closed lips; slender upright shoulders; medium warm tan skin; one tiny mole on the left cheek; measured thoughtful reserve.
Cell2, TOP RIGHT, facingRIGHT: broad round face with full cheeks; a short gray-flecked full beard; soft arched brows and broad slightly hooded eyes; short rounded nose and a wide relaxed mouth; broad rounded shoulders; light golden skin; gentle crow-feet at both outer eyes; calm generous authority.
Only cells1 and2 are occupied. The bottom two cells MUST stay EMPTY #E3D7BE paper, no extra figures.
All faces must read as different unrelated individuals at44px. Maintain the same dignified natural human proportions across all cultures. Output1024x1280.
```

### batch-22 · shared/foreign-west

| 文件后缀／版本 | 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01 | oval face with high cheekbones and a pointed chin | neat short boxed beard with a joined moustache | fine arched brows and wide-set long eyes | high gently curved nose and a small closed mouth | lean straight shoulders | olive-brown skin | one thin natural brow crease | quiet observant assurance |
| 02 | broad rectangular face and a blunt chin | long gray-white forked beard | thick downturned brows and small calm eyes | broad straight nose and full firm lips | solid heavy shoulders | light warm beige skin | small mole near the right temple | patient dignified composure |

```text
Use case: historical-scene. Asset type: game character portraits for an illustrated Chinese historical atlas. Input images1–4 are STYLE REFERENCES ONLY, never copy their people or costumes. Clean Chinese baimiao ink outlines with light FLAT muted color washes, gently varied line weight, at most one faint shading layer, simplified collar and shoulders, extremely faint paper grain. Palette ochre, cinnabar, azurite, malachite, beige, ink gray. Plain solid #E3D7BE background, no scenery. HEAD AND SHOULDERS only, crop just below shoulders; no hands, props or long torso. Top of hair/hat at12% of EACH portrait height; BOTH EYE CENTERS at38% (strictly36–40%), horizontally centered. Use COMPACT headwear and short forehead space so the eye line is high; keep natural facial anatomy. Three-quarter view, gaze slightly off camera. No text, Chinese characters, labels, guides, seals, signature, watermark, frame, actor likeness, anime, photorealism,3D, glow or intricate embroidery.
STRICT EVEN2x2 grid on a1024x1280 canvas. Every cell512x640, narrow plain beige gaps. Each occupied cell: top of head at y=77px and eye line at y=240px; absolutely not near the middle of the cell. Equal row heights, clothing continues to its cell bottom.
All occupied cells: two adult western-region rulers, ages45 and61, with modest wrapped CLOTH TURBANS and plain brocade robes indicated by only a few simple geometric lines; no elaborate jewels or exotic stereotypes.
Cell1, TOP LEFT, facingLEFT: oval face with high cheekbones and a pointed chin; neat short boxed beard with a joined moustache; fine arched brows and wide-set long eyes; high gently curved nose and a small closed mouth; lean straight shoulders; olive-brown skin; one thin natural brow crease; quiet observant assurance.
Cell2, TOP RIGHT, facingRIGHT: broad rectangular face and a blunt chin; long gray-white forked beard; thick downturned brows and small calm eyes; broad straight nose and full firm lips; solid heavy shoulders; light warm beige skin; small mole near the right temple; patient dignified composure.
Only cells1 and2 are occupied. The bottom two cells MUST stay EMPTY #E3D7BE paper, no extra figures.
All faces must read as different unrelated individuals at44px. Maintain the same dignified natural human proportions across all cultures. Output1024x1280.
```

### batch-23 · shared/foreign-south

| 文件后缀／版本 | 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01 | full heart-shaped face with a tapered chin | clean-shaven with a smooth rounded hairline under a low headwrap | short curved brows and bright round eyes | small straight nose and gently curved lips | slim sloping shoulders | warm medium brown skin | small cheek dimple | friendly alert curiosity |
| 02 | long rectangular face with a firm wide jaw | a thin drooping moustache and a short rectangular chin tuft | strong level brows and narrow steady eyes | large rounded nose and tightly closed thin lips | broad upright shoulders | sun-tanned golden skin | a fine vertical crease between the brows | serious even-tempered resolve |

```text
Use case: historical-scene. Asset type: game character portraits for an illustrated Chinese historical atlas. Input images1–4 are STYLE REFERENCES ONLY, never copy their people or costumes. Clean Chinese baimiao ink outlines with light FLAT muted color washes, gently varied line weight, at most one faint shading layer, simplified collar and shoulders, extremely faint paper grain. Palette ochre, cinnabar, azurite, malachite, beige, ink gray. Plain solid #E3D7BE background, no scenery. HEAD AND SHOULDERS only, crop just below shoulders; no hands, props or long torso. Top of hair/hat at12% of EACH portrait height; BOTH EYE CENTERS at38% (strictly36–40%), horizontally centered. Use COMPACT headwear and short forehead space so the eye line is high; keep natural facial anatomy. Three-quarter view, gaze slightly off camera. No text, Chinese characters, labels, guides, seals, signature, watermark, frame, actor likeness, anime, photorealism,3D, glow or intricate embroidery.
STRICT EVEN2x2 grid on a1024x1280 canvas. Every cell512x640, narrow plain beige gaps. Each occupied cell: top of head at y=77px and eye line at y=240px; absolutely not near the middle of the cell. Equal row heights, clothing continues to its cell bottom.
All occupied cells: two adult southern-region rulers, ages32 and52, wearing modest wrapped woven CLOTH HEADWRAPS and plain closed short coats in muted jade or cinnabar; dignified equal-status portraits, no feathers, face paint, bare torso or caricature.
Cell1, TOP LEFT, facingLEFT: full heart-shaped face with a tapered chin; clean-shaven with a smooth rounded hairline under a low headwrap; short curved brows and bright round eyes; small straight nose and gently curved lips; slim sloping shoulders; warm medium brown skin; small cheek dimple; friendly alert curiosity.
Cell2, TOP RIGHT, facingRIGHT: long rectangular face with a firm wide jaw; a thin drooping moustache and a short rectangular chin tuft; strong level brows and narrow steady eyes; large rounded nose and tightly closed thin lips; broad upright shoulders; sun-tanned golden skin; a fine vertical crease between the brows; serious even-tempered resolve.
Only cells1 and2 are occupied. The bottom two cells MUST stay EMPTY #E3D7BE paper, no extra figures.
All faces must read as different unrelated individuals at44px. Maintain the same dignified natural human proportions across all cultures. Output1024x1280.
```

### batch-24 · shared/foreign-east

| 文件后缀／版本 | 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01 | short broad face with a rounded chin | sparse neat moustache with a tiny separated chin tuft | soft sloping brows and long downturned eyes | low broad nose and a small full mouth | full gently rounded shoulders | pale warm skin | small mole below the left eye | polite cautious attention |
| 02 | very long oval face with hollow cheeks | a medium-length gray three-strand beard | fine high brows and narrow slightly hooded eyes | long high nose and thin firmly closed lips | lean slightly stooped shoulders | medium golden beige skin | subtle lines beside the mouth | quiet scholarly gravity |

```text
Use case: historical-scene. Asset type: game character portraits for an illustrated Chinese historical atlas. Input images1–4 are STYLE REFERENCES ONLY, never copy their people or costumes. Clean Chinese baimiao ink outlines with light FLAT muted color washes, gently varied line weight, at most one faint shading layer, simplified collar and shoulders, extremely faint paper grain. Palette ochre, cinnabar, azurite, malachite, beige, ink gray. Plain solid #E3D7BE background, no scenery. HEAD AND SHOULDERS only, crop just below shoulders; no hands, props or long torso. Top of hair/hat at12% of EACH portrait height; BOTH EYE CENTERS at38% (strictly36–40%), horizontally centered. Use COMPACT headwear and short forehead space so the eye line is high; keep natural facial anatomy. Three-quarter view, gaze slightly off camera. No text, Chinese characters, labels, guides, seals, signature, watermark, frame, actor likeness, anime, photorealism,3D, glow or intricate embroidery.
STRICT EVEN2x2 grid on a1024x1280 canvas. Every cell512x640, narrow plain beige gaps. Each occupied cell: top of head at y=77px and eye line at y=240px; absolutely not near the middle of the cell. Equal row heights, clothing continues to its cell bottom.
All occupied cells: two adult sea-east rulers, ages35 and59, wearing simple dark CLOTH CAPS without rigid wings and modest broad-sleeved overlapping-collar robes, no Chinese imperial dragon robe, no Ming civil hat and no western crown; restrained premodern East-Asian ceremonial outline.
Cell1, TOP LEFT, facingLEFT: short broad face with a rounded chin; sparse neat moustache with a tiny separated chin tuft; soft sloping brows and long downturned eyes; low broad nose and a small full mouth; full gently rounded shoulders; pale warm skin; small mole below the left eye; polite cautious attention.
Cell2, TOP RIGHT, facingRIGHT: very long oval face with hollow cheeks; a medium-length gray three-strand beard; fine high brows and narrow slightly hooded eyes; long high nose and thin firmly closed lips; lean slightly stooped shoulders; medium golden beige skin; subtle lines beside the mouth; quiet scholarly gravity.
Only cells1 and2 are occupied. The bottom two cells MUST stay EMPTY #E3D7BE paper, no extra figures.
All faces must read as different unrelated individuals at44px. Maintain the same dignified natural human proportions across all cultures. Output1024x1280.
```

### batch-25 · shared/boy-young

| 文件后缀／版本 | 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01 | round toddler face with chubby cheeks and a tiny chin | low rounded child hairline and one tiny top tuft | short soft straight brows and large wide-set round eyes | tiny low nose and a small full mouth | very small round toddler shoulders | warm ivory skin | one shallow left cheek dimple | gentle curious wonder |
| 02 | longer soft oval child face with a narrow rounded chin | higher curved child hairline and two small neat tied tufts | fine slanted brows and long bright eyes | small straight nose and thin softly closed lips | slender small child shoulders | soft golden tan skin | one tiny freckle near the right temple | shy thoughtful attentiveness |

```text
Use case: historical-scene. Asset type: game character portraits for an illustrated Chinese historical atlas. Input images1–4 are STYLE REFERENCES ONLY, never copy their people or costumes. Clean Chinese baimiao ink outlines with light FLAT muted color washes, gently varied line weight, at most one faint shading layer, simplified collar and shoulders, extremely faint paper grain. Palette ochre, cinnabar, azurite, malachite, beige, ink gray. Plain solid #E3D7BE background, no scenery. HEAD AND SHOULDERS only, crop just below shoulders; no hands, props or long torso. Top of hair/hat at12% of EACH portrait height; BOTH EYE CENTERS at38% (strictly36–40%), horizontally centered. Use COMPACT headwear and short forehead space so the eye line is high; keep natural facial anatomy. Three-quarter view, gaze slightly off camera. No text, Chinese characters, labels, guides, seals, signature, watermark, frame, actor likeness, anime, photorealism,3D, glow or intricate embroidery.
STRICT EVEN2x2 grid on a1024x1280 canvas. Every cell512x640, narrow plain beige gaps. Each occupied cell: top of head at y=77px and eye line at y=240px; absolutely not near the middle of the cell. Equal row heights, clothing continues to its cell bottom.
All occupied cells: two REAL young boys, one2-year-old toddler and one5-year-old child, fully covered in simple neutral premodern Chinese overlapping-collar robes, small child topknots; no adult crown, official hat, makeup or facial hair.
Cell1, TOP LEFT, facingLEFT: round toddler face with chubby cheeks and a tiny chin; low rounded child hairline and one tiny top tuft; short soft straight brows and large wide-set round eyes; tiny low nose and a small full mouth; very small round toddler shoulders; warm ivory skin; one shallow left cheek dimple; gentle curious wonder.
Cell2, TOP RIGHT, facingRIGHT: longer soft oval child face with a narrow rounded chin; higher curved child hairline and two small neat tied tufts; fine slanted brows and long bright eyes; small straight nose and thin softly closed lips; slender small child shoulders; soft golden tan skin; one tiny freckle near the right temple; shy thoughtful attentiveness.
Only cells1 and2 are occupied. The bottom two cells MUST stay EMPTY #E3D7BE paper, no extra figures.
All faces must read as different unrelated individuals at44px. Maintain the same dignified natural human proportions across all cultures. Output1024x1280.
```

### batch-26 · shared/girl-young

| 文件后缀／版本 | 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01 | full round toddler face with a very short chin | low straight soft child fringe and two tiny symmetrical buns | short curved brows and wide bright eyes | small low round nose and softly parted tiny lips | soft little toddler shoulders | pale warm beige skin | small right cheek dimple | open playful curiosity |
| 02 | soft pear-shaped child face with a broad lower cheek and small chin | high rounded child hairline and two low looped child buns with plain cloth ties | fine level brows and narrow gently lowered eyes | tiny straight nose and thin gently closed mouth | narrow upright child shoulders | medium warm golden skin | one tiny mole beside the left brow | quiet determined concentration |

```text
Use case: historical-scene. Asset type: game character portraits for an illustrated Chinese historical atlas. Input images1–4 are STYLE REFERENCES ONLY, never copy their people or costumes. Clean Chinese baimiao ink outlines with light FLAT muted color washes, gently varied line weight, at most one faint shading layer, simplified collar and shoulders, extremely faint paper grain. Palette ochre, cinnabar, azurite, malachite, beige, ink gray. Plain solid #E3D7BE background, no scenery. HEAD AND SHOULDERS only, crop just below shoulders; no hands, props or long torso. Top of hair/hat at12% of EACH portrait height; BOTH EYE CENTERS at38% (strictly36–40%), horizontally centered. Use COMPACT headwear and short forehead space so the eye line is high; keep natural facial anatomy. Three-quarter view, gaze slightly off camera. No text, Chinese characters, labels, guides, seals, signature, watermark, frame, actor likeness, anime, photorealism,3D, glow or intricate embroidery.
STRICT EVEN2x2 grid on a1024x1280 canvas. Every cell512x640, narrow plain beige gaps. Each occupied cell: top of head at y=77px and eye line at y=240px; absolutely not near the middle of the cell. Equal row heights, clothing continues to its cell bottom.
All occupied cells: two REAL young girls, one2-year-old toddler and one5-year-old child, fully covered simple premodern Chinese standing/crossed-collar child jackets in muted jade or rose, tiny child buns; no adult hair crown, makeup, jewelry glamour or mature face.
Cell1, TOP LEFT, facingLEFT: full round toddler face with a very short chin; low straight soft child fringe and two tiny symmetrical buns; short curved brows and wide bright eyes; small low round nose and softly parted tiny lips; soft little toddler shoulders; pale warm beige skin; small right cheek dimple; open playful curiosity.
Cell2, TOP RIGHT, facingRIGHT: soft pear-shaped child face with a broad lower cheek and small chin; high rounded child hairline and two low looped child buns with plain cloth ties; fine level brows and narrow gently lowered eyes; tiny straight nose and thin gently closed mouth; narrow upright child shoulders; medium warm golden skin; one tiny mole beside the left brow; quiet determined concentration.
Only cells1 and2 are occupied. The bottom two cells MUST stay EMPTY #E3D7BE paper, no extra figures.
All faces must read as different unrelated individuals at44px. Maintain the same dignified natural human proportions across all cultures. Output1024x1280.
```

### batch-27 · shared/scholar-mature

| 文件后缀／版本 | 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01 | broad square face with a heavy blunt chin | short separated moustache and small square chin beard | thick flat brows and narrow upturned eyes | wide rounded nose and firmly closed thin lips | solid upright shoulders | weathered yellow-ochre skin | a tiny mole on the right cheek | plainspoken steady resolve |
| 02 | very long thin face and pointed chin | three thin strands of long dark beard with a slight gray edge | high fine brows and small downturned eyes | long narrow straight nose and a compact closed mouth | lean slightly stooped shoulders | pale olive skin | fine vertical line between the brows | absorbed cautious thought |
| 03 | round full face with a soft double chin | short gray-flecked full fan beard | soft arched brows and large hooded eyes | short broad nose and full gently curved lips | plump gently sloping shoulders | warm ruddy skin | a small dimple at one mouth corner | patient sociable warmth |
| 04 | angular diamond face with a narrow square chin | long gray-white pointed beard and a thin gray moustache | bushy downturned brows and deep-set long eyes | high hooked nose and broad thin mouth | broad bony straight shoulders | medium golden tan skin | clear crow-feet beside the eyes | dignified alert skepticism |

```text
Use case: historical-scene. Asset type: game character portraits for an illustrated Chinese historical atlas. Input images1–4 are STYLE REFERENCES ONLY, never copy their people or costumes. Clean Chinese baimiao ink outlines with light FLAT muted color washes, gently varied line weight, at most one faint shading layer, simplified collar and shoulders, extremely faint paper grain. Palette ochre, cinnabar, azurite, malachite, beige, ink gray. Plain solid #E3D7BE background, no scenery. HEAD AND SHOULDERS only, crop just below shoulders; no hands, props or long torso. Top of hair/hat at12% of EACH portrait height; BOTH EYE CENTERS at38% (strictly36–40%), horizontally centered. Use COMPACT headwear and short forehead space so the eye line is high; keep natural facial anatomy. Three-quarter view, gaze slightly off camera. No text, Chinese characters, labels, guides, seals, signature, watermark, frame, actor likeness, anime, photorealism,3D, glow or intricate embroidery.
STRICT EVEN2x2 grid on a1024x1280 canvas. Every cell512x640, narrow plain beige gaps. Each occupied cell: top of head at y=77px and eye line at y=240px; absolutely not near the middle of the cell. Equal row heights, clothing continues to its cell bottom.
All occupied cells: four adult unappointed scholars ages35,46,58,65, all wearing SOFT folded CLOTH CONFUCIAN HEADKERCHIEFS (rujin), simple plain overlapping-collar cloth robes; no rigid hat wings, no gold crowns, no rank patch or official uniform.
Cell1, TOP LEFT, facingLEFT: broad square face with a heavy blunt chin; short separated moustache and small square chin beard; thick flat brows and narrow upturned eyes; wide rounded nose and firmly closed thin lips; solid upright shoulders; weathered yellow-ochre skin; a tiny mole on the right cheek; plainspoken steady resolve.
Cell2, TOP RIGHT, facingRIGHT: very long thin face and pointed chin; three thin strands of long dark beard with a slight gray edge; high fine brows and small downturned eyes; long narrow straight nose and a compact closed mouth; lean slightly stooped shoulders; pale olive skin; fine vertical line between the brows; absorbed cautious thought.
Cell3, BOTTOM LEFT, facingRIGHT: round full face with a soft double chin; short gray-flecked full fan beard; soft arched brows and large hooded eyes; short broad nose and full gently curved lips; plump gently sloping shoulders; warm ruddy skin; a small dimple at one mouth corner; patient sociable warmth.
Cell4, BOTTOM RIGHT, facingLEFT: angular diamond face with a narrow square chin; long gray-white pointed beard and a thin gray moustache; bushy downturned brows and deep-set long eyes; high hooked nose and broad thin mouth; broad bony straight shoulders; medium golden tan skin; clear crow-feet beside the eyes; dignified alert skepticism.
All faces must read as different unrelated individuals at44px. Maintain the same dignified natural human proportions across all cultures. Output1024x1280.
```

### batch-28 · 万历开局皇帝（朱翊钧）

依据：scenarios.js：9岁、节俭，张居正摄政、李太后严于管教；据此表现克制、认真听取的儿童仪态。具体五官是视觉设定，不声称为史实容貌。

| 文件后缀／版本 | 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| base | broad round CHILD face, full soft cheeks and a short rounded chin | smooth low rounded hairline; fully clean-shaven child face beneath a SMALL black Ming yishanguan | gently arched brows and long softly hooded CHILD eyes | short broad nose with a round tip and a full lower lip | small upright child shoulders | pale warm golden skin | one tiny subtle freckle near the outer right brow | serious self-contained attention, quiet economical restraint; visibly9years old, never an adult |

```text
Use case: historical-scene. Asset type: game character portraits for an illustrated Chinese historical atlas. Input images1–4 are STYLE REFERENCES ONLY, never copy their people or costumes. Clean Chinese baimiao ink outlines with light FLAT muted color washes, gently varied line weight, at most one faint shading layer, simplified collar and shoulders, extremely faint paper grain. Palette ochre, cinnabar, azurite, malachite, beige, ink gray. Plain solid #E3D7BE background, no scenery. HEAD AND SHOULDERS only, crop just below shoulders; no hands, props or long torso. Top of hair/hat at12% of EACH portrait height; BOTH EYE CENTERS at38% (strictly36–40%), horizontally centered. Use COMPACT headwear and short forehead space so the eye line is high; keep natural facial anatomy. Three-quarter view, gaze slightly off camera. No text, Chinese characters, labels, guides, seals, signature, watermark, frame, actor likeness, anime, photorealism,3D, glow or intricate embroidery.
ONE SINGLE PERSON, full portrait canvas, no grid. A REAL9-year-old Chinese boy emperor of the Ming dynasty. SMALL compact black YISHANGUAN with its two rear wings folded UPWARD behind the crown, absolutely no horizontal oval official wings. Muted yellow round-collar imperial robe with only a few simple suggested dragon lines at the shoulder. Clearly child proportions, no adult face, moustache or makeup.
Subject: broad round CHILD face, full soft cheeks and a short rounded chin; smooth low rounded hairline; fully clean-shaven child face beneath a SMALL black Ming yishanguan; gently arched brows and long softly hooded CHILD eyes; short broad nose with a round tip and a full lower lip; small upright child shoulders; pale warm golden skin; one tiny subtle freckle near the outer right brow; serious self-contained attention, quiet economical restraint; visibly9years old, never an adult.
FacingLEFT, eyes high at38% of full canvas, top of complete crown at12%, head-and-shoulders, no torso length. Plain beige paper. Output1024x1280.
```

### batch-29 · 万历老年专属像（朱翊钧）

依据：同一皇帝≥40岁的游戏年龄档，沿用节俭的剧本性格和开局像的脸型、鼻口及眉旁标记；48岁为本次绘图年龄，不是开局时间。

| 文件后缀／版本 | 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| old | broad round face retaining the childhood wide cheeks and short chin, now full lower cheeks | neat short moustache and small tapered beard, a few early gray strands at the temples | the same gently arched brows and long hooded eyes, with restrained age lines | the same broad round-tipped nose and full lower lip | full upright adult shoulders | pale warm golden skin | the SAME tiny freckle near the outer right brow | quiet self-contained authority and measured restraint; visibly48years old |

```text
Use case: historical-scene. Asset type: game character portraits for an illustrated Chinese historical atlas. Input images1–4 are STYLE REFERENCES ONLY, never copy their people or costumes. Clean Chinese baimiao ink outlines with light FLAT muted color washes, gently varied line weight, at most one faint shading layer, simplified collar and shoulders, extremely faint paper grain. Palette ochre, cinnabar, azurite, malachite, beige, ink gray. Plain solid #E3D7BE background, no scenery. HEAD AND SHOULDERS only, crop just below shoulders; no hands, props or long torso. Top of hair/hat at12% of EACH portrait height; BOTH EYE CENTERS at38% (strictly36–40%), horizontally centered. Use COMPACT headwear and short forehead space so the eye line is high; keep natural facial anatomy. Three-quarter view, gaze slightly off camera. No text, Chinese characters, labels, guides, seals, signature, watermark, frame, actor likeness, anime, photorealism,3D, glow or intricate embroidery.
ONE SINGLE PERSON, full portrait canvas, no grid. The SAME Ming emperor as the additional child identity reference, naturally aged to48. Preserve recognizable broad round face, arched hooded eyes, round-tipped broad nose, full lower lip and small brow freckle, now an older adult with short neat facial hair. Compact black Ming YISHANGUAN with two upward folded BACK wings, no horizontal official wings. Muted yellow round-collar robe, a few simple dragon lines only.
Subject: broad round face retaining the childhood wide cheeks and short chin, now full lower cheeks; neat short moustache and small tapered beard, a few early gray strands at the temples; the same gently arched brows and long hooded eyes, with restrained age lines; the same broad round-tipped nose and full lower lip; full upright adult shoulders; pale warm golden skin; the SAME tiny freckle near the outer right brow; quiet self-contained authority and measured restraint; visibly48years old.
FacingLEFT, eyes high at38% of full canvas, top of complete crown at12%, head-and-shoulders, no torso length. Plain beige paper. Output1024x1280.
```

### batch-30 · 万历首辅专属像（张居正）

依据：scenarios.js：47岁，内阁首辅、刚毅果决、综核名实；秘密为与冯保内外相结、逐高拱。以挺直肩背、紧抿嘴和专注眉眼表现果决与权谋，不把政治秘密画成道具或脸谱。

| 文件后缀／版本 | 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| base | long rectangular face with high broad cheekbones and a firm square chin | neat long dark three-strand beard and separated straight moustache | strong level brows and narrow direct but off-camera eyes | high straight nose and thin tightly closed lips | broad straight composed shoulders | medium warm golden skin | a fine vertical brow crease and restrained lines beside the mouth | decisive disciplined authority with alert political calculation; visibly47years old |

```text
Use case: historical-scene. Asset type: game character portraits for an illustrated Chinese historical atlas. Input images1–4 are STYLE REFERENCES ONLY, never copy their people or costumes. Clean Chinese baimiao ink outlines with light FLAT muted color washes, gently varied line weight, at most one faint shading layer, simplified collar and shoulders, extremely faint paper grain. Palette ochre, cinnabar, azurite, malachite, beige, ink gray. Plain solid #E3D7BE background, no scenery. HEAD AND SHOULDERS only, crop just below shoulders; no hands, props or long torso. Top of hair/hat at12% of EACH portrait height; BOTH EYE CENTERS at38% (strictly36–40%), horizontally centered. Use COMPACT headwear and short forehead space so the eye line is high; keep natural facial anatomy. Three-quarter view, gaze slightly off camera. No text, Chinese characters, labels, guides, seals, signature, watermark, frame, actor likeness, anime, photorealism,3D, glow or intricate embroidery.
ONE SINGLE PERSON, full portrait canvas, no grid. One47-year-old Chinese Ming chief grand secretary. Correct black Ming WUSHAMAO: LOW front panel close to forehead, TALLER rear crown, TWO thin FLAT OVAL gauze wings extending horizontally from the BACK of the cap, not a continuous brim or western round hat. Muted deep cinnabar round-collar official robe with only a small upper edge of a simple rank patch.
Subject: long rectangular face with high broad cheekbones and a firm square chin; neat long dark three-strand beard and separated straight moustache; strong level brows and narrow direct but off-camera eyes; high straight nose and thin tightly closed lips; broad straight composed shoulders; medium warm golden skin; a fine vertical brow crease and restrained lines beside the mouth; decisive disciplined authority with alert political calculation; visibly47years old.
FacingRIGHT, eyes high at38% of full canvas, top of complete crown at12%, head-and-shoulders, no torso length. Plain beige paper. Output1024x1280.
```


### 第 21–28 批初稿验收修订

南方君主左像及幼童眼线偏低、幼童右像年龄偏大；壮年士子下排头顶留白不足；万历幼帝冠帽过高。以下仅修订这些问题，长相卡的身份、脸型及主要标记不变，幼童按真实2／5岁重画。

#### batch-23

```text
Edit only portrait COMPOSITION, preserving the same two distinct southern-region rulers, cloth headwraps, plain coats, face shapes, skin tones, facial hair, marks and left/right gazes. The TOP-LEFT face is too low: shift its face UP about35px, shorten the headwrap/forehead space naturally, keep the very top of the wrap around12% down from its cell top, and put BOTH eyes on38% of its cell height. The TOP-RIGHT face and EMPTY bottom cells stay unchanged. Head and shoulders only, plain beige gaps and background, clean baimiao ink line and flat dilute color, no extra detail, guides or text.
```

#### batch-25

```text
Edit this2x2 grid of TWO CHILDREN. Preserve two occupied top cells and empty bottom cells, the muted green and blue crossed-collar robes, child hair tufts, facing directions, plain beige paper and clean baimiao flat-color style. TOP-LEFT remains a REAL2-year-old toddler with round puffy cheeks, tiny nose/chin and a small open curious mouth. AGE REPAIR for TOP-RIGHT: he must be a REAL5-year-old LITTLE BOY, not a teenager. Keep a subtly longer face than the toddler but make it a SHORT soft child oval with full upper cheeks, small short chin, very small nose and mouth, round forehead, small CHILD neck/shoulders, two small tied hair tufts, no mature long jaw or long adult neck. Natural unmade-up eyes and lips, no eyeliner. In BOTH occupied cells, move the eyes UP from current low position to38% of cell height, within36–40%; top of hair/tufts around12%, compact child hairstyle. No added person, text, guide lines, prop, adult headwear or decoration.
```

#### batch-26

```text
Edit this2x2 grid of TWO YOUNG GIRLS, keeping two portraits in the TOP row, bottom row empty, their red/green fully covered jackets, different child hairstyles, beige paper and simple baimiao flat-color drawing. TOP-LEFT remains a REAL2-year-old toddler, round chubby face, very short chin, tiny soft nose and small child mouth. AGE REPAIR for TOP-RIGHT: redraw her as a REAL5-year-old LITTLE GIRL, never a teen or adult. A SHORT soft pear-shaped child face with full soft cheeks, very small straight nose, small short rounded chin, small natural thin mouth without lipstick, big child forehead, thin SMALL CHILD neck and narrow small shoulders. Keep her two low cloth-tied loop buns and tiny left-brow mole, quiet determined expression and right-facing gaze. Absolutely no adult jaw, long neck, makeup/eyeliner, adult glamour or hair crown. Reframe BOTH girls with eye centers at38% of their cell height (allowed36–40%), top of hair at12%, compact hairstyle and complete head/shoulders, no long torso. No extra people, scenery, guides, text or new ornaments.
```

#### batch-27

```text
Edit only the LOWER TWO occupied cells of this2x2 scholar grid. Keep both upper portraits unchanged. Move each lower portrait DOWN about22pixels within its own cell, continuing robe naturally to cell bottom; this gives the cloth kerchief a clear10–12% paper margin from the central divider, and places eyes near38–40% of cell height. Preserve the same four DIFFERENT scholars, face shapes, beards, age, wrinkles, left/right gazes, soft cloth kerchiefs, plain crossed-collar robes, colors and simple baimiao flat washes. No gold crown, rigid hat wings, added figure, prop, guides, text or background. Keep exact even2x2 layout.
```

#### batch-28

```text
Edit the attached SINGLE9-year-old Ming boy emperor, preserving this same CHILD face identity: broad round child face/full soft cheeks, short rounded chin, arched softly hooded eyes, round-tipped short broad nose, full lower lip and tiny right-brow freckle; preserve left-facing gaze, yellow round-collar robe and clean baimiao flat color on #E3D7BE paper. COMPOSITION REPAIR: the imperial crown is FAR TOO TALL and pushes the eyes near46% of the canvas. Make the black Ming YISHANGUAN about ONE THIRD SHORTER vertically, compact two upright folded-back rear wings, no horizontal civil-official wings. Keep the top of the crown at12% canvas height while raising the ENTIRE face/head about100pixels so BOTH EYE CENTERS lie at38% (within36–40%). Preserve natural CHILD anatomy, no facial distortion and no adult aging. Keep complete crown and head, only neck and shoulders below, no long torso. Simplify skin to flat wash without engraving. No other person, text, guides, seals, watermarks, frame, props or extra ornament.
```


### 幼童构图复修与老年像身份参考

幼童年龄已修正；再次压缩每格人物尺度，以调整眼线而不拉长成人化脸部。万历老年像实际调用另附第5张幼帝身份参考。

#### batch-25

```text
Edit ONLY the composition of this2x2 grid, preserving the SAME TWO children, real ages2 and5, their facial identities, hairstyles, left/right gazes, closed robes, colors, clean ink lines and flat washes. The heads and faces are too large and low. Redraw EACH occupied portrait at 92% of its CURRENT size, scaling toward the TOP CENTER of its own cell. This puts the top of hair at10–14% and BOTH EYE CENTERS at37–39% of each cell height, rather than the current lower line. Keep faces horizontally centered, entire heads visible, and extend the simple clothing naturally to the bottom edge of its cell. This is composition, NOT aging; maintain real toddler/young-child proportions with no adult features, makeup or ornaments. Exact equal2x2 grid, top two cells occupied, bottom cells EMPTY plain #E3D7BE paper. No labels, guides, border, text, extra people, scene or props.
```

#### batch-26

```text
Edit ONLY the composition of this2x2 grid, preserving the SAME TWO children, real ages2 and5, their facial identities, hairstyles, left/right gazes, closed robes, colors, clean ink lines and flat washes. The heads and faces are too large and low. Redraw EACH occupied portrait at 82% of its CURRENT size, scaling toward the TOP CENTER of its own cell. This puts the top of hair at10–14% and BOTH EYE CENTERS at37–39% of each cell height, rather than the current lower line. Keep faces horizontally centered, entire heads visible, and extend the simple clothing naturally to the bottom edge of its cell. This is composition, NOT aging; maintain real toddler/young-child proportions with no adult features, makeup or ornaments. Exact equal2x2 grid, top two cells occupied, bottom cells EMPTY plain #E3D7BE paper. No labels, guides, border, text, extra people, scene or props.
```

#### batch-29 最终实际提示词（含身份参考说明）

```text
Use case: historical-scene. Asset type: game character portraits for an illustrated Chinese historical atlas. Input images1–4 are STYLE REFERENCES ONLY, never copy their people or costumes. Clean Chinese baimiao ink outlines with light FLAT muted color washes, gently varied line weight, at most one faint shading layer, simplified collar and shoulders, extremely faint paper grain. Palette ochre, cinnabar, azurite, malachite, beige, ink gray. Plain solid #E3D7BE background, no scenery. HEAD AND SHOULDERS only, crop just below shoulders; no hands, props or long torso. Top of hair/hat at12% of EACH portrait height; BOTH EYE CENTERS at38% (strictly36–40%), horizontally centered. Use COMPACT headwear and short forehead space so the eye line is high; keep natural facial anatomy. Three-quarter view, gaze slightly off camera. No text, Chinese characters, labels, guides, seals, signature, watermark, frame, actor likeness, anime, photorealism,3D, glow or intricate embroidery.
ONE SINGLE PERSON, full portrait canvas, no grid. The SAME Ming emperor as the additional child identity reference, naturally aged to48. Preserve recognizable broad round face, arched hooded eyes, round-tipped broad nose, full lower lip and small brow freckle, now an older adult with short neat facial hair. Compact black Ming YISHANGUAN with two upward folded BACK wings, no horizontal official wings. Muted yellow round-collar robe, a few simple dragon lines only.
Subject: broad round face retaining the childhood wide cheeks and short chin, now full lower cheeks; neat short moustache and small tapered beard, a few early gray strands at the temples; the same gently arched brows and long hooded eyes, with restrained age lines; the same broad round-tipped nose and full lower lip; full upright adult shoulders; pale warm golden skin; the SAME tiny freckle near the outer right brow; quiet self-contained authority and measured restraint; visibly48years old.
FacingLEFT, eyes high at38% of full canvas, top of complete crown at12%, head-and-shoulders, no torso length. Plain beige paper. Output1024x1280.
Input image5 is an IDENTITY REFERENCE: the9-year-old emperor. Use it only to imagine his natural aging to48, retaining broad rounded face structure, eye shape, nose, lips and brow freckle; do not copy child proportions into the older portrait. Input images1–4 remain the style references.
```


### batch-30 胡须与帽顶留白修订

首稿胡须被画成编辫扎束，改为自然未扎束三绺长须；稍缩后帽身以补足头顶留白。其余身份与衣冠结构不变。

```text
Edit this SINGLE Ming chief grand secretary portrait, preserving the exact same47-year-old man, long rectangular face/high cheekbones/square chin, strong brows, off-camera RIGHT-facing gaze, serious decisive expression, cinnabar round-collar robe, small rank-patch edge, black Ming wushamao with its correct front-low/rear-high two-level silhouette and flat oval wings from the back. Change ONLY these details: (1) shorten the TOP of the raised rear cap by about45–50pixels so the complete hat has10–14% blank beige headroom, while the eye line stays near38% of image height; preserve the stepped hat and thin flat oval wings, no continuous brim. (2) Replace the BRAIDED/TIED beard with THREE NATURAL LOOSE UNBRAIDED dark beard strands, neat long flowing hair; remove ALL gold ties, bands and braiding. Keep moustache and overall beard length. (3) simplify any decorative skin or robe texture to clean baimiao ink lines, flat light washes and extremely faint paper grain. Keep plain #E3D7BE background, complete head and shoulders, no props, text, seals, watermark, guides, extra people or new ornaments.
```


## 2026-11-06 玩家审图修订 · 当前生效

全26张文官统一平顶乌纱帽、禁黄袍。按指定撞脸调整，壮年02改富态络腮胡、14改53岁灰鬓稀灰须；士子01清瘦白皙无须，04深肤富态方脸络腮胡。其余文官长相卡不变。指定女性像只柔化眉眼和女性下颌，保留各自其他差异。正位戴可辨凤形、展翼与珠串的冠；万历老像富态双下巴、翼善冠；海东用高仪冠宽白领区别于明士人。先修订38张并展示44px对照，再继续余下37张专属像、14张场景题图。

### rev-official-mature-01

| 文件 | 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| assets/art/portraits/ming/official-mature-01.webp | broad square face | short separated moustache and small pointed goatee | thick straight eyebrows and narrow upturned eyes | broad nose and thin tightly closed lips | solid upright shoulders | weathered yellow-ochre skin | small mole on the left cheek | calm honest firmness |
| assets/art/portraits/ming/official-mature-02.webp | long rectangular face with full rounded cheeks and a soft double chin | dense full dark cheek-and-jaw beard joined to short moustache | fine level brows and large open eyes | long high nose and a broad soft mouth | distinctly plump broad shoulders and thick neck | pale warm skin | one deep vertical line between brows | warm patient kindness |
| assets/art/portraits/ming/official-mature-03.webp | full round face | thick straight moustache only | arched heavy brows and drooping eyelids | short rounded nose and full lips | plump rounded shoulders | sun-darkened brown skin | no facial mark and a smooth forehead | stern uncompromising resolve |
| assets/art/portraits/ming/official-mature-04.webp | narrow triangular face | three thin strands of a long beard | slanting long brows and small deep-set eyes | narrow hooked nose and tightly pursed lips | lean slightly stooped shoulders | cool pale skin | deep smile lines beside the mouth | quiet suspicion |

~~~text
Use case: historical-scene. Game portrait asset, Chinese baimiao clean ink lines and light FLAT muted washes, at most one faint shading layer, solid #E3D7BE paper with extremely faint grain. HEAD AND SHOULDERS only, no hands/props/long torso. EYES strictly36–40%, target38%, complete head top12%, face centered, three-quarter off-camera gaze. Compact headwear, no huge forehead space. No text, guides, seals, watermark, frames, actors, photography, anime,3D, glow or intricate embroidery. Images1–4 are established STYLE references; image5 is ONLY approved flat-top hat SHAPE, never copy its face. EXACT EVEN2x2 grid1024x1280, four equal512x640 cells, plain beige gaps. In EACH cell head top y77, eyes y240. Complete heads within cells, shoulders continue to cell bottom. ALL hats match image5: FLAT-TOP Ming WUSHAMAO, low front close to forehead, distinctly HIGHER FLAT rear crown, two thin FLAT OVAL wings extending HORIZONTALLY from the BACK. No rounded dome, western hat, continuous brim or upward imperial wings. MATURE adults32–54. Chinese Ming civil officials; round-collar robes ONLY muted RED, BLUE or GREEN, ABSOLUTELY NO YELLOW/GOLD/OCHRE clothing. Rank patch only a few simple strokes.
Cell1, TOP LEFT, facingLEFT: broad square face; short separated moustache and small pointed goatee; thick straight eyebrows and narrow upturned eyes; broad nose and thin tightly closed lips; solid upright shoulders; weathered yellow-ochre skin; small mole on the left cheek; calm honest firmness; robe muted cinnabar RED.
Cell2, TOP RIGHT, facingRIGHT: long rectangular face with full rounded cheeks and a soft double chin; dense full dark cheek-and-jaw beard joined to short moustache; fine level brows and large open eyes; long high nose and a broad soft mouth; distinctly plump broad shoulders and thick neck; pale warm skin; one deep vertical line between brows; warm patient kindness; robe muted azurite BLUE.
Cell3, BOTTOM LEFT, facingRIGHT: full round face; thick straight moustache only; arched heavy brows and drooping eyelids; short rounded nose and full lips; plump rounded shoulders; sun-darkened brown skin; no facial mark and a smooth forehead; stern uncompromising resolve; robe muted dark jade GREEN.
Cell4, BOTTOM RIGHT, facingLEFT: narrow triangular face; three thin strands of a long beard; slanting long brows and small deep-set eyes; narrow hooked nose and tightly pursed lips; lean slightly stooped shoulders; cool pale skin; deep smile lines beside the mouth; quiet suspicion; robe muted cinnabar RED.
~~~

### rev-official-mature-05

| 文件 | 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| assets/art/portraits/ming/official-mature-05.webp | wide cheekbones with a pointed chin | short neat full beard | bushy brows and wide-set round eyes | flat broad nose and small curved mouth | broad muscular shoulders | ruddy warm skin | a small mole near the right temple | bright scholarly curiosity |
| assets/art/portraits/ming/official-mature-06.webp | soft oval face | sparse forked chin beard | short sparse brows and hooded eyes | small straight nose and full softly closed lips | narrow delicate shoulders | olive-golden skin | clear cheek dimples | relaxed sociable ease |
| assets/art/portraits/ming/official-mature-07.webp | short broad face with a heavy jaw | heavy downturned moustache and cropped chin beard | high curved brows and very narrow eyes | large rounded nose and a wide thin mouth | stocky shoulders and thick neck | freckled tan skin | a broad crease above the nose | self-assured pride |
| assets/art/portraits/ming/official-mature-08.webp | very long thin face | long wispy beard | downturned brows and slightly tired eyes | long narrow nose and drooping mouth corners | thin neck and gently sloping shoulders | soft medium beige skin | a small age spot at the left jaw | tired but attentive patience |

~~~text
Use case: historical-scene. Game portrait asset, Chinese baimiao clean ink lines and light FLAT muted washes, at most one faint shading layer, solid #E3D7BE paper with extremely faint grain. HEAD AND SHOULDERS only, no hands/props/long torso. EYES strictly36–40%, target38%, complete head top12%, face centered, three-quarter off-camera gaze. Compact headwear, no huge forehead space. No text, guides, seals, watermark, frames, actors, photography, anime,3D, glow or intricate embroidery. Images1–4 are established STYLE references; image5 is ONLY approved flat-top hat SHAPE, never copy its face. EXACT EVEN2x2 grid1024x1280, four equal512x640 cells, plain beige gaps. In EACH cell head top y77, eyes y240. Complete heads within cells, shoulders continue to cell bottom. ALL hats match image5: FLAT-TOP Ming WUSHAMAO, low front close to forehead, distinctly HIGHER FLAT rear crown, two thin FLAT OVAL wings extending HORIZONTALLY from the BACK. No rounded dome, western hat, continuous brim or upward imperial wings. MATURE adults32–54. Chinese Ming civil officials; round-collar robes ONLY muted RED, BLUE or GREEN, ABSOLUTELY NO YELLOW/GOLD/OCHRE clothing. Rank patch only a few simple strokes.
Cell1, TOP LEFT, facingLEFT: wide cheekbones with a pointed chin; short neat full beard; bushy brows and wide-set round eyes; flat broad nose and small curved mouth; broad muscular shoulders; ruddy warm skin; a small mole near the right temple; bright scholarly curiosity; robe muted cinnabar RED.
Cell2, TOP RIGHT, facingRIGHT: soft oval face; sparse forked chin beard; short sparse brows and hooded eyes; small straight nose and full softly closed lips; narrow delicate shoulders; olive-golden skin; clear cheek dimples; relaxed sociable ease; robe muted dark jade GREEN.
Cell3, BOTTOM LEFT, facingRIGHT: short broad face with a heavy jaw; heavy downturned moustache and cropped chin beard; high curved brows and very narrow eyes; large rounded nose and a wide thin mouth; stocky shoulders and thick neck; freckled tan skin; a broad crease above the nose; self-assured pride; robe muted cinnabar RED.
Cell4, BOTTOM RIGHT, facingLEFT: very long thin face; long wispy beard; downturned brows and slightly tired eyes; long narrow nose and drooping mouth corners; thin neck and gently sloping shoulders; soft medium beige skin; a small age spot at the left jaw; tired but attentive patience; robe muted azurite BLUE.
~~~

### rev-official-mature-09

| 文件 | 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| assets/art/portraits/ming/official-mature-09.webp | pear-shaped face with a broad lower jaw | short rough stubble | flat broad brows and a close-set steady gaze | high broad bridge and thick closed lips | solid upright shoulders | weathered yellow-ochre skin | several horizontal forehead creases | calm honest firmness |
| assets/art/portraits/ming/official-mature-10.webp | heart-shaped face and tapered chin | thin pencil moustache with no chin hair | uneven brows and long almond eyes | short wide nose and a compact thin mouth | slender straight shoulders | pale warm skin | a shallow dimple in the chin | warm patient kindness |
| assets/art/portraits/ming/official-mature-11.webp | broad diamond face | broad fan-shaped beard | strong angular brows and alert small eyes | large straight nose and pronounced upper lip | plump rounded shoulders | sun-darkened brown skin | one visible dark freckle below the right eye | stern uncompromising resolve |
| assets/art/portraits/ming/official-mature-12.webp | narrow oval face with hollow cheeks | small tuft directly under lower lip | soft curved brows and heavy lower eyelids | slender low nose and a long straight mouth | lean slightly stooped shoulders | cool pale skin | a pronounced crease at one mouth corner | quiet suspicion |

~~~text
Use case: historical-scene. Game portrait asset, Chinese baimiao clean ink lines and light FLAT muted washes, at most one faint shading layer, solid #E3D7BE paper with extremely faint grain. HEAD AND SHOULDERS only, no hands/props/long torso. EYES strictly36–40%, target38%, complete head top12%, face centered, three-quarter off-camera gaze. Compact headwear, no huge forehead space. No text, guides, seals, watermark, frames, actors, photography, anime,3D, glow or intricate embroidery. Images1–4 are established STYLE references; image5 is ONLY approved flat-top hat SHAPE, never copy its face. EXACT EVEN2x2 grid1024x1280, four equal512x640 cells, plain beige gaps. In EACH cell head top y77, eyes y240. Complete heads within cells, shoulders continue to cell bottom. ALL hats match image5: FLAT-TOP Ming WUSHAMAO, low front close to forehead, distinctly HIGHER FLAT rear crown, two thin FLAT OVAL wings extending HORIZONTALLY from the BACK. No rounded dome, western hat, continuous brim or upward imperial wings. MATURE adults32–54. Chinese Ming civil officials; round-collar robes ONLY muted RED, BLUE or GREEN, ABSOLUTELY NO YELLOW/GOLD/OCHRE clothing. Rank patch only a few simple strokes.
Cell1, TOP LEFT, facingLEFT: pear-shaped face with a broad lower jaw; short rough stubble; flat broad brows and a close-set steady gaze; high broad bridge and thick closed lips; solid upright shoulders; weathered yellow-ochre skin; several horizontal forehead creases; calm honest firmness; robe muted azurite BLUE.
Cell2, TOP RIGHT, facingRIGHT: heart-shaped face and tapered chin; thin pencil moustache with no chin hair; uneven brows and long almond eyes; short wide nose and a compact thin mouth; slender straight shoulders; pale warm skin; a shallow dimple in the chin; warm patient kindness; robe muted cinnabar RED.
Cell3, BOTTOM LEFT, facingRIGHT: broad diamond face; broad fan-shaped beard; strong angular brows and alert small eyes; large straight nose and pronounced upper lip; plump rounded shoulders; sun-darkened brown skin; one visible dark freckle below the right eye; stern uncompromising resolve; robe muted azurite BLUE.
Cell4, BOTTOM RIGHT, facingLEFT: narrow oval face with hollow cheeks; small tuft directly under lower lip; soft curved brows and heavy lower eyelids; slender low nose and a long straight mouth; lean slightly stooped shoulders; cool pale skin; a pronounced crease at one mouth corner; quiet suspicion; robe muted dark jade GREEN.
~~~

### rev-official-mature-13

| 文件 | 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| assets/art/portraits/ming/official-mature-13.webp | high narrow forehead and square chin | pointed triangular beard and no moustache | straight fine brows and wide-set long eyes | narrow blunt nose and a broad lower lip | broad muscular shoulders | ruddy warm skin | a slightly uneven eyebrow edge | bright scholarly curiosity |
| assets/art/portraits/ming/official-mature-14.webp | round forehead and tapered jaw | sparse gray-flecked two long moustache tips and sparse gray chin hair | high sparse brows and compact round eyes | wide low bridge and sharply shaped lips | narrow delicate shoulders | olive-golden skin | clear crow-feet, forehead age lines, gray temples and faint nose freckles; visibly53years old | relaxed sociable ease |
| assets/art/portraits/ming/official-mature-15.webp | wide forehead and long straight jaw | close-cropped rounded beard | low heavy brows and a calm sideways gaze | long convex nose and a small tight mouth | stocky shoulders and thick neck | freckled tan skin | gray streaks at both temples | self-assured pride |
| assets/art/portraits/ming/official-mature-16.webp | short angular face with a small chin | sparse irregular cheek and chin hair | light short brows and deep-set downturned eyes | small pointed nose and slightly uneven lips | thin neck and gently sloping shoulders | soft medium beige skin | a small mole just beside the upper lip | tired but attentive patience |

~~~text
Use case: historical-scene. Game portrait asset, Chinese baimiao clean ink lines and light FLAT muted washes, at most one faint shading layer, solid #E3D7BE paper with extremely faint grain. HEAD AND SHOULDERS only, no hands/props/long torso. EYES strictly36–40%, target38%, complete head top12%, face centered, three-quarter off-camera gaze. Compact headwear, no huge forehead space. No text, guides, seals, watermark, frames, actors, photography, anime,3D, glow or intricate embroidery. Images1–4 are established STYLE references; image5 is ONLY approved flat-top hat SHAPE, never copy its face. EXACT EVEN2x2 grid1024x1280, four equal512x640 cells, plain beige gaps. In EACH cell head top y77, eyes y240. Complete heads within cells, shoulders continue to cell bottom. ALL hats match image5: FLAT-TOP Ming WUSHAMAO, low front close to forehead, distinctly HIGHER FLAT rear crown, two thin FLAT OVAL wings extending HORIZONTALLY from the BACK. No rounded dome, western hat, continuous brim or upward imperial wings. MATURE adults32–54. Chinese Ming civil officials; round-collar robes ONLY muted RED, BLUE or GREEN, ABSOLUTELY NO YELLOW/GOLD/OCHRE clothing. Rank patch only a few simple strokes.
Cell1, TOP LEFT, facingLEFT: high narrow forehead and square chin; pointed triangular beard and no moustache; straight fine brows and wide-set long eyes; narrow blunt nose and a broad lower lip; broad muscular shoulders; ruddy warm skin; a slightly uneven eyebrow edge; bright scholarly curiosity; robe muted dark jade GREEN.
Cell2, TOP RIGHT, facingRIGHT: round forehead and tapered jaw; sparse gray-flecked two long moustache tips and sparse gray chin hair; high sparse brows and compact round eyes; wide low bridge and sharply shaped lips; narrow delicate shoulders; olive-golden skin; clear crow-feet, forehead age lines, gray temples and faint nose freckles; visibly53years old; relaxed sociable ease; robe muted azurite BLUE.
Cell3, BOTTOM LEFT, facingRIGHT: wide forehead and long straight jaw; close-cropped rounded beard; low heavy brows and a calm sideways gaze; long convex nose and a small tight mouth; stocky shoulders and thick neck; freckled tan skin; gray streaks at both temples; self-assured pride; robe muted dark jade GREEN.
Cell4, BOTTOM RIGHT, facingLEFT: short angular face with a small chin; sparse irregular cheek and chin hair; light short brows and deep-set downturned eyes; small pointed nose and slightly uneven lips; thin neck and gently sloping shoulders; soft medium beige skin; a small mole just beside the upper lip; tired but attentive patience; robe muted cinnabar RED.
~~~

### rev-official-old-01

| 文件 | 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| assets/art/portraits/ming/official-old-01.webp | broad square face | gray-white short separated moustache and small pointed goatee | slanting long brows and small deep-set eyes | short rounded nose and full lips | solid upright shoulders | weathered yellow-ochre skin | age wrinkles; small mole on the left cheek | calm honest firmness |
| assets/art/portraits/ming/official-old-02.webp | long rectangular face | clean-shaven with white temples | bushy brows and wide-set round eyes | narrow hooked nose and tightly pursed lips | slender straight shoulders | pale warm skin | age wrinkles; one deep vertical line between brows | warm patient kindness |
| assets/art/portraits/ming/official-old-03.webp | full round face | gray-white thick straight moustache only | short sparse brows and hooded eyes | flat broad nose and small curved mouth | plump rounded shoulders | sun-darkened brown skin | age wrinkles; no facial mark and a smooth forehead | stern uncompromising resolve |
| assets/art/portraits/ming/official-old-04.webp | narrow triangular face | gray-white three thin strands of a long beard | high curved brows and very narrow eyes | small straight nose and full softly closed lips | lean slightly stooped shoulders | cool pale skin | age wrinkles; deep smile lines beside the mouth | quiet suspicion |

~~~text
Use case: historical-scene. Game portrait asset, Chinese baimiao clean ink lines and light FLAT muted washes, at most one faint shading layer, solid #E3D7BE paper with extremely faint grain. HEAD AND SHOULDERS only, no hands/props/long torso. EYES strictly36–40%, target38%, complete head top12%, face centered, three-quarter off-camera gaze. Compact headwear, no huge forehead space. No text, guides, seals, watermark, frames, actors, photography, anime,3D, glow or intricate embroidery. Images1–4 are established STYLE references; image5 is ONLY approved flat-top hat SHAPE, never copy its face. EXACT EVEN2x2 grid1024x1280, four equal512x640 cells, plain beige gaps. In EACH cell head top y77, eyes y240. Complete heads within cells, shoulders continue to cell bottom. ALL hats match image5: FLAT-TOP Ming WUSHAMAO, low front close to forehead, distinctly HIGHER FLAT rear crown, two thin FLAT OVAL wings extending HORIZONTALLY from the BACK. No rounded dome, western hat, continuous brim or upward imperial wings. OLDER adults56–75 with gray hair and clear age lines. Chinese Ming civil officials; round-collar robes ONLY muted RED, BLUE or GREEN, ABSOLUTELY NO YELLOW/GOLD/OCHRE clothing. Rank patch only a few simple strokes.
Cell1, TOP LEFT, facingLEFT: broad square face; gray-white short separated moustache and small pointed goatee; slanting long brows and small deep-set eyes; short rounded nose and full lips; solid upright shoulders; weathered yellow-ochre skin; age wrinkles; small mole on the left cheek; calm honest firmness; robe muted cinnabar RED.
Cell2, TOP RIGHT, facingRIGHT: long rectangular face; clean-shaven with white temples; bushy brows and wide-set round eyes; narrow hooked nose and tightly pursed lips; slender straight shoulders; pale warm skin; age wrinkles; one deep vertical line between brows; warm patient kindness; robe muted azurite BLUE.
Cell3, BOTTOM LEFT, facingRIGHT: full round face; gray-white thick straight moustache only; short sparse brows and hooded eyes; flat broad nose and small curved mouth; plump rounded shoulders; sun-darkened brown skin; age wrinkles; no facial mark and a smooth forehead; stern uncompromising resolve; robe muted dark jade GREEN.
Cell4, BOTTOM RIGHT, facingLEFT: narrow triangular face; gray-white three thin strands of a long beard; high curved brows and very narrow eyes; small straight nose and full softly closed lips; lean slightly stooped shoulders; cool pale skin; age wrinkles; deep smile lines beside the mouth; quiet suspicion; robe muted azurite BLUE.
~~~

### rev-official-old-05

| 文件 | 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| assets/art/portraits/ming/official-old-05.webp | wide cheekbones with a pointed chin | gray-white short neat full beard | downturned brows and slightly tired eyes | large rounded nose and a wide thin mouth | broad muscular shoulders | ruddy warm skin | age wrinkles; a small mole near the right temple | bright scholarly curiosity |
| assets/art/portraits/ming/official-old-06.webp | soft oval face | gray-white sparse forked chin beard | flat broad brows and a close-set steady gaze | long narrow nose and drooping mouth corners | narrow delicate shoulders | olive-golden skin | age wrinkles; clear cheek dimples | relaxed sociable ease |
| assets/art/portraits/ming/official-old-07.webp | short broad face with a heavy jaw | gray-white heavy downturned moustache and cropped chin beard | uneven brows and long almond eyes | high broad bridge and thick closed lips | stocky shoulders and thick neck | freckled tan skin | age wrinkles; a broad crease above the nose | self-assured pride |
| assets/art/portraits/ming/official-old-08.webp | very long thin face | gray-white long wispy beard | strong angular brows and alert small eyes | short wide nose and a compact thin mouth | thin neck and gently sloping shoulders | soft medium beige skin | age wrinkles; a small age spot at the left jaw | tired but attentive patience |

~~~text
Use case: historical-scene. Game portrait asset, Chinese baimiao clean ink lines and light FLAT muted washes, at most one faint shading layer, solid #E3D7BE paper with extremely faint grain. HEAD AND SHOULDERS only, no hands/props/long torso. EYES strictly36–40%, target38%, complete head top12%, face centered, three-quarter off-camera gaze. Compact headwear, no huge forehead space. No text, guides, seals, watermark, frames, actors, photography, anime,3D, glow or intricate embroidery. Images1–4 are established STYLE references; image5 is ONLY approved flat-top hat SHAPE, never copy its face. EXACT EVEN2x2 grid1024x1280, four equal512x640 cells, plain beige gaps. In EACH cell head top y77, eyes y240. Complete heads within cells, shoulders continue to cell bottom. ALL hats match image5: FLAT-TOP Ming WUSHAMAO, low front close to forehead, distinctly HIGHER FLAT rear crown, two thin FLAT OVAL wings extending HORIZONTALLY from the BACK. No rounded dome, western hat, continuous brim or upward imperial wings. OLDER adults56–75 with gray hair and clear age lines. Chinese Ming civil officials; round-collar robes ONLY muted RED, BLUE or GREEN, ABSOLUTELY NO YELLOW/GOLD/OCHRE clothing. Rank patch only a few simple strokes.
Cell1, TOP LEFT, facingLEFT: wide cheekbones with a pointed chin; gray-white short neat full beard; downturned brows and slightly tired eyes; large rounded nose and a wide thin mouth; broad muscular shoulders; ruddy warm skin; age wrinkles; a small mole near the right temple; bright scholarly curiosity; robe muted azurite BLUE.
Cell2, TOP RIGHT, facingRIGHT: soft oval face; gray-white sparse forked chin beard; flat broad brows and a close-set steady gaze; long narrow nose and drooping mouth corners; narrow delicate shoulders; olive-golden skin; age wrinkles; clear cheek dimples; relaxed sociable ease; robe muted dark jade GREEN.
Cell3, BOTTOM LEFT, facingRIGHT: short broad face with a heavy jaw; gray-white heavy downturned moustache and cropped chin beard; uneven brows and long almond eyes; high broad bridge and thick closed lips; stocky shoulders and thick neck; freckled tan skin; age wrinkles; a broad crease above the nose; self-assured pride; robe muted cinnabar RED.
Cell4, BOTTOM RIGHT, facingLEFT: very long thin face; gray-white long wispy beard; strong angular brows and alert small eyes; short wide nose and a compact thin mouth; thin neck and gently sloping shoulders; soft medium beige skin; age wrinkles; a small age spot at the left jaw; tired but attentive patience; robe muted dark jade GREEN.
~~~

### rev-official-old-09

| 文件 | 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| assets/art/portraits/ming/official-old-09.webp | pear-shaped face with a broad lower jaw | gray-white short rough stubble | soft curved brows and heavy lower eyelids | large straight nose and pronounced upper lip | solid upright shoulders | weathered yellow-ochre skin | age wrinkles; several horizontal forehead creases | calm honest firmness |
| assets/art/portraits/ming/official-old-10.webp | heart-shaped face and tapered chin | gray-white thin pencil moustache with no chin hair | straight fine brows and wide-set long eyes | slender low nose and a long straight mouth | slender straight shoulders | pale warm skin | age wrinkles; a shallow dimple in the chin | warm patient kindness |

~~~text
Use case: historical-scene. Game portrait asset, Chinese baimiao clean ink lines and light FLAT muted washes, at most one faint shading layer, solid #E3D7BE paper with extremely faint grain. HEAD AND SHOULDERS only, no hands/props/long torso. EYES strictly36–40%, target38%, complete head top12%, face centered, three-quarter off-camera gaze. Compact headwear, no huge forehead space. No text, guides, seals, watermark, frames, actors, photography, anime,3D, glow or intricate embroidery. Images1–4 are established STYLE references; image5 is ONLY approved flat-top hat SHAPE, never copy its face. EXACT EVEN2x2 grid1024x1280, four equal512x640 cells, plain beige gaps. In EACH cell head top y77, eyes y240. Complete heads within cells, shoulders continue to cell bottom. ALL hats match image5: FLAT-TOP Ming WUSHAMAO, low front close to forehead, distinctly HIGHER FLAT rear crown, two thin FLAT OVAL wings extending HORIZONTALLY from the BACK. No rounded dome, western hat, continuous brim or upward imperial wings. OLDER adults56–75 with gray hair and clear age lines. Chinese Ming civil officials; round-collar robes ONLY muted RED, BLUE or GREEN, ABSOLUTELY NO YELLOW/GOLD/OCHRE clothing. Rank patch only a few simple strokes.
Cell1, TOP LEFT, facingLEFT: pear-shaped face with a broad lower jaw; gray-white short rough stubble; soft curved brows and heavy lower eyelids; large straight nose and pronounced upper lip; solid upright shoulders; weathered yellow-ochre skin; age wrinkles; several horizontal forehead creases; calm honest firmness; robe muted dark jade GREEN.
Cell2, TOP RIGHT, facingRIGHT: heart-shaped face and tapered chin; gray-white thin pencil moustache with no chin hair; straight fine brows and wide-set long eyes; slender low nose and a long straight mouth; slender straight shoulders; pale warm skin; age wrinkles; a shallow dimple in the chin; warm patient kindness; robe muted cinnabar RED.
All remaining cells stay EMPTY #E3D7BE, no extra people.
~~~

### rev-consort-female

| 文件 | 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| assets/art/portraits/ming/consort-regular-02.webp | soft oval face | high arched hairline; low compact bun under a small Ming hair crown | soft long curved feminine brows and small gently hooded almond eyes | long narrow nose and drooping mouth corners | plump rounded shoulders | sun-darkened brown skin | a broad crease above the nose | stern uncompromising resolve |
| assets/art/portraits/ming/consort-regular-03.webp | short broad face with a heavy jaw | straight low hairline; twin small rounded bun loops under a tiny hair crown | short fine softly arched feminine brows and soft hooded eyes | short wide nose and a compact thin mouth | lean slightly stooped shoulders | cool pale skin | several horizontal forehead creases | quiet suspicion |
| assets/art/portraits/ming/consort-regular-06.webp | heart-shaped face and tapered chin | rounded high forehead; a compact oval bun with a low Ming hair crown | soft curved feminine brows and rounder gently lowered almond eyes | small pointed nose and slightly uneven lips | stocky shoulders and thick neck | freckled tan skin | gray streaks at both temples | self-assured pride |

~~~text
Use case: historical-scene. Game portrait asset, Chinese baimiao clean ink lines and light FLAT muted washes, at most one faint shading layer, solid #E3D7BE paper with extremely faint grain. HEAD AND SHOULDERS only, no hands/props/long torso. EYES strictly36–40%, target38%, complete head top12%, face centered, three-quarter off-camera gaze. Compact headwear, no huge forehead space. No text, guides, seals, watermark, frames, actors, photography, anime,3D, glow or intricate embroidery. Images1–4 are established STYLE references; image5 is ONLY approved flat-top hat SHAPE, never copy its face. EXACT EVEN2x2 grid1024x1280, four equal512x640 cells, plain beige gaps. In EACH cell head top y77, eyes y240. Complete heads within cells, shoulders continue to cell bottom. Three ADULT WOMEN, unmistakably feminine faces with soft feminine brows/eyes, naturally rounded female jaw edges and cheeks, no masculine facial structure/hair. Preserve different face SHAPES, hairlines, marks, nose/mouth, builds, skin tones and expressions. Modest Ming standing/crossed-collar AO jackets, small jiuji buns/hair crowns, no phoenix crown.
Cell1, TOP LEFT, facingLEFT: soft oval face; high arched hairline; low compact bun under a small Ming hair crown; soft long curved feminine brows and small gently hooded almond eyes; long narrow nose and drooping mouth corners; plump rounded shoulders; sun-darkened brown skin; a broad crease above the nose; stern uncompromising resolve.
Cell2, TOP RIGHT, facingRIGHT: short broad face with a heavy jaw; straight low hairline; twin small rounded bun loops under a tiny hair crown; short fine softly arched feminine brows and soft hooded eyes; short wide nose and a compact thin mouth; lean slightly stooped shoulders; cool pale skin; several horizontal forehead creases; quiet suspicion.
Cell3, BOTTOM LEFT, facingRIGHT: heart-shaped face and tapered chin; rounded high forehead; a compact oval bun with a low Ming hair crown; soft curved feminine brows and rounder gently lowered almond eyes; small pointed nose and slightly uneven lips; stocky shoulders and thick neck; freckled tan skin; gray streaks at both temples; self-assured pride.
All remaining cells stay EMPTY #E3D7BE, no extra people.
~~~

### rev-consort-phoenix

| 文件 | 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| assets/art/portraits/ming/consort-high-01.webp | broad oval face | low straight hairline; low compact bun under a small outlined Ming phoenix crown | thick gently curved eyebrows and wide almond eyes | broad straight nose and full firmly closed lips | full dignified shoulders | warm ivory skin | small mole under left eye | quiet authoritative composure |
| assets/art/portraits/ming/consort-high-02.webp | long narrow face | high rounded hairline; medium-height bun under a low simple Ming phoenix crown | fine level brows and long slightly downturned eyes | small high nose and thin soft lips | slender upright shoulders | pale beige skin | a shallow dimple beside the mouth | thoughtful reserve |
| assets/art/portraits/ming/consort-high-03.webp | round face with a short chin | widow peak hairline; high round bun with an airy outline of a Ming phoenix crown | short angular brows and large bright eyes | short rounded nose and broad small mouth | stocky graceful shoulders | soft golden tan skin | no marks, smooth cheeks | warm confident openness |

~~~text
Use case: historical-scene. Game portrait asset, Chinese baimiao clean ink lines and light FLAT muted washes, at most one faint shading layer, solid #E3D7BE paper with extremely faint grain. HEAD AND SHOULDERS only, no hands/props/long torso. EYES strictly36–40%, target38%, complete head top12%, face centered, three-quarter off-camera gaze. Compact headwear, no huge forehead space. No text, guides, seals, watermark, frames, actors, photography, anime,3D, glow or intricate embroidery. Images1–4 are established STYLE references; image5 is ONLY approved flat-top hat SHAPE, never copy its face. EXACT EVEN2x2 grid1024x1280, four equal512x640 cells, plain beige gaps. In EACH cell head top y77, eyes y240. Complete heads within cells, shoulders continue to cell bottom. Three HIGH-RANKING CONSORT WOMEN in Ming ao jackets. Each wears unmistakable PHOENIX CROWN: a visible GOLD PHOENIX BIRD with curved neck/beak and OUTSPREAD WINGS across crown; two or three short hanging strands of ROUND PEARLS at sides. Clear bird-and-pearl SILHOUETTE, not small plain hair clip or round bun cap. Simplify lines and pearl dots; broad compact crown leaves high eye line.
Cell1, TOP LEFT, facingLEFT: broad oval face; low straight hairline; low compact bun under a small outlined Ming phoenix crown; thick gently curved eyebrows and wide almond eyes; broad straight nose and full firmly closed lips; full dignified shoulders; warm ivory skin; small mole under left eye; quiet authoritative composure.
Cell2, TOP RIGHT, facingRIGHT: long narrow face; high rounded hairline; medium-height bun under a low simple Ming phoenix crown; fine level brows and long slightly downturned eyes; small high nose and thin soft lips; slender upright shoulders; pale beige skin; a shallow dimple beside the mouth; thoughtful reserve.
Cell3, BOTTOM LEFT, facingRIGHT: round face with a short chin; widow peak hairline; high round bun with an airy outline of a Ming phoenix crown; short angular brows and large bright eyes; short rounded nose and broad small mouth; stocky graceful shoulders; soft golden tan skin; no marks, smooth cheeks; warm confident openness.
All remaining cells stay EMPTY #E3D7BE, no extra people.
~~~

### rev-princess-female

| 文件 | 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| assets/art/portraits/ming/princess-adult-01.webp | short broad face with a heavy jaw | straight low hairline; twin small rounded bun loops under a tiny hair crown | short fine softly arched feminine brows and soft hooded almond eyes | short wide nose and a compact thin mouth | lean slightly stooped shoulders | cool pale skin | tiny mole near left outer brow; smooth youthful forehead, no age wrinkles | quiet suspicion |

~~~text
Use case: historical-scene. Game portrait asset, Chinese baimiao clean ink lines and light FLAT muted washes, at most one faint shading layer, solid #E3D7BE paper with extremely faint grain. HEAD AND SHOULDERS only, no hands/props/long torso. EYES strictly36–40%, target38%, complete head top12%, face centered, three-quarter off-camera gaze. Compact headwear, no huge forehead space. No text, guides, seals, watermark, frames, actors, photography, anime,3D, glow or intricate embroidery. Images1–4 are established STYLE references; image5 is ONLY approved flat-top hat SHAPE, never copy its face. EXACT EVEN2x2 grid1024x1280, four equal512x640 cells, plain beige gaps. In EACH cell head top y77, eyes y240. Complete heads within cells, shoulders continue to cell bottom. One19-year-old YOUNG ADULT WOMAN, clearly FEMALE with soft fine brows, gentle almond eyes, rounded female jaw edges despite naturally broad short face. Preserve low hairline/twin small bun loops/tiny crown, short wide nose, compact thin mouth, pale skin and reserved expression. Blue Ming standing-collar ao, no masculine angular cheeks or old wrinkles.
Cell1, TOP LEFT, facingLEFT: short broad face with a heavy jaw; straight low hairline; twin small rounded bun loops under a tiny hair crown; short fine softly arched feminine brows and soft hooded almond eyes; short wide nose and a compact thin mouth; lean slightly stooped shoulders; cool pale skin; tiny mole near left outer brow; smooth youthful forehead, no age wrinkles; quiet suspicion.
All remaining cells stay EMPTY #E3D7BE, no extra people.
~~~

### rev-scholar-contrast

| 文件 | 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| assets/art/portraits/shared/scholar-young-01.webp | long rectangular face | fully clean-shaven; soft folded cloth rujin only | fine level brows and large open eyes | long high nose and a broad soft mouth | slender straight shoulders | pale warm skin | one deep vertical line between brows | warm patient kindness |
| assets/art/portraits/shared/scholar-young-04.webp | broad square face with wide heavy lower jaw | short dense rounded full cheek-and-chin beard with small joined moustache; soft cloth rujin | straight fine brows and wide-set long eyes | narrow blunt nose and a broad lower lip | very stocky broad shoulders and thick neck | deep warm brown tan skin | a slightly uneven eyebrow edge | bright scholarly curiosity |

~~~text
Use case: historical-scene. Game portrait asset, Chinese baimiao clean ink lines and light FLAT muted washes, at most one faint shading layer, solid #E3D7BE paper with extremely faint grain. HEAD AND SHOULDERS only, no hands/props/long torso. EYES strictly36–40%, target38%, complete head top12%, face centered, three-quarter off-camera gaze. Compact headwear, no huge forehead space. No text, guides, seals, watermark, frames, actors, photography, anime,3D, glow or intricate embroidery. Images1–4 are established STYLE references; image5 is ONLY approved flat-top hat SHAPE, never copy its face. EXACT EVEN2x2 grid1024x1280, four equal512x640 cells, plain beige gaps. In EACH cell head top y77, eyes y240. Complete heads within cells, shoulders continue to cell bottom. Two young adult male scholars22/28, SOFT CLOTH RUJIN and plain crossed-collar robes, no official hat/wings/crown/patch. LEFT slim PALE long-faced FULLY CLEAN-SHAVEN. RIGHT very STOCKY DARK-TAN broad SQUARE face with DENSE SHORT FULL CHEEK/CHIN BEARD. Clearly different silhouettes, beard, shoulders, skin and brows at44px.
Cell1, TOP LEFT, facingLEFT: long rectangular face; fully clean-shaven; soft folded cloth rujin only; fine level brows and large open eyes; long high nose and a broad soft mouth; slender straight shoulders; pale warm skin; one deep vertical line between brows; warm patient kindness.
Cell2, TOP RIGHT, facingRIGHT: broad square face with wide heavy lower jaw; short dense rounded full cheek-and-chin beard with small joined moustache; soft cloth rujin; straight fine brows and wide-set long eyes; narrow blunt nose and a broad lower lip; very stocky broad shoulders and thick neck; deep warm brown tan skin; a slightly uneven eyebrow edge; bright scholarly curiosity.
All remaining cells stay EMPTY #E3D7BE, no extra people.
~~~

### rev-wanli-old

| 文件 | 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| assets/art/portraits/unique/ming-wanli/emperor-01-old.webp | broad round face retaining the childhood wide cheeks and short chin, now full lower cheeks | neat short moustache and small tapered beard, a few early gray strands at the temples | the same gently arched brows and long hooded eyes, with restrained age lines | the same broad round-tipped nose and full lower lip | full upright adult shoulders | pale warm golden skin | the SAME tiny freckle near the outer right brow | quiet self-contained authority and measured restraint; visibly48years old |

~~~text
Use case: historical-scene. Game portrait asset, Chinese baimiao clean ink lines and light FLAT muted washes, at most one faint shading layer, solid #E3D7BE paper with extremely faint grain. HEAD AND SHOULDERS only, no hands/props/long torso. EYES strictly36–40%, target38%, complete head top12%, face centered, three-quarter off-camera gaze. Compact headwear, no huge forehead space. No text, guides, seals, watermark, frames, actors, photography, anime,3D, glow or intricate embroidery. Images1–4 are established STYLE references; image5 is ONLY approved flat-top hat SHAPE, never copy its face. ONE SINGLE older48-year-old Ming emperor, NO GRID. Image6 SAME-PERSON identity reference. Make MUCH MORE CORPULENT: full round cheeks, heavier lower face, obvious soft DOUBLE CHIN, thick neck, broad PLUMP shoulders. Retain arched hooded eyes, round-tipped broad nose, full lower lip, tiny outer-right-brow freckle, neat moustache/small tapered beard, left gaze. Black Ming YISHANGUAN with TWO upright folded-back rear wings immediately behind crown, NO horizontal official wings. Muted yellow round-collar dragon robe. Subtle gray temples. Eyes38%, crown top12%, complete head and shoulders. Plain beige1024x1280.
~~~

### rev-foreign-east

| 文件 | 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| assets/art/portraits/shared/foreign-east-01.webp | short broad face with a rounded chin | sparse neat moustache with a tiny separated chin tuft | soft sloping brows and long downturned eyes | low broad nose and a small full mouth | full gently rounded shoulders | pale warm skin | small mole below the left eye | polite cautious attention |
| assets/art/portraits/shared/foreign-east-02.webp | very long oval face with hollow cheeks | a medium-length gray three-strand beard | fine high brows and narrow slightly hooded eyes | long high nose and thin firmly closed lips | lean slightly stooped shoulders | medium golden beige skin | subtle lines beside the mouth | quiet scholarly gravity |

~~~text
Use case: historical-scene. Game portrait asset, Chinese baimiao clean ink lines and light FLAT muted washes, at most one faint shading layer, solid #E3D7BE paper with extremely faint grain. HEAD AND SHOULDERS only, no hands/props/long torso. EYES strictly36–40%, target38%, complete head top12%, face centered, three-quarter off-camera gaze. Compact headwear, no huge forehead space. No text, guides, seals, watermark, frames, actors, photography, anime,3D, glow or intricate embroidery. Images1–4 are established STYLE references; image5 is ONLY approved flat-top hat SHAPE, never copy its face. EXACT EVEN2x2 grid1024x1280, four equal512x640 cells, plain beige gaps. In EACH cell head top y77, eyes y240. Complete heads within cells, shoulders continue to cell bottom. Two adult SEA-EAST FOREIGN RULERS, dignified natural faces, IMMEDIATELY DIFFERENT from Ming scholars. No rujin, wushamao or rank patch. LEFT: TALL rigid black narrow RIBBED ceremonial crown with upright rectangular profile and short rear ribbons; deep teal broad formal outer robe, very WIDE WHITE layered crossed collar, broad burgundy shoulder bands. RIGHT: TALL black folded CONE-LIKE ceremonial EBOSHI silhouette and visible rear neck cord; dark burgundy wide formal outer robe over WHITE crossed collar, no Chinese round-collar robe. Broad sea-east cultural cues, no fantasy or ethnic caricature.
Cell1, TOP LEFT, facingLEFT: short broad face with a rounded chin; sparse neat moustache with a tiny separated chin tuft; soft sloping brows and long downturned eyes; low broad nose and a small full mouth; full gently rounded shoulders; pale warm skin; small mole below the left eye; polite cautious attention.
Cell2, TOP RIGHT, facingRIGHT: very long oval face with hollow cheeks; a medium-length gray three-strand beard; fine high brows and narrow slightly hooded eyes; long high nose and thin firmly closed lips; lean slightly stooped shoulders; medium golden beige skin; subtle lines beside the mouth; quiet scholarly gravity.
Bottom two cells EMPTY beige.
~~~

### 审图修订稿构图复检

以下保持人物与冠服，修正偏低眼线；常位02继续柔化眉弓，并明确袄领。万历老像只传四张画风图加同人像，共5张参考。

#### rev-official-mature-01

~~~text
Edit ONLY FRAMING of this existing2x2 grid; preserve all faces, facial hair, marks, expressions, ages, facing directions, red/blue/green robes and the approved FLAT-TOP FRONT-LOW REAR-HIGH wushamao with thin oval wings extending horizontally from the BACK. All occupied cells currently have eyes too low because caps are too tall. Make caps noticeably SHORTER vertically while keeping complete cap tops12% down from EACH cell top. Raise each whole face/head until BOTH eye centers lie at38% of its cell height, within36–40%. On a1122x1402 grid that means eye line at y263 within each701-high cell, not y290–320. Compact flat stepped caps, natural face anatomy, shoulders continue to cell bottom. Same exact number of people, empty cells stay empty. Do not add text, guides, ornaments, actors, new identities or yellow robes. Preserve plain #E3D7BE and clean baimiao flat washes.
~~~

#### rev-official-mature-05

~~~text
Edit ONLY FRAMING of this existing2x2 grid; preserve all faces, facial hair, marks, expressions, ages, facing directions, red/blue/green robes and the approved FLAT-TOP FRONT-LOW REAR-HIGH wushamao with thin oval wings extending horizontally from the BACK. All occupied cells currently have eyes too low because caps are too tall. Make caps noticeably SHORTER vertically while keeping complete cap tops12% down from EACH cell top. Raise each whole face/head until BOTH eye centers lie at38% of its cell height, within36–40%. On a1122x1402 grid that means eye line at y263 within each701-high cell, not y290–320. Compact flat stepped caps, natural face anatomy, shoulders continue to cell bottom. Same exact number of people, empty cells stay empty. Do not add text, guides, ornaments, actors, new identities or yellow robes. Preserve plain #E3D7BE and clean baimiao flat washes.
~~~

#### rev-official-mature-09

~~~text
Edit ONLY FRAMING of this existing2x2 grid; preserve all faces, facial hair, marks, expressions, ages, facing directions, red/blue/green robes and the approved FLAT-TOP FRONT-LOW REAR-HIGH wushamao with thin oval wings extending horizontally from the BACK. All occupied cells currently have eyes too low because caps are too tall. Make caps noticeably SHORTER vertically while keeping complete cap tops12% down from EACH cell top. Raise each whole face/head until BOTH eye centers lie at38% of its cell height, within36–40%. On a1122x1402 grid that means eye line at y263 within each701-high cell, not y290–320. Compact flat stepped caps, natural face anatomy, shoulders continue to cell bottom. Same exact number of people, empty cells stay empty. Do not add text, guides, ornaments, actors, new identities or yellow robes. Preserve plain #E3D7BE and clean baimiao flat washes.
~~~

#### rev-official-mature-13

~~~text
Edit ONLY FRAMING of this existing2x2 grid; preserve all faces, facial hair, marks, expressions, ages, facing directions, red/blue/green robes and the approved FLAT-TOP FRONT-LOW REAR-HIGH wushamao with thin oval wings extending horizontally from the BACK. All occupied cells currently have eyes too low because caps are too tall. Make caps noticeably SHORTER vertically while keeping complete cap tops12% down from EACH cell top. Raise each whole face/head until BOTH eye centers lie at38% of its cell height, within36–40%. On a1122x1402 grid that means eye line at y263 within each701-high cell, not y290–320. Compact flat stepped caps, natural face anatomy, shoulders continue to cell bottom. Same exact number of people, empty cells stay empty. Do not add text, guides, ornaments, actors, new identities or yellow robes. Preserve plain #E3D7BE and clean baimiao flat washes.
~~~

#### rev-official-old-01

~~~text
Edit ONLY FRAMING of this existing2x2 grid; preserve all faces, facial hair, marks, expressions, ages, facing directions, red/blue/green robes and the approved FLAT-TOP FRONT-LOW REAR-HIGH wushamao with thin oval wings extending horizontally from the BACK. All occupied cells currently have eyes too low because caps are too tall. Make caps noticeably SHORTER vertically while keeping complete cap tops12% down from EACH cell top. Raise each whole face/head until BOTH eye centers lie at38% of its cell height, within36–40%. On a1122x1402 grid that means eye line at y263 within each701-high cell, not y290–320. Compact flat stepped caps, natural face anatomy, shoulders continue to cell bottom. Same exact number of people, empty cells stay empty. Do not add text, guides, ornaments, actors, new identities or yellow robes. Preserve plain #E3D7BE and clean baimiao flat washes.
~~~

#### rev-official-old-05

~~~text
Edit ONLY FRAMING of this existing2x2 grid; preserve all faces, facial hair, marks, expressions, ages, facing directions, red/blue/green robes and the approved FLAT-TOP FRONT-LOW REAR-HIGH wushamao with thin oval wings extending horizontally from the BACK. All occupied cells currently have eyes too low because caps are too tall. Make caps noticeably SHORTER vertically while keeping complete cap tops12% down from EACH cell top. Raise each whole face/head until BOTH eye centers lie at38% of its cell height, within36–40%. On a1122x1402 grid that means eye line at y263 within each701-high cell, not y290–320. Compact flat stepped caps, natural face anatomy, shoulders continue to cell bottom. Same exact number of people, empty cells stay empty. Do not add text, guides, ornaments, actors, new identities or yellow robes. Preserve plain #E3D7BE and clean baimiao flat washes.
~~~

#### rev-official-old-09

~~~text
Edit ONLY FRAMING of this existing2x2 grid; preserve all faces, facial hair, marks, expressions, ages, facing directions, red/blue/green robes and the approved FLAT-TOP FRONT-LOW REAR-HIGH wushamao with thin oval wings extending horizontally from the BACK. All occupied cells currently have eyes too low because caps are too tall. Make caps noticeably SHORTER vertically while keeping complete cap tops12% down from EACH cell top. Raise each whole face/head until BOTH eye centers lie at38% of its cell height, within36–40%. On a1122x1402 grid that means eye line at y263 within each701-high cell, not y290–320. Compact flat stepped caps, natural face anatomy, shoulders continue to cell bottom. Same exact number of people, empty cells stay empty. Do not add text, guides, ornaments, actors, new identities or yellow robes. Preserve plain #E3D7BE and clean baimiao flat washes.
~~~

#### rev-consort-female

~~~text
Edit these SAME THREE Ming adult WOMEN. TOP-LEFT is still too masculine: make brows thin, soft and gently curved, remove hard angular brow ridge, soften feminine cheeks and jaw edges while preserving her soft OVAL face, high arched hairline, long narrow nose, drooping mouth corners, brown skin, broad faint nasal crease and resolute expression. TOP-RIGHT remains short-broad-faced with a heavy but softly rounded FEMALE jaw, pale skin, fine brows/hooded eyes and low hairline; BOTTOM-LEFT remains heart-faced/tapered-chin, freckled tan with a little gray at temples, soft curved brows and pride. ALL wear clearly Ming VERTICAL-STANDING-COLLAR or CROSSED-COLLAR AO jackets, no male round-collar official robe. Keep small hair crowns/buns and pins, no phoenix crown. Also reframe eye centers to38% of EACH cell and hair tops12%, compact hairstyles, head and shoulders only. Preserve distinct builds/marks and plain paper; bottom-right stays empty. No text or guides.
~~~

#### rev-consort-phoenix

~~~text
Edit only FRAMING of this2x2 grid of THREE Ming women in PHOENIX CROWNS. Preserve all three different faces, feminine features, gazes, Ming ao, crown GOLD BIRD shape with beak/neck/OUTSPREAD WINGS and short PEARL STRANDS. The crown/forehead space is too tall and eyes too low. Make each crown vertically more COMPACT while retaining a broad unmistakable phoenix-and-pearl silhouette. Full crown top12% below EACH cell top, BOTH EYES at38% (within36–40%), shoulders fill cell bottom. Natural face proportions; do not simply move eyes within faces. Empty bottom-right remains plain beige. Same identity/style/colors, no text, guides or extra decoration.
~~~

#### rev-princess-female

~~~text
Reframe this SAME single young adult Ming princess occupying the TOP-LEFT cell of a2x2 grid. Preserve clearly feminine broad short face, soft fine brows, hooded almond eyes, rounded female jaw, small nose/mouth, pale skin, tiny brow mole, twin bun loops and tiny crown, blue standing-collar ao, left gaze and reserved expression. The eye line is too low. Move whole face/head UP and compact bun/forehead space so eye centers are at38% of the TOP-LEFT cell height, hair/crown top12%; natural proportions. Other THREE cells stay EMPTY beige paper. Clean ink lines/flat muted color, no text/guides, no extra person or ornament.
~~~

#### rev-foreign-east

~~~text
Correct FRAMING ONLY of these SAME TWO sea-east FOREIGN RULERS in TOP cells of a2x2 grid. Preserve faces, beards, left/right gaze, LEFT ribbed upright narrow ceremonial crown and rear ribbons/teal robe/broad white crossed collar, RIGHT folded CONE EBOSHI and rear cord/burgundy robe/white collar. They must remain clearly different from Ming scholars. SHORTEN the tall crowns vertically so their COMPLETE tops are12% down from each cell top, and raise the faces until BOTH EYES are at38% of cell height, within36–40%. Keep ceremonial shapes recognizable, no rujin or Ming wushamao. Empty bottom row stays beige. Natural anatomy, same clean baimiao flat washes, no text or guides.
~~~

#### 万历老年像实际提示词

~~~text
Use case: historical-scene. Game portrait asset, Chinese baimiao clean ink lines and light FLAT muted washes, at most one faint shading layer, solid #E3D7BE paper with extremely faint grain. HEAD AND SHOULDERS only, no hands/props/long torso. EYES strictly36–40%, target38%, complete head top12%, face centered, three-quarter off-camera gaze. Compact headwear, no huge forehead space. No text, guides, seals, watermark, frames, actors, photography, anime,3D, glow or intricate embroidery. Images1–4 are established STYLE references; image5 is the SAME-PERSON emperor identity reference, not an official hat reference. ONE SINGLE older48-year-old Ming emperor, NO GRID. Image5 SAME-PERSON identity reference. Make MUCH MORE CORPULENT: full round cheeks, heavier lower face, obvious soft DOUBLE CHIN, thick neck, broad PLUMP shoulders. Retain arched hooded eyes, round-tipped broad nose, full lower lip, tiny outer-right-brow freckle, neat moustache/small tapered beard, left gaze. Black Ming YISHANGUAN with TWO upright folded-back rear wings immediately behind crown, NO horizontal official wings. Muted yellow round-collar dragon robe. Subtle gray temples. Eyes38%, crown top12%, complete head and shoulders. Plain beige1024x1280.
~~~


### 女性像最终眼线与留白复核

#### rev-consort-female

~~~text
Edit ONLY COMPOSITION, no age, identity or clothing change. Preserve all THREE clearly FEMALE faces and all differences, feminine brows/jaws, Ming crossed-collar ao and buns. ONLY TOP TWO portraits: redraw at87% of current size anchored to TOP CENTER of their cell, extending plain clothing to bottom. This raises their low eye line to38% while hair tops remain about12%. BOTTOM-LEFT stays unchanged; bottom-right empty. Equal2x2 layout, clean baimiao lines/flat dilute colors, faint grain. No added people, text, guides, borders, scenery or ornaments.
~~~

#### rev-consort-phoenix

~~~text
Edit ONLY COMPOSITION, no age, identity or clothing change. Preserve the THREE SAME women, distinct faces and broad GOLD PHOENIX BIRDS with PEARL STRANDS, ao colors and poses. In EACH occupied cell, redraw the portrait at85% of its current size anchored to top-center, THEN place it25pixels lower within its cell. This yields crown top about12% and eyes38–40%; extend clothing to bottom. Keep phoenix silhouette large enough to identify, no replacement with plain hair crown. Bottom-right empty. Equal2x2 layout, clean baimiao lines/flat dilute colors, faint grain. No added people, text, guides, borders, scenery or ornaments.
~~~

#### rev-princess-female

~~~text
Edit ONLY COMPOSITION, no age, identity or clothing change. Preserve this SAME clearly feminine19-year-old broad-faced princess, soft brows/eyes, tiny brow mole, twin bun loops/tiny hair crown and blue standing-collar ao. Only occupied TOP-LEFT portrait: redraw at80% of current size anchored to top-center of that cell, THEN position it50pixels lower. This yields crown top12% and eye line38%; extend simple clothing to cell bottom. The other THREE cells remain EMPTY beige. Equal2x2 layout, clean baimiao lines/flat dilute colors, faint grain. No added people, text, guides, borders, scenery or ornaments.
~~~


## 2026-11-06 一期余量 · 37张专属像与14张场景／题图

修订对照展示后按授权继续。专属像的姓名、年龄、官职、性格与秘密依据src/core/scenarios.js；以下具体五官为视觉设计，不声称史实容貌，不借用演员。崇祯老年像为游戏≥40岁年龄档，沿用开局同人特征。李太后、懿安皇后采用黑发成年女性仪态，不套用通用老年太后。外邦只取衣冠大意，仪态平等；不把国别与政治秘密画成夸张面貌。每张专属像单独生成，全部实际提示词如下。

### new-ming-chongzhen-emperor-01 · 朱由检

剧本依据：['朱由检', 17, '65 60 45 65 50', '多疑']

| 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| long narrow youthful oval face and small firm chin | clean-shaven youthful face under black yishanguan | fine straight brows slightly drawn inward and long wary eyes | narrow straight nose and thin closed lips | slender upright adolescent shoulders | pale warm skin | tiny subtle mole below left mouth corner | serious tense guarded attention |

~~~text
Use case: historical-scene. ONE SINGLE character portrait for a Chinese historical atlas game,1024x1280, no grid. Images1–4 STYLE ONLY: clean Chinese baimiao ink lines, light FLAT muted washes, at most one faint shading layer, simple major folds, extremely faint paper grain. Plain solid #E3D7BE. HEAD AND SHOULDERS ONLY, no hands, props or long torso. Complete head/hat top12%, BOTH EYE CENTERS exactly38% (strictly36–40%), face centered, three-quarter gaze slightly off camera. COMPACT headwear: hat bottom near26% so eyes stay HIGH, no oversized crown/forehead gap. Simplified costume, no dense patterns. No words, Chinese characters, labels, seals, watermark, frame, guides, actor/TV likeness, anime, photography,3D, glow, nudity, weapons or blood. Ming emperor in muted YELLOW round-collar dragon robe indicated by only a few simple lines, compact black YISHANGUAN with TWO rear wings folded UPWARD behind crown, no horizontal official wings.  Real17-year-old older adolescent face, youthful skin and slender adolescent neck/shoulders; no middle-aged face or facial hair.
Subject face card: long narrow youthful oval face and small firm chin; clean-shaven youthful face under black yishanguan; fine straight brows slightly drawn inward and long wary eyes; narrow straight nose and thin closed lips; slender upright adolescent shoulders; pale warm skin; tiny subtle mole below left mouth corner; serious tense guarded attention.
FacingLEFT. Visibly17years old. No NAME or text in image.
~~~

### new-ming-wanli-official-02 · 冯保

剧本依据：冯保|8|3|40|知书善琴，贪而有才|矫遗诏与内阁同受顾命，自加顾命之名。|60 20 70 30 60 80|80

| 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| broad soft oval face and full lower cheeks | completely clean-shaven gauze service cap | fine arched brows and small observant hooded eyes | short straight nose and full closed lips | full composed shoulders | pale warm skin | fine line at one mouth corner | literate poised attention and discreet calculation |

~~~text
Use case: historical-scene. ONE SINGLE character portrait for a Chinese historical atlas game,1024x1280, no grid. Images1–4 STYLE ONLY: clean Chinese baimiao ink lines, light FLAT muted washes, at most one faint shading layer, simple major folds, extremely faint paper grain. Plain solid #E3D7BE. HEAD AND SHOULDERS ONLY, no hands, props or long torso. Complete head/hat top12%, BOTH EYE CENTERS exactly38% (strictly36–40%), face centered, three-quarter gaze slightly off camera. COMPACT headwear: hat bottom near26% so eyes stay HIGH, no oversized crown/forehead gap. Simplified costume, no dense patterns. No words, Chinese characters, labels, seals, watermark, frame, guides, actor/TV likeness, anime, photography,3D, glow, nudity, weapons or blood. Ming court eunuch, FULLY CLEAN-SHAVEN, modest compact dark gauze service cap WITHOUT official side wings, plain muted teal or cinnabar crossed-collar yesā service robe. No beard or imperial crown.
Subject face card: broad soft oval face and full lower cheeks; completely clean-shaven gauze service cap; fine arched brows and small observant hooded eyes; short straight nose and full closed lips; full composed shoulders; pale warm skin; fine line at one mouth corner; literate poised attention and discreet calculation.
FacingLEFT. Visibly40years old. No NAME or text in image.
~~~

### new-ming-wanli-official-03 · 吕调阳

剧本依据：吕调阳|10|0|56|谨厚，凡事唯首辅是听|私下以为考成法太急。|70 20 75 75 75 40|30

| 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| round broad face and blunt soft chin | short white moustache and rounded gray chin beard | gentle level brows and downturned eyes | broad low nose and a soft wide mouth | slightly stooped full shoulders | warm beige skin | fine forehead creases | mild cautious deference |

~~~text
Use case: historical-scene. ONE SINGLE character portrait for a Chinese historical atlas game,1024x1280, no grid. Images1–4 STYLE ONLY: clean Chinese baimiao ink lines, light FLAT muted washes, at most one faint shading layer, simple major folds, extremely faint paper grain. Plain solid #E3D7BE. HEAD AND SHOULDERS ONLY, no hands, props or long torso. Complete head/hat top12%, BOTH EYE CENTERS exactly38% (strictly36–40%), face centered, three-quarter gaze slightly off camera. COMPACT headwear: hat bottom near26% so eyes stay HIGH, no oversized crown/forehead gap. Simplified costume, no dense patterns. No words, Chinese characters, labels, seals, watermark, frame, guides, actor/TV likeness, anime, photography,3D, glow, nudity, weapons or blood. Ming civil official in a muted RED, BLUE or DARK GREEN round-collar robe, small simple rank-patch edge. ABSOLUTELY NO YELLOW/GOLD/OCHRE robe. Black FLAT-TOP WUSHAMAO matching image5 silhouette ONLY: low front, higher flat rear, two thin FLAT OVAL wings extending horizontally from BACK, no dome or continuous brim.
Subject face card: round broad face and blunt soft chin; short white moustache and rounded gray chin beard; gentle level brows and downturned eyes; broad low nose and a soft wide mouth; slightly stooped full shoulders; warm beige skin; fine forehead creases; mild cautious deference.
FacingRIGHT. Visibly56years old. No NAME or text in image.
~~~

### new-ming-wanli-official-04 · 张四维

剧本依据：张四维|15|0|46|工于心计|家族世代经营盐业，与晋商往来密切。|75 25 75 50 60 80|75

| 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| narrow triangular face with high cheekbones | thin moustache and a neat sharp goatee | fine angled brows and narrow watchful eyes | long pointed nose and tightly closed thin lips | lean upright shoulders | pale olive skin | tiny mole near left temple | polished calculating composure |

~~~text
Use case: historical-scene. ONE SINGLE character portrait for a Chinese historical atlas game,1024x1280, no grid. Images1–4 STYLE ONLY: clean Chinese baimiao ink lines, light FLAT muted washes, at most one faint shading layer, simple major folds, extremely faint paper grain. Plain solid #E3D7BE. HEAD AND SHOULDERS ONLY, no hands, props or long torso. Complete head/hat top12%, BOTH EYE CENTERS exactly38% (strictly36–40%), face centered, three-quarter gaze slightly off camera. COMPACT headwear: hat bottom near26% so eyes stay HIGH, no oversized crown/forehead gap. Simplified costume, no dense patterns. No words, Chinese characters, labels, seals, watermark, frame, guides, actor/TV likeness, anime, photography,3D, glow, nudity, weapons or blood. Ming civil official in a muted RED, BLUE or DARK GREEN round-collar robe, small simple rank-patch edge. ABSOLUTELY NO YELLOW/GOLD/OCHRE robe. Black FLAT-TOP WUSHAMAO matching image5 silhouette ONLY: low front, higher flat rear, two thin FLAT OVAL wings extending horizontally from BACK, no dome or continuous brim.
Subject face card: narrow triangular face with high cheekbones; thin moustache and a neat sharp goatee; fine angled brows and narrow watchful eyes; long pointed nose and tightly closed thin lips; lean upright shoulders; pale olive skin; tiny mole near left temple; polished calculating composure.
FacingLEFT. Visibly46years old. No NAME or text in image.
~~~

### new-ming-wanli-official-05 · 申时行

剧本依据：申时行|19|0|37|温和圆融|状元出身，与言官、阁臣皆不愿结怨。|80 25 85 70 70 70|55

| 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| full oval face with rounded jaw | short neat moustache and very small chin tuft | soft curved brows and long relaxed eyes | small straight nose and full gently curved lips | rounded relaxed shoulders | warm ivory skin | shallow cheek dimple | approachable tactful warmth |

~~~text
Use case: historical-scene. ONE SINGLE character portrait for a Chinese historical atlas game,1024x1280, no grid. Images1–4 STYLE ONLY: clean Chinese baimiao ink lines, light FLAT muted washes, at most one faint shading layer, simple major folds, extremely faint paper grain. Plain solid #E3D7BE. HEAD AND SHOULDERS ONLY, no hands, props or long torso. Complete head/hat top12%, BOTH EYE CENTERS exactly38% (strictly36–40%), face centered, three-quarter gaze slightly off camera. COMPACT headwear: hat bottom near26% so eyes stay HIGH, no oversized crown/forehead gap. Simplified costume, no dense patterns. No words, Chinese characters, labels, seals, watermark, frame, guides, actor/TV likeness, anime, photography,3D, glow, nudity, weapons or blood. Ming civil official in a muted RED, BLUE or DARK GREEN round-collar robe, small simple rank-patch edge. ABSOLUTELY NO YELLOW/GOLD/OCHRE robe. Black FLAT-TOP WUSHAMAO matching image5 silhouette ONLY: low front, higher flat rear, two thin FLAT OVAL wings extending horizontally from BACK, no dome or continuous brim.
Subject face card: full oval face with rounded jaw; short neat moustache and very small chin tuft; soft curved brows and long relaxed eyes; small straight nose and full gently curved lips; rounded relaxed shoulders; warm ivory skin; shallow cheek dimple; approachable tactful warmth.
FacingRIGHT. Visibly37years old. No NAME or text in image.
~~~

### new-ming-wanli-official-06 · 王锡爵

剧本依据：王锡爵|16|0|38|刚直有守|曾在高拱、张居正之间两不依附。|75 25 80 80 75 60|50

| 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| angular square face and firm chin | short dark straight moustache and squared beard | strong level brows and alert almond eyes | high straight nose and thin firm lips | broad straight shoulders | golden beige skin | small natural notch in right brow | upright self-contained resolve |

~~~text
Use case: historical-scene. ONE SINGLE character portrait for a Chinese historical atlas game,1024x1280, no grid. Images1–4 STYLE ONLY: clean Chinese baimiao ink lines, light FLAT muted washes, at most one faint shading layer, simple major folds, extremely faint paper grain. Plain solid #E3D7BE. HEAD AND SHOULDERS ONLY, no hands, props or long torso. Complete head/hat top12%, BOTH EYE CENTERS exactly38% (strictly36–40%), face centered, three-quarter gaze slightly off camera. COMPACT headwear: hat bottom near26% so eyes stay HIGH, no oversized crown/forehead gap. Simplified costume, no dense patterns. No words, Chinese characters, labels, seals, watermark, frame, guides, actor/TV likeness, anime, photography,3D, glow, nudity, weapons or blood. Ming civil official in a muted RED, BLUE or DARK GREEN round-collar robe, small simple rank-patch edge. ABSOLUTELY NO YELLOW/GOLD/OCHRE robe. Black FLAT-TOP WUSHAMAO matching image5 silhouette ONLY: low front, higher flat rear, two thin FLAT OVAL wings extending horizontally from BACK, no dome or continuous brim.
Subject face card: angular square face and firm chin; short dark straight moustache and squared beard; strong level brows and alert almond eyes; high straight nose and thin firm lips; broad straight shoulders; golden beige skin; small natural notch in right brow; upright self-contained resolve.
FacingLEFT. Visibly38years old. No NAME or text in image.
~~~

### new-ming-wanli-official-07 · 王国光

剧本依据：王国光|1|4|60|精于理财|正着手编订《万历会计录》。|85 25 75 70 75 55|40

| 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| very long thin face and hollow cheeks | gray long three-strand beard | fine low brows and small focused eyes | long broad-bridged nose and narrow mouth | lean slightly stooped shoulders | light yellow-beige skin | clear lines between brows | absorbed precise financial concern |

~~~text
Use case: historical-scene. ONE SINGLE character portrait for a Chinese historical atlas game,1024x1280, no grid. Images1–4 STYLE ONLY: clean Chinese baimiao ink lines, light FLAT muted washes, at most one faint shading layer, simple major folds, extremely faint paper grain. Plain solid #E3D7BE. HEAD AND SHOULDERS ONLY, no hands, props or long torso. Complete head/hat top12%, BOTH EYE CENTERS exactly38% (strictly36–40%), face centered, three-quarter gaze slightly off camera. COMPACT headwear: hat bottom near26% so eyes stay HIGH, no oversized crown/forehead gap. Simplified costume, no dense patterns. No words, Chinese characters, labels, seals, watermark, frame, guides, actor/TV likeness, anime, photography,3D, glow, nudity, weapons or blood. Ming civil official in a muted RED, BLUE or DARK GREEN round-collar robe, small simple rank-patch edge. ABSOLUTELY NO YELLOW/GOLD/OCHRE robe. Black FLAT-TOP WUSHAMAO matching image5 silhouette ONLY: low front, higher flat rear, two thin FLAT OVAL wings extending horizontally from BACK, no dome or continuous brim.
Subject face card: very long thin face and hollow cheeks; gray long three-strand beard; fine low brows and small focused eyes; long broad-bridged nose and narrow mouth; lean slightly stooped shoulders; light yellow-beige skin; clear lines between brows; absorbed precise financial concern.
FacingRIGHT. Visibly60years old. No NAME or text in image.
~~~

### new-ming-wanli-official-08 · 杨博

剧本依据：杨博|3|1|70|老成知兵|年事已高，屡请致仕。|80 75 70 75 80 60|20

| 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| broad rectangular weathered face | short white full beard and heavy white moustache | bushy gray brows and deep-set steady eyes | large rounded nose and broad thin mouth | broad bony shoulders | ruddy tan skin | deep forehead age lines | experienced tired but composed authority |

~~~text
Use case: historical-scene. ONE SINGLE character portrait for a Chinese historical atlas game,1024x1280, no grid. Images1–4 STYLE ONLY: clean Chinese baimiao ink lines, light FLAT muted washes, at most one faint shading layer, simple major folds, extremely faint paper grain. Plain solid #E3D7BE. HEAD AND SHOULDERS ONLY, no hands, props or long torso. Complete head/hat top12%, BOTH EYE CENTERS exactly38% (strictly36–40%), face centered, three-quarter gaze slightly off camera. COMPACT headwear: hat bottom near26% so eyes stay HIGH, no oversized crown/forehead gap. Simplified costume, no dense patterns. No words, Chinese characters, labels, seals, watermark, frame, guides, actor/TV likeness, anime, photography,3D, glow, nudity, weapons or blood. Ming civil official in a muted RED, BLUE or DARK GREEN round-collar robe, small simple rank-patch edge. ABSOLUTELY NO YELLOW/GOLD/OCHRE robe. Black FLAT-TOP WUSHAMAO matching image5 silhouette ONLY: low front, higher flat rear, two thin FLAT OVAL wings extending horizontally from BACK, no dome or continuous brim.
Subject face card: broad rectangular weathered face; short white full beard and heavy white moustache; bushy gray brows and deep-set steady eyes; large rounded nose and broad thin mouth; broad bony shoulders; ruddy tan skin; deep forehead age lines; experienced tired but composed authority.
FacingLEFT. Visibly70years old. No NAME or text in image.
~~~

### new-ming-wanli-official-09 · 谭纶

剧本依据：谭纶|2|1|52|知兵，能任事|与戚继光同在东南抗倭，交情深厚。|70 85 70 70 80 55|40

| 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| wide diamond face and square chin | thick dark downturned moustache with bare chin | straight heavy brows and small decisive eyes | broad straight nose and firm full lips | solid upright shoulders | medium warm tan skin | a fine line beside the left mouth | practical disciplined readiness |

~~~text
Use case: historical-scene. ONE SINGLE character portrait for a Chinese historical atlas game,1024x1280, no grid. Images1–4 STYLE ONLY: clean Chinese baimiao ink lines, light FLAT muted washes, at most one faint shading layer, simple major folds, extremely faint paper grain. Plain solid #E3D7BE. HEAD AND SHOULDERS ONLY, no hands, props or long torso. Complete head/hat top12%, BOTH EYE CENTERS exactly38% (strictly36–40%), face centered, three-quarter gaze slightly off camera. COMPACT headwear: hat bottom near26% so eyes stay HIGH, no oversized crown/forehead gap. Simplified costume, no dense patterns. No words, Chinese characters, labels, seals, watermark, frame, guides, actor/TV likeness, anime, photography,3D, glow, nudity, weapons or blood. Ming civil official in a muted RED, BLUE or DARK GREEN round-collar robe, small simple rank-patch edge. ABSOLUTELY NO YELLOW/GOLD/OCHRE robe. Black FLAT-TOP WUSHAMAO matching image5 silhouette ONLY: low front, higher flat rear, two thin FLAT OVAL wings extending horizontally from BACK, no dome or continuous brim.
Subject face card: wide diamond face and square chin; thick dark downturned moustache with bare chin; straight heavy brows and small decisive eyes; broad straight nose and firm full lips; solid upright shoulders; medium warm tan skin; a fine line beside the left mouth; practical disciplined readiness.
FacingRIGHT. Visibly52years old. No NAME or text in image.
~~~

### new-ming-wanli-official-10 · 潘季驯

剧本依据：潘季驯|18|4|51|精于治河，主束水攻沙|屡被言官弹劾治河耗费。|80 30 80 75 75 45|35

| 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| long oval face with pointed chin | long sparse dark beard with gray ends | fine gently curved brows and hooded thinking eyes | long narrow nose and thin closed lips | slender straight shoulders | pale golden skin | deep vertical brow crease | intent patient technical concentration |

~~~text
Use case: historical-scene. ONE SINGLE character portrait for a Chinese historical atlas game,1024x1280, no grid. Images1–4 STYLE ONLY: clean Chinese baimiao ink lines, light FLAT muted washes, at most one faint shading layer, simple major folds, extremely faint paper grain. Plain solid #E3D7BE. HEAD AND SHOULDERS ONLY, no hands, props or long torso. Complete head/hat top12%, BOTH EYE CENTERS exactly38% (strictly36–40%), face centered, three-quarter gaze slightly off camera. COMPACT headwear: hat bottom near26% so eyes stay HIGH, no oversized crown/forehead gap. Simplified costume, no dense patterns. No words, Chinese characters, labels, seals, watermark, frame, guides, actor/TV likeness, anime, photography,3D, glow, nudity, weapons or blood. Ming civil official in a muted RED, BLUE or DARK GREEN round-collar robe, small simple rank-patch edge. ABSOLUTELY NO YELLOW/GOLD/OCHRE robe. Black FLAT-TOP WUSHAMAO matching image5 silhouette ONLY: low front, higher flat rear, two thin FLAT OVAL wings extending horizontally from BACK, no dome or continuous brim.
Subject face card: long oval face with pointed chin; long sparse dark beard with gray ends; fine gently curved brows and hooded thinking eyes; long narrow nose and thin closed lips; slender straight shoulders; pale golden skin; deep vertical brow crease; intent patient technical concentration.
FacingLEFT. Visibly51years old. No NAME or text in image.
~~~

### new-ming-wanli-official-11 · 戚继光

剧本依据：戚继光|28|1|44|治军严明|以重礼结交张居正，求在蓟镇专权练兵。|50 95 70 70 85 55|50

| 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| broad square face and strong jaw | short dark full cheek-and-chin beard | heavy straight brows and wide-set sharp eyes | broad high nose and thin level mouth | broad muscular shoulders | sun-tanned brown skin | a small subtle old scar beside left brow | disciplined steady military resolve |

~~~text
Use case: historical-scene. ONE SINGLE character portrait for a Chinese historical atlas game,1024x1280, no grid. Images1–4 STYLE ONLY: clean Chinese baimiao ink lines, light FLAT muted washes, at most one faint shading layer, simple major folds, extremely faint paper grain. Plain solid #E3D7BE. HEAD AND SHOULDERS ONLY, no hands, props or long torso. Complete head/hat top12%, BOTH EYE CENTERS exactly38% (strictly36–40%), face centered, three-quarter gaze slightly off camera. COMPACT headwear: hat bottom near26% so eyes stay HIGH, no oversized crown/forehead gap. Simplified costume, no dense patterns. No words, Chinese characters, labels, seals, watermark, frame, guides, actor/TV likeness, anime, photography,3D, glow, nudity, weapons or blood. Ming military commander, low dull steel PHOENIX-WING HELMET with short upward-swept metal temple wings and plain lamellar shoulder armor. No civil hat, no weapon/battle, no tall plume. Muted blue/green/cinnabar under-robe.
Subject face card: broad square face and strong jaw; short dark full cheek-and-chin beard; heavy straight brows and wide-set sharp eyes; broad high nose and thin level mouth; broad muscular shoulders; sun-tanned brown skin; a small subtle old scar beside left brow; disciplined steady military resolve.
FacingRIGHT. Visibly44years old. No NAME or text in image.
~~~

### new-ming-wanli-official-12 · 李成梁

剧本依据：李成梁|25|1|46|骁勇，善养家丁|冒功邀赏、纵容家丁之事不在少数。|50 88 50 40 65 70|70

| 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| full round face with broad jaw | thick moustache and a dense short rounded beard | high heavy brows and narrow alert eyes | short large nose and full lips | very broad stocky shoulders | ruddy golden tan skin | small mole on right cheek | confident shrewd command |

~~~text
Use case: historical-scene. ONE SINGLE character portrait for a Chinese historical atlas game,1024x1280, no grid. Images1–4 STYLE ONLY: clean Chinese baimiao ink lines, light FLAT muted washes, at most one faint shading layer, simple major folds, extremely faint paper grain. Plain solid #E3D7BE. HEAD AND SHOULDERS ONLY, no hands, props or long torso. Complete head/hat top12%, BOTH EYE CENTERS exactly38% (strictly36–40%), face centered, three-quarter gaze slightly off camera. COMPACT headwear: hat bottom near26% so eyes stay HIGH, no oversized crown/forehead gap. Simplified costume, no dense patterns. No words, Chinese characters, labels, seals, watermark, frame, guides, actor/TV likeness, anime, photography,3D, glow, nudity, weapons or blood. Ming military commander, low dull steel PHOENIX-WING HELMET with short upward-swept metal temple wings and plain lamellar shoulder armor. No civil hat, no weapon/battle, no tall plume. Muted blue/green/cinnabar under-robe.
Subject face card: full round face with broad jaw; thick moustache and a dense short rounded beard; high heavy brows and narrow alert eyes; short large nose and full lips; very broad stocky shoulders; ruddy golden tan skin; small mole on right cheek; confident shrewd command.
FacingLEFT. Visibly46years old. No NAME or text in image.
~~~

### new-ming-wanli-foreign-01 · 俺答汗

剧本依据：蒙古|俺答汗|朝贡|60|北|互市与封贡

| 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| long broad-cheeked face and blunt chin | gray full beard with long moustache tips | thick curved brows and calmly hooded eyes | large straight nose and broad firm mouth | broad heavy shoulders | medium warm brown skin | fine age lines around eyes | measured dignified confidence |

~~~text
Use case: historical-scene. ONE SINGLE character portrait for a Chinese historical atlas game,1024x1280, no grid. Images1–4 STYLE ONLY: clean Chinese baimiao ink lines, light FLAT muted washes, at most one faint shading layer, simple major folds, extremely faint paper grain. Plain solid #E3D7BE. HEAD AND SHOULDERS ONLY, no hands, props or long torso. Complete head/hat top12%, BOTH EYE CENTERS exactly38% (strictly36–40%), face centered, three-quarter gaze slightly off camera. COMPACT headwear: hat bottom near26% so eyes stay HIGH, no oversized crown/forehead gap. Simplified costume, no dense patterns. No words, Chinese characters, labels, seals, watermark, frame, guides, actor/TV likeness, anime, photography,3D, glow, nudity, weapons or blood. Adult steppe ruler with simple felt cap, muted wool coat with modest fur edge; no Ming official hat or patch. Dignified natural human face, no caricature/exaggerated ethnic features.
Subject face card: long broad-cheeked face and blunt chin; gray full beard with long moustache tips; thick curved brows and calmly hooded eyes; large straight nose and broad firm mouth; broad heavy shoulders; medium warm brown skin; fine age lines around eyes; measured dignified confidence.
FacingRIGHT. No NAME or text in image.
~~~

### new-ming-wanli-foreign-02 · 王杲

剧本依据：建州女真|王杲|冷淡|30|东|抚赏与马市

| 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| angular long face and narrow chin | thin straight moustache and short triangular beard | strong slanted brows and small watchful eyes | long low nose and tightly closed lips | lean firm shoulders | warm medium tan skin | tiny mole beside right nose | guarded resolute attention |

~~~text
Use case: historical-scene. ONE SINGLE character portrait for a Chinese historical atlas game,1024x1280, no grid. Images1–4 STYLE ONLY: clean Chinese baimiao ink lines, light FLAT muted washes, at most one faint shading layer, simple major folds, extremely faint paper grain. Plain solid #E3D7BE. HEAD AND SHOULDERS ONLY, no hands, props or long torso. Complete head/hat top12%, BOTH EYE CENTERS exactly38% (strictly36–40%), face centered, three-quarter gaze slightly off camera. COMPACT headwear: hat bottom near26% so eyes stay HIGH, no oversized crown/forehead gap. Simplified costume, no dense patterns. No words, Chinese characters, labels, seals, watermark, frame, guides, actor/TV likeness, anime, photography,3D, glow, nudity, weapons or blood. Adult northeastern frontier ruler, low fur-edged felt cap and plain dark green crossed-front coat with narrow burgundy trim; no Ming wushamao or official patch. Dignified natural human face, no caricature/exaggerated ethnic features.
Subject face card: angular long face and narrow chin; thin straight moustache and short triangular beard; strong slanted brows and small watchful eyes; long low nose and tightly closed lips; lean firm shoulders; warm medium tan skin; tiny mole beside right nose; guarded resolute attention.
FacingLEFT. No NAME or text in image.
~~~

### new-ming-wanli-foreign-03 · 李昖

剧本依据：朝鲜|李昖|朝贡|70|东|册封与书籍

| 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| soft oval face with broad forehead | thin moustache and small pointed chin beard | fine gently sloping brows and long eyes | small high nose and compact thin mouth | narrow upright shoulders | pale golden skin | small dimple in chin | quiet formal composure |

~~~text
Use case: historical-scene. ONE SINGLE character portrait for a Chinese historical atlas game,1024x1280, no grid. Images1–4 STYLE ONLY: clean Chinese baimiao ink lines, light FLAT muted washes, at most one faint shading layer, simple major folds, extremely faint paper grain. Plain solid #E3D7BE. HEAD AND SHOULDERS ONLY, no hands, props or long torso. Complete head/hat top12%, BOTH EYE CENTERS exactly38% (strictly36–40%), face centered, three-quarter gaze slightly off camera. COMPACT headwear: hat bottom near26% so eyes stay HIGH, no oversized crown/forehead gap. Simplified costume, no dense patterns. No words, Chinese characters, labels, seals, watermark, frame, guides, actor/TV likeness, anime, photography,3D, glow, nudity, weapons or blood. Adult sea-east ruler, tall narrow black RIBBED ceremonial crown with rear ribbons, burgundy broad formal robe with very WIDE WHITE layered crossed collar, no Ming rujin/wushamao/patch. Dignified natural human face, no caricature/exaggerated ethnic features.
Subject face card: soft oval face with broad forehead; thin moustache and small pointed chin beard; fine gently sloping brows and long eyes; small high nose and compact thin mouth; narrow upright shoulders; pale golden skin; small dimple in chin; quiet formal composure.
FacingRIGHT. No NAME or text in image.
~~~

### new-ming-wanli-foreign-04 · 莫茂洽

剧本依据：安南|莫茂洽|朝贡|50|南|册封

| 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| short broad face with rounded chin | neat short boxed beard | soft level brows and wide almond eyes | short broad nose and full closed lips | full straight shoulders | warm bronze skin | small mole under left eye | patient alert dignity |

~~~text
Use case: historical-scene. ONE SINGLE character portrait for a Chinese historical atlas game,1024x1280, no grid. Images1–4 STYLE ONLY: clean Chinese baimiao ink lines, light FLAT muted washes, at most one faint shading layer, simple major folds, extremely faint paper grain. Plain solid #E3D7BE. HEAD AND SHOULDERS ONLY, no hands, props or long torso. Complete head/hat top12%, BOTH EYE CENTERS exactly38% (strictly36–40%), face centered, three-quarter gaze slightly off camera. COMPACT headwear: hat bottom near26% so eyes stay HIGH, no oversized crown/forehead gap. Simplified costume, no dense patterns. No words, Chinese characters, labels, seals, watermark, frame, guides, actor/TV likeness, anime, photography,3D, glow, nudity, weapons or blood. Adult southern maritime ruler, compact folded dark ceremonial cap with short downturned side tabs, dark jade formal robe with broad ivory overlapping collar; no Ming wushamao or rank patch. Dignified natural human face, no caricature/exaggerated ethnic features.
Subject face card: short broad face with rounded chin; neat short boxed beard; soft level brows and wide almond eyes; short broad nose and full closed lips; full straight shoulders; warm bronze skin; small mole under left eye; patient alert dignity.
FacingLEFT. No NAME or text in image.
~~~

### new-ming-wanli-foreign-05 · 织田信长

剧本依据：日本|织田信长|冷淡|35|东|勘合贸易

| 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| long angular face and firm narrow chin | thin moustache and small sharply pointed goatee | strong high brows and narrow focused eyes | high long nose and thin tightly set mouth | slender firm shoulders | light warm beige skin | slight uneven right eyebrow edge | forceful controlled attention |

~~~text
Use case: historical-scene. ONE SINGLE character portrait for a Chinese historical atlas game,1024x1280, no grid. Images1–4 STYLE ONLY: clean Chinese baimiao ink lines, light FLAT muted washes, at most one faint shading layer, simple major folds, extremely faint paper grain. Plain solid #E3D7BE. HEAD AND SHOULDERS ONLY, no hands, props or long torso. Complete head/hat top12%, BOTH EYE CENTERS exactly38% (strictly36–40%), face centered, three-quarter gaze slightly off camera. COMPACT headwear: hat bottom near26% so eyes stay HIGH, no oversized crown/forehead gap. Simplified costume, no dense patterns. No words, Chinese characters, labels, seals, watermark, frame, guides, actor/TV likeness, anime, photography,3D, glow, nudity, weapons or blood. Adult sea-east ruler, tall black folded CONE EBOSHI with neck cord, charcoal broad ceremonial outer robe over clear white crossed collar and simple broad shoulder panels; no Ming official hat or round-collar patch robe. Dignified natural human face, no caricature/exaggerated ethnic features.
Subject face card: long angular face and firm narrow chin; thin moustache and small sharply pointed goatee; strong high brows and narrow focused eyes; high long nose and thin tightly set mouth; slender firm shoulders; light warm beige skin; slight uneven right eyebrow edge; forceful controlled attention.
FacingRIGHT. No NAME or text in image.
~~~

### new-ming-wanli-dowager-01 · 李太后

剧本依据：李太后

| 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| broad oval female face and softly rounded chin | black low rounded hairline and compact bun under phoenix crown | fine softly curved brows and long firm almond eyes | small straight nose and full gently closed lips | full upright female shoulders | warm pale skin | tiny mole by left brow | restrained maternal authority and attentive discipline |

~~~text
Use case: historical-scene. ONE SINGLE character portrait for a Chinese historical atlas game,1024x1280, no grid. Images1–4 STYLE ONLY: clean Chinese baimiao ink lines, light FLAT muted washes, at most one faint shading layer, simple major folds, extremely faint paper grain. Plain solid #E3D7BE. HEAD AND SHOULDERS ONLY, no hands, props or long torso. Complete head/hat top12%, BOTH EYE CENTERS exactly38% (strictly36–40%), face centered, three-quarter gaze slightly off camera. COMPACT headwear: hat bottom near26% so eyes stay HIGH, no oversized crown/forehead gap. Simplified costume, no dense patterns. No words, Chinese characters, labels, seals, watermark, frame, guides, actor/TV likeness, anime, photography,3D, glow, nudity, weapons or blood. Ming royal WOMAN, unmistakably feminine soft brows/eyes and rounded female jaw edges while preserving card face shape. Ming standing/crossed-collar AO fully covering shoulders. Recognizable compact GOLD PHOENIX CROWN with bird beak/neck/outspread wings and short PEARL STRANDS like image5 silhouette; simple outline, not a plain hair clip.  A young-to-mature adult woman with black hair, NOT an elderly gray-haired generic dowager.
Subject face card: broad oval female face and softly rounded chin; black low rounded hairline and compact bun under phoenix crown; fine softly curved brows and long firm almond eyes; small straight nose and full gently closed lips; full upright female shoulders; warm pale skin; tiny mole by left brow; restrained maternal authority and attentive discipline.
FacingLEFT. No NAME or text in image.
~~~

### new-ming-chongzhen-official-01 · 魏忠贤

剧本依据：魏忠贤|8|3|59|目不识丁而权倾朝野|生祠遍天下，各地督抚多有馈遗。|40 30 30 10 20 85|95

| 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| broad heavy lower face with full jowls | fully clean-shaven gray temples and modest service cap | thick low brows and small hooded eyes | broad low nose and wide tightly closed lips | stocky full shoulders | warm medium beige skin | deep lines beside mouth | self-possessed guarded political authority |

~~~text
Use case: historical-scene. ONE SINGLE character portrait for a Chinese historical atlas game,1024x1280, no grid. Images1–4 STYLE ONLY: clean Chinese baimiao ink lines, light FLAT muted washes, at most one faint shading layer, simple major folds, extremely faint paper grain. Plain solid #E3D7BE. HEAD AND SHOULDERS ONLY, no hands, props or long torso. Complete head/hat top12%, BOTH EYE CENTERS exactly38% (strictly36–40%), face centered, three-quarter gaze slightly off camera. COMPACT headwear: hat bottom near26% so eyes stay HIGH, no oversized crown/forehead gap. Simplified costume, no dense patterns. No words, Chinese characters, labels, seals, watermark, frame, guides, actor/TV likeness, anime, photography,3D, glow, nudity, weapons or blood. Ming court eunuch, FULLY CLEAN-SHAVEN, modest compact dark gauze service cap WITHOUT official side wings, plain muted teal or cinnabar crossed-collar yesā service robe. No beard or imperial crown.
Subject face card: broad heavy lower face with full jowls; fully clean-shaven gray temples and modest service cap; thick low brows and small hooded eyes; broad low nose and wide tightly closed lips; stocky full shoulders; warm medium beige skin; deep lines beside mouth; self-possessed guarded political authority.
FacingLEFT. Visibly59years old. No NAME or text in image.
~~~

### new-ming-chongzhen-official-02 · 崔呈秀

剧本依据：崔呈秀|2|3|50|依附魏珰，人称五虎之首|贪墨军饷，账目可查。|50 40 55 15 25 75|85

| 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| short square face with a blunt chin | short dense moustache and broad pointed chin beard | strong curved brows and small close-set eyes | short high nose and a broad thin mouth | solid slightly hunched shoulders | yellow-ochre tan skin | small mole beside right eyebrow | calculating reserved attention |

~~~text
Use case: historical-scene. ONE SINGLE character portrait for a Chinese historical atlas game,1024x1280, no grid. Images1–4 STYLE ONLY: clean Chinese baimiao ink lines, light FLAT muted washes, at most one faint shading layer, simple major folds, extremely faint paper grain. Plain solid #E3D7BE. HEAD AND SHOULDERS ONLY, no hands, props or long torso. Complete head/hat top12%, BOTH EYE CENTERS exactly38% (strictly36–40%), face centered, three-quarter gaze slightly off camera. COMPACT headwear: hat bottom near26% so eyes stay HIGH, no oversized crown/forehead gap. Simplified costume, no dense patterns. No words, Chinese characters, labels, seals, watermark, frame, guides, actor/TV likeness, anime, photography,3D, glow, nudity, weapons or blood. Ming civil official in a muted RED, BLUE or DARK GREEN round-collar robe, small simple rank-patch edge. ABSOLUTELY NO YELLOW/GOLD/OCHRE robe. Black FLAT-TOP WUSHAMAO matching image5 silhouette ONLY: low front, higher flat rear, two thin FLAT OVAL wings extending horizontally from BACK, no dome or continuous brim.
Subject face card: short square face with a blunt chin; short dense moustache and broad pointed chin beard; strong curved brows and small close-set eyes; short high nose and a broad thin mouth; solid slightly hunched shoulders; yellow-ochre tan skin; small mole beside right eyebrow; calculating reserved attention.
FacingRIGHT. Visibly50years old. No NAME or text in image.
~~~

### new-ming-chongzhen-official-03 · 黄立极

剧本依据：黄立极|0|3|62|庸懦依违|曾为魏忠贤生祠撰写颂词。|55 20 60 30 40 55|45

| 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| long soft oval face with slack rounded chin | thin gray moustache and wispy gray chin beard | drooping fine brows and small downturned eyes | long low nose and thin soft lips | narrow stooped shoulders | pale warm beige skin | clear forehead creases | hesitant compliant reserve |

~~~text
Use case: historical-scene. ONE SINGLE character portrait for a Chinese historical atlas game,1024x1280, no grid. Images1–4 STYLE ONLY: clean Chinese baimiao ink lines, light FLAT muted washes, at most one faint shading layer, simple major folds, extremely faint paper grain. Plain solid #E3D7BE. HEAD AND SHOULDERS ONLY, no hands, props or long torso. Complete head/hat top12%, BOTH EYE CENTERS exactly38% (strictly36–40%), face centered, three-quarter gaze slightly off camera. COMPACT headwear: hat bottom near26% so eyes stay HIGH, no oversized crown/forehead gap. Simplified costume, no dense patterns. No words, Chinese characters, labels, seals, watermark, frame, guides, actor/TV likeness, anime, photography,3D, glow, nudity, weapons or blood. Ming civil official in a muted RED, BLUE or DARK GREEN round-collar robe, small simple rank-patch edge. ABSOLUTELY NO YELLOW/GOLD/OCHRE robe. Black FLAT-TOP WUSHAMAO matching image5 silhouette ONLY: low front, higher flat rear, two thin FLAT OVAL wings extending horizontally from BACK, no dome or continuous brim.
Subject face card: long soft oval face with slack rounded chin; thin gray moustache and wispy gray chin beard; drooping fine brows and small downturned eyes; long low nose and thin soft lips; narrow stooped shoulders; pale warm beige skin; clear forehead creases; hesitant compliant reserve.
FacingLEFT. Visibly62years old. No NAME or text in image.
~~~

### new-ming-chongzhen-official-04 · 温体仁

剧本依据：温体仁|16|4|54|外示温谨，内实阴狠|欲借攻讦东林以邀圣眷。|75 20 75 35 50 90|85

| 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| narrow angular face and pointed chin | neat narrow dark moustache and long pointed beard | fine level brows and very narrow calm eyes | high hooked nose and thin closed mouth | slim perfectly straight shoulders | cool pale skin | one fine brow crease | outwardly mild deeply watchful composure |

~~~text
Use case: historical-scene. ONE SINGLE character portrait for a Chinese historical atlas game,1024x1280, no grid. Images1–4 STYLE ONLY: clean Chinese baimiao ink lines, light FLAT muted washes, at most one faint shading layer, simple major folds, extremely faint paper grain. Plain solid #E3D7BE. HEAD AND SHOULDERS ONLY, no hands, props or long torso. Complete head/hat top12%, BOTH EYE CENTERS exactly38% (strictly36–40%), face centered, three-quarter gaze slightly off camera. COMPACT headwear: hat bottom near26% so eyes stay HIGH, no oversized crown/forehead gap. Simplified costume, no dense patterns. No words, Chinese characters, labels, seals, watermark, frame, guides, actor/TV likeness, anime, photography,3D, glow, nudity, weapons or blood. Ming civil official in a muted RED, BLUE or DARK GREEN round-collar robe, small simple rank-patch edge. ABSOLUTELY NO YELLOW/GOLD/OCHRE robe. Black FLAT-TOP WUSHAMAO matching image5 silhouette ONLY: low front, higher flat rear, two thin FLAT OVAL wings extending horizontally from BACK, no dome or continuous brim.
Subject face card: narrow angular face and pointed chin; neat narrow dark moustache and long pointed beard; fine level brows and very narrow calm eyes; high hooked nose and thin closed mouth; slim perfectly straight shoulders; cool pale skin; one fine brow crease; outwardly mild deeply watchful composure.
FacingRIGHT. Visibly54years old. No NAME or text in image.
~~~

### new-ming-chongzhen-official-05 · 周延儒

剧本依据：周延儒|15|0|34|机敏善揣|状元出身，与东林若即若离。|70 25 85 45 50 80|80

| 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| rounded heart-shaped face and small chin | short fine moustache with bare chin | soft arched brows and bright long eyes | small rounded nose and full slightly curved lips | slender relaxed shoulders | warm ivory skin | small cheek dimple | quick attentive social assurance |

~~~text
Use case: historical-scene. ONE SINGLE character portrait for a Chinese historical atlas game,1024x1280, no grid. Images1–4 STYLE ONLY: clean Chinese baimiao ink lines, light FLAT muted washes, at most one faint shading layer, simple major folds, extremely faint paper grain. Plain solid #E3D7BE. HEAD AND SHOULDERS ONLY, no hands, props or long torso. Complete head/hat top12%, BOTH EYE CENTERS exactly38% (strictly36–40%), face centered, three-quarter gaze slightly off camera. COMPACT headwear: hat bottom near26% so eyes stay HIGH, no oversized crown/forehead gap. Simplified costume, no dense patterns. No words, Chinese characters, labels, seals, watermark, frame, guides, actor/TV likeness, anime, photography,3D, glow, nudity, weapons or blood. Ming civil official in a muted RED, BLUE or DARK GREEN round-collar robe, small simple rank-patch edge. ABSOLUTELY NO YELLOW/GOLD/OCHRE robe. Black FLAT-TOP WUSHAMAO matching image5 silhouette ONLY: low front, higher flat rear, two thin FLAT OVAL wings extending horizontally from BACK, no dome or continuous brim.
Subject face card: rounded heart-shaped face and small chin; short fine moustache with bare chin; soft arched brows and bright long eyes; small rounded nose and full slightly curved lips; slender relaxed shoulders; warm ivory skin; small cheek dimple; quick attentive social assurance.
FacingLEFT. Visibly34years old. No NAME or text in image.
~~~

### new-ming-chongzhen-official-06 · 毕自严

剧本依据：毕自严|1|4|58|精于钱谷|深知太仓银库已入不敷出。|85 30 75 75 80 50|35

| 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| long rectangular face and bony jaw | gray forked long beard and short gray moustache | low level brows and deep-set focused eyes | broad straight nose and a small firmly closed mouth | bony slightly stooped shoulders | light golden beige skin | fine lines under eyes | weary exacting financial concentration |

~~~text
Use case: historical-scene. ONE SINGLE character portrait for a Chinese historical atlas game,1024x1280, no grid. Images1–4 STYLE ONLY: clean Chinese baimiao ink lines, light FLAT muted washes, at most one faint shading layer, simple major folds, extremely faint paper grain. Plain solid #E3D7BE. HEAD AND SHOULDERS ONLY, no hands, props or long torso. Complete head/hat top12%, BOTH EYE CENTERS exactly38% (strictly36–40%), face centered, three-quarter gaze slightly off camera. COMPACT headwear: hat bottom near26% so eyes stay HIGH, no oversized crown/forehead gap. Simplified costume, no dense patterns. No words, Chinese characters, labels, seals, watermark, frame, guides, actor/TV likeness, anime, photography,3D, glow, nudity, weapons or blood. Ming civil official in a muted RED, BLUE or DARK GREEN round-collar robe, small simple rank-patch edge. ABSOLUTELY NO YELLOW/GOLD/OCHRE robe. Black FLAT-TOP WUSHAMAO matching image5 silhouette ONLY: low front, higher flat rear, two thin FLAT OVAL wings extending horizontally from BACK, no dome or continuous brim.
Subject face card: long rectangular face and bony jaw; gray forked long beard and short gray moustache; low level brows and deep-set focused eyes; broad straight nose and a small firmly closed mouth; bony slightly stooped shoulders; light golden beige skin; fine lines under eyes; weary exacting financial concentration.
FacingRIGHT. Visibly58years old. No NAME or text in image.
~~~

### new-ming-chongzhen-official-07 · 王永光

剧本依据：王永光|3|3|66|圆滑持禄|曾附阉党，如今正四处撇清。|60 20 60 40 45 65|50

| 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| full round face with broad lower cheeks | short gray full beard and rounded moustache | soft curved brows and hooded sideways eyes | short broad nose and full closed mouth | plump sloping shoulders | ruddy warm skin | small age spot on left cheek | careful sociable self-restraint |

~~~text
Use case: historical-scene. ONE SINGLE character portrait for a Chinese historical atlas game,1024x1280, no grid. Images1–4 STYLE ONLY: clean Chinese baimiao ink lines, light FLAT muted washes, at most one faint shading layer, simple major folds, extremely faint paper grain. Plain solid #E3D7BE. HEAD AND SHOULDERS ONLY, no hands, props or long torso. Complete head/hat top12%, BOTH EYE CENTERS exactly38% (strictly36–40%), face centered, three-quarter gaze slightly off camera. COMPACT headwear: hat bottom near26% so eyes stay HIGH, no oversized crown/forehead gap. Simplified costume, no dense patterns. No words, Chinese characters, labels, seals, watermark, frame, guides, actor/TV likeness, anime, photography,3D, glow, nudity, weapons or blood. Ming civil official in a muted RED, BLUE or DARK GREEN round-collar robe, small simple rank-patch edge. ABSOLUTELY NO YELLOW/GOLD/OCHRE robe. Black FLAT-TOP WUSHAMAO matching image5 silhouette ONLY: low front, higher flat rear, two thin FLAT OVAL wings extending horizontally from BACK, no dome or continuous brim.
Subject face card: full round face with broad lower cheeks; short gray full beard and rounded moustache; soft curved brows and hooded sideways eyes; short broad nose and full closed mouth; plump sloping shoulders; ruddy warm skin; small age spot on left cheek; careful sociable self-restraint.
FacingLEFT. Visibly66years old. No NAME or text in image.
~~~

### new-ming-chongzhen-official-08 · 袁崇焕

剧本依据：袁崇焕|28|4|43|慷慨负胆略|曾私遣使与后金议和。|65 85 75 60 70 60|70

| 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| long narrow face and strong pointed chin | neat short dark goatee and straight moustache | heavy angled brows and long intent eyes | high narrow nose and thin firm lips | lean muscular shoulders | sun-tanned golden skin | a fine old line near right temple | bold thoughtful military resolve |

~~~text
Use case: historical-scene. ONE SINGLE character portrait for a Chinese historical atlas game,1024x1280, no grid. Images1–4 STYLE ONLY: clean Chinese baimiao ink lines, light FLAT muted washes, at most one faint shading layer, simple major folds, extremely faint paper grain. Plain solid #E3D7BE. HEAD AND SHOULDERS ONLY, no hands, props or long torso. Complete head/hat top12%, BOTH EYE CENTERS exactly38% (strictly36–40%), face centered, three-quarter gaze slightly off camera. COMPACT headwear: hat bottom near26% so eyes stay HIGH, no oversized crown/forehead gap. Simplified costume, no dense patterns. No words, Chinese characters, labels, seals, watermark, frame, guides, actor/TV likeness, anime, photography,3D, glow, nudity, weapons or blood. Ming military commander, low dull steel PHOENIX-WING HELMET with short upward-swept metal temple wings and plain lamellar shoulder armor. No civil hat, no weapon/battle, no tall plume. Muted blue/green/cinnabar under-robe.
Subject face card: long narrow face and strong pointed chin; neat short dark goatee and straight moustache; heavy angled brows and long intent eyes; high narrow nose and thin firm lips; lean muscular shoulders; sun-tanned golden skin; a fine old line near right temple; bold thoughtful military resolve.
FacingRIGHT. Visibly43years old. No NAME or text in image.
~~~

### new-ming-chongzhen-official-09 · 洪承畴

剧本依据：洪承畴|26|4|34|沉毅多谋|在陕西督粮，眼见饥民渐成流寇。|75 85 75 55 60 75|60

| 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| broad square face and heavy rounded jaw | short dark full beard trimmed close | thick level brows and deeply attentive almond eyes | broad straight nose and compact firm mouth | stocky upright shoulders | medium warm brown skin | one fine vertical brow line | sober patient strategic attention |

~~~text
Use case: historical-scene. ONE SINGLE character portrait for a Chinese historical atlas game,1024x1280, no grid. Images1–4 STYLE ONLY: clean Chinese baimiao ink lines, light FLAT muted washes, at most one faint shading layer, simple major folds, extremely faint paper grain. Plain solid #E3D7BE. HEAD AND SHOULDERS ONLY, no hands, props or long torso. Complete head/hat top12%, BOTH EYE CENTERS exactly38% (strictly36–40%), face centered, three-quarter gaze slightly off camera. COMPACT headwear: hat bottom near26% so eyes stay HIGH, no oversized crown/forehead gap. Simplified costume, no dense patterns. No words, Chinese characters, labels, seals, watermark, frame, guides, actor/TV likeness, anime, photography,3D, glow, nudity, weapons or blood. Ming military commander, low dull steel PHOENIX-WING HELMET with short upward-swept metal temple wings and plain lamellar shoulder armor. No civil hat, no weapon/battle, no tall plume. Muted blue/green/cinnabar under-robe.
Subject face card: broad square face and heavy rounded jaw; short dark full beard trimmed close; thick level brows and deeply attentive almond eyes; broad straight nose and compact firm mouth; stocky upright shoulders; medium warm brown skin; one fine vertical brow line; sober patient strategic attention.
FacingLEFT. Visibly34years old. No NAME or text in image.
~~~

### new-ming-chongzhen-official-10 · 卢象升

剧本依据：卢象升|25|1|27|文武兼资，忠勇|治大名府，练兵颇有成效。|70 85 70 85 95 50|40

| 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| long youthful oval face and firm small chin | clean-shaven under military helmet | fine straight brows and large clear eyes | small high nose and softly closed thin lips | slender strong upright shoulders | pale golden skin | tiny mole at right jaw | open earnest courageous readiness |

~~~text
Use case: historical-scene. ONE SINGLE character portrait for a Chinese historical atlas game,1024x1280, no grid. Images1–4 STYLE ONLY: clean Chinese baimiao ink lines, light FLAT muted washes, at most one faint shading layer, simple major folds, extremely faint paper grain. Plain solid #E3D7BE. HEAD AND SHOULDERS ONLY, no hands, props or long torso. Complete head/hat top12%, BOTH EYE CENTERS exactly38% (strictly36–40%), face centered, three-quarter gaze slightly off camera. COMPACT headwear: hat bottom near26% so eyes stay HIGH, no oversized crown/forehead gap. Simplified costume, no dense patterns. No words, Chinese characters, labels, seals, watermark, frame, guides, actor/TV likeness, anime, photography,3D, glow, nudity, weapons or blood. Ming military commander, low dull steel PHOENIX-WING HELMET with short upward-swept metal temple wings and plain lamellar shoulder armor. No civil hat, no weapon/battle, no tall plume. Muted blue/green/cinnabar under-robe.
Subject face card: long youthful oval face and firm small chin; clean-shaven under military helmet; fine straight brows and large clear eyes; small high nose and softly closed thin lips; slender strong upright shoulders; pale golden skin; tiny mole at right jaw; open earnest courageous readiness.
FacingRIGHT. Visibly27years old. No NAME or text in image.
~~~

### new-ming-chongzhen-consort-01 · 周氏

剧本依据：周氏|皇后|苏州周氏|16|0|80|出身寒微，家中曾以卖卜为生。

| 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| soft youthful oval female face and small rounded chin | black low rounded hairline and low bun under compact phoenix crown | fine softly curved brows and clear gentle almond eyes | small low nose and full natural closed lips | small upright older-teen female shoulders | warm ivory skin | tiny dimple near left cheek | quiet modest dignity |

~~~text
Use case: historical-scene. ONE SINGLE character portrait for a Chinese historical atlas game,1024x1280, no grid. Images1–4 STYLE ONLY: clean Chinese baimiao ink lines, light FLAT muted washes, at most one faint shading layer, simple major folds, extremely faint paper grain. Plain solid #E3D7BE. HEAD AND SHOULDERS ONLY, no hands, props or long torso. Complete head/hat top12%, BOTH EYE CENTERS exactly38% (strictly36–40%), face centered, three-quarter gaze slightly off camera. COMPACT headwear: hat bottom near26% so eyes stay HIGH, no oversized crown/forehead gap. Simplified costume, no dense patterns. No words, Chinese characters, labels, seals, watermark, frame, guides, actor/TV likeness, anime, photography,3D, glow, nudity, weapons or blood. Ming royal WOMAN, unmistakably feminine soft brows/eyes and rounded female jaw edges while preserving card face shape. Ming standing/crossed-collar AO fully covering shoulders. Recognizable compact GOLD PHOENIX CROWN with bird beak/neck/outspread wings and short PEARL STRANDS like image5 silhouette; simple outline, not a plain hair clip.  Visibly16years old, age-appropriate youthful face and fully covered modest ceremonial clothing, no glamour makeup.
Subject face card: soft youthful oval female face and small rounded chin; black low rounded hairline and low bun under compact phoenix crown; fine softly curved brows and clear gentle almond eyes; small low nose and full natural closed lips; small upright older-teen female shoulders; warm ivory skin; tiny dimple near left cheek; quiet modest dignity.
FacingLEFT. No NAME or text in image.
~~~

### new-ming-chongzhen-consort-02 · 田氏

剧本依据：田氏|妃|扬州田氏|18|2|70|多才艺，其父田弘遇骄横。

| 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| heart-shaped young female face and tapered chin | high curved hairline and compact side-swept jiuji bun | fine arched brows and bright wide-set eyes | small pointed nose and softly curved full lips | slender gently sloping female shoulders | pale peach-beige skin | tiny mole near right brow | lively cultivated curiosity |

~~~text
Use case: historical-scene. ONE SINGLE character portrait for a Chinese historical atlas game,1024x1280, no grid. Images1–4 STYLE ONLY: clean Chinese baimiao ink lines, light FLAT muted washes, at most one faint shading layer, simple major folds, extremely faint paper grain. Plain solid #E3D7BE. HEAD AND SHOULDERS ONLY, no hands, props or long torso. Complete head/hat top12%, BOTH EYE CENTERS exactly38% (strictly36–40%), face centered, three-quarter gaze slightly off camera. COMPACT headwear: hat bottom near26% so eyes stay HIGH, no oversized crown/forehead gap. Simplified costume, no dense patterns. No words, Chinese characters, labels, seals, watermark, frame, guides, actor/TV likeness, anime, photography,3D, glow, nudity, weapons or blood. Ming royal WOMAN, unmistakably feminine soft brows/eyes, rounded female jaw edges preserving card face shape. Compact round JIUJI bun or very small hair crown with one simple pin, fully covered standing/crossed-collar AO jacket, no phoenix crown or male round-collar official robe.  Visibly18years old, age-appropriate youthful face and fully covered modest ceremonial clothing, no glamour makeup.
Subject face card: heart-shaped young female face and tapered chin; high curved hairline and compact side-swept jiuji bun; fine arched brows and bright wide-set eyes; small pointed nose and softly curved full lips; slender gently sloping female shoulders; pale peach-beige skin; tiny mole near right brow; lively cultivated curiosity.
FacingRIGHT. No NAME or text in image.
~~~

### new-ming-chongzhen-consort-03 · 袁氏

剧本依据：袁氏|嫔|宛平袁氏|17|1|55|性情温顺，少与人争。

| 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| round youthful female face and short chin | straight low hairline and low small round bun | fine level brows and soft downturned almond eyes | short round nose and small natural mouth | small soft rounded female shoulders | warm golden beige skin | shallow right cheek dimple | gentle shy attentive warmth |

~~~text
Use case: historical-scene. ONE SINGLE character portrait for a Chinese historical atlas game,1024x1280, no grid. Images1–4 STYLE ONLY: clean Chinese baimiao ink lines, light FLAT muted washes, at most one faint shading layer, simple major folds, extremely faint paper grain. Plain solid #E3D7BE. HEAD AND SHOULDERS ONLY, no hands, props or long torso. Complete head/hat top12%, BOTH EYE CENTERS exactly38% (strictly36–40%), face centered, three-quarter gaze slightly off camera. COMPACT headwear: hat bottom near26% so eyes stay HIGH, no oversized crown/forehead gap. Simplified costume, no dense patterns. No words, Chinese characters, labels, seals, watermark, frame, guides, actor/TV likeness, anime, photography,3D, glow, nudity, weapons or blood. Ming royal WOMAN, unmistakably feminine soft brows/eyes, rounded female jaw edges preserving card face shape. Compact round JIUJI bun or very small hair crown with one simple pin, fully covered standing/crossed-collar AO jacket, no phoenix crown or male round-collar official robe.  Visibly17years old, age-appropriate youthful face and fully covered modest ceremonial clothing, no glamour makeup.
Subject face card: round youthful female face and short chin; straight low hairline and low small round bun; fine level brows and soft downturned almond eyes; short round nose and small natural mouth; small soft rounded female shoulders; warm golden beige skin; shallow right cheek dimple; gentle shy attentive warmth.
FacingLEFT. No NAME or text in image.
~~~

### new-ming-chongzhen-foreign-01 · 林丹汗

剧本依据：察哈尔|林丹汗|冷淡|30|北|抚赏

| 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| wide diamond face and strong square chin | thick straight moustache and dense short beard | bushy angled brows and alert small eyes | large broad nose and thin firmly closed lips | very broad muscular shoulders | medium bronze tan skin | fine old scar at left jaw | proud controlled resolve |

~~~text
Use case: historical-scene. ONE SINGLE character portrait for a Chinese historical atlas game,1024x1280, no grid. Images1–4 STYLE ONLY: clean Chinese baimiao ink lines, light FLAT muted washes, at most one faint shading layer, simple major folds, extremely faint paper grain. Plain solid #E3D7BE. HEAD AND SHOULDERS ONLY, no hands, props or long torso. Complete head/hat top12%, BOTH EYE CENTERS exactly38% (strictly36–40%), face centered, three-quarter gaze slightly off camera. COMPACT headwear: hat bottom near26% so eyes stay HIGH, no oversized crown/forehead gap. Simplified costume, no dense patterns. No words, Chinese characters, labels, seals, watermark, frame, guides, actor/TV likeness, anime, photography,3D, glow, nudity, weapons or blood. Adult steppe ruler with a low pointed felt cap, dark blue wool coat and simple light fur collar; no Ming official hat. Dignified natural human face, no caricature/exaggerated ethnic features.
Subject face card: wide diamond face and strong square chin; thick straight moustache and dense short beard; bushy angled brows and alert small eyes; large broad nose and thin firmly closed lips; very broad muscular shoulders; medium bronze tan skin; fine old scar at left jaw; proud controlled resolve.
FacingRIGHT. No NAME or text in image.
~~~

### new-ming-chongzhen-foreign-02 · 皇太极

剧本依据：后金|皇太极|冷淡|5|东|入关劫掠

| 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| full broad oval face and heavy lower cheeks | neat short moustache and rounded chin beard | thick softly curved brows and long hooded eyes | short broad round-tipped nose and full closed lips | broad stocky shoulders | warm golden-brown skin | one fine line between brows | calm deliberate strategic authority |

~~~text
Use case: historical-scene. ONE SINGLE character portrait for a Chinese historical atlas game,1024x1280, no grid. Images1–4 STYLE ONLY: clean Chinese baimiao ink lines, light FLAT muted washes, at most one faint shading layer, simple major folds, extremely faint paper grain. Plain solid #E3D7BE. HEAD AND SHOULDERS ONLY, no hands, props or long torso. Complete head/hat top12%, BOTH EYE CENTERS exactly38% (strictly36–40%), face centered, three-quarter gaze slightly off camera. COMPACT headwear: hat bottom near26% so eyes stay HIGH, no oversized crown/forehead gap. Simplified costume, no dense patterns. No words, Chinese characters, labels, seals, watermark, frame, guides, actor/TV likeness, anime, photography,3D, glow, nudity, weapons or blood. Adult northeastern frontier ruler, dark round felt ceremonial cap with a SMALL muted red top, plain ochre-brown outer coat over white crossed collar, simple fur edge; no Ming wushamao/rank patch or elaborate beads. Dignified natural human face, no caricature/exaggerated ethnic features.
Subject face card: full broad oval face and heavy lower cheeks; neat short moustache and rounded chin beard; thick softly curved brows and long hooded eyes; short broad round-tipped nose and full closed lips; broad stocky shoulders; warm golden-brown skin; one fine line between brows; calm deliberate strategic authority.
FacingLEFT. No NAME or text in image.
~~~

### new-ming-chongzhen-foreign-03 · 李倧

剧本依据：朝鲜|李倧|朝贡|55|东|乞援抗金

| 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| long slender oval face and narrow chin | sparse dark three-strand beard and fine moustache | fine sloped brows and long downturned eyes | long small-bridged nose and thin gently closed mouth | lean straight shoulders | pale warm beige skin | fine line at right mouth corner | reserved cautious dignity |

~~~text
Use case: historical-scene. ONE SINGLE character portrait for a Chinese historical atlas game,1024x1280, no grid. Images1–4 STYLE ONLY: clean Chinese baimiao ink lines, light FLAT muted washes, at most one faint shading layer, simple major folds, extremely faint paper grain. Plain solid #E3D7BE. HEAD AND SHOULDERS ONLY, no hands, props or long torso. Complete head/hat top12%, BOTH EYE CENTERS exactly38% (strictly36–40%), face centered, three-quarter gaze slightly off camera. COMPACT headwear: hat bottom near26% so eyes stay HIGH, no oversized crown/forehead gap. Simplified costume, no dense patterns. No words, Chinese characters, labels, seals, watermark, frame, guides, actor/TV likeness, anime, photography,3D, glow, nudity, weapons or blood. Adult sea-east ruler, tall black ribbed upright ceremonial crown and short rear ribbons, deep teal formal outer robe with very WIDE WHITE crossed collar and burgundy shoulder band, no Ming scholar clothing. Dignified natural human face, no caricature/exaggerated ethnic features.
Subject face card: long slender oval face and narrow chin; sparse dark three-strand beard and fine moustache; fine sloped brows and long downturned eyes; long small-bridged nose and thin gently closed mouth; lean straight shoulders; pale warm beige skin; fine line at right mouth corner; reserved cautious dignity.
FacingRIGHT. No NAME or text in image.
~~~

### new-ming-chongzhen-foreign-04 · 德川家光

剧本依据：日本|德川家光|冷淡|30|东|闭关自守

| 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| short broad face and heavy square chin | small straight moustache and a short squared chin beard | level heavy brows and close-set steady eyes | short high nose and thin firm lips | full square shoulders | light golden skin | small mole near left temple | formal restrained self-possession |

~~~text
Use case: historical-scene. ONE SINGLE character portrait for a Chinese historical atlas game,1024x1280, no grid. Images1–4 STYLE ONLY: clean Chinese baimiao ink lines, light FLAT muted washes, at most one faint shading layer, simple major folds, extremely faint paper grain. Plain solid #E3D7BE. HEAD AND SHOULDERS ONLY, no hands, props or long torso. Complete head/hat top12%, BOTH EYE CENTERS exactly38% (strictly36–40%), face centered, three-quarter gaze slightly off camera. COMPACT headwear: hat bottom near26% so eyes stay HIGH, no oversized crown/forehead gap. Simplified costume, no dense patterns. No words, Chinese characters, labels, seals, watermark, frame, guides, actor/TV likeness, anime, photography,3D, glow, nudity, weapons or blood. Adult sea-east ruler, tall black folded cone-like EBOSHI and rear cord, muted burgundy broad ceremonial outer robe with crisp wide white crossed collar; no Ming rujin/wushamao/rank patch. Dignified natural human face, no caricature/exaggerated ethnic features.
Subject face card: short broad face and heavy square chin; small straight moustache and a short squared chin beard; level heavy brows and close-set steady eyes; short high nose and thin firm lips; full square shoulders; light golden skin; small mole near left temple; formal restrained self-possession.
FacingLEFT. No NAME or text in image.
~~~

### new-ming-chongzhen-dowager-01 · 懿安皇后

剧本依据：懿安皇后

| 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| long young-adult oval female face and rounded chin | black high rounded hairline and modest low bun under phoenix crown | fine soft straight brows and long attentive almond eyes | small straight nose and natural gently closed lips | slender upright female shoulders | pale warm skin | tiny mole below right brow | quiet protective dignity |

~~~text
Use case: historical-scene. ONE SINGLE character portrait for a Chinese historical atlas game,1024x1280, no grid. Images1–4 STYLE ONLY: clean Chinese baimiao ink lines, light FLAT muted washes, at most one faint shading layer, simple major folds, extremely faint paper grain. Plain solid #E3D7BE. HEAD AND SHOULDERS ONLY, no hands, props or long torso. Complete head/hat top12%, BOTH EYE CENTERS exactly38% (strictly36–40%), face centered, three-quarter gaze slightly off camera. COMPACT headwear: hat bottom near26% so eyes stay HIGH, no oversized crown/forehead gap. Simplified costume, no dense patterns. No words, Chinese characters, labels, seals, watermark, frame, guides, actor/TV likeness, anime, photography,3D, glow, nudity, weapons or blood. Ming royal WOMAN, unmistakably feminine soft brows/eyes and rounded female jaw edges while preserving card face shape. Ming standing/crossed-collar AO fully covering shoulders. Recognizable compact GOLD PHOENIX CROWN with bird beak/neck/outspread wings and short PEARL STRANDS like image5 silhouette; simple outline, not a plain hair clip.  A young-to-mature adult woman with black hair, NOT an elderly gray-haired generic dowager.
Subject face card: long young-adult oval female face and rounded chin; black high rounded hairline and modest low bun under phoenix crown; fine soft straight brows and long attentive almond eyes; small straight nose and natural gently closed lips; slender upright female shoulders; pale warm skin; tiny mole below right brow; quiet protective dignity.
FacingRIGHT. No NAME or text in image.
~~~

### new-ming-chongzhen-emperor-01-old · 朱由检

剧本依据：['朱由检', 17, '65 60 45 65 50', '多疑']；游戏≥40岁年龄档

| 脸型 | 胡须／发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| the SAME long narrow oval face and firm chin, naturally aged with fine cheek lines | neat short moustache and small pointed chin beard with a few gray temple strands under yishanguan | fine straight brows slightly drawn inward and long wary eyes | narrow straight nose and thin closed lips | lean upright adult shoulders | pale warm skin | same tiny mole below left mouth corner plus restrained crow-feet and forehead lines | serious weary guarded authority, visibly45-year-old adult |

~~~text
Use case: historical-scene. ONE SINGLE character portrait for a Chinese historical atlas game,1024x1280, no grid. Images1–4 STYLE ONLY: clean Chinese baimiao ink lines, light FLAT muted washes, at most one faint shading layer, simple major folds, extremely faint paper grain. Plain solid #E3D7BE. HEAD AND SHOULDERS ONLY, no hands, props or long torso. Complete head/hat top12%, BOTH EYE CENTERS exactly38% (strictly36–40%), face centered, three-quarter gaze slightly off camera. COMPACT headwear: hat bottom near26% so eyes stay HIGH, no oversized crown/forehead gap. Simplified costume, no dense patterns. No words, Chinese characters, labels, seals, watermark, frame, guides, actor/TV likeness, anime, photography,3D, glow, nudity, weapons or blood. Ming emperor in muted YELLOW round-collar dragon robe indicated by only a few simple lines, compact black YISHANGUAN with TWO rear wings folded UPWARD behind crown, no horizontal official wings.
Subject face card: the SAME long narrow oval face and firm chin, naturally aged with fine cheek lines; neat short moustache and small pointed chin beard with a few gray temple strands under yishanguan; fine straight brows slightly drawn inward and long wary eyes; narrow straight nose and thin closed lips; lean upright adult shoulders; pale warm skin; same tiny mole below left mouth corner plus restrained crow-feet and forehead lines; serious weary guarded authority, visibly45-year-old adult.
FacingLEFT. Visibly45years old. No NAME or text in image.
Input image5 will be the SAME-PERSON younger emperor identity reference. Age naturally to45, retain face, eyes, nose, lips and tiny left-mouth mole, no unrelated new person.
~~~

### new-scene-desk-day · 御案日景

~~~text
Use case: historical-scene. Game chapter/action scene illustration. Images1–4 are STYLE references ONLY, do not paint the portrait people. Chinese baimiao clean ink lines with light FLAT muted color washes, simple architectural contours, at most one faint shadow layer, extremely faint paper grain. Palette ochre/cinnabar/azurite/malachite/beige/ink-gray. A broad Chinese imperial writing desk with simple brush rack, CLOSED unmarked folded memorial stacks and plain paperweight; lattice window, glimpse of palace wall, wooden beams above and desk legs/flagstone floor below. Daytime pale even light.
COMPOSITION: important objects in the horizontal MIDDLE BAND30–70% of canvas height so a112px mobile header crop remains meaningful. FULL-BLEED illustration to ALL FOUR EDGES: paint beams/eaves/sky to TOP and floor/ground/water to BOTTOM. NO blank beige strip, black letterbox bar, masking band, border or baked-in gradient. Generic Chinese court space, not a real building replica. No people or identifiable figures, ANY text, plaques with writing, seals, signature, watermark, photorealism,3D, fantasy glow, dramatic lighting or ornate filigree. 16:9 landscape,1536x864.
~~~

### new-scene-audience · 偏殿召对

~~~text
Use case: historical-scene. Game chapter/action scene illustration. Images1–4 are STYLE references ONLY, do not paint the portrait people. Chinese baimiao clean ink lines with light FLAT muted color washes, simple architectural contours, at most one faint shadow layer, extremely faint paper grain. Palette ochre/cinnabar/azurite/malachite/beige/ink-gray. A quiet side audience chamber, simple standing screen and two small stools, red wooden pillars, lattice window, plain low side table, beams and floor. Empty room with no people. Daytime pale even light.
COMPOSITION: important objects in the horizontal MIDDLE BAND30–70% of canvas height so a112px mobile header crop remains meaningful. FULL-BLEED illustration to ALL FOUR EDGES: paint beams/eaves/sky to TOP and floor/ground/water to BOTTOM. NO blank beige strip, black letterbox bar, masking band, border or baked-in gradient. Generic Chinese court space, not a real building replica. No people or identifiable figures, ANY text, plaques with writing, seals, signature, watermark, photorealism,3D, fantasy glow, dramatic lighting or ornate filigree. 16:9 landscape,1536x864.
~~~

### new-scene-banquet · 宫宴

~~~text
Use case: historical-scene. Game chapter/action scene illustration. Images1–4 are STYLE references ONLY, do not paint the portrait people. Chinese baimiao clean ink lines with light FLAT muted color washes, simple architectural contours, at most one faint shadow layer, extremely faint paper grain. Palette ochre/cinnabar/azurite/malachite/beige/ink-gray. An empty palace banquet hall with orderly low tables, plain wine cups and simple bowls, hanging palace lanterns, timber beams and red columns. No people, no readable marks or ornate food detail. Daytime neutral light.
COMPOSITION: important objects in the horizontal MIDDLE BAND30–70% of canvas height so a112px mobile header crop remains meaningful. FULL-BLEED illustration to ALL FOUR EDGES: paint beams/eaves/sky to TOP and floor/ground/water to BOTTOM. NO blank beige strip, black letterbox bar, masking band, border or baked-in gradient. Generic Chinese court space, not a real building replica. No people or identifiable figures, ANY text, plaques with writing, seals, signature, watermark, photorealism,3D, fantasy glow, dramatic lighting or ornate filigree. 16:9 landscape,1536x864.
~~~

### new-scene-palace · 后宫夜廊

~~~text
Use case: historical-scene. Game chapter/action scene illustration. Images1–4 are STYLE references ONLY, do not paint the portrait people. Chinese baimiao clean ink lines with light FLAT muted color washes, simple architectural contours, at most one faint shadow layer, extremely faint paper grain. Palette ochre/cinnabar/azurite/malachite/beige/ink-gray. An exterior palace corridor at NIGHT, red columns, closed lattice doors, modest hanging lanterns, Chinese fabric drapes or bamboo blinds, dark paving and timber eaves. NO BED, sleeping area, people or western curtains. Overall very dark brown near#1C1714; tiny flat warm-gold lantern areas near#C8A35A.
COMPOSITION: important objects in the horizontal MIDDLE BAND30–70% of canvas height so a112px mobile header crop remains meaningful. FULL-BLEED illustration to ALL FOUR EDGES: paint beams/eaves/sky to TOP and floor/ground/water to BOTTOM. NO blank beige strip, black letterbox bar, masking band, border or baked-in gradient. Generic Chinese court space, not a real building replica. No people or identifiable figures, ANY text, plaques with writing, seals, signature, watermark, photorealism,3D, fantasy glow, dramatic lighting or ornate filigree. 16:9 landscape,1536x864.
~~~

### new-scene-garden · 御花园

~~~text
Use case: historical-scene. Game chapter/action scene illustration. Images1–4 are STYLE references ONLY, do not paint the portrait people. Chinese baimiao clean ink lines with light FLAT muted color washes, simple architectural contours, at most one faint shadow layer, extremely faint paper grain. Palette ochre/cinnabar/azurite/malachite/beige/ink-gray. A modest imperial garden, curved stone bridge over quiet pond, rockery and one open pavilion, sparse trees and malachite-green plants, red palace wall in distance. No people. Daytime pale even light, simple clean spatial shapes.
COMPOSITION: important objects in the horizontal MIDDLE BAND30–70% of canvas height so a112px mobile header crop remains meaningful. FULL-BLEED illustration to ALL FOUR EDGES: paint beams/eaves/sky to TOP and floor/ground/water to BOTTOM. NO blank beige strip, black letterbox bar, masking band, border or baked-in gradient. Generic Chinese court space, not a real building replica. No people or identifiable figures, ANY text, plaques with writing, seals, signature, watermark, photorealism,3D, fantasy glow, dramatic lighting or ornate filigree. 16:9 landscape,1536x864.
~~~

### new-scene-study · 经筵书斋

~~~text
Use case: historical-scene. Game chapter/action scene illustration. Images1–4 are STYLE references ONLY, do not paint the portrait people. Chinese baimiao clean ink lines with light FLAT muted color washes, simple architectural contours, at most one faint shadow layer, extremely faint paper grain. Palette ochre/cinnabar/azurite/malachite/beige/ink-gray. A quiet study with wooden shelves of CLOSED unmarked books, a few rolled scrolls, small plain incense burner on a desk, lattice window and simple timber structure. No writing on spines, no people. Daytime pale even light.
COMPOSITION: important objects in the horizontal MIDDLE BAND30–70% of canvas height so a112px mobile header crop remains meaningful. FULL-BLEED illustration to ALL FOUR EDGES: paint beams/eaves/sky to TOP and floor/ground/water to BOTTOM. NO blank beige strip, black letterbox bar, masking band, border or baked-in gradient. Generic Chinese court space, not a real building replica. No people or identifiable figures, ANY text, plaques with writing, seals, signature, watermark, photorealism,3D, fantasy glow, dramatic lighting or ornate filigree. 16:9 landscape,1536x864.
~~~

### new-scene-exam · 殿试考场

~~~text
Use case: historical-scene. Game chapter/action scene illustration. Images1–4 are STYLE references ONLY, do not paint the portrait people. Chinese baimiao clean ink lines with light FLAT muted color washes, simple architectural contours, at most one faint shadow layer, extremely faint paper grain. Palette ochre/cinnabar/azurite/malachite/beige/ink-gray. An EMPTY Chinese palace examination hall with orderly rows of simple wooden examination desks and stools, blank unmarked paper rolls kept closed, timber beams and red columns. No candidates or readable writing. Daytime pale even light.
COMPOSITION: important objects in the horizontal MIDDLE BAND30–70% of canvas height so a112px mobile header crop remains meaningful. FULL-BLEED illustration to ALL FOUR EDGES: paint beams/eaves/sky to TOP and floor/ground/water to BOTTOM. NO blank beige strip, black letterbox bar, masking band, border or baked-in gradient. Generic Chinese court space, not a real building replica. No people or identifiable figures, ANY text, plaques with writing, seals, signature, watermark, photorealism,3D, fantasy glow, dramatic lighting or ornate filigree. 16:9 landscape,1536x864.
~~~

### new-scene-tour · 城外驿道

~~~text
Use case: historical-scene. Game chapter/action scene illustration. Images1–4 are STYLE references ONLY, do not paint the portrait people. Chinese baimiao clean ink lines with light FLAT muted color washes, simple architectural contours, at most one faint shadow layer, extremely faint paper grain. Palette ochre/cinnabar/azurite/malachite/beige/ink-gray. A generic Chinese city gate opening onto a winding post road, distant low mountains and sparse roadside trees, modest way station roof at one side. No people, vehicles or written signs. Daytime pale even light.
COMPOSITION: important objects in the horizontal MIDDLE BAND30–70% of canvas height so a112px mobile header crop remains meaningful. FULL-BLEED illustration to ALL FOUR EDGES: paint beams/eaves/sky to TOP and floor/ground/water to BOTTOM. NO blank beige strip, black letterbox bar, masking band, border or baked-in gradient. Generic Chinese court space, not a real building replica. No people or identifiable figures, ANY text, plaques with writing, seals, signature, watermark, photorealism,3D, fantasy glow, dramatic lighting or ornate filigree. 16:9 landscape,1536x864.
~~~

### new-scene-camp · 军营大帐

~~~text
Use case: historical-scene. Game chapter/action scene illustration. Images1–4 are STYLE references ONLY, do not paint the portrait people. Chinese baimiao clean ink lines with light FLAT muted color washes, simple architectural contours, at most one faint shadow layer, extremely faint paper grain. Palette ochre/cinnabar/azurite/malachite/beige/ink-gray. A calm military encampment with one simple command tent, plain UNMARKED banners, low brazier/campfire, timber poles and distant smaller tents. No people, weapons, battle, blood or injuries. Daytime subdued even light, small flat warm fire area.
COMPOSITION: important objects in the horizontal MIDDLE BAND30–70% of canvas height so a112px mobile header crop remains meaningful. FULL-BLEED illustration to ALL FOUR EDGES: paint beams/eaves/sky to TOP and floor/ground/water to BOTTOM. NO blank beige strip, black letterbox bar, masking band, border or baked-in gradient. Generic Chinese court space, not a real building replica. No people or identifiable figures, ANY text, plaques with writing, seals, signature, watermark, photorealism,3D, fantasy glow, dramatic lighting or ornate filigree. 16:9 landscape,1536x864.
~~~

### new-scene-accession · 宫门晨光

~~~text
Use case: historical-scene. Game chapter/action scene illustration. Images1–4 are STYLE references ONLY, do not paint the portrait people. Chinese baimiao clean ink lines with light FLAT muted color washes, simple architectural contours, at most one faint shadow layer, extremely faint paper grain. Palette ochre/cinnabar/azurite/malachite/beige/ink-gray. An EMPTY broad palace gateway and long stone steps at DAWN, red walls, timber eaves and restrained warm-gold morning color. No people or writing. Generic architecture, not a specific monument, no dramatic rays.
COMPOSITION: important objects in the horizontal MIDDLE BAND30–70% of canvas height so a112px mobile header crop remains meaningful. FULL-BLEED illustration to ALL FOUR EDGES: paint beams/eaves/sky to TOP and floor/ground/water to BOTTOM. NO blank beige strip, black letterbox bar, masking band, border or baked-in gradient. Generic Chinese court space, not a real building replica. No people or identifiable figures, ANY text, plaques with writing, seals, signature, watermark, photorealism,3D, fantasy glow, dramatic lighting or ornate filigree. 16:9 landscape,1536x864.
~~~

### new-scene-ending · 雪夜空殿

~~~text
Use case: historical-scene. Game chapter/action scene illustration. Images1–4 are STYLE references ONLY, do not paint the portrait people. Chinese baimiao clean ink lines with light FLAT muted color washes, simple architectural contours, at most one faint shadow layer, extremely faint paper grain. Palette ochre/cinnabar/azurite/malachite/beige/ink-gray. An empty palace hall on a snowy NIGHT, closed doors, dark timber pillars, pale snow visible beyond an open side, a CLOSED unmarked historical book on a plain low foreground table. No people or writing. Overall dark near#1C1714, muted cold-gray snow and tiny warm-gold lamp area.
COMPOSITION: important objects in the horizontal MIDDLE BAND30–70% of canvas height so a112px mobile header crop remains meaningful. FULL-BLEED illustration to ALL FOUR EDGES: paint beams/eaves/sky to TOP and floor/ground/water to BOTTOM. NO blank beige strip, black letterbox bar, masking band, border or baked-in gradient. Generic Chinese court space, not a real building replica. No people or identifiable figures, ANY text, plaques with writing, seals, signature, watermark, photorealism,3D, fantasy glow, dramatic lighting or ornate filigree. 16:9 landscape,1536x864.
~~~

### new-scene-hall-realm · 天下山河题图

~~~text
Use case: historical-scene. Game hall title illustration. Images1–4 are STYLE references ONLY, do not paint the portrait people. Chinese baimiao clean ink lines with light FLAT muted color washes, simple architectural contours, at most one faint shadow layer, extremely faint paper grain. Palette ochre/cinnabar/azurite/malachite/beige/ink-gray. A Chinese landscape long-scroll view of layered malachite-green mountains, a winding river, fields and tiny generic distant wall/pavilion silhouettes. Daytime pale even light, no people or words.
COMPOSITION: important objects in the horizontal MIDDLE BAND30–70% of canvas height so a112px mobile header crop remains meaningful. FULL-BLEED illustration to ALL FOUR EDGES: paint beams/eaves/sky to TOP and floor/ground/water to BOTTOM. NO blank beige strip, black letterbox bar, masking band, border or baked-in gradient. Generic Chinese court space, not a real building replica. No people or identifiable figures, ANY text, plaques with writing, seals, signature, watermark, photorealism,3D, fantasy glow, dramatic lighting or ornate filigree. 3:1 wide landscape,1536x512.
~~~

### new-scene-hall-treasury · 内库题图

~~~text
Use case: historical-scene. Game hall title illustration. Images1–4 are STYLE references ONLY, do not paint the portrait people. Chinese baimiao clean ink lines with light FLAT muted color washes, simple architectural contours, at most one faint shadow layer, extremely faint paper grain. Palette ochre/cinnabar/azurite/malachite/beige/ink-gray. A plain treasury/granary gateway with closed timber doors, simple money chests and stacked grain bins, muted red-brown wood and green-gray stone. Daytime pale even light, no people, writing, coins with marks or glowing gold.
COMPOSITION: important objects in the horizontal MIDDLE BAND30–70% of canvas height so a112px mobile header crop remains meaningful. FULL-BLEED illustration to ALL FOUR EDGES: paint beams/eaves/sky to TOP and floor/ground/water to BOTTOM. NO blank beige strip, black letterbox bar, masking band, border or baked-in gradient. Generic Chinese court space, not a real building replica. No people or identifiable figures, ANY text, plaques with writing, seals, signature, watermark, photorealism,3D, fantasy glow, dramatic lighting or ornate filigree. 3:1 wide landscape,1536x512.
~~~

### new-scene-hall-archive · 史馆题图

~~~text
Use case: historical-scene. Game hall title illustration. Images1–4 are STYLE references ONLY, do not paint the portrait people. Chinese baimiao clean ink lines with light FLAT muted color washes, simple architectural contours, at most one faint shadow layer, extremely faint paper grain. Palette ochre/cinnabar/azurite/malachite/beige/ink-gray. A long wooden archive library corridor with shelves of CLOSED unmarked books and rolled scrolls, timber beams, lattice windows and stone floor. Daytime pale even light, no people or writing on spines.
COMPOSITION: important objects in the horizontal MIDDLE BAND30–70% of canvas height so a112px mobile header crop remains meaningful. FULL-BLEED illustration to ALL FOUR EDGES: paint beams/eaves/sky to TOP and floor/ground/water to BOTTOM. NO blank beige strip, black letterbox bar, masking band, border or baked-in gradient. Generic Chinese court space, not a real building replica. No people or identifiable figures, ANY text, plaques with writing, seals, signature, watermark, photorealism,3D, fantasy glow, dramatic lighting or ornate filigree. 3:1 wide landscape,1536x512.
~~~

## 2026-11-06 最终构图复核修订

高冠收短、保留原五官和服装；封卷史册移入中间带。以下为实际修订提示词，导出仍仅裁切、等比缩放及转 WebP。

### new-ming-wanli-foreign-05

~~~text
Use case: precise-object-edit. Image1 is the EDIT TARGET. Shorten ONLY the tall black EBOSHI cap vertically: its TOP must be at10% of canvas height, keep its distinct angular folded cone and cords. Keep ALL facial identity, eyes at38%, nose, lips, beard, robe, facing, shoulders, background and style EXACTLY unchanged. Do not move the face or enlarge the forehead. Image2 is an extra style reference only. Preserve clean Chinese baimiao ink outlines with light flat muted colors. No text, seals, watermark, borders or new props.
~~~

### new-ming-chongzhen-foreign-04

~~~text
Use case: precise-object-edit. Image1 is the EDIT TARGET. Shorten ONLY the tall black EBOSHI cap vertically: its TOP must be at10% of canvas height, keep its distinct angular folded cone and cords. Keep ALL facial identity, eyes at38–40%, nose, lips, beard, robe, facing, shoulders, background and style EXACTLY unchanged. Do not move the face or enlarge the forehead. Image2 is an extra style reference only. Preserve clean Chinese baimiao ink outlines with light flat muted colors. No text, seals, watermark, borders or new props.
~~~

### new-ming-chongzhen-emperor-01-old

~~~text
Use case: precise-object-edit. Image1 is the EDIT TARGET. Shorten ONLY the imperial YISHANGUAN crown vertically: two upward rear wings must start at10% from top with plain paper headroom above; retain the two raised rear wings and rounded low front. Keep ALL SAME face, age45, eyes at38%, eyebrows, nose, moustache, beard, tiny left-mouth mole, yellow dragon robe, background and style EXACTLY unchanged. Do not move the face or redraw identity. Image2 is an extra style reference only. Preserve clean Chinese baimiao ink outlines with light flat muted colors. No text, seals, watermark, borders or new props.
~~~

### new-scene-ending

~~~text
Use case: precise-object-edit. Image1 is the EDIT TARGET. Move ONLY the wooden desk and its CLOSED unmarked history book upward in the composition, so the book center is at63% of full canvas height (inside30–70% center band). Simplify the desk depth naturally. Preserve the empty snow-night Chinese hall, shut red doors, lanterns, snowy courtyard, all-over dark flat baimiao colors and full-bleed beams at top and stone floor at bottom. No people, text, watermark, blank strips, black bars or borders. Image2 is an extra style reference only. Preserve clean Chinese baimiao ink outlines with light flat muted colors. No text, seals, watermark, borders or new props.
~~~


### 天下题图最终版：只画山河长卷

~~~text
Use case: historical-scene. ONE 3:1 panoramic QINGLU Chinese MOUNTAIN-AND-RIVER LANDSCAPE long scroll for game hall title,1536x512. Images1–4 are ONLY linework, flat color and paper texture references: ABSOLUTELY DO NOT COPY their palace architecture, portraits or thrones. Entire canvas is an OPEN OUTDOOR LANDSCAPE: layered malachite-green and azurite mountains across width, winding pale blue river across central band, tiny fields and trees at shore. View from a hillside, no building in foreground. ONLY a few tiny far-away wall/pavilion silhouettes allowed, smaller than1% canvas. Plain pale daytime sky touches top edge, river and green ground touch bottom edge, hills continue left/right. Main mountain/river forms in30–70% height. Chinese baimiao clean ink contours, light FLAT muted washes, one faint shadow layer, subtle paper texture. NO palace interior, roof, eaves, timber beams, columns, curtain, desk, chair, throne, stairs, people, text, seals, watermarks, borders, black bars or blank beige strips. No photorealism,3D,fantasy,glow.
~~~


### 御花园预算复核：简化枝叶与纸纹

1440档首次q72导出超出150KB，保持规范尺寸与质量，回到imagegen简化线条及纸纹。

~~~text
Use case: precise-object-edit. Image1 is the garden EDIT TARGET. Images2–5 are the four approved STYLE reference images. Keep exact garden identity and layout: curved white stone bridge, small open pavilion, rockery, quiet pond, red distant wall, overhanging Chinese timber eaves. SIMPLIFY DETAIL STRONGLY for a small compressed game image: trees drawn with just a few large flat cloud-like leaf masses and10–15 short twig strokes each; remove individually drawn little leaves and dense reed detail; water is a mostly smooth flat muted green area with only8–12 long simple ripple lines; rocks have only a few contour strokes. NO granular or mottled paper noise, background almost perfectly smooth pale paper with extremely faint texture only. Clean Chinese baimiao ink contours and flat light muted color washes, at most one faint shading layer. Retain daylight, objects in central30–70% band. FULL-BLEED painting to all4edges; roof timbers top, stone pavement/water bottom. No words,seals,watermark,frames,bars,blank strips,people,3D or photo.
~~~

## b87b457审阅后修订：专属像辨识度与野外场景

本节为这些文件的最新长相卡，覆盖此前同名文件的视觉设定。姓名、年龄、角色性格与秘密依据src/core/scenarios.js；脸型、胡须与体态为依据这些资料作的视觉设计，不作为史实肖像断言。两组全部7人重出，分别保证4人与3人在脸型、胡须、体态、神情等维度明显不同。万历两张只调整翼善冠，保留已确认身份与年龄。文件名、取图逻辑和玩法不变。

### ming-wanli/official-04 · 张四维（46岁）

剧本依据：工于心计；盐业家族，与晋商往来密切。

|脸型|胡须|眉眼|鼻口|体态|肤色|标记|神情|
|---|---|---|---|---|---|---|---|
|狭尖倒三角，颧骨高、面颊凹|细八字短髭、尖而细的山羊须|细斜眉、狭小警觉眼|长窄鼻、紧抿薄唇|窄肩细颈，清瘦挺直|浅橄榄肤|左鬓近处小痣，深法令纹|克制精算、礼貌但疏离|

### ming-wanli/official-05 · 申时行（37岁）

剧本依据：温和圆融；状元出身，不愿与言官阁臣结怨。

|脸型|胡须|眉眼|鼻口|体态|肤色|标记|神情|
|---|---|---|---|---|---|---|---|
|宽圆梨形，下颊丰厚、下巴圆|完全无须，颌线洁净|柔弧细眉、放松下垂眼|短圆鼻、较厚唇、温和微笑|富态宽肩、短颈、轻微双下颌|暖象牙肤|右颊浅酒窝|亲和、圆融、从容|

### ming-wanli/official-06 · 王锡爵（38岁）

剧本依据：刚直有守；高拱与张居正间两不依附。

|脸型|胡须|眉眼|鼻口|体态|肤色|标记|神情|
|---|---|---|---|---|---|---|---|
|宽方脸，宽下颌、平直下巴|浓黑短络腮胡，连腮连颌|粗平眉、大而直的警醒眼|宽直鼻、紧闭薄唇|壮实厚颈、宽直肩|偏深金褐肤|右眉小缺口|正直、严肃、自持|

### ming-wanli/official-09 · 谭纶（52岁）

剧本依据：知兵能任事；曾与戚继光在东南抗倭，交情深厚。

|脸型|胡须|眉眼|鼻口|体态|肤色|标记|神情|
|---|---|---|---|---|---|---|---|
|宽颧五角脸、直短下巴|浓下垂髭，颏颊无须|浓压眉、眼袋及鱼尾纹|宽鼻、宽而紧的嘴|粗壮颈肩、干练|深褐风霜肤|灰鬓、横额纹|沉着务实、坚决|

### ming-chongzhen/official-02 · 崔呈秀（50岁）

剧本依据：依附魏珰，五虎之首；贪墨军饷，账目可查。

|脸型|胡须|眉眼|鼻口|体态|肤色|标记|神情|
|---|---|---|---|---|---|---|---|
|短宽梯形，下颊丰厚、下颌宽|浓密扇形短颏髯连腮，有灰丝|八字粗眉、小而近的眯眼|短宽鼻、宽薄唇|富态双下颌、粗短颈、微收肩|暖棕肤|右眉旁痣、深颊纹|审视、逢迎而戒备|

### ming-chongzhen/official-04 · 温体仁（54岁）

剧本依据：外示温谨，内实阴狠；欲借攻讦东林邀圣眷。

|脸型|胡须|眉眼|鼻口|体态|肤色|标记|神情|
|---|---|---|---|---|---|---|---|
|极清瘦长矩形，颊凹、下巴窄|三绺稀疏长髯、细短髭|低平细眉、细长重睑眼|长高窄鼻、薄且平直嘴|细颈、削肩、端直|冷浅肤|花白鬓、眉间细竖纹|外表温谨，冷静深藏|

### ming-chongzhen/official-05 · 周延儒（34岁）

剧本依据：机敏善揣；状元出身，与东林若即若离。

|脸型|胡须|眉眼|鼻口|体态|肤色|标记|神情|
|---|---|---|---|---|---|---|---|
|短卵圆脸，圆颧、紧凑下巴|完全无须，显年轻成年|上扬短眉、明亮较大眼|短小微翘鼻、圆润微弯唇|清俊细颈、轻盈松肩|暖浅米肤|左嘴角浅窝|机敏、专注、擅应对|

### 实际生成提示词与参照角色

每条均为内置imagegen，参照图1是待修原图，2–5为四张定调样张（仅画风）。专属像单张生成；导出仅裁切、等比缩放、转WebP。

#### review2-ming-wanli-official-04

目标：assets/art/portraits/unique/ming-wanli/official-04.webp

~~~text
Use case: historical-scene. ONE single Chinese Ming civil minister game portrait,1024x1280,HEAD AND SHOULDERS,plain solid #E3D7BE. Image1 is EDIT TARGET: preserve its correct flat-top Ming WUSHAMAO construction but REPLACE FACE, facial hair, neck/build and expression with the specified NEW distinct identity. Images2–5 are the four approved STYLE references ONLY, never copy their faces or locations. Chinese baimiao CLEAN INK contours and light FLAT muted washes, at most one faint shading layer, simplified main folds, extremely faint smooth paper grain. Compact black WUSHAMAO: FLAT TOP,low front close to forehead,higher flat rear, two thin FLAT OVAL wings projecting HORIZONTALLY from BACK. No dome or continuous hat brim. Hat/head top at12%,eye centers EXACTLY38% (strict36–40%),face centered,three-quarter view,gaze slightly off-camera. Crop just below shoulders, no hands or props. Costume is Ming round-collar official robe with only simple rank-patch top edge. NO yellow,ochre or gold robes. No text,names,seals,watermarks,frames,guides,actors,TV likeness,anime,photo,3D,glow or intricate embroidery. Render face-shape,beard,build and expression differences VERY CLEARLY even at44px.
Subject NEW face card: very NARROW INVERTED TRIANGLE face, high projecting cheekbones, noticeably hollow cheeks and sharp tapering chin; thin separated downward moustache and one very narrow pointed GOATEE with completely bare jaw sides; fine slanted brows and small close watchful eyes; long narrow slightly hooked nose, thin tightly pursed lips; skinny neck and narrow upright shoulders; pale olive skin, tiny left-temple mole and deep nose-mouth folds; controlled polished calculating reserve.
Age46; facingLEFT. Robe muted dark GREEN. No text/name in image.
~~~

#### review2-ming-wanli-official-05

目标：assets/art/portraits/unique/ming-wanli/official-05.webp

~~~text
Use case: historical-scene. ONE single Chinese Ming civil minister game portrait,1024x1280,HEAD AND SHOULDERS,plain solid #E3D7BE. Image1 is EDIT TARGET: preserve its correct flat-top Ming WUSHAMAO construction but REPLACE FACE, facial hair, neck/build and expression with the specified NEW distinct identity. Images2–5 are the four approved STYLE references ONLY, never copy their faces or locations. Chinese baimiao CLEAN INK contours and light FLAT muted washes, at most one faint shading layer, simplified main folds, extremely faint smooth paper grain. Compact black WUSHAMAO: FLAT TOP,low front close to forehead,higher flat rear, two thin FLAT OVAL wings projecting HORIZONTALLY from BACK. No dome or continuous hat brim. Hat/head top at12%,eye centers EXACTLY38% (strict36–40%),face centered,three-quarter view,gaze slightly off-camera. Crop just below shoulders, no hands or props. Costume is Ming round-collar official robe with only simple rank-patch top edge. NO yellow,ochre or gold robes. No text,names,seals,watermarks,frames,guides,actors,TV likeness,anime,photo,3D,glow or intricate embroidery. Render face-shape,beard,build and expression differences VERY CLEARLY even at44px.
Subject NEW face card: noticeably PLUMP PEAR-ROUND face with wide full lower cheeks, rounded jaw and slight DOUBLE CHIN; COMPLETELY CLEAN-SHAVEN, absolutely no moustache, stubble or chin tuft; softly curved fine eyebrows, relaxed slightly downturned eyes; short rounded nose and full lips in a gentle tactful closed-mouth smile; short thick neck, soft broad rounded shoulders; warm ivory skin, shallow right-cheek dimple; approachable conciliatory warmth, visibly a mature man of37, not a teenager.
Age37; facingRIGHT. Robe muted BLUE. No text/name in image.
~~~

#### review2-ming-wanli-official-06

目标：assets/art/portraits/unique/ming-wanli/official-06.webp

~~~text
Use case: historical-scene. ONE single Chinese Ming civil minister game portrait,1024x1280,HEAD AND SHOULDERS,plain solid #E3D7BE. Image1 is EDIT TARGET: preserve its correct flat-top Ming WUSHAMAO construction but REPLACE FACE, facial hair, neck/build and expression with the specified NEW distinct identity. Images2–5 are the four approved STYLE references ONLY, never copy their faces or locations. Chinese baimiao CLEAN INK contours and light FLAT muted washes, at most one faint shading layer, simplified main folds, extremely faint smooth paper grain. Compact black WUSHAMAO: FLAT TOP,low front close to forehead,higher flat rear, two thin FLAT OVAL wings projecting HORIZONTALLY from BACK. No dome or continuous hat brim. Hat/head top at12%,eye centers EXACTLY38% (strict36–40%),face centered,three-quarter view,gaze slightly off-camera. Crop just below shoulders, no hands or props. Costume is Ming round-collar official robe with only simple rank-patch top edge. NO yellow,ochre or gold robes. No text,names,seals,watermarks,frames,guides,actors,TV likeness,anime,photo,3D,glow or intricate embroidery. Render face-shape,beard,build and expression differences VERY CLEARLY even at44px.
Subject NEW face card: BROAD SQUARE face with massive rectangular jaw corners and blunt horizontal chin; dense BLACK FULL BEARD across BOTH CHEEKS, entire jaw and chin, with thick connected moustache, short even beard length, NOT a small goatee; thick straight level brows and large steady alert eyes; broad straight nose, firm closed thin lips; sturdy thick neck and broad squared shoulders; deeper golden-brown skin, small natural notch in right eyebrow; upright direct unbending integrity, adult38 without gray hair.
Age38; facingLEFT. Robe muted RED. No text/name in image.
~~~

#### review2-ming-wanli-official-09

目标：assets/art/portraits/unique/ming-wanli/official-09.webp

~~~text
Use case: historical-scene. ONE single Chinese Ming civil minister game portrait,1024x1280,HEAD AND SHOULDERS,plain solid #E3D7BE. Image1 is EDIT TARGET: preserve its correct flat-top Ming WUSHAMAO construction but REPLACE FACE, facial hair, neck/build and expression with the specified NEW distinct identity. Images2–5 are the four approved STYLE references ONLY, never copy their faces or locations. Chinese baimiao CLEAN INK contours and light FLAT muted washes, at most one faint shading layer, simplified main folds, extremely faint smooth paper grain. Compact black WUSHAMAO: FLAT TOP,low front close to forehead,higher flat rear, two thin FLAT OVAL wings projecting HORIZONTALLY from BACK. No dome or continuous hat brim. Hat/head top at12%,eye centers EXACTLY38% (strict36–40%),face centered,three-quarter view,gaze slightly off-camera. Crop just below shoulders, no hands or props. Costume is Ming round-collar official robe with only simple rank-patch top edge. NO yellow,ochre or gold robes. No text,names,seals,watermarks,frames,guides,actors,TV likeness,anime,photo,3D,glow or intricate embroidery. Render face-shape,beard,build and expression differences VERY CLEARLY even at44px.
Subject NEW face card: WIDE CHEEKBONE PENTAGON face with a short blunt clean jaw; thick downward-curving MOUSTACHE ONLY with slightly gray ends, completely bare chin and bare cheeks, NO goatee or full beard; heavy low brows, narrow steady eyes, visible crow-feet and eye bags; broad flattened nose and a wide firmly set mouth; muscular thick neck and practical broad shoulders; dark weathered sun-browned skin, gray temples and clear horizontal forehead creases; calm seasoned determined competence, visibly52, a civil minister experienced in military affairs.
Age52; facingRIGHT. Robe muted dark GREEN. No text/name in image.
~~~

#### review2-ming-chongzhen-official-02

目标：assets/art/portraits/unique/ming-chongzhen/official-02.webp

~~~text
Use case: historical-scene. ONE single Chinese Ming civil minister game portrait,1024x1280,HEAD AND SHOULDERS,plain solid #E3D7BE. Image1 is EDIT TARGET: preserve its correct flat-top Ming WUSHAMAO construction but REPLACE FACE, facial hair, neck/build and expression with the specified NEW distinct identity. Images2–5 are the four approved STYLE references ONLY, never copy their faces or locations. Chinese baimiao CLEAN INK contours and light FLAT muted washes, at most one faint shading layer, simplified main folds, extremely faint smooth paper grain. Compact black WUSHAMAO: FLAT TOP,low front close to forehead,higher flat rear, two thin FLAT OVAL wings projecting HORIZONTALLY from BACK. No dome or continuous hat brim. Hat/head top at12%,eye centers EXACTLY38% (strict36–40%),face centered,three-quarter view,gaze slightly off-camera. Crop just below shoulders, no hands or props. Costume is Ming round-collar official robe with only simple rank-patch top edge. NO yellow,ochre or gold robes. No text,names,seals,watermarks,frames,guides,actors,TV likeness,anime,photo,3D,glow or intricate embroidery. Render face-shape,beard,build and expression differences VERY CLEARLY even at44px.
Subject NEW face card: VERY SHORT WIDE TRAPEZOID face with heavy fleshy lower cheeks, broad jaw and a clear DOUBLE CHIN; broad dense FAN-SHAPED SHORT FULL CHIN AND CHEEK BEARD with gray flecks and thick separated drooping moustache, NOT a pointed goatee; bushy downward-splayed brows and small close-set hooded eyes; short broad nose and broad thin closed lips; very short thick neck, plump bulky shoulders held slightly inward; warm tan-brown skin, small mole beside right brow and deep cheek folds; guarded ingratiating calculation and wary attention, adult50, restrained human expression without caricature.
Age50; facingRIGHT. Robe muted RED. No text/name in image.
~~~

#### review2-ming-chongzhen-official-04

目标：assets/art/portraits/unique/ming-chongzhen/official-04.webp

~~~text
Use case: historical-scene. ONE single Chinese Ming civil minister game portrait,1024x1280,HEAD AND SHOULDERS,plain solid #E3D7BE. Image1 is EDIT TARGET: preserve its correct flat-top Ming WUSHAMAO construction but REPLACE FACE, facial hair, neck/build and expression with the specified NEW distinct identity. Images2–5 are the four approved STYLE references ONLY, never copy their faces or locations. Chinese baimiao CLEAN INK contours and light FLAT muted washes, at most one faint shading layer, simplified main folds, extremely faint smooth paper grain. Compact black WUSHAMAO: FLAT TOP,low front close to forehead,higher flat rear, two thin FLAT OVAL wings projecting HORIZONTALLY from BACK. No dome or continuous hat brim. Hat/head top at12%,eye centers EXACTLY38% (strict36–40%),face centered,three-quarter view,gaze slightly off-camera. Crop just below shoulders, no hands or props. Costume is Ming round-collar official robe with only simple rank-patch top edge. NO yellow,ochre or gold robes. No text,names,seals,watermarks,frames,guides,actors,TV likeness,anime,photo,3D,glow or intricate embroidery. Render face-shape,beard,build and expression differences VERY CLEARLY even at44px.
Subject NEW face card: EXTREMELY LEAN LONG RECTANGULAR face, long hollow cheeks, narrow elongated chin and visible cheekbone planes; THREE DISTINCT LONG SPARSE WISPY BEARD STRANDS with a fine short moustache, some gray, bare upper cheeks, never thick full beard; low fine straight brows and very narrow heavily lidded calm eyes; long high narrow nose and very thin horizontal closed lips; thin long neck and narrow sloping shoulders held rigidly straight; cool pale skin, clearly gray-flecked temples and one fine vertical brow crease; outwardly courteous mildness with cold deeply guarded composure, visibly54.
Age54; facingRIGHT. Robe muted BLUE. No text/name in image.
~~~

#### review2-ming-chongzhen-official-05

目标：assets/art/portraits/unique/ming-chongzhen/official-05.webp

~~~text
Use case: historical-scene. ONE single Chinese Ming civil minister game portrait,1024x1280,HEAD AND SHOULDERS,plain solid #E3D7BE. Image1 is EDIT TARGET: preserve its correct flat-top Ming WUSHAMAO construction but REPLACE FACE, facial hair, neck/build and expression with the specified NEW distinct identity. Images2–5 are the four approved STYLE references ONLY, never copy their faces or locations. Chinese baimiao CLEAN INK contours and light FLAT muted washes, at most one faint shading layer, simplified main folds, extremely faint smooth paper grain. Compact black WUSHAMAO: FLAT TOP,low front close to forehead,higher flat rear, two thin FLAT OVAL wings projecting HORIZONTALLY from BACK. No dome or continuous hat brim. Hat/head top at12%,eye centers EXACTLY38% (strict36–40%),face centered,three-quarter view,gaze slightly off-camera. Crop just below shoulders, no hands or props. Costume is Ming round-collar official robe with only simple rank-patch top edge. NO yellow,ochre or gold robes. No text,names,seals,watermarks,frames,guides,actors,TV likeness,anime,photo,3D,glow or intricate embroidery. Render face-shape,beard,build and expression differences VERY CLEARLY even at44px.
Subject NEW face card: SHORT COMPACT OVAL face with rounded upper cheekbones and a small tidy chin, not long triangular; COMPLETELY CLEAN-SHAVEN adult34, no moustache, stubble or chin hair; short lifted eyebrows and large bright observant eyes; small slightly upturned nose, full gently curved lips and subtle knowing closed-mouth smile; slender neck and light relaxed narrow shoulders; warm light beige skin, tiny dimple near left mouth corner; quick socially attentive intelligence and easy self-confidence, adult male rather than boyish or feminine.
Age34; facingLEFT. Robe muted dark GREEN. No text/name in image.
~~~

#### review2-wanli-emperor-young

目标：assets/art/portraits/unique/ming-wanli/emperor-01.webp

~~~text
Use case: precise-object-edit. Image1 is the imperial portrait EDIT TARGET; images2–5 are the four approved STYLE references ONLY. Change ONLY the black headwear to an unmistakable Chinese Ming YISHANGUAN 翼善冠: a low dark crown in front and TWO clearly shaped stiff thin black wings attached at the REAR, folded UPWARD and slightly backward together behind the crown; compact but visibly taller angular folded rear wings, not two small rounded bumps, bunny ears, a cap with horizontal official wings, or a western hat. Complete crown top10–12% from canvas top, preserve eye centers38% (strict36–40%). Keep EXACT same existing face,eye/nose/lip identity,skin,head angle,facing LEFT,yellow round-collar dragon robe,simple motifs,shoulders,solid #E3D7BE background and clean baimiao flat light washes. Preserve true9-year-old CHILD face and child-sized shoulders,round cheeks,clean-shaven,NO aging or adultification. No new objects,words,seals,watermarks,borders,glow,photo or3D. Portrait1024x1280.
~~~

#### review2-wanli-emperor-old

目标：assets/art/portraits/unique/ming-wanli/emperor-01-old.webp

~~~text
Use case: precise-object-edit. Image1 is the imperial portrait EDIT TARGET; images2–5 are the four approved STYLE references ONLY. Change ONLY the black headwear to an unmistakable Chinese Ming YISHANGUAN 翼善冠: a low dark crown in front and TWO clearly shaped stiff thin black wings attached at the REAR, folded UPWARD and slightly backward together behind the crown; compact but visibly taller angular folded rear wings, not two small rounded bumps, bunny ears, a cap with horizontal official wings, or a western hat. Complete crown top10–12% from canvas top, preserve eye centers38% (strict36–40%). Keep EXACT same existing face,eye/nose/lip identity,skin,head angle,facing LEFT,yellow round-collar dragon robe,simple motifs,shoulders,solid #E3D7BE background and clean baimiao flat light washes. Preserve the PLUMP adult48 identity,full round cheeks,obvious double chin,thick neck,existing moustache and chin tuft and gray temples. No new objects,words,seals,watermarks,borders,glow,photo or3D. Portrait1024x1280.
~~~

#### review2-scene-camp

目标：assets/art/scenes/camp-1440.webp、assets/art/scenes/camp-720.webp

~~~text
Use case: historical-scene. Image1 is the scene EDIT TARGET to be compositionally REBUILT per request; images2–5 are STYLE references ONLY, ABSOLUTELY DO NOT COPY their palace framing or portrait people. REBUILD as a truly OUTDOOR WILDERNESS MILITARY ENCAMPMENT, camera standing on open rough earth and short grass. Center band: a large simple canvas command TENT,2–3 smaller canvas tents further back,plain unmarked red cloth flags on thin freestanding poles,one small fire brazier,low distant hills. Foreground ONLY natural dusty earth,grass,small stones and a few tent pegs/ropes; top edge ONLY open pale sky and distant landscape. Remove ALL palace roof,eaves,timber beams,veranda,red columns,stone column bases,throne,wooden pavilion and grand stone palace terrace. NO foreground table needed. Tent poles must be slim functional tent supports,not palace columns. Chinese baimiao clean INK OUTLINES with light FLAT muted cinnabar/azurite/malachite/beige/ink-gray washes,on nearly smooth pale paper,one faint shading layer at most. Keep detail SIMPLIFIED for small game WebP: no granular paper noise,dense tiny leaves or intricate brick texture. Daytime even pale light. FULL BLEED to every edge,no blank beige strips,black letterbox bars,frame or baked-in gradient. Important scene elements inside horizontal middle30–70% height for112px mobile cover crops. No people,battle,blood,weapons,text,readable marks,plaques,seals,watermarks,photo,3D,glow or fantasy. Landscape16:9,1536x864.
~~~

#### review2-scene-tour

目标：assets/art/scenes/tour-1440.webp、assets/art/scenes/tour-720.webp

~~~text
Use case: historical-scene. Image1 is the scene EDIT TARGET to be compositionally REBUILT per request; images2–5 are STYLE references ONLY, ABSOLUTELY DO NOT COPY their palace framing or portrait people. REBUILD viewpoint FROM INSIDE A THICK BRICK-AND-STONE CITY GATE TUNNEL LOOKING OUTWARD. Foreground top and left/right edges are the dark simple brick vault/arched stone opening and thick rough masonry inner walls; bottom edge is worn stone paving leading OUT into a winding pale dirt post road toward distant soft hills and sparse roadside trees. The view is framed ONLY by a real STONE ARCH and BRICK GATE PASSAGE. Central band30–70% shows the bright opening and outgoing road. NO palace eaves,red wooden columns,timber beams,veranda,decorative brackets,throne or foreground palace roof; no exterior gate-tower facade viewed from a courtyard. Chinese baimiao clean INK OUTLINES with light FLAT muted cinnabar/azurite/malachite/beige/ink-gray washes,on nearly smooth pale paper,one faint shading layer at most. Keep detail SIMPLIFIED for small game WebP: no granular paper noise,dense tiny leaves or intricate brick texture. Daytime even pale light. FULL BLEED to every edge,no blank beige strips,black letterbox bars,frame or baked-in gradient. Important scene elements inside horizontal middle30–70% height for112px mobile cover crops. No people,battle,blood,weapons,text,readable marks,plaques,seals,watermarks,photo,3D,glow or fantasy. Landscape16:9,1536x864.
~~~


### 万历两像冠高复核：只收短后翼

上折冠翼保持可辨，冠顶留白恢复约10%，五官、眼位、年龄及衣袍不动。

#### review2-wanli-emperor-young-final

~~~text
Use case: precise-object-edit. Image1 is EDIT TARGET. Images2–5 are approved STYLE references only. Change ONLY the HEIGHT of the TWO angular raised REAR WINGS of the black Ming YISHANGUAN: SHORTEN them so their highest top is at y140 of this1402px portrait (10% from top), with clear plain paper headroom above. KEEP the wings recognizably separate, stiff, folded upward/backward at REAR, never round bumps. Keep front crown EXACTLY where it is. Do NOT move or resize the face,eyes,head,shoulders,robe or canvas. Keep the exact same 9-year-old child,clean-shaven round child face identity, same mole,facing LEFT,background #E3D7BE,flat baimiao lines/colors and simplified dragon motifs. No added text,marks,frames or props.
~~~

#### review2-wanli-emperor-old-final

~~~text
Use case: precise-object-edit. Image1 is EDIT TARGET. Images2–5 are approved STYLE references only. Change ONLY the HEIGHT of the TWO angular raised REAR WINGS of the black Ming YISHANGUAN: SHORTEN them so their highest top is at y140 of this1402px portrait (10% from top), with clear plain paper headroom above. KEEP the wings recognizably separate, stiff, folded upward/backward at REAR, never round bumps. Keep front crown EXACTLY where it is. Do NOT move or resize the face,eyes,head,shoulders,robe or canvas. Keep the exact same plump48-year-old adult,full cheeks,double chin,moustache and beard identity, same mole,facing LEFT,background #E3D7BE,flat baimiao lines/colors and simplified dragon motifs. No added text,marks,frames or props.
~~~
