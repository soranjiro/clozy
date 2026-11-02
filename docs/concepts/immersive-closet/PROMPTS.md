# Clozy — 画像生成プロンプト

作成日：2026-11-01

方式：組み込み `image_gen.imagegen`。CLI/APIキー方式は使用していない。
用途：ui-mockup。設計用コンセプト画像であり、アプリの実装スクリーンショットではない。

## Board A

出力：`board-a.png`。S01 全景 / S02 レール探索 / S03 トップス取り出し。
新規生成。入力参照画像なし。

```text
Use case: ui-mockup
Asset type: Clozy immersive mobile wardrobe UX concept board A, 3 adjacent portrait app screens, extremely high fidelity 3D product design.
Primary request: communicate a usable app that feels like being INSIDE a real closet. No app header, no tab bar, no sidebar. The furniture and actual garments are the interface.
Composition: one landscape image containing exactly THREE equal tall portrait viewport panels side by side, separated by thin warm ivory gutters, each approx 390:844 proportions, edge-to-edge app scene without phones or device frames. No typography anywhere, no letters, no numbers, no logos, no arrows, no captions, no watermarks, no status bars. This is an interface storyboard, not a room photograph or moodboard.
Consistent environment across all three panels: refined warm walnut and honey oak built-in closet, subtle brushed brass rails and small functional handles, soft warm-white under-shelf lights, fabric textures and crisp physically believable contact shadows. Shallow restrained perspective from within furniture, tactile luxurious but approachable. Ivory linen shirt, sand cardigan, charcoal jacket and muted olive top hang from wooden hangers on UPPER rail. A DISTINCT LOWER rail carries navy trousers and taupe skirt from clip hangers. At the very bottom are TWO LEVELS of clearly visible oak shoe shelves carrying white sneakers, brown loafers and black ankle boots as paired footwear. Long outerwear in slim separate left bay. Slim utility handle with tiny magnifier engraving on the right furniture edge. No decorative unrelated objects.
Left panel S01: overview, all THREE storage types clearly visible simultaneously: tops above, separate clip-hung bottoms midway, paired shoes on lower racks. View straight into closet with enough negative space and readable garment silhouettes.
Middle panel S02: move closer to the upper hanging rail. Show shirts slightly overlapping left and right, same ivory shirt centered and frontal with extra space opening either side, brass rail visibly passing across the upper part of screen; bottom rail and shoe shelves remain partially visible below. Suggest horizontal sliding with asymmetrical hanger spacing and mild physical hanger angles, NO motion arrows.
Right panel S03: same ivory shirt with the same wooden hanger pulled FORWARD towards viewer and turned frontal, large at center; visible empty gap behind at its original upper rail position; same cabinet, lower rail and shoe rack remain dimly readable. Beside selected garment only two or three tiny ivory/brass icon-only local controls for heart, add-to-outfit (hanger with plus), return; no text and no enclosing toolbar. Garment is not a photo on a card.
Style: premium contemporary spatial mobile app concept, realistic 3D rendering, meticulously composed useful interaction states, natural fabric drape and correct hanger anatomy. Consistent calm material palette, high clarity and restrained shadows, not dark cinematic fantasy, not a generic ecommerce UI.
Constraints: exactly three complete portrait screens, no text of any kind, no conventional navigation chrome, distinguish upper clothes from separate lower bottoms and very bottom shoes. Keep the SAME closet and SAME items between screens.
```

## Board B

出力：`board-b.png`。S04 ボトムス / S05 シューズ選択 / S06 コーデ完成。
新規生成。Board Aを家具・素材・服・照明の連続性の参照に使用。

```text
Use case: ui-mockup
Asset type: Clozy immersive wardrobe UX concept board B: 3 adjacent portrait app screens.
Input images: Image 1 is a STYLE AND CONTINUITY REFERENCE, NOT an edit target. Create a NEW second board in the same app. Match its warm walnut/oak closet, brass rails, warm-white lighting, ivory linen shirt, navy trousers, white sneakers and tiny ivory/brass icon controls. Do not repeat the same screens.
Primary request: show exploring separate bottoms rail, selecting shoes from bottom rack, then assembling an outfit entirely INSIDE the same closet. No header, no tab bar, no sidebar.
Composition: exactly THREE equally sized tall portrait panels side-by-side separated by thin warm ivory gutters. Edge-to-edge spatial app scenes, no device frames. Overall landscape board with same dimensions and panel proportions as reference. Absolutely NO letters, NO numbers, NO captions, NO logo, NO watermarks, NO instructional arrows, NO status bars. Icons only where specified.
LEFT panel S04: camera LOWER than reference, close to independent BOTTOMS RAIL. Several navy tailored trousers, taupe skirt and sand trousers hang on distinct wooden CLIP hangers along a brass horizontal rail near the upper third. Navy trousers occupy center, pulled slightly forward with clear side gaps, skirts/pants to left and right angled naturally along rail. Show the hems of upper shirts above to preserve spatial orientation. Below the bottoms, visible oak shoe shelves with pairs of white sneakers, brown loafers and black boots. Furniture remains continuous with reference. This must clearly read as separate lower rail, NOT upper shirts.
MIDDLE panel S05: camera lowers further and slightly looks down at the TWO-LEVEL OAK SHOE RACK. Paired shoes arranged on shelves. ONE PAIR of white sneakers is pulled towards viewer on a thin oak slide-out tray extending from one shelf, correct shoe anatomy and grounded contact shadows; brown loafers and black boots remain on original shelves. Partial hanging trousers above. Small local heart and hanger-plus icons only near selected pair. No floating shoes, no unrelated room.
RIGHT panel S06: camera eases back to a slim pulled-out OUTFIT ASSEMBLY bay within the SAME CLOSET, frontal ivory linen shirt on a small brass auxiliary hanging rail at upper center, selected navy trousers on a separate clip hanger below shirt, and selected white sneaker pair aligned underneath on a lower pull-out oak tray. A coherent outfit laid out VERTICALLY, top-bottom-shoes all visible and correctly proportioned. Original storage with dimly visible other clothes remains at the edges, reinforcing same space, no blank studio. A single small ivory circular checkmark button on brass cabinet edge at reachable lower-right signals explicit confirmation; heart or garment-remove icons can be small and restrained, no toolbar.
Style: very high fidelity premium tactile 3D spatial mobile UX, calm walnut, honey oak, ivory fabric, brushed brass, soft warm-white under-shelf lights, detailed linen/cotton/denim/leather, restrained shallow perspective and realistic contact shadows. Same exposure and visual language as reference.
Constraints: three different distinct states; same exact furniture/material palette and selected garments across both boards. Functionally legible closet exploration and outfit selection. No text of any kind, no conventional cards, no generic ecommerce UI, no body mannequin, no people, no bedroom panorama.
```

## 目視確認

- 両画像とも3分割・計6状態。画像内の説明文、ヘッダー、タブバーなし。
- 上部の服、別レールのボトムス、下段のシューズラックが識別できる。
- 選択した白シャツ・紺ボトムス・白スニーカーがコーデ完成へ連続する。
- ボードAの近景では全景より収納比率が変わる。ボードBでは小物の配置・木目が完全一致しているわけではない。実装では単一シーンの座標で連続性を固定する。
- 棚の同型靴の繰り返しはデザイン上の仮配置。実製品はユーザーの登録データのみ表示する。
- ボードAの取り出し状態の戻る矢印は操作アイコンであり、説明用の矢印図ではない。
- ターゲットサイズ、スクロール、保存処理、アニメーションは静止画から検証できない。要件定義と実装設計で補完する。

