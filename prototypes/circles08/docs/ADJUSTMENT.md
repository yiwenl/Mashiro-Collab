# Circles08 — agent 向け調整ガイド

先に [共通の進め方](../../../docs/agent/ADJUSTMENT-GUIDE.md)と [操作説明](../README.md)を読みます。この文書のファイルパスは `prototypes/circles08/` を基準にしています。

## パラメーターと編集場所

既定値は [src/Config.js](../src/Config.js) にあります。まず画面で試し、保持する値だけをこのファイルへ保存します。

| 希望の例 | 画面で試す項目 | Config.js のキー |
| --- | --- | --- |
| 球や箱を増減する | Objects → Spheres / Boxes | `sphereCount` / `cubeCount` |
| 物体を大きくする | Objects → Min size / Max size | `minSize` / `maxSize` |
| 初期の散らばり方を変える | Objects → Scatter radius | `spawnRadius` |
| 長い棒を調整する | Lines / rods → Rods / Length / Width | `rodCount` / `rodLength` / `rodWidth` |
| 中心へ集まる力を変える | Motion → Center pull | `attraction` |
| 動きや回転を落ち着かせる | Motion → Linear / Angular damping | `linearDamping` / `angularDamping` |
| 跳ね返りを変える | Motion → Bounce | `restitution` |
| 表示方式を変える | Display → Mode | `mode`: `color` / `difference` / `normal` |
| 色や模様を変える | Display → Palette / Pattern amount / Pattern size | `palette` / `patternAmount` / `patternScale` |
| 輪郭を変える | Contour → Enabled / Width | `contour` / `contourWidth` |
| 手の動きの範囲を広げる | 選択中の mapping → Position scale | `tracking.<source>.handScale` |
| 押す位置を前後へ移す | Depth offset | `tracking.<source>.handDepthOffset` |
| 相対的な奥行きの変化を調整する | Depth scale | `tracking.<source>.handDepthScale` |
| 押す球の大きさを変える | Sphere radius | `tracking.<source>.handRadius` |
| 左右反転を変える | Mirror | `tracking.<source>.handMirror` |
| 身体追跡の信頼度条件を変える | Kinetic mapping → Min visibility | `tracking.kinetic.minVisibility` |

`<source>` は `digit` または `kinetic` です。起動時の Source は `trackingSource` で決まります。双方の mapping は独立しているため、一方で決めた値を他方にも自動適用しません。

## 設定を保持する

GUI はメモリー上の設定を変更し、ファイルには書き込みません。保持したい値を記録して `src/Config.js` を変更し、再読み込み後に同じ値・効果になるか確認します。GUI の表示名と保存キーが異なる項目に注意してください。

パレットは表示名ではなく内部 ID を保存します。`src/render/palettes.js`、`src/render/solarPalettes.js` と `src/utils/addControl.js` の対応を確認し、ID を推測しません。GUI の範囲や、サイズの上下限の関係を壊さないようにします。

URL の `fxhash` が同じなら同じ初期配置を比較できます。現在の全設定や手の動きまで記録する機能ではありません。比較する時は設定値も一緒に記録します。

## 手を使う調整の順序

1. Digit / Kinetic のどちらを使うか決め、カメラ映像と赤い点を確認します。
2. Mirror を合わせ、Position scale で左右・上下の範囲を合わせます。
3. Depth offset で物体に触れやすい奥行きへ移します。
4. Sphere radius で押せる範囲を調整します。
5. 必要に応じて Depth scale を調整します。相対 z は実際の距離ではなく、Digit / Kinetic でも同じ意味の尺度ではありません。
6. Kinetic で手が出たり消えたりする場合は画角・遮蔽・Min visibility を確認します。

Pause 中は手の衝突球が取り除かれます。静止中に押せないことだけで追跡不具合と判断しません。

## 設定以外の変更箇所

| 対象 | ファイル / フォルダー |
| --- | --- |
| 操作パネルの項目・範囲 | `src/utils/addControl.js` |
| 固定カメラ・描画サイズ・全体の調整 | `src/SceneApp.js` |
| 手の位置変換 | `src/interaction/handMapping.js`、`kineticMapping.js` |
| 追跡とカメラの開始・停止 | `src/interaction/HandTracking.js`、`trackingSources.js` |
| 物理と手の衝突球 | `src/physics/` |
| 色・模様・輪郭の描画 | `src/render/`、`src/shaders/`、`src/patterns/` |
| 同梱ライブラリと変換 | `vendor/`、`config/tracking-library-loader.js` |

カメラは固定されており、棒が画面外に出ることがあります。操作や構図の希望がない限り自動でカメラを引く変更は加えません。MediaPipe と WASM のバージョン対応や `vendor/` は、通常のパラメーター調整では変更しません。

変更後は [検証項目](VALIDATION.md) を実行します。
