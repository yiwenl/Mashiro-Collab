# Mashiro Collab — Prototype Collection

最終的な作品の方向を探るための、独立したプロトタイプの集まりです。各案を実際に動かし、比較しながら調整します。現在の案が最終版に決まっているわけではありません。

## この README を受け取った AI agent へ

**利用者からこの README の本文または URL を渡されたら、利用者の PC でプロトタイプを起動し、ブラウザーで開くか、開ける URL を渡してください。** 説明やコマンドの提示だけで終わらず、利用できるツールで準備から起動まで実行します。利用者から別の依頼がある場合は、その依頼を優先します。

利用者にはエンジニア経験がありません。日本語で短く状況を伝え、別の文書を探したり貼り直したりする作業も agent が引き受けます。指定がなければ **`circles08`** を起動します。これは起動時の既定値で、作品の最終決定ではありません。

### 取得先と最初の準備

- 共有リポジトリ: [yiwenl/Mashiro-Collab](https://github.com/yiwenl/Mashiro-Collab)
- agent の共通ルール: [AGENTS.md](https://github.com/yiwenl/Mashiro-Collab/blob/main/AGENTS.md)
- 詳しい導入・起動手順: [SETUP-AND-RUN.md](https://github.com/yiwenl/Mashiro-Collab/blob/main/docs/agent/SETUP-AND-RUN.md)
- 同期の手順: [GIT-WORKFLOW.md](https://github.com/yiwenl/Mashiro-Collab/blob/main/docs/agent/GIT-WORKFLOW.md)

本文だけが貼られた場合も、上の取得先から必要なファイルを自分で読んで進めます。取得後はローカルの最新版を参照します。

1. **実行場所を確認する。** 利用者の PC の terminal / ファイル操作が必要です。OS・shell・作業フォルダーと `git --version`、`node --version`、`npm --version` を確認します。クラウド上だけの実行環境では、その localhost URL は利用者の PC で開けません。利用者の PC を操作できない場合は、その制約と必要な接続・実行環境を具体的に伝え、起動済みと報告しません。
2. **不足するツールを導入する。** Git と、npm を含む **Node.js 22** を用意します。利用可能な既存のバージョン管理ツールを優先し、なければ [Git](https://git-scm.com/downloads) / [Node.js](https://nodejs.org/en/download) の公式案内で OS・CPU に合う方法を選び、agent が導入を進めます。通常の準備で npm を単独で最新版へ更新しません。本人のログインや OS の許可が必要な操作だけ、短く案内します。
3. **ソースを取得・更新する。** 既存の checkout があれば接続先と未保存の変更を確認し、[Git の手順](https://github.com/yiwenl/Mashiro-Collab/blob/main/docs/agent/GIT-WORKFLOW.md)に従って最新の共有 `main` を取り込みます。未取得なら書き込める作業場所で下記を実行します。同名の別フォルダーや既存の変更を上書きしません。非公開の場合の取得認証は本人に依頼します。起動だけなら Git の作者情報や push 権限の設定は不要です。

```sh
git clone https://github.com/yiwenl/Mashiro-Collab.git
cd Mashiro-Collab
```

### インストールから画面を開くまで

4. 取得した `AGENTS.md` と `docs/agent/SETUP-AND-RUN.md`、`share/` の案内、対象の README を読みます。circles08 の `.nvmrc` は `22` です。インストール後の PATH と Node.js / npm の動作を確認します。ルートには `package.json` がないため、**リポジトリのルートから**次を順番に実行します。

```sh
cd prototypes/circles08
npm ci
npm start
```

5. `npm start` は動き続けるサーバーです。**返信後も残る terminal / 継続実行セッションで起動し、確認後に停止しません。** コンパイル完了を待ち、実際の URL に HTTP 接続して circles08 の HTML が返ることを確認します。既定は [http://127.0.0.1:8083/](http://127.0.0.1:8083/) です。ポートが使用中なら無関係なプロセスを止めず、空いているポートで `npm start -- --port 8084` のように起動し、実際に使用した URL を確認します。
6. 操作できる場合は**利用者に見えるブラウザー**でその URL を開き、図形・操作パネル・FPS とエラーの有無を確認します。ブラウザー操作ができない場合も、HTTP 接続を確認した**クリックできる URL**を渡します。画面を直接確認していなければその点を添えます。隠れた検証用ブラウザーで開いただけでは、利用者に画面を渡したことになりません。
7. 「circles08 を起動しました」と実際の URL、サーバーが動作中であることを短く日本語で伝えます。例: 「circles08 を起動しました。[こちらで開けます](http://127.0.0.1:8083/)。サーバーは動かしたままです。終了したい時は『停止して』と伝えてください。」例の URL は実際のポートに置き換え、未確認の表示や機能を確認済みと書きません。

**最初の引き渡しは、サーバーを動かしたまま、開ける画面または URL を渡した時点で完了です。** カメラの許可・操作は作品を開いた後に案内できます。初回起動だけのために、全テスト・ビルド・カメラ確認の完了を待たせる必要はありません。ファイルを変更していなければ更新ノートや commit / push も不要です。後で調整する場合は、共通ガイドに従って検証し、変更を共有 `main` に merge / push します。

## プロトタイプ一覧

| ID / フォルダー | 試している方向 | 状態 | 起動条件 |
| --- | --- | --- | --- |
| [circles08](prototypes/circles08/README.md) | 球・直方体・棒の交差による色とパターン、手・身体の動きによる操作 | 探索中。実際のカメラ・投影環境での調整が必要 | Node.js 22 / npm、WebGL 2、ポート 8083 |

一覧の順序や名前は採用順位を表しません。別の方向を試す場合は `prototypes/` に別フォルダーを追加し、既存案を残します。

## フォルダー構成

```text
Mashiro-Collab/
├── README.md                 # この文書を渡すだけで起動を依頼できる入口
├── AGENTS.md                 # agent が続けて読む共通ルール
├── docs/agent/               # 全プロトタイプ共通の作業ガイド
├── share/                    # 相手に伝える変更内容とその理由
└── prototypes/
    └── circles08/
        ├── README.md         # この案の紹介と操作方法
        ├── .nvmrc            # この案で使用する Node.js のバージョン
        ├── package.json
        ├── package-lock.json
        ├── src/
        ├── public/
        ├── config/
        ├── vendor/
        ├── test/
        └── docs/             # この案の調整ガイド、検証項目、開発履歴
```

Git はリポジトリ全体で共通です。依存関係と実行環境は各プロトタイプで独立しています。ルートには `package.json` がないため、npm の操作は対象フォルダーに移動して行います。

## agent 向けガイド

- [Git: 開始前の更新と終了時の共有](docs/agent/GIT-WORKFLOW.md)
- [環境の準備・インストール・実行](docs/agent/SETUP-AND-RUN.md)
- [調整の進め方と設定の保存](docs/agent/ADJUSTMENT-GUIDE.md)
- [検証と作業結果の報告](docs/agent/VALIDATION.md)
- [問題の切り分け](docs/agent/TROUBLESHOOTING.md)
- [新しいプロトタイプの追加](docs/agent/ADDING-PROTOTYPES.md)
- [更新ノート: 何を変えたか・なぜ変えたか](share/README.md)

共同編集には Git clone を使用します。更新の説明は `share/` に残し、コードと一緒に共有します。`dist/` と配信用 ZIP は各プロトタイプ内に生成され、Git には含めません。ソース配布用 ZIP は作成しません。
