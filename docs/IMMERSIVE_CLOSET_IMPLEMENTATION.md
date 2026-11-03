# Clozy — 没入型クローゼット 実装設計

作成日：2026-11-01／対象：[要件定義](IMMERSIVE_CLOSET_UX.md)

状態：既存コードを確認した構成案。以下の新規コンポーネント・依存・状態管理は未実装。本変更は文書とコンセプト画像のみ。

## 1. 現在の実装と差分

| 実在するファイル/機能 | 確認した現状 | 変更方針 |
| --- | --- | --- |
| `apps/web/src/App.tsx` | `View`でhome/wardrobe/planning/calendar/insights/settingsを切替。topbar/sidebar/mobile-navあり | 没入シェルを追加し、全機能を物体/引き出しに接続。既存シェルを先に消さない |
| `WardrobeScene.tsx` | CSS製扉、固定の架空服、スクロール連動。`onBrowse`で一覧へ | 新シーンは実際の`Clothing[]`を投影。既存シーンは移行期間の旧表示用 |
| `App.tsx`の`Wardrobe` | 実データの検索・絞り込み・並べ替え・編集 | 条件計算を共通化してレール/DOM版双方へ供給 |
| `GarmentVisual.tsx` | カテゴリ別SVG、サービスから写真取得、Blob URL生成 | 写真/シルエットのフォールバックとして再利用。3Dテクスチャ利用時も寿命を管理 |
| `Planning.tsx` | 既存候補・組み合わせ記録のUI | 候補計算とコーデの表示を分離し、同じ結果をサブレールへ |
| `GarmentForm.tsx` / `BulkAdd.tsx` | 編集、登録、一括処理 | 初期はそのまま再利用。家具から開くが入力は通常DOM |
| `App.tsx`内`CalendarView`/`Insights`/`Settings` | 着用記録、分析、設定 | 独立モジュールに抽出して引き出し内に表示 |
| `packages/domain/src/model.ts` | 日本語8カテゴリ、写真ID、季節、収納状態。3Dモデル/家具座標なし | UI配置のために業務データへ座標を追加しない |
| `packages/application/src/index.ts` | `list`、`image`、`add/edit/favorite/remove`、`recordOutfit`等 | 既存サービスで保存。キャンバスから直接IndexedDBを触らない |
| `packages/storage/src/index.ts` | IndexedDB・画像処理 | P0ではDBスキーマを変更しない |
| `apps/web/public/_headers` | 自己オリジンのスクリプト/画像/接続、画像blob許可 | 静的3D資産も同一オリジン。外部モデルCDNを足さない |

現在はThree.js/React Three Fiberの依存も、服の3Dアセット台帳も存在しない。コンセプト画像を背景に貼るだけではこの仕様の操作は実現しない。

## 2. レイヤーと責務

既存の`web → application → domain`、storageがrepository portを実装する方向を守る。

```text
App（ロード/既存サービス/保存/通知/ロック）
 └ ImmersiveCloset（機能フラグで選択）
    ├ SceneViewport（視覚：3D、失敗時はDOMと写真）
    │  ├ ClosetEnvironment / RailScene / ShoeRackScene
    │  └ GarmentInstance（選択/画像/モデルを表示するだけ）
    ├ ClosetInteractionLayer（DOM操作、スクロール、フォーカス）
    │  ├ RailScroller（実際の服一覧、仮想化）
    │  ├ ObjectHotspot（収納/取っ手/追加）
    │  └ SelectedGarmentActions
    ├ UtilityDrawer（検索/全機能/絞り込み）
    ├ OutfitDrawer（既存候補と選択中コーデ）
    └ FeaturePanel（既存の登録/履歴/分析/設定）
```

Canvasは家具と服を描く。操作・読み上げ・フォームはDOMが担う。視覚モデルとアクセシブルな一覧の二重操作を避け、DOMのIDを選択状態の唯一の参照とする。

## 3. 提案ファイル配置

以下は新設予定パス。存在するファイルとして扱わない。

