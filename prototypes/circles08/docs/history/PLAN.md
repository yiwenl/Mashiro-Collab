# Circles08 3D Difference Implementation Plan

> **履歴資料 / 歷史資料。** 以下は元の実験を開発した時の記録です。旧パス、commit 方針、skill 要求、チェック欄を現在の作業指示として実行しないでください。現行の共同作業は [ルートの AGENTS.md](../../../../AGENTS.md)、操作は [このプロトタイプの README](../../README.md) に従います。

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. 使用者已於 2026-10-08 確認開始實作；第一版功能已建立，瀏覽器驗收紀錄見 README.md。不自動 commit。沿用 circles07 的實驗節奏：平常以瀏覽器觀察為主，要求 commit 時才集中執行自動化測試與 production build。

**Goal:** 在獨立的 circles08 中，讓隨機大小的球與正方體在三維空間互相碰撞、往中心聚集，並逐個物件以 difference 疊圖。

**Architecture:** 沿用 blocks01 的 alfrid／WebGL 場景、相機及 framebuffer 基礎；CPU 剛體模擬負責位置與旋轉，renderer 只讀取結果。每個物件先單獨畫入離屏貼圖，再與累積畫面做 difference，重複直到全部物件完成。

**Tech Stack:** JavaScript ES modules、webpack 5、現有 alfrid、gl-matrix、dat.gui、fxrand；建議新增 cannon-es 作為 3D 剛體引擎。

**Spec:** 本文件的「設計基準」與「繪圖流程」就是本輪規格；數值為第一版調整起點，尚未經實際畫面調校。計畫日期：2026-10-08。

## Global Constraints

- 所有新增內容位於 `circles08/`，不修改 `circles07/`、`blocks01/`。
- 使用者已確認需要完整 3D 剛體碰撞、旋轉，並授權選擇合適引擎；不以 AABB 包圍盒排斥替代球／方塊實際形狀的碰撞。
- 最新迭代依使用者要求改為球與長方體；長、寬、高獨立抽樣，視覺尺寸與 collider 一致。下方第一版正方體描述保留為歷史設計。
- 物理運動在 x／y／z 三軸上進行，不限制在平面。
- 差值合成的單位是「完整物件」；單一物件內的三角形不可彼此做 difference。
- 隨機形狀、尺寸、位置與姿態只在建立初始資料時抽取；物理更新與繪圖不抽亂數。
- 保留 fxhash seed、同構圖重播、暫停／繼續、PNG 匯出。
- 第一版先觀察收斂與疊圖；不移植 circles07 的遞迴圓群、圓環、裝飾線／圓串、彩色系統，也不移植 blocks01 的粒子場、圖樣 atlas 或陰影 pass。
- 不自動 commit；已依使用者後續指示安裝依賴並建立 circles08。

## Review Focus

1. 前後分離但投影重疊的物件，必須都參與 difference；由 Task 3 的固定雙球場景檢查。
2. 單一立方體正反面、三角形接縫及透明背景不得額外反相；由 Task 3 的單物件／空層案例檢查。
3. 掉幀、切換分頁與暫停恢復不得導致物理爆開或大幅跳躍；由 Task 2 的時間控制案例檢查。
4. 正方體旋轉後的 collider、球半徑與渲染尺寸必須一致；由 Task 2 的三種碰撞配對檢查。
5. 重播、切換模式與 resize 不得重新抽構圖、改變模擬或持續累積 framebuffer；由 Task 4 的同 seed 與資源生命週期案例檢查。

## 設計基準

### 現有程式與沿用範圍

- `circles07/src/render/drawCircleTree.js`：單色模式以淺底、白色圖形逐個做 Canvas `difference`。新實驗沿用這個畫面邏輯，不移植 Canvas renderer。
- `circles07/src/sketch.js`：參考固定模擬步長、快取亂數與還原初始資料的重播方式。
- `blocks01/src/SceneApp.js`：參考場景生命週期、透視相機、OrbitalControl、resize 與離屏繪圖。
- `blocks01/src/alfrid/`：複製為 circles08 的本地相依，沿用 `Geom.sphere`、`Geom.cube`、`Draw`、`FrameBuffer`、`FboPingPong`。避免直接 import 相鄰實驗的檔案。
- 不照搬 `DrawBlocks` 的 instancing／粒子貼圖：本輪物件少，而且需要逐物件合成。

### 引擎選擇

