# 高級素材・見本服の画像生成記録

2026-11-02。組み込みimagegenを使用。見本26着はAI生成の架空アイテム。ユーザーの服には適用しない。

保存先：apps/web/public/closet/preview/{outerwear,tops,bottoms-shoes}.webp、apps/web/public/closet/materials/walnut.jpg。
透明背景の3×3アトラスをCSSの背景位置で各服に割当。服の登録・バックアップには混ぜない。

## 服アトラス 1

Use case: product-mockup. Asset: production sprite atlas for a luxurious wardrobe app. Create exactly a 3 COLUMN by 3 ROW equal-cell contact sheet with a truly transparent background, no grid lines, no text, no logos, no mannequin or human, no hanger, no shadows outside garments. Each cell has one isolated photorealistic garment centered and fully contained with 10% empty padding, never crossing cell boundaries. Entire canvas portrait 2:3 ratio, so each cell portrait 2:3. All garments front facing, natural hanging drape, invisible ghost mannequin styling, extremely realistic woven fabric, seams, buttons and subtle wrinkles, soft neutral studio lighting. Consistent scale and alignment. Row-major positions: 1 camel wool Chesterfield coat; 2 navy tailored blazer; 3 beige light trench coat; 4 black zip bomber; 5 olive quilted coat; 6 indigo denim jacket; 7 gray cardigan; 8 ivory short puffer jacket; 9 brown leather jacket.

## 服アトラス 2

Use case: product-mockup. Asset: production sprite atlas for a luxurious wardrobe app. Create exactly a 3 COLUMN by 3 ROW equal-cell contact sheet with a truly transparent background, no grid lines, no text, no logos, no mannequin or human, no hanger, no shadows outside garments. Each cell has one isolated photorealistic garment centered and fully contained with 10% empty padding, never crossing cell boundaries. Entire canvas portrait 2:3 ratio, so each cell portrait 2:3. All garments front facing, natural hanging drape, invisible ghost mannequin styling, extremely realistic woven fabric, seams, buttons and subtle wrinkles, soft neutral studio lighting. Consistent scale and alignment. Row-major positions: 1 white Oxford button down shirt; 2 black crew neck T shirt; 3 blue and ivory narrow striped linen shirt; 4 ivory sweatshirt; 5 navy and ivory Breton striped long sleeve top; 6 chocolate mock neck knit sweater; 7 gray pullover hoodie; 8 pale blue button down shirt; 9 white ribbed knit sweater.

## 服アトラス 3

Use case: product-mockup. Asset: production sprite atlas for a luxurious wardrobe app. Create exactly a 3 COLUMN by 3 ROW equal-cell contact sheet with a truly transparent background, no grid lines, no text, no logos, no mannequin or human, no hanger, no shadows outside garments. Each cell has one isolated photorealistic garment centered and fully contained with 10% empty padding, never crossing cell boundaries. Entire canvas portrait 2:3 ratio, so each cell portrait 2:3. All garments front facing, natural hanging drape, invisible ghost mannequin styling, extremely realistic woven fabric, seams, buttons and subtle wrinkles, soft neutral studio lighting. Consistent scale and alignment. Row-major positions: 1 straight indigo denim jeans; 2 black wide tailored trousers; 3 beige chino trousers; 4 brown corduroy trousers; 5 gray tapered trousers; 6 olive cargo trousers; 7 a PAIR of white low top leather sneakers in three-quarter view side by side; 8 a PAIR of black leather loafers in three-quarter view side by side; 9 leave completely empty transparent.

## ウォルナット

Use case: product-mockup. Asset: realistic wood material texture for a luxurious built-in closet app. Full-frame straight-on macro photograph of an uninterrupted dark warm walnut veneer panel, exquisite fine vertical natural grain, rich chocolate brown and smoked amber, subtle satin oiled finish, no knots, no joins, no edges, no objects, no clothes, no text, no dramatic highlights or lighting gradients, even diffuse neutral illumination. Texture only. Portrait orientation. Natural fine material detail not repetitive stripes, not orange, not cartoon.


生成PNGを透明度を保持したWebP（品質90）へ、木材をJPEG（品質80）へ形式変換して配信容量を抑えた。