```text
apps/web/src/closet/
  ImmersiveCloset.tsx        シェルと既存Appのコールバック接続
  closet-state.ts            reducer、状態/イベント、遷移検証
  closet-projection.ts       Clothing→収納区画、検索/配置、ID順
  closet-assets.ts           静的アセット台帳、写真/モデル優先順位
  useClosetScroll.ts         縦位置→視点、レール位置→選択位置
  useClosetAssets.ts         遅延取得、キャッシュ、破棄、失敗代替
  ClosetInteractionLayer.tsx DOM一覧/取っ手/選択アクション
  RailScroller.tsx           横スクロールと前後ボタン
  UtilityDrawer.tsx          検索・絞り込み・全機能一覧
  OutfitDrawer.tsx           サブレールと既存候補・記録操作
  SceneBoundary.tsx          例外/context lost時のDOM切替
  scene/
    ClosetCanvas.tsx         遅延読み込みされる3D入口
    ClosetEnvironment.tsx    家具/ライト/固定モデル
    RailScene.tsx            ハンガーと服の位置
    ShoeRackScene.tsx        棚と靴トレー
    GarmentInstance.tsx      モデル/写真面/シルエット
    scene-motion.ts          時間/減衰/動きを減らす設定
  immersive-closet.css       safe-area、DOM配置、パネル
apps/web/src/features/
  CalendarView.tsx           Appから抽出
  Insights.tsx               Appから抽出
  Settings.tsx               Appから抽出
apps/web/public/closet/
  environment/              家具GLBとローカルテクスチャ
  garments/                 配布可能な汎用モデルのみ
  manifest.json             同一オリジンの静的資産台帳
```

汎用モデルはカテゴリの代替表現。利用者の服の実形状・実寸を再現したと誤認させない。生成コンセプトの画像は`docs/concepts/`に保存し、本番の服データとして読み込まない。

## 4. 表示データの投影

初期ルールは純粋関数で決定する。既存データのカテゴリを保存し直さない。

| 業務データ | 表示先 |
| --- | --- |
| トップス | `topsRail` |
| ボトムス | `bottomsRail` |
| アウター/ワンピース | `longRail`（縦長区画） |
| シューズ | `shoeRack`（1レコード=1足組） |
| バッグ | `sideHooks` |
| アクセサリー/その他 | `accessoryDrawer` |
| `archived === true` | `storageBox`。通常レールと二重に表示しない |

`archived`未定義は既存と同じ着用中。検索で収納中を含める時は、ヒットした服の実際の住所へ誘導し、全てをトップスレールへ並べない。

投影結果は`{clothingId, zone, order, visualKind, assetKey?}`のUIモデルとする。`imageId`をそのままモデルIDにしない。各区画に独立した並びと中央IDを持つ。

P0の順序は既存ソートの結果を利用。P2で手動配置を保存する際は、業務データと分離したローカルUI設定とする。配置バックアップを扱うなら、バージョンと検証・旧バックアップ互換を別設計してから追加する。

## 5. 状態モデル

```ts
type Zone = 'overview' | 'topsRail' | 'bottomsRail' | 'longRail'
  | 'shoeRack' | 'sideHooks' | 'accessoryDrawer' | 'storageBox';
type Panel = 'none' | 'utility' | 'outfit' | 'calendar' | 'insights'
  | 'settings' | 'add' | 'bulkAdd' | 'edit';
type ClosetState = {
  zone: Zone;
  centeredByZone: Partial<Record<Zone, string>>;
  selectedId: string | null;
  panel: Panel;
  query: string;
  filters: ClosetFilters; // category / favorite / season / storage / sort
  outfitIds: string[];
  returnAnchor: { zone: Zone; clothingId?: string; scrollTop: number } | null;
  renderMode: 'three' | 'dom';
  quality: 'normal' | 'low';
};
```

`Clothing[]`・`WearEntry[]`の正本は既存Appのデータ。状態に服オブジェクトを複製せずIDを保存する。フレームごとの座標/速度/揺れはref/描画側に保持し、全Reactツリーを再描画しない。

### 主なイベントと遷移

