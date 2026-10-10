# 環境を準備してプロトタイプを実行する

## まず確認すること

agent が OS、CPU、使用中の shell、作業フォルダーを確認します。macOS / Linux の shell 手順を Windows PowerShell にそのまま貼り付けないでください。既存環境を使える場合は再インストールしません。

```sh
git --version
node --version
npm --version
```

- Git: 共同作業の履歴・同期に使用します。
- Node.js: 開発サーバーやビルドを動かします。
- npm: Node.js のパッケージをインストールします。通常は Node.js と一緒に導入します。

対象プロトタイプの `.nvmrc`、`package.json`、README を確認し、指定されたバージョンを使います。**circles08 は Node.js 22** です。別の案に無条件で同じバージョンを適用しません。

## Git / Node.js がない場合

Git は [公式配布ページ](https://git-scm.com/downloads)、Node.js は [公式配布ページ](https://nodejs.org/en/download) の、OS・CPU に合う方法で導入します。circles08 用には Node.js 22 を選びます。「最新」の表示だけで別の major バージョンを選びません。

- **macOS:** 既存のバージョン管理ツールを優先します。ない場合は適切な公式 installer を案内します。Git の実行で開発ツールの導入画面が出たら、その手順を説明します。
- **Windows:** 既存の Node.js 管理方法か、対応する公式 installer を使います。インストール後は新しい terminal / agent session で PATH を再確認します。PowerShell が `npm.ps1` を拒否する場合は同じ Node.js に含まれる `npm.cmd` を使えます。PC 全体の実行ポリシーを変更する必要はありません。
- **Linux:** 既存のバージョン管理ツールか公式案内の対応方法を使います。配布パッケージの Node.js が対象バージョンに合うか確認します。

`nvm` がすでに利用できる macOS / Linux 環境では、対象プロトタイプに移動して `nvm install`、`nvm use` を実行できます。Windows で同じ `nvm` の挙動を仮定しません。

GUI installer やログインなど本人の操作が必要な時だけ、短い日本語で案内します。導入後に上の三つのバージョン確認を再実行します。

## ソースと依存関係

未取得なら [Git ガイド](GIT-WORKFLOW.md) に従って clone します。取得済みなら、**テストを始める前にそのガイドの開始前手順を完了**してください。

以降はリポジトリのルートから、対象プロトタイプへ移動します。circles08 の例:

```sh
cd prototypes/circles08
npm ci
```

ここに `package.json` と `package-lock.json` があることを確認してから実行します。ルート、`config/`、`vendor/` ではインストールしません。

`npm ci` は lockfile に固定された依存関係を入れ直します。通常の準備では `npm install` で lockfile を更新しません。初回・lockfile の変更時・Node.js の変更時に再実行し、同じセッションで画面を確認するたびに再インストールする必要はありません。[npm の仕様](https://docs.npmjs.com/cli/v11/commands/npm-ci/)

依存追加・更新そのものが依頼の対象なら、その変更理由を明確にし、manifest と lockfile を一緒に更新・検証します。起動のためだけに `npm audit fix --force` や一括アップグレードを行いません。

circles08 は npm の公開パッケージと同梱の `vendor/` を使用します。別リポジトリの checkout、npm ログイン、API key、`.env` の作成は通常不要です。共同編集の GitHub 認証は別途必要です。

## 起動と成功の確認

circles08 のフォルダーで:

```sh
npm start
```

開発サーバーは動き続けるプロセスです。agent は起動したプロセスを識別できるよう記録し、起動ログのコンパイル結果を確認します。

1. [http://127.0.0.1:8083/](http://127.0.0.1:8083/) をブラウザーで開きます。
2. 図形、右上の操作パネル、左上の FPS が表示されることを確認します。
3. console のエラーを確認します。ログが正常でも画面確認を省略しません。ブラウザー操作ができない agent は、利用者に見える項目を具体的に尋ね、未確認の範囲を記録します。
4. 対象の README の操作手順へ進みます。

8083 が使用中なら、使用者不明のプロセスを終了せず、既存サーバーの対象を確認するか空いているポートを選びます。

```sh
npm start -- --port 8084
```

その場合の URL は `http://127.0.0.1:8084/` です。別プロトタイプはその README のポートと起動方法を使います。

## カメラを使用する circles08 の条件

- WebGL 2 に対応するブラウザーが必要です。Color モードには追加の GPU 機能が必要で、非対応時は Difference に切り替わります。
- **Start tracking** 後のカメラ許可は本人に依頼します。OS とブラウザーの両方の設定が関係する場合があります。
- カメラは localhost / `127.0.0.1` または HTTPS で使用します。HTML の直接オープンや通常の HTTP LAN アドレスで代用しません。
- 追跡開始時に外部 CDN の WASM / モデルが必要です。依存関係のインストール完了だけではオフライン利用可能とは判断しません。
- Digit は手、Kinetic は上半身と両手を映して確認します。詳細は [対象の README](../../prototypes/circles08/README.md) を読みます。

## 停止・再開

先に画面の **Stop camera** を押し、追跡を停止します。その後、起動した terminal で Ctrl+C、または agent が管理するそのプロセスを停止します。他の Node.js プロセスをまとめて終了しません。

後日再開する時は Git 更新から始めます。同じセッションの再起動なら対象フォルダーで `npm start` を実行します。
