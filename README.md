# Mashiro Collab — Prototype Collection

最終的な作品の方向を探るための、独立したプロトタイプの集まりです。各案を実際に動かし、比較しながら調整します。現在の案が最終版に決まっているわけではありません。

**AI agent は、最初に [AGENTS.md](AGENTS.md) を読んでください。** 環境の準備、共同作業の Git 手順、検証、終了時の共有方法を案内しています。

## プロトタイプ一覧

| ID / フォルダー | 試している方向 | 状態 | 起動条件 |
| --- | --- | --- | --- |
| [circles08](prototypes/circles08/README.md) | 球・直方体・棒の交差による色とパターン、手・身体の動きによる操作 | 探索中。実際のカメラ・投影環境での調整が必要 | Node.js 22 / npm、WebGL 2、ポート 8083 |

一覧の順序や名前は採用順位を表しません。別の方向を試す場合は `prototypes/` に別フォルダーを追加し、既存案を残します。

## フォルダー構成

```text
Mashiro-Collab/
├── AGENTS.md                 # agent の入口と共通ルール
├── README.md                 # 作品候補の一覧
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

## circles08 を開く

初回の共同作業では先に [Git の準備](docs/agent/GIT-WORKFLOW.md) と [環境の準備](docs/agent/SETUP-AND-RUN.md) を行います。リポジトリのルートから:

```sh
cd prototypes/circles08
npm ci
npm start
```

[http://127.0.0.1:8083/](http://127.0.0.1:8083/) を開きます。操作方法は [circles08 の README](prototypes/circles08/README.md) を参照してください。

## agent 向けガイド

- [Git: 開始前の更新と終了時の共有](docs/agent/GIT-WORKFLOW.md)
- [環境の準備・インストール・実行](docs/agent/SETUP-AND-RUN.md)
- [調整の進め方と設定の保存](docs/agent/ADJUSTMENT-GUIDE.md)
- [検証と作業結果の報告](docs/agent/VALIDATION.md)
- [問題の切り分け](docs/agent/TROUBLESHOOTING.md)
- [新しいプロトタイプの追加](docs/agent/ADDING-PROTOTYPES.md)
- [更新ノート: 何を変えたか・なぜ変えたか](share/README.md)

共同編集には Git clone を使用します。更新の説明は `share/` に残し、コードと一緒に共有します。`dist/` と配信用 ZIP は各プロトタイプ内に生成され、Git には含めません。ソース配布用 ZIP は作成しません。
