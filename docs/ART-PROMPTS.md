# 御极 · 美术一期实际提示词

工具：内置 `imagegen`，未使用 CLI / 外部 API。以下仅为四张定调样张（含一轮文官构图修订）；其余 128 张等待画风确认，不提前生成。

## 样张长相卡

| 池 / 编号 | 脸型 | 胡须 / 发型 | 眉眼 | 鼻口 | 体态 | 肤色 | 标记 | 神情 / 朝向 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ming/official-mature/01 | 宽方脸 | 短髭、小山羊须 | 浓直眉、细长略吊眼 | 宽鼻、薄唇紧抿 | 结实端正 | 风霜黄肤 | 左颊小痣 | 沉稳刚直 / 向左 |
| ming/consort-regular/01 | 长鹅蛋脸、圆尖下颌 | 低圆发际线、端正狄髻 | 细弯眉、略垂杏眼 | 小直鼻、丰唇轻合 | 清瘦挺秀 | 暖白 | 右眉旁小痣 | 温厚若有所思 / 向右 |

每个池当前只有一张。后续池图在生成前补齐全部长相卡，并逐对检查至少四维不同与脸型 / 胡须或发际线差异。

## 源图与导出

原始 PNG 保存在本机忽略目录 `art-source/`；WebP 在 `assets/art/`。实际生成像素由工具决定，导出仅中心裁切到规定比例、等比缩放、格式转换；不做调色、修脸、补画。人物 400×500 / q75，场景 1440×810、720×405 / q72。

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
