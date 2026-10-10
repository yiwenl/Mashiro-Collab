# 問題の切り分け

まず作業フォルダー、対象プロトタイプ、OS、Node.js / npm、実行コマンド、最初に発生したエラーを確認します。変更を重ねる前に、どの段階で失敗したか特定してください。

## 共通

| 症状 | agent が確認すること | 対応 |
| --- | --- | --- |
| README 本文だけを受け取り、他のファイルがない | 本文にある共有リポジトリ URL と取得状況 | [共有リポジトリ](https://github.com/yiwenl/Mashiro-Collab)から agent が取得して読む。利用者に文書を一つずつ貼り直させない |
| agent の localhost が利用者の PC で開かない | 実行先がクラウドや別 PC ではないか | 本人の PC の terminal / ファイル操作に接続して起動する。実行手段がなければ必要な環境を具体的に伝える |
| `package.json` がない / ENOENT | リポジトリのルートで npm を実行していないか | 対象の `prototypes/<id>/` に移動する。新しい package.json をその場で作らない |
| `git` / `node` / `npm` が見つからない | インストール状況、PATH、terminal の再起動 | [環境ガイド](SETUP-AND-RUN.md) を使う |
| `node` は動くが `npm` がない | 選択中の Node.js と PATH | npm を含む指定バージョンの Node.js の導入を修復し、両方のバージョンを再確認する |
| PowerShell が `npm.ps1` を拒否 | 同じ Node.js の `npm.cmd` が使えるか | `npm.cmd ci` / `npm.cmd start` を使う |
| `npm ci` が lockfile 不一致で止まる | 対象フォルダー、manifest / lockfile の差分、未解決の競合 | 正しい組み合わせを復元する。lockfile を消して回避しない |
| 依存ダウンロード失敗 | 接続、proxy、DNS、最初の npm エラー | 通信原因を解消して再実行する。SSL 検証を無効化しない |
| 権限エラー | 保存先の所有者と npm cache の状態 | 原因に合わせて直す。無条件に `sudo npm` を使わない |
| ポート使用中 | 既存サーバーのプロジェクトとポート | 自分の既存サーバーを再利用するか別ポートへ。無関係なプロセスを止めない |
| 起動直後は開けたが、agent の返信後に開けない | 起動セッションの終了・時間制限・停止処理 | 返信後も残る terminal / 継続実行セッションで再起動し、HTTP 接続を確認して実際の URL を渡す |
| agent にブラウザー操作機能がない | サーバーが対象の HTML を返すか | HTTP 接続を確認したリンクを渡し、画面未確認と添える。本人の画面確認待ちで URL の引き渡しを止めない |
| Git の更新・push 失敗 | 接続先、ログイン、権限、競合、ブランチ保護 | [Git ガイド](GIT-WORKFLOW.md) の対応へ。force push を使わない |
| 調整が消えた | GUI だけで変更していないか | [調整ガイド](ADJUSTMENT-GUIDE.md) に従い保持したい値をソースへ保存する |

## circles08: 画面とカメラ

この節は circles08 用です。別の案には、その README に書かれた条件を適用します。

| 症状 | 確認する順序 |
| --- | --- |
| ページが開かない | 起動プロセスが生きているか → ログの URL / ポート → ブラウザーが同じ PC の localhost を開いているか |
| 画面が空白 | コンパイル結果 → ブラウザー console / Network の最初のエラー → WebGL 2 / GPU 対応 |
| Color が表示されず Difference になる | `EXT_color_buffer_float` 非対応時のフォールバックか確認する。意図された動作の場合がある |
| カメラを開始できない | localhost / HTTPS → Start tracking → ブラウザー・OS の許可 → 接続されたカメラと他アプリによる使用 |
| Waiting for camera のまま | 許可ダイアログが別ウィンドウに隠れていないか。必要なら Stop camera の後に再試行 |
| Loading model から進まない | CDN への通信・モデル取得エラー。npm の再インストールだけで直そうとしない |
| 映像はあるが手を検出しない | Source の選択 → Digit は手、Kinetic は上半身と手が入る画角 → 明るさ・遮蔽 → Kinetic の Min visibility |
| 赤い点は動くが物体を押せない | Pause の状態 → Position scale → Depth offset → Sphere radius。深度は実測距離ではない |
| 左右が逆 / 位置が合わない | 選択中 Source の Mirror と mapping 値。Digit と Kinetic の設定は別々 |
| 動作が重い | FPS、画面サイズ、物体数、追跡の有無を同じ条件で比較する。まず制御できる数を減らし、原因を特定する |

## 修正後

最初の失敗条件をもう一度試します。起動できたことだけで、元の問題が解消したと判断しません。ソースを変更した場合は関連するテストとビルドを行います。

解消できない場合も、変更を保持し、対象・再現操作・最初のエラー・試した対応・残る条件を短く報告します。認証情報を含むログをそのまま共有しないでください。