建議 **alfrid + cannon-es**：保留現有繪圖框架，新增剛體模擬即可。官方文件列出 Sphere／Sphere、Sphere／Box、Box／Box 三種本輪需要的碰撞配對；位置與 quaternion 可直接交給 gl-matrix 組模型矩陣。[cannon-es 文件](https://pmndrs.github.io/cannon-es/docs/)

另一條路是自行把 circles07 的約束 solver 擴成 3D，但旋轉方塊之間的接觸、角動量與穩定性需要額外處理。這輪採完整物理引擎，把時間用在運動與 difference 的視覺實驗。

### 場景與初始構圖

- 第一版預設 6 顆球、6 個正方體；兩類數量可各自調成 0–16。
- 球的直徑、正方體的邊長在 0.8–1.6 世界單位之間抽樣，使用共同的尺寸範圍。
- 初始分布在原點周圍半徑 4 的球形區域；正方體有 seeded 隨機初始 quaternion，初速及角速度先為零。
- 以各形狀的保守包圍球避開初始穿插，含物件外緣落在生成區域內。每物件最多嘗試 200 次；失敗則整批重試並將生成半徑乘 1.2，最多 5 輪。仍失敗時顯示無法配置，不進入無限迴圈或悄悄少放物件。
- 保存實際使用的生成半徑及全部初始資料；重播直接重建相同物理世界，不再抽樣。
- 使用透視相機與 Orbit 操作；初始角度參考 blocks01 的 rx = -0.6、ry = -0.5。相機依生成範圍及畫面比例安排初始距離，初始構圖含外緣需完整入鏡。
- 空間中不加地板，不設向下重力；所有物件圍繞同一個中心聚集。

### 運動與碰撞

- `World.gravity = (0, 0, 0)`；球使用 `Sphere(radius)`，立方體使用 `Box(halfExtents)`，其中三個 half extent 都是邊長的一半。
- 相同密度 1，質量依球／正方體的體積計算，慣性由引擎處理。
- 每個固定物理步都施加 `F = mass * attraction * (center - position)`，預設 `center = [0, 0, 0]`、`attraction = 0.8`。乘上質量可讓不同大小物件有相近的向心加速度；中心沒有距離倒數的奇異點。
- 起始設定：`linearDamping = 0.35`、`angularDamping = 0.4`、`restitution = 0.1`、`friction = 0.15`、solver iterations = 15。零重力世界另設 `frictionGravity = (0, -9.82, 0)`，作為引擎接觸摩擦的參考，不會增加向下加速度。[World 的摩擦設定說明](https://github.com/pmndrs/cannon-es)
- 第一版 `allowSleep = false`，避免向心力與 sleep／wake 互相干擾；用阻尼讓聚集後的運動逐漸減小，不加入自動判定 Settled 或保證固定秒數停止。
- 固定步長 `1 / 60` 秒；由自己的 accumulator 每次呼叫一次 `world.step(1 / 60)`，並在每次呼叫前施力。每畫面最多推進 5 步；超過的等待時間捨棄，返回分頁或恢復時重設計時。
- renderer 只讀位置與 quaternion。旋轉來自初始姿態和真實碰撞，不另外用動畫覆寫 body。
- 初版走「散落 → 聚集 → 趨於穩定」。若之後需要持續翻動，再另加微弱擾動或移動吸引中心。

## 繪圖流程

### 每個物件都是獨立圖層

1. 每一幀把累積畫面清成白色；不沿用上一幀作拖影。
2. 清除一張共用 object framebuffer 的 color 與 depth，只畫目前這個球或立方體。背景為透明黑；物件為白色或灰階不透明表面。
3. 物件內開啟 depth test／depth write，正常處理正反面遮擋；關閉固定管線 blending，寫入未預乘的 RGB 與 alpha。
4. 全螢幕合成 pass 讀取該物件貼圖與上一張累積貼圖，寫入另一張累積 framebuffer，再 swap。
5. 依穩定的物件 ID 順序重複，最後將累積貼圖畫到 canvas。

其中 `A` 是已累積 RGB、`C` 是物件 RGB、`a` 是物件 alpha：

```text
result.rgb = mix(A, abs(A - C), a)
result.a   = 1
```

不透明區域對應 difference 的 `abs(A - C)`；透明區域保留 A。這是針對不透明底圖的簡化合成形式。[W3C difference 定義](https://www.w3.org/TR/compositing-1/#blendingdifference)

關鍵約束：

- 不共用不同物件的 depth buffer；前方物件不能擋掉後方物件的整層。
- 合成及最後 copy 時關閉 depth test／depth write 與 blending，模型矩陣恢復 identity；畫下一個物件前還原 3D 狀態與相機矩陣。
- 每次讀寫不同的累積貼圖；不讀取目前正在寫入的 texture。
- 純白形狀在白底上呈現一層黑、兩層白、三層黑。加入灰階後，difference 的順序會影響結果，因此固定 ID 順序，不依相機深度重新排序。
- 只需一張 object framebuffer 與兩張累積 framebuffer，依序重用；不為每個物件長期配置全尺寸貼圖，也不在每幀將像素讀回 CPU。
- 顏色附件先用 RGBA8、linear filtering、關閉 mipmap；依使用者後續要求，canvas 與離屏貼圖的寬高固定為 window size 的 1.5 倍，CSS width／height 維持 100%。
- 離屏貼圖的邊緣品質必須實際查看；canvas 的 antialias 設定不代表這些 FBO 自動有抗鋸齒。必要時再加獨立的輸出抗鋸齒處理，不先擴充。

### 顯示與操作

- `Difference` 為預設，白底、白色物件層，先保留 circles07 的黑白反相關係。
- `Shading` 0–1、預設 0：以簡單固定方向光把層內白色漸變成灰階，觀察球面和方塊各面的立體感；不加投射陰影。
- `Normal` 為比較模式：同一份姿態資料，一次畫整個場景並共用深度，使用基本灰階光照以檢查碰撞。
- GUI 分成物件、運動、顯示：數量／尺寸／生成半徑改動需重建；向心力／阻尼／彈性可即時調整；顯示模式與 Shading 只改畫面。
- 提供 Pause／Resume、Replay same layout、Save image。暫停只停物理，Orbit 與畫面比較仍可操作；resize 不重播。
- 不增加遞迴、彩色 palette、材質貼圖、拖影或持續擾動控制。

## 檔案配置與介面

以下是第一版的檔案分工；自動化 test/ 已在提交前建立。

| 檔案／目錄 | 責任 |
| --- | --- |
| `package.json`、`config/`、`public/` | 獨立啟動、shader loader、fxhash 頁面及 production 打包 |
| `src/alfrid/` | blocks01 的本地繪圖基礎副本 |
| `src/index.js`、`src/Config.js` | 啟動與本實驗設定 |
| `src/SceneApp.js` | 相機、物理步進、模式切換與 resize |
| `src/physics/createBodies.js` | seeded 初始形狀／尺寸／姿態／配置資料 |
| `src/physics/PhysicsWorld.js` | cannon-es、碰撞、向心力、固定步進、重播與 dispose |
| `src/render/DrawBody.js` | 共用球／方塊 mesh，以 position／quaternion 畫單一物件 |
| `src/render/DifferenceRenderer.js` | 共用離屏層、ping-pong 累積、resize 與清理 |
| `src/shaders/body.vert`、`body.frag`、`difference.frag` | 物件模型／光照、差值合成；全螢幕頂點 shader 沿用 alfrid |
| `src/utils/addControl.js`、`download.js` | GUI、PNG 下載 |
| `README.md`、`test/` | 使用與畫面驗收紀錄；提交前的核心回歸測試 |

共用資料介面採 plain objects／arrays，不讓 renderer 依賴 cannon-es 類型：

```text
Vec3 = [number, number, number]
Quat = [number, number, number, number]  // x, y, z, w
BodySpec = { id: number, kind: 'sphere' | 'cube', size: number, position: Vec3, quaternion: Quat }
  size: sphere 的直徑，或 cube 的邊長
Layout = { specs: BodySpec[], spawnRadius: number }
BodyPose = { id: number, position: Vec3, quaternion: Quat }
```

## Task 1：獨立 3D 場景與隨機物件

**Files:** 建立 `circles08/package.json`、`config/`、`public/`、`src/alfrid/`、`src/index.js`、`src/Config.js`、`src/SceneApp.js`、`src/physics/createBodies.js`、`src/render/DrawBody.js`、`src/shaders/body.vert`、`body.frag`。

**Interfaces:** `createBodies({ rng, sphereCount, cubeCount, minSize, maxSize, spawnRadius }): Layout`；`DrawBody.draw(spec: BodySpec, pose: BodyPose, { shading }): void`。

- [x] 依 blocks01 建立獨立啟動設定，沿用 circles07 的 `.js` ESM／`config/package.json` CommonJS 慣例。直接由 webpack 載入 shader，不複製無用的 shader／asset watcher、dist 或 node_modules；確認本地 alfrid 的實際 imports 皆有對應依賴。
- [x] 實作初始配置、快取 fxrand stream 與 Layout snapshot；尺寸定義與有限重試依規格，零物件回傳空陣列。
- [x] 建立相機、共享 sphere／cube mesh、基本光照及 quaternion 模型矩陣，先以 Normal 模式顯示靜態場景。
- [x] 用 `npm start -- --port 8083` 開啟。檢查兩種形狀、大小差異、隨機朝向、Orbit、初始完整入鏡、窄視窗 resize；相同 seed／參數還原相同 Layout。

**驗收產物：** 可獨立開啟的 circles08 靜態 3D 構圖。

## Task 2：碰撞、向心力與重播

**Files:** 建立 `circles08/src/physics/PhysicsWorld.js`；修改 `package.json`、`Config.js`、`SceneApp.js`。

**Interfaces:** `new PhysicsWorld(layout: Layout, options)`；`advance(dtSeconds): void`（內含 accumulator 與每個 substep 施力）、`getPoses(): BodyPose[]`、`configure({ attraction, linearDamping, angularDamping, restitution }): void`、`replay(): void`、`resetClock(): void`、`dispose(): void`。SceneApp 管理 paused 狀態，暫停時不呼叫 advance。

- [x] 安裝並固定 cannon-es 的實際版本；依 BodySpec 建立 Sphere／Box、質量與初始 quaternion，維持穩定 ID 對應。
- [x] 依規格完成逐 substep 向心力、阻尼、碰撞材質和時間上限；用引擎輸出更新 DrawBody，不覆寫物理旋轉。
- [x] 實作 replay 為銷毀並依同一 snapshot 重建物理世界；paused／visibilitychange／replay 時清空 accumulator 與上一幀時間，避免補跑舊時間。
- [x] 以球／球、球／旋轉方塊、旋轉方塊／方塊分別驗收碰撞；自動化案例確認接觸後分離、不互相穿過，偏心碰撞產生旋轉。三個 seed 各模擬 60 秒，座標有限、不散逸且平均半徑下降；另有瀏覽器聚集觀察。
- [x] 檢查物件恰位於中心、空場景、單物件及 30／60／120 Hz 輸入；測試 resetClock 清除殘留時間、長幀最多推進五步。固定步數重播以容差比較相同姿態；瀏覽器已操作暫停／恢復，分頁切回依相同 resetClock 路徑處理。

**驗收產物：** 可重播、可暫停，三軸運動並在中心聚集的剛體場景。

## Task 3：逐物件 difference 合成

**Files:** 建立 `circles08/src/render/DifferenceRenderer.js`、`src/shaders/difference.frag`；修改 `SceneApp.js`、`DrawBody.js`、`body.frag`。

**Interfaces:** `new DifferenceRenderer(width, height)`；`render(specs: BodySpec[], poses: BodyPose[], camera, { shading }): void`；`resize(width, height): void`；`dispose(): void`。

- [x] 配置共用 object FBO 及 FboPingPong，實作本文件的逐物件繪圖流程與 alpha-aware difference 公式。
- [x] 明確設定各 pass 的 depth、blend、viewport、模型／相機矩陣；每個物件清 depth，每幀清累積色，不使用跨物件遮擋或跨幀累積。
- [x] 加入 Difference／Normal 切換；兩個模式讀同一份姿態，切換不重新建立物理世界。
- [ ] 固定畫面驗收：空場景全白；一個白球呈黑；兩個沿視線前後分離的白球重疊區變白；三層同區重疊再變黑；透明區不改底圖。
- [x] 單獨看旋轉立方體，確認沒有背面反相或三角形接縫；Shading = 1 時可讀出面向，順序固定且顯示切換不影響運動。
- [ ] 比較 12 與 32 物件的畫面時間和邊緣品質；記錄實測，不先假定固定 FPS。

**驗收產物：** 物理上互不穿透、投影上可逐層相交反相的 3D 畫面。

## Task 4：操作、匯出與整合驗收

**Files:** 建立 `circles08/src/utils/addControl.js`、`download.js`、`README.md`；修改 `SceneApp.js`、`DifferenceRenderer.js`、`Config.js`、`index.js`。要求 commit 時才新增／執行 `test/createBodies.test.js`、`physicsWorld.test.js` 與 `package.json` 的 test script。

**Interfaces:** `addControls({ config, rebuild, configurePhysics, setPaused, replay, saveImage }): { dispose(): void }`；GUI callback 依規格分為重建、即時物理與純顯示。

- [x] 加入物件數、尺寸、生成範圍、向心力、阻尼、彈性、模式、Shading 與操作按鈕；重播保留構圖與相機，PNG 匯出目前顯示結果。
- [x] resize 時同步 canvas／camera／所有 FBO；先釋放舊 FBO，再建立新尺寸，dispose 清除事件與 GUI。處理 Scene 基底建構時就呼叫 resize 的時機，避免資源尚未建立便存取。
- [x] 暫停同一畫面，依序比較 Normal、Difference／Shading = 0、Difference／Shading > 0 並匯出 PNG，確認下載圖片與畫面一致。
- [x] 至少觀察 3 個 seed、兩個物件數級距；反覆 resize／重播 20 次後，FBO 數量回到相同基線，沒有多重更新迴圈。記錄未解決的視覺問題與下一輪調整。
- [x] 使用者要求 commit 時，補上核心回歸案例並執行 `npm test`（19 項通過）、`npm run build`；涵蓋初始配置確定性／尺寸／有限重試、中心零向量、三種碰撞配對、掉幀／resetClock、重播及讀取姿態不改物理。ZIP 檔案清單與內容已比對 `dist/` 一致。difference 的 GPU 行為仍以 Task 3 畫面驗收為準，不以重寫的 JavaScript 公式測試代替 shader 驗證。

**驗收產物：** 可調整、重播及存圖的獨立 3D difference 實驗。

## 第一輪完成標準

- 從 circles08 獨立啟動，能看見隨機大小的球與真正的正方體。
- 向心力使物件集中，三種形狀配對會碰撞並允許旋轉。
- Difference 模式中每個完整物件恰好參與一次合成，前後層可在畫面上反相交疊。
- 暫停、Orbit、重播、顯示比較、resize 與 PNG 匯出可用。
- 第一輪先以黑白形狀關係決定後續方向；持續攪動、彩色、陰影或遞迴結構留到下一個明確實驗。


## 2026-10-08 實作紀錄

- 第一版功能已實作並開啟本機預覽，來源僅新增於 circles08；沒有 commit。
- SceneApp 採相機／Orbit 組合與自有動畫生命週期，避免原 Scene 基底建構時的 callback 與清理限制。
- 修正本地 alfrid 的 DrawCamera 混用 CommonJS、補上 Orbit dispose；blocks01 原檔保持不變。
- 實際窄視窗觀察後，resize 改為依視角比例調整相機距離，保留相對 zoom 和模擬。
- 已驗證 20 次暫停重播的截圖一致，以及重複 resize 後 FBO = 3／texture = 6；PNG 已實際下載。
- 獨立 review 無阻擋發現；fxpreview 改為第一幀繪製後才呼叫。
- 提交前已完成核心自動化測試與 production build；未勾選項目保留指定重疊 fixture 與效能量測，並非未實作功能。


## 長方體尺寸迭代

- 依使用者要求，方塊改以 `dimensions: [width, height, depth]` 儲存三個獨立抽樣的邊長，球維持 `size` 代表直徑；內部 kind／cubeCount 名稱沿用，GUI 顯示改為 Boxes。
- 長方體的 collider half extents、質量（長×寬×高）、生成包圍球（對角線÷2）及 mesh scale 同步更新。
- 光照使用模型矩陣的 inverse transpose，正確處理非等比縮放。
- Max size 滑桿上限由 2 提高至 4；預設仍為 1.6，可在畫面中調整比較。
- 瀏覽器已確認預設尺寸與 Max size = 4 的 Normal／Difference 畫面，並實際匯出 PNG；本輪未跑自動化測試或 production build、未 commit。

## 提交前驗證

- 2026-10-08 使用者要求切換分支並 commit；沿用已建立的 `codex/circles08-3d-difference` 專用分支。
- 已補上 `test/createBodies.test.js`、`test/physicsWorld.test.js` 及共用 helper，19 項測試通過。
- production build 成功，`dist-zipped/project.zip` 與 `dist/` 每個輸出檔案完全一致。
- 最新畫布及 FBO 解析度為 window size 的 1.5 倍，CSS width／height 維持 100%。