| イベント | 遷移/副作用 |
| --- | --- |
| `FOCUS_ZONE(zone)` | 選択を解除、区画へ移動。以前の中央IDを復元 |
| `CENTER_ITEM(zone,id)` | 有効IDを検証して中央更新。着用や選択にはしない |
| `PICK_ITEM(id)` | 選択して取り出す。戻る位置を記録 |
| `RETURN_ITEM` | 選択解除、元の区画/位置へ |
| `SET_FILTERS` | 投影を再計算。中央が消えたら最寄り有効IDへ |
| `OPEN_PANEL(panel)` | 引き出しへフォーカス移動。背景の操作を無効化 |
| `CLOSE_PANEL` | 元の物体/位置にフォーカス復帰。未保存は既存確認 |
| `ADD_TO_OUTFIT(id)` | 明示スロット処理後ID追加。サービス保存はしない |
| `RECORD_OUTFIT(date)` | Appに委譲、`service.recordOutfit`。成功/失敗を分ける |
| `DATA_RELOADED` | 削除/変更済みIDを照合。選択・コーデを整合 |
| `RENDER_FAILED` | DOM版へ切替、同じ区画・中央・コーデを保持 |

非同期保存はAppの既存`execute`と`busy`制御を再利用。記録完了前の成功演出は禁止。reducerは保存処理を呼ばない。

## 6. スクロール・戻る・フォーカス

- 1つの通常縦スクロール領域を用意し、区画のDOMアンカーからカメラの高さを計算する。3DとDOMが異なるスクロール位置を持たないようにする。
- 各レールはネイティブ横スクロールを正本にする。スクロール量をハンガー位置に投影し、停止後のスナップだけ調整する。
- `scroll-snap`と動きを減らす設定の組み合わせを実機検証する。斜め入力を独自pointer捕捉だけで解決しようとしない。
- 見えている前後アイテムだけ描画/マウントし、全件の論理IDとスクロール幅を保持。フォーカスが移る前に対象DOMを実体化する。
- 3Dの物体位置に対応するDOMターゲットを射影する。画面外/遮蔽の対象を誤って押せないようhit領域を更新。
- 戻る状態をHistory APIに接続するアダプターを用意。パネル→取り出し→区画→全景の順に戻る。ブラウザの戻るを常時キャンセルしない。
- 履歴エントリには小さなUI状態のみ格納。フォーム本文や画像Blobを入れない。既存の未保存確認を優先。
- 詳細パネルに入る際は座標だけでなく、呼び出し元のDOM要素参照/IDを保存する。

## 7. 3D描画方式と依存

候補はThree.js＋React Three Fiber。既存Reactは19.3.1。公式の対応表ではFiber 9がReact 19に対応するが、**19.3.1との実際のpeer依存とビルドは採用時に検証する**。本設計作業で依存は追加しない。

