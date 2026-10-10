# Git — 最新版から始め、変更を共有する

## 目的

各テストセッションの開始前に GitHub の最新 `main` を取得し、終了時には保持する変更を `main` に merge して GitHub に push します。ローカルでの保存だけでは共有完了ではありません。起動だけで変更がなければ、取得・更新までを行い、書き込みの準備や commit / push は不要です。

Git の対象は **Mashiro-Collab 全体** です。以下の操作はリポジトリのルートで行います。コマンドは状態を確認しながら一つずつ実行し、失敗したら後続を続けないでください。

## 初回: ソースを取得する

1. [環境ガイド](SETUP-AND-RUN.md) に従って Git を確認します。
2. 既存の checkout がある場合は `git rev-parse --show-toplevel` と `git remote -v` で場所と接続先を確認します。重ねて clone しません。
3. 初めて取得する場合、書き込める保存先の親フォルダーで次を実行します。同名の別フォルダーを上書きしません。非公開リポジトリなど読み取り認証が必要な場合だけ、本人の GitHub アカウントで認証します。

```sh
git clone https://github.com/yiwenl/Mashiro-Collab.git
cd Mashiro-Collab
```

認証が必要な場合は既存の方法を優先します。必要なら GitHub CLI の `gh auth login` → `gh auth setup-git`、または Git Credential Manager / SSH を使います。ログインは本人に依頼し、パスワードや token をチャットやファイルに貼らせません。clone できたら、下の「開始前」へ進みます。作者情報や書き込み権限が未設定でも起動できます。

## 変更を共有する時: 書き込み権限と作者情報

初めて調整・保存を依頼された時に準備します。初回の画面を開くための前提にはしません。

1. 所有者から共同編集の招待を受け、友人本人の GitHub アカウントで承認してもらいます。公開リポジトリを読めても書き込み権限があるとは限りません。
2. 本人の認証が必要なら、上記の認証方法を使います。
3. `git config user.name` と `git config user.email` を確認します。未設定なら本人の希望する名前・メール（GitHub の noreply も可）を確認し、`git config --local` で設定します。作者の情報をコピーせず、他のプロジェクトの global 設定を変更しません。

CLI が利用できる場合は `gh repo view yiwenl/Mashiro-Collab --json viewerPermission` で権限を確認できます。ブランチ保護は別条件なので、書き込み権限があっても `main` への直接 push が可能とは限りません。

認証方法の詳細: [GitHub 公式ガイド](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/about-authentication-to-github)。

## 開始前

まず状態を読みます。

```sh
git status --short --branch
git branch --show-current
git remote -v
git fetch origin
```

`origin` が想定した共有リポジトリであることを確認します。別の URL なら勝手に変更せず、取得元を調べます。

### 通常: 作業ツリーが空で、前回の作業が完了している場合

```sh
git switch main
git merge --ff-only origin/main
```

`main` に共有されていない commit がないかも `git log --oneline origin/main..main` で確認します。他の作業の commit があれば、今回まとめて push しないよう内容を確認・分離します。

起動だけなら、更新した `main` のまま環境準備へ進めます。ファイルを変更する場合は最新の `main` から今回のブランチを作ります。次は circles08 の手の調整の例です。対象と目的に合わせ、一意な名前を選んでください。

```sh
git switch -c codex/circles08-hand-scale
```

取り込んだ更新に含まれる [share/ の関連ノート](../../share/README.md)を読み、意図と試してほしい点を確認してから環境準備とテストを開始します。fetch に失敗した場合は「最新版を取得できた」と扱いません。ネットワークや認証を直すか、利用者がオフラインでの続行を望んだ場合だけ古い版であることを伝えて進めます。

### 未完了の変更がある場合

- `git diff`、`git diff --cached`、未追跡ファイルと直近の履歴を確認し、前回の作業と今回の作業を識別します。
- 既存の内容を削除しません。適切な作業ブランチへの途中保存 commit、または説明付きの stash と復元計画で保護します。stash は GitHub 上のバックアップではありません。未追跡ファイルも取りこぼさないよう確認します。
- 同じ作業の続きなら、保護した変更のある作業ブランチに `origin/main` を merge してから再開できます。新しいブランチを毎回作る必要はありません。
- 別作業の変更ならそのブランチに残し、今回の作業と混ぜません。意図が不明な変更だけ利用者に確認します。
- すでに merge / rebase 中ならまずその状態を把握し、無関係な操作を重ねません。

