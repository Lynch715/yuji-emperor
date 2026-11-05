# 御极 · 美术一期实际提示词

工具：内置 `imagegen`，未使用 CLI / 外部 API。画风方向已确认；先修订四张定调样张与明制服饰约束，再继续一期批量生成。历史提示词保留以便追溯。

## 明制服饰要点（本轮修订，后续明 / 大晟人物全部沿用）

- 文官乌纱帽：前低后高，前部贴近额头，后部帽身明显高出；两片扁平椭圆展角从帽后向两侧水平伸出。不得画成圆顶礼帽加连续帽檐。
- 常位后妃：鬏髻或小发冠，搭配明制竖领或交领袄；不画通用高髻配圆领衫。正位仍按规范使用简化凤冠。所有人物眼线固定在画高36–40%，目标38%。
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
| 02 | long rectangular face | clean-shaven | fine level brows and large open eyes | long high nose and a broad soft mouth | slender straight shoulders | pale warm skin | one deep vertical line between brows | warm patient kindness |
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
| 14 | round forehead and tapered jaw | two long separate moustache tips and bare chin | high sparse brows and compact round eyes | wide low bridge and sharply shaped lips | narrow delicate shoulders | olive-golden skin | faint freckles across the nose | relaxed sociable ease |
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
| 02 | soft oval face | high arched hairline; low compact bun under a small Ming hair crown | slanting long brows and small deep-set eyes | long narrow nose and drooping mouth corners | plump rounded shoulders | sun-darkened brown skin | a broad crease above the nose | stern uncompromising resolve |
| 03 | short broad face with a heavy jaw | straight low hairline; twin small rounded bun loops under a tiny hair crown | short sparse brows and hooded eyes | short wide nose and a compact thin mouth | lean slightly stooped shoulders | cool pale skin | several horizontal forehead creases | quiet suspicion |
| 04 | very long thin face | widow-peak hairline; medium-height round jiuji bun | downturned brows and slightly tired eyes | slender low nose and a long straight mouth | broad muscular shoulders | ruddy warm skin | one visible dark freckle below the right eye | bright scholarly curiosity |
| 05 | pear-shaped face with a broad lower jaw | soft M-shaped hairline; small low rear bun with a plain gold pin | uneven brows and long almond eyes | wide low bridge and sharply shaped lips | narrow delicate shoulders | olive-golden skin | a slightly uneven eyebrow edge | relaxed sociable ease |
| 06 | heart-shaped face and tapered chin | rounded high forehead; a compact oval bun with a low Ming hair crown | soft curved brows and heavy lower eyelids | small pointed nose and slightly uneven lips | stocky shoulders and thick neck | freckled tan skin | gray streaks at both temples | self-assured pride |
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
| 01 | short broad face with a heavy jaw | straight low hairline; twin small rounded bun loops under a tiny hair crown | short sparse brows and hooded eyes | short wide nose and a compact thin mouth | lean slightly stooped shoulders | cool pale skin | several horizontal forehead creases | quiet suspicion |
| 02 | heart-shaped face and tapered chin | rounded high forehead; a compact oval bun with a low Ming hair crown | soft curved brows and heavy lower eyelids | small pointed nose and slightly uneven lips | stocky shoulders and thick neck | freckled tan skin | gray streaks at both temples | self-assured pride |

### shared/scholar-young 长相卡

| 编号 | 脸型 | 胡须或发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 01 | long rectangular face | clean-shaven; neat tied hair under a small Ming princely crown | fine level brows and large open eyes | long high nose and a broad soft mouth | slender straight shoulders | pale warm skin | one deep vertical line between brows | warm patient kindness |
| 02 | wide cheekbones with a pointed chin | clean-shaven; neat tied hair under a small Ming princely crown | bushy brows and wide-set round eyes | flat broad nose and small curved mouth | broad muscular shoulders | ruddy warm skin | a small mole near the right temple | bright scholarly curiosity |
| 03 | short broad face with a heavy jaw | heavy downturned moustache and cropped chin beard | high curved brows and very narrow eyes | large rounded nose and a wide thin mouth | stocky shoulders and thick neck | freckled tan skin | a broad crease above the nose | self-assured pride |
| 04 | high narrow forehead and square chin | pointed triangular beard and no moustache | straight fine brows and wide-set long eyes | narrow blunt nose and a broad lower lip | broad muscular shoulders | ruddy warm skin | a slightly uneven eyebrow edge | bright scholarly curiosity |

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
