# Circles08 — 3D Intersections

Mashiro Collab の候補の一つです。手や身体の動きと図形の交差を試すためのプロトタイプで、最終的な作品の方向は未決定です。[候補の一覧](../../README.md)に戻れます。

初めて利用する人は [ルート README](https://github.com/yiwenl/Mashiro-Collab/blob/main/README.md) を agent に渡してください。agent が取得・準備・起動まで進めます。この README は circles08 の操作説明です。AI agent は [共通ルール](../../AGENTS.md) を読み、テストセッション前の Git 更新を済ませてください。

球・直方体・細長い棒が中心に集まり、重なりによって色とパターンが変化するインタラクティブな 3D 実験です。Digit による手の検出、Kinetic による全身骨格からの両手の検出に対応しています。

## 起動

Node.js 22 と npm を使用します。不足している場合は agent が [環境ガイド](../../docs/agent/SETUP-AND-RUN.md)に従って導入します。追跡ライブラリのソースは同梱されており、他のリポジトリの取得や npm ログインは不要です。npm の依存関係は下記でインストールします。GitHub の取得認証は必要な場合だけ行い、作者情報や push 権限の準備は変更を共有する時に行います。

以下は Mashiro-Collab のルートから実行します。すでに `prototypes/circles08/` にいる場合は最初の `cd` を省きます。

```sh
cd prototypes/circles08
npm ci
npm start
```

agent はコンパイルと HTTP 応答を確認し、[http://127.0.0.1:8083/](http://127.0.0.1:8083/) を利用者に見える WebGL 2 対応ブラウザーで開くか、クリックできる URL を渡します。ポートが使用中の場合は空きを確認して `npm start -- --port 8084` のように起動し、リンクも実際のポートに合わせます。**返信後もサーバーを動かしたままにします。** ブラウザー操作ができなければ、画面未確認と添えて URL を渡してください。

カメラは画面を開いた後で試せます。初回起動だけであれば、カメラの許可や全テスト・ビルドの完了を待つ必要はありません。

## カメラとインタラクション

1. 右上の **Tracking → Source** で **Digit** または **Kinetic** を選びます。
2. **Start tracking** を押し、カメラの使用を許可します。
3. 左下にカメラ映像、手の位置に赤い点が表示されます。見えない球が物体を押します。
4. **Stop camera** でカメラと追跡を停止します。

Digit は手を近くで動かす場合、Kinetic は身体を含む広い範囲で使う場合を想定しています。Kinetic は 1 人の左右の手を使います。カメラの回転・ズーム・移動は固定です。

**Digit mapping** と **Kinetic mapping** の設定は別々に保持され、選択中のフォルダーだけが表示されます。ページを再読み込みすると初期値に戻ります。

気に入った設定を次回も使うには agent に保存を依頼します。GUI の変更だけではファイルは更新されません。[調整と保存のガイド](docs/ADJUSTMENT.md)を参照してください。

| 設定 | 内容 |
| --- | --- |
| Position scale | 手の左右・上下の移動範囲 |
| Depth scale | 相対的な奥行きの倍率。Digit は 4、Kinetic は 2 が初期値 |
| Depth offset | 奥行きの位置調整。正の値でカメラに近づく |
| Sphere radius | 物体を押す球の半径 |
| Mirror | カメラ映像と位置を左右反転 |
| Min visibility | Kinetic の検出信頼度の下限。初期値 0.5 |

奥行きは実測距離ではありません。投影する場所では、まず Position scale と Depth offset を調整してください。追跡中に Source を切り替えると、古いカメラ・モデルを停止して新しい追跡を開始します。

カメラは localhost または HTTPS が必要です。HTML ファイルの直接起動や、通常の HTTP の LAN アドレスでは使用できません。初回の追跡時には MediaPipe の WASM とモデルを外部 CDN から取得するため、インターネット接続が必要です。

## 画面の設定

- **Objects / Lines / rods**：物体の数、大きさ、棒の長さ・太さ。
- **Motion**：中心に引く力、減衰、反発。
- **Display**：Color / Difference / Normal、色票、パターン。
- **Contour**：輪郭線。
- **Pause / Replay same layout**：物理の一時停止・初期配置の再生。
- **Save image**：PNG を保存。カメラ映像、FPS、GUI は含みません。
- 左上の **FPS** は約 0.5 秒ごとに更新します。

URL の `fxhash` を共有すると、同じ初期配置を再現できます。手の動きによる結果は毎回変わります。

## ビルドと共有

以下も `prototypes/circles08/` 内で実行します。

```sh
npm test
npm run build
```

`dist/` に配信用ファイル、`dist-zipped/project.zip` に同じ内容の ZIP を出力します。Web に公開する場合は `dist/` のファイル一式を HTTPS のホスティングへ配置してください。サブディレクトリにも配置できます。

共同編集にはリポジトリ全体を Git clone し、[共通の Git 手順](../../docs/agent/GIT-WORKFLOW.md)で更新・共有します。`dist/` と `dist-zipped/` はこのプロトタイプの中に生成され、Git には含めません。配信用 ZIP はソースを編集するためのファイルではありません。

更新内容とその理由は、ルートの [share/](../../share/README.md) に記録し、コードと同じ Git の更新で共有します。ソース配布用の ZIP は作成しません。

## 開発メモ

- `vendor/`：Digit、Kinetic、camera-manager の固定スナップショット。出典は [vendor/README.md](vendor/README.md)。
- MediaPipe は npm エイリアスで Digit 用 `0.10.32` と Kinetic 用 `1.0.1` を固定しています。
- TypeScript の変換と WASM のバージョン整合は `config/tracking-library-loader.js` で行います。
- agent 向けの [調整箇所](docs/ADJUSTMENT.md)と [検証項目](docs/VALIDATION.md)があります。
- 元の実験記録は [docs/history/EXPERIMENT.zh-TW.md](docs/history/EXPERIMENT.zh-TW.md) にあります。履歴内の古いパスや作業方針は現行の指示ではありません。
- 実際のカメラによる認識精度と投影時の操作感は現場での確認が必要です。

試し終えて停止する時は、agent に停止を依頼できます。自分で停止する場合は、カメラ使用中なら **Stop camera** を押し、開発サーバーを起動した terminal で Ctrl+C を押します。

## Quick start (English)

Give the root [README](https://github.com/yiwenl/Mashiro-Collab/blob/main/README.md) to an agent that can operate your PC. The agent reads [AGENTS.md](../../AGENTS.md), obtains the latest shared main, installs Node.js 22 with npm if needed, enters `prototypes/circles08/`, runs `npm ci`, and starts `npm start`. It verifies the actual URL, opens a visible browser or provides a clickable link, and keeps the server running after replying. The default URL is `http://127.0.0.1:8083/`; use the actual port if it changes. Camera tracking is optional after launch: choose Digit or Kinetic under Tracking and click Start tracking. Tracking sources are included in `vendor/`; no sibling checkout is needed. Camera access requires localhost or HTTPS and downloads WASM/model assets from external CDNs. GUI settings reset on reload; save chosen defaults in source. Before sharing code changes, run `npm test` and `npm run build`, then follow the shared Git workflow. This is one experimental direction, not a selected final design.