- [公式インストールとReact対応](https://r3f.docs.pmnd.rs/getting-started/installation)
- [公式の性能設計：必要時描画・再利用・インスタンシング](https://r3f.docs.pmnd.rs/advanced/scaling-performance)

3D入口を`React.lazy`等で分割し、初期のデータ読込とDOM操作を3D依存の読み込みで止めない。写真版と3D版は同じ操作コンポーネントを使う。

同じ形のハンガーは描画を共用。動きのある時間帯だけ描画し、操作/アニメーション中は必要なフレームを要求する。終了/背景移行で停止。静止画面に常設レンダーループを回さない。

影は家具中心の事前計算/簡易接地影を初期案とする。実布シミュレーションや全服の剛体物理をP0に入れず、減衰する軽い揺れで表現する。

### 資産契約

```ts
type GarmentAsset = {
  key: string;
  src: string;              // 同一オリジンの許可済みパス
  anchor: 'hanger' | 'clip' | 'sole';
  boundsMeters: [number, number, number];
  displayScale: number;
  hasBackView: boolean;
  lodSources?: string[];
};
```

同じ服の正確な3Dモデルがある場合のみ優先。ない場合は登録写真→既存シルエットの順。カテゴリ別汎用3Dは利用者がその表現を選んだ場合に限り使い、服の形状を事実として推定しない。

写真は背景切り抜き済みと仮定しない。背景付き写真もフレーム/面として正しく表示する。自動3D化・自動背景除去を本仕様に紛れ込ませない。

GLTFデコーダ等を使う時はローカル配布・CSP・worker要件を確認する。現行CSPに`worker-src`はなく、画像用blob許可はworker用blob許可ではない。安易にポリシーを緩めず、必要性を検証する。

Blob URL、GPUテクスチャ、ジオメトリ、イベント購読をunmount/キャッシュ追放時に解放。共有アセットは参照数を持たせ、利用中の別インスタンスを破棄しない。context lost後は写真/DOM版へ即切替し、復帰は利用者の操作でも可能にする。

## 8. 段階的実装と完了判定

### Step 1：操作をDOMで成立させる

- UI機能フラグを追加し、旧シェルと新シェルを切り替え可能にする。P0ではDB/APIを触らない。
- `closet-projection`とreducerを実装。既存の検索・並べ替え結果を共有する。
- 3つの収納と長物区画、横送り、取り出し、ユーティリティ引き出し、写真/シルエットで操作を完成。
- 登録・編集・候補・記録・履歴・分析・設定を既存サービスへ接続。
- 完了：3D無効でも主要タスクが完了し、旧表示へ戻して同じデータが読める。

### Step 2：同じ状態へ3Dを載せる

- 依存互換の小さな検証後、家具とサンプル許諾済みモデルを同一オリジンで配置。
- 上下レール/靴棚とカメラを実装。DOMと中央ID・選択IDを同期。
- 動き・光・低品質・必要時描画・遅延ロードを導入。
- 完了：6状態が連続し、描画失敗時に操作と選択が失われない。

### Step 3：実機・アクセシビリティ・回帰

- iOS/Androidの斜めスワイプ、ブラウザ戻る、安全領域、キーボードを確認。
- 読み上げ/キーボードのみ、動きを減らす設定、200%拡大、低品質で確認。
- 実データに依存しない100/500/1000件、写真なし/モデルなし/破損/失敗を検証。
- ユーザーテストと性能測定結果を記録。合格後に新シェルを標準化し、不要な旧ナビを削除する。

P2の手動配置・家具カスタマイズは上記が成立してから。モデル実物がない時もStep 1は先行できる。

## 9. 検証計画

現時点で本書の計画をテスト実施済みとは扱わない。

| 範囲 | 検証内容 |
| --- | --- |
| ユニット | 8カテゴリ/未定義archivedの配置、絞り込み後中央ID、削除参照、スロット入替、保存失敗遷移 |
| 既存回帰 | `npm run typecheck` / `npm test` / `npm run build` / `npm run test:browser` |
| ブラウザ追加 | 各物体から機能へ到達、横送りで実際の別ID選択、登録後配置、コーデの記録、検索0件復帰、History/フォーカス復帰 |
| フォールバック | WebGL初期失敗/context lost、画像/モデル失敗、低品質、3D未ロードでの操作 |
| 実機 | iPhone Safari/Android Chromeの縦横判定、ピンチ/端スワイプ、背景復帰、ソフトキーボード |
| 視覚 | 320/390/430/768/1440px、S01〜S06、拡大時、読み込み/エラー、服の重なりとhit領域 |
| 性能 | 転送サイズ、操作可能時間、fps/長い処理、1000件時メモリ、画面往復後のGPU/Blob解放 |

Canvasのピクセル比較だけで合否を判断しない。保存結果・服ID・フォーカス位置を確認する。既存の回帰テストは操作の目的を維持し、旧タブの存在だけを期待する部分を新しい物体入口へ更新する。

## 10. 変更境界

- 今回確定するもの：体験の構造、6状態、入力の原則、既存コードへの対応と実装順序。
- 実装時に調整するもの：各カメラ座標、スワイプ閾値、視認距離、モデルサイズ/LOD、性能の実測値。
- 別設計が必要なもの：自動3D化、3D資産のユーザー登録/バックアップ、手動配置の永続化、自動同期、仮想試着。
- アプリへの適用、パッケージ追加、コミット/公開はこの設計成果物の作成には含めていない。