## 終了時

以下は保持するファイルの変更がある場合の手順です。変更なしの起動引き渡しでは実行せず、サーバーを動かしたまま画面または URL を渡します。

### 1. 保持する内容を検証・保存

[検証ガイド](VALIDATION.md) と対象プロトタイプの検証項目を実行します。GUI だけで変更した値はファイルに保存されているか確認してください。

共有する更新について [share/](../../share/README.md) に日付付きノートを追加します。変更内容と理由、次に試してほしいこと、確認済み・未確認を日本語で書きます。ノートもソースと同じ作業ブランチに commit し、同じ `main` への merge / push で共有します。

`git diff` と未追跡ファイルを確認し、今回の変更を漏れなく、明示したパスで stage します。例えば `git add -- prototypes/circles08/src/Config.js` です。この例以外に変更したファイルがあれば、それぞれ内容を確認して追加します。

```sh
git diff --cached
git diff --cached --check
git commit -m "Adjust circles08 hand interaction"
```

commit メッセージは実際の変更を表す文に置き換えます。変更がなければ空の commit や merge を作る必要はありません。

### 2. 最新の共有変更と統合

作業ブランチ上で次を実行します。

```sh
git fetch origin
git merge --no-edit origin/main
```

競合は両方の変更意図を確認して解決し、解決内容を commit します。一方の変更を丸ごと捨てる方法を既定にしません。競合で創作上の選択が必要なら、その違いだけを日本語で確認します。

統合後の内容で、[検証ガイド](VALIDATION.md)に従い変更に必要な検証を行います。共有変更が別の案にも影響する場合、その案の検証も行います。統合で変更内容が変わった場合は更新ノートも合わせます。失敗が残る場合は作業ブランチに保存し、`main` への反映を完了扱いにしません。

### 3. main に反映して push

作業ツリーが空であることを確認します。次のブランチ名は実際に使った名前に置き換えてください。

```sh
git switch main
git merge --ff-only origin/main
git merge --ff-only codex/circles08-hand-scale
git log --oneline origin/main..main
git push origin main
```

push 前の履歴に、共有してはいけない別作業の commit がないことを確認します。`--ff-only` が失敗した場合は分岐を調べ、他の commit を消さずに統合し直します。

- push が他の人の更新で拒否された場合: 再度 fetch し、作業ブランチで新しい `origin/main` と手元の必要な変更を統合・検証してからやり直します。force push は使いません。
- 認証・権限で拒否された場合: 変更を保持し、ログインや共同編集権限の不足を案内します。
- ブランチ保護で直接 push できない場合: ルールを解除せず、作業ブランチの push と PR の経路に切り替えます。PR が merge され、共有 `main` に含まれるまでは共有完了としません。

### 4. リモートの反映を確認

```sh
git fetch origin
git rev-parse main
git rev-parse origin/main
git merge-base --is-ancestor main origin/main
git status --short --branch
```

通常は `main` と `origin/main` の commit ID が一致します。確認中に他の人が更新した場合でも、最後の ancestry チェックが終了コード 0 なら、手元の `main` はリモートの履歴に含まれます。違いを確認してから fast-forward し、必要な再検証を行います。

push 成功、共有された commit ID、残る未確認事項を報告します。作業ブランチの削除は共有確認後に必要に応じて行います。

## 初期状態と例外

- **まだ commit / 共有 main がない:** 初回配布の準備段階です。所有者がソースを確認して最初の commit と共有 `main` を用意する必要があります。通常の友人のテスト手順では、空のリポジトリを独断で初期化・上書きしません。
- **ZIP で届いた:** Git clone を別フォルダーに取得し、ZIP 内に独自変更があれば比較して必要なソースだけ移します。clone 先の `.git/` を置き換えません。
- **テストのみで変更なし:** 最新版で確認した結果を報告します。不要な commit / push は行いません。
- **中断:** 作業ブランチ、保存状態、残作業を記録します。中断を完成として `main` に merge しません。

fast-forward と更新の背景: [Git 公式ドキュメント](https://git-scm.com/docs/git-pull)。
