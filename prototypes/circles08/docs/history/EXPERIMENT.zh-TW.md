# Circles08 — 3D Difference

> **履歴資料 / 歷史資料。** 以下のパス、起動方法、検証結果は開発当時の記録で、現在の実行結果ではありません。現行の起動方法は [このプロトタイプの README](../../README.md)、共同作業の方針は [ルートの AGENTS.md](../../../../AGENTS.md) を参照してください。今後の作業記録はこの履歴を書き換えず、別の文書に残します。

隨機大小的球、長方體與細長柱散落在三維空間，再受到向心力拉回原點。細長柱帶隨機三維朝向，在投影中形成類似 circles07 的線條。使用 cannon-es 處理碰撞與旋轉，並將每個物件各自畫成一層。預設 Color 模式依投影交疊的物件組合上色，也可切回黑白 Difference 或一般 3D 的 Normal。

## 啟動

```sh
cd Mashiro-Collab
npm install
npm start
```

開啟 <http://127.0.0.1:8083/>。指定其他埠可用 `npm start -- --port 8084`。

獨立分享版把 Digit、Kinetic 與 camera-manager 的來源放在 `vendor/`，不需要相鄰專案。從專案根目錄執行 `npm ci` 與 `npm start` 即可啟動；打包時分別使用鎖定的 MediaPipe 0.10.32／1.0.1。首次啟用追蹤仍需連線下載 WASM 與模型。

網址會保存目前的 `fxhash`；重新整理相同網址會還原相同初始構圖。移除網址的 `fxhash` 參數再開啟，即可產生新的構圖。GUI 的參數在本次頁面中有效，重新整理會回復預設設定。

## Kinetic 提交驗收（2026-10-10）

- `npm test`：45 項全部通過。新增 5 項涵蓋 Kinetic 原始影像座標、低可信度與手腕回退，以及關閉、運行、模型初始化三種狀態下的來源切換；既有手部互動與物理案例仍通過。
- `npm run build` 成功且無編譯警告；ZIP 與 `dist/` 的 9 個檔案清單及內容一致，包含兩種來源各自的延遲載入 chunks。11 個修改或新增 JavaScript 檔案通過語法檢查，差異格式檢查通過。
- 瀏覽器已確認對應 folder、獨立設定保留與等待攝影機時切換／停止，獨立程式審查未發現實質問題。真實骨架辨識、投影場合的映射與效能仍待攝影機實測。

## 手部互動提交驗收（2026-10-10，292ac2e）

- `npm test`：40 項全部通過。新增 14 項涵蓋掌心座標、鏡像／比例／相對深度、手部球推動球／方塊／細柱、定位點使用實際碰撞位置、半徑更新與移除，以及串流／模型初始化途中停止、重新啟動、過期追蹤、分頁隱藏與資源清理。
- `npm run build` 成功；ZIP 與 `dist/` 的 7 個檔案清單及內容一致，包含 digit 的延遲載入 chunks。12 個修改或新增 JavaScript 檔案通過語法檢查，差異格式檢查通過。
- 瀏覽器以模擬資料確認左下角預覽、鏡像與三種模式的最上層定位點；模擬資料已移除。獨立程式審查指出的 shader 相容性問題已修正並完成實際繪製驗證。真實攝影機辨識、抖動與推動手感仍待實測。

## 圖樣與輪廓提交驗收（2026-10-09，bfd48ce）

- `npm test`：26 項全部通過。新增長柱 seeded 配置、40 個混合物件的初始間距、rod 參數驗證，以及交叉／平行／近乎平行／端點膠囊距離與旋轉包圍範圍檢查；collider 測試也涵蓋 50 長度細柱的尺寸與質量。
- 既有固定步長、碰撞、重播與清理案例通過；三個 seed 各 60 秒的聚集模擬使用目前含長柱的預設設定。
- `npm run build` 成功，ZIP 與 `dist/` 的四個檔案清單及內容一致；24 個修改或新增 JavaScript 檔案通過語法檢查。
- 整合程式審查未發現阻擋提交的問題。下方保留各功能開發時的瀏覽器驗收紀錄；尚未建立 GPU 自動化回歸案例或量測 FPS。

## 操作

- **FPS**：左上角顯示畫面更新率，每半秒更新平均值；包含物理、繪圖與追蹤影響，不是固定的物理步長或攝影機 FPS。返回分頁時重新計算，存圖不包含此介面。
- 相機距離固定為 14，旋轉、滾輪縮放與 Shift＋拖曳平移皆鎖定，讓手部座標和畫面保持一致。更改物件、柱長或視窗尺寸都不自動拉遠，長柱可以伸出畫面。
- **Tracking**：Source 選 Digit 或 Kinetic，再按 Start tracking 並允許攝影機；Stop camera 會停止串流並移除手部碰撞球。只顯示目前來源的 mapping folder，切換回來會保留本次頁面中的各自設定。Position scale 調整平面活動範圍，Depth scale／offset 調整深度，Sphere radius 調整碰撞球半徑，Mirror 控制左右鏡像。左下角顯示目前來源、影像與追蹤狀態。
- **Objects**：球／長方體數量、尺寸範圍、散落半徑。調整完成後，以同一個 seed 重建；擁擠時會有限度放大生成範圍。
- **Lines / rods**：細長柱數量 0–8、基準長度 3–50、基準寬度 0.025–0.2；預設 4 根、長度 50、寬度 0.05。每根長度在基準的 80–120%、寬度在 85–115% 之間抽樣，初始朝向使用 seeded quaternion；加入相同的剛體碰撞、向心力與交疊合成。
- **Motion**：向心力、線性／角速度阻尼、碰撞彈性，即時套用。
- **Color**：每種交疊物件組合對應固定的純色或圖樣材質；物件移動或旋轉時，圖樣固定在畫面上，由投影輪廓裁切。交疊判斷與材質取樣都在 GPU 上完成。
- **Palette**：circles07 的 Coral / sage、Rust / ochre、Red / gold / cyan，加上 isoGrid 的 24 節氣色票，共 27 組。預設立春；切換會重繪材質貼圖，不重播物理。
- **Pattern amount**：0 全部純色、1 將可用圖樣的區塊全部改成圖樣，預設 0.5 混合。含 rod 的區塊（包括與其他物件的交疊區）固定使用純色。依交疊組合的固定 hash 選擇，調整時不重新抽籤。
- **Pattern size**：48–320 CSS pixels，預設 160。數值越大圖樣越大；解析度倍率不影響圖樣的視覺密度。
- **Contour**：Color／Difference 的深色輪廓覆蓋層，預設開啟；Width 0.5–2 CSS pixels，預設 0.5。只描出黑白 difference 的邊界，不描 pattern 細節；Normal 不使用此效果。
- **Difference**：白底上每個物件做一次差值合成，重疊區域反相。前後物件都參與合成，不以深度互相遮住。
- **Difference shading**：只影響 Difference。0 為純黑白；增加數值後，物件層帶灰階明暗，能看出球面與方塊面向。Color 使用完整、沒有明暗的物件 mask。
- **Normal**：一般有深度遮擋的灰階 3D，方便對照實際碰撞。模式切換不改變物理狀態。
- **Pause**：暫停物理並移除手部碰撞球，仍可切換模式和存圖；恢復後重新使用最新的手部位置。
- **Replay same layout**：還原相同初始位置、尺寸與朝向，保留相機、目前的運動參數和暫停狀態。
- **Save image** 或 Cmd/Ctrl＋S：匯出目前畫面的 PNG，不含控制面板。
- **Close Controls**：收起控制面板。

預設 6 顆球與 6 個長方體，尺寸 0.8–1.6。長方體的長、寬、高各自在 Min size–Max size 範圍抽樣，球則以此範圍抽取直徑；Max size 可調到 4。碰撞形狀、質量與生成用包圍球皆依實際三邊尺寸計算；沒有地板或向下重力。物件在中心聚集後逐漸減少運動，不額外持續攪動，也不強制停止。

另外加入 4 根細長柱，共 16 個物件；最大可達 16 顆球＋16 個長方體＋8 根柱，共 40 個。細長柱使用真正的 Box collider，三邊尺寸同時決定 mesh 與質量。初始配置以包住柱身與端點的膠囊體檢查重疊，避免長柱的外接球排除過多空間；這個膠囊體只用於生成，運動時仍以 Box 碰撞。生成範圍及遠裁切面依長柱尺寸調整，相機距離不跟著改變。

## 結構

- `src/physics/createBodies.js`、`placementBounds.js`：使用 fxrand 產生初始配置；球／方塊用保守包圍球、細長柱用膠囊包圍範圍避免初始穿插，採有限重試。
- `src/physics/PhysicsWorld.js`：真正的 Sphere／Box collider、固定 60 Hz 模擬、每個物理步的向心力、重播。
- `src/physics/HandColliders.js`：最多兩顆隱形 KINEMATIC 球，以平滑、限速的移動推動場景物件。
- `src/interaction/HandTracking.js`、`handMapping.js`：digit／攝影機生命週期、掌心取樣、鏡像與固定相機座標映射。
- `src/interaction/trackingSources.js`、`kineticMapping.js`：來源介面、延遲載入與 Kinetic 骨架手部取樣；兩者的輸入均轉成正規化影像座標，再各自套用 mapping 設定。
- `src/render/HandMarkers.js`：最後繪製手部碰撞球中心的小點，不受場景深度遮擋。
- `src/render/DrawBody.js`：共享球／方塊 mesh，從物理位置與 quaternion 組成模型矩陣。
- `src/render/DifferenceRenderer.js`：一張物件 FBO、兩張交替累積 FBO；每幀重新合成。
- `src/render/ContourRenderer.js`：黑白 difference 與透明輪廓各一張 FBO，再把輪廓疊到主畫面。
- `src/shaders/intersections.frag`、`colorize.frag`：累積物件組合編碼，再選擇材質格位，以固定畫面座標取樣。
- `src/render/MaterialAtlas.js`：預先產生純色與圖樣，組成同一張 texture atlas；切換色票時更新既有 texture。
- `src/render/palettes.js`、`solarPalettes.js`：三組原有配色與 isoGrid 的 24 節氣色票。
- `src/patterns/`：從 isoGrid 移植的波紋、點狀波紋、六角、六角環格、花形、菱形與迷宮，共七類圖樣。
- `src/SceneApp.js`：相機、動畫排程、resize、GUI 與匯出協調。
- `src/alfrid/`：從 blocks01 複製的本地繪圖基礎；補上 Orbit 清理及 DrawCamera 的 ESM 匯入相容性。

場景只透過 plain arrays 在物理與繪圖之間傳遞姿態。Resize 保留物理狀態與相機距離，只更新投影長寬比；FBO 會釋放並重建。

## 手部互動

Digit 每隻手取手腕與四個指根（landmark 0、5、9、13、17）的平均位置作為掌心，最多支援兩隻手。x／y 由影像正規化座標映射到固定相機的視野，預設左右鏡像；球體只加入物理世界，不加入任何繪圖模式、交疊 index、pattern 或 contour，也不改變 seeded 初始配置。

Kinetic 是相鄰的全身骨架 library，第一版使用 full 模型追蹤一個人，只取左右手腕及該手的可見拇指／食指／小指點平均位置。讀取 `result.landmarks` 的原始正規化影像座標與相對 z，不把相容格式的像素座標或以公尺表示的身體局部座標直接套入場景。手腕必須通過 Min visibility 門檻（預設 0.5，可調 0–1），其他手部點不可靠時回退至手腕；visibility 與有提供的 presence 都會檢查，遮擋時移除該手。

Digit 與 Kinetic 的設定分開保存在 `Config.tracking`；前者 Depth scale 預設 4，後者預設 2，其餘預設相同。兩者的相對 z 不視為相同的實際距離，適合分別校正。切換來源會清除舊碰撞球、樣本與預覽，停止舊模型和串流；若原本正在追蹤或初始化，會自動啟動新來源，原本關閉時則保持關閉。相機仍固定，兩種來源共用原有 camera feed 與最上層定位點。

取得攝影機影像後，左下角會顯示同一個 video 的即時預覽，不另開串流，保持原比例並同步 Mirror 設定。停止攝影機時預覽會移除。每顆手部碰撞球的實際中心另外畫一個 12 CSS pixels 的紅色小點，帶白環及深色外框；小點在 Color／Difference／Normal 與 contour 完成後才繪製，關閉 depth test，因此不會被物件遮住。它不參與交疊合成，也不需讀回 framebuffer。Save image 會包含定位點，但不含左下角的攝影機介面。

Digit 保留手部影像 landmarks 的相對 z，較小的值映射到較靠近相機的位置。[MediaPipe 手部模型的 z 以手腕為相對原點](https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker/web_js#handle_and_display_results)，不能當作手與攝影機之間的絕對距離；其 worldLandmarks 則以手的幾何中心為原點，因此沒有直接用它定位整隻手。

| 控制 | 預設 | 範圍 | 效果 |
| --- | --- | --- | --- |
| Position scale | 1 | 0.25–3 | 以畫面中心為基準放大／縮小 x、y 活動範圍 |
| Depth scale | Digit 4／Kinetic 2 | 0–20 | 相對 z 的倍率；0 表示固定深度 |
| Depth offset | 0 | −6–6 | 整體往前／後移動；正值靠近相機，總位移限制為 ±6 |
| Sphere radius | 0.75 | 0.15–2 | 場景單位的碰撞球半徑 |
| Mirror | 開啟 | 開／關 | 左右鏡像 |

### Kinetic 開發驗收（2026-10-10）

- 瀏覽器確認 Source 切換只顯示相對應 folder，Digit 的 Position scale 1.35／Mirror 關閉與 Kinetic 的 Position scale 1.8 可各自保留；驗收後已還原預設值。
- Kinetic library 可載入至等待攝影機階段，等待期間可切換至 Digit 並停止。尚未取得真實骨架偵測結果，實際投影場合的映射、可信度與效能仍待攝影機實測。
- 獨立程式審查未發現實質問題。骨架座標／可信度與來源切換的自動化測試及 production build 結果見上方 Kinetic 提交驗收。

碰撞球以 KINEMATIC body 的速度移動，將推力傳給其他剛體，不受向心力影響，也不會互相碰撞。追蹤消失或資料超過 250 ms 未更新時移除；暫停、重播、場景重建與隱藏分頁時清除。回到分頁後恢復偵測；Stop camera 或頁面清理會關閉串流與模型，初始化途中停止也會清理晚到的資源。

### 手部互動開發驗收（2026-10-10）

- 開發預覽編譯成功，Hands 控制與原有畫面正常顯示，瀏覽器沒有警告或錯誤。
- 暫停後拖曳與滾輪操作，操作前後畫布區域截圖完全相同，相機保持鎖定。
- 已確認啟動時顯示等待攝影機，初始化尚未完成時按 Stop camera 可回到關閉狀態。
- 手部追蹤與物理整合的獨立程式審查未發現實質問題。尚未取得真實手部追蹤結果；掌心位置、前後深度與推動手感仍待攝影機實測。自動化測試與 production build 結果見上方手部互動提交驗收。
- 預覽與定位點以暫時的模擬影像／碰撞球位置進行瀏覽器驗收：確認三種模式均能顯示定位點，Normal 中仍能蓋在球與柱身上，Mirror 同步翻轉預覽。程式審查指出衍生函式的 shader 版本相容性問題，已改用點直徑計算反鋸齒寬度；實際繪製時沒有 shader／WebGL 警告或錯誤。模擬資料已移除，實際 camera feed 仍待取得攝影機影像後確認。

## 交疊上色方式

每個物件先獨立畫入共用 RGBA8 mask，只有完整的投影輪廓參與累積。ID 0–15 以 `2 ** id` 加進 R 通道；ID 16–31 以 `2 ** (id - 16)` 加進 G 通道；ID 32–39 以 `2 ** (id - 32)` 加進 B 通道。各通道最多 65535，可精確存入既有 RGBA32F，無須增加 framebuffer。

累積貼圖的 alpha 從白色 1 開始，每經過一個物件輪廓，就做一次 `abs(previous - covered)`。它同時保留原本純黑白 difference 的結果，無須為 contour 再繪製一次幾何；Difference shading 只影響 RGB，不影響這個黑白來源。顯示 Difference 時另以不透明 alpha 輸出 RGB，避免把這份編碼當成透明度。

累積在 ping-pong shader 裡做加法，關閉固定管線 blending，不需要 `EXT_float_blend`；使用 `EXT_color_buffer_float` 建立可繪製的浮點貼圖。編碼使用 `NEAREST`／`texelFetch`，不混入光照與邊緣插值。最後一個 pass 還原 R／G 的 32-bit 組合編碼，再混入 B 的額外物件編碼，以固定整數 hash 選擇材質；所有通道都為 0 時使用背景格位。程式不讀回 framebuffer 到 CPU，也不在每幀掃描區域或重抽材質。

Color 與 Difference 共用兩張累積 FBO，切換時依需要重新配置 float／byte 格式；額外只有一張材質 atlas。沒有 float color-buffer 支援的裝置會使用 Difference，並顯示提示。

有限材質可能讓不同組合共用顏色或圖樣；同一組合形成的多個不相連區域也會使用相同材質。這版沒有做連通區域辨識或保證相鄰區域異色。

## 純色與圖樣材質

Atlas 是 2080×1040 的 RGBA8 貼圖，8×4 格，每格內容 256×256，四周各 2 pixels 的重複邊界。包含一格背景、7 或 16 格純色，以及七類圖樣生成的 15 個變化。純色與圖樣都經過同一條 texture 取樣路徑，不增加 framebuffer 或逐物件貼圖切換。

Color shader 以三通道 rod bitmask 判斷交疊組合是否包含細柱；只要包含 rod，就從純色格位取樣，即使 Pattern amount 為 1 也不使用圖樣。交疊區仍依物件組合選色，所以一根 rod 穿過不同物件時可以出現不同純色。

圖樣在第一次使用 Color 或更換色票時以 Canvas 2D 生成，之後重用。亂數以 fxhash 衍生獨立的 seeded stream，避免改變物理的初始配置；同一 seed 與色票會得到相同材質。背景與線條都取自所選色票，線條使用亮度差較大的顏色。24 節氣色票各有 16 色，紙底取最亮色與白色混合。

取樣座標以視窗左上角為原點，換算為 CSS pixels；移動相機或物件時，圖樣保持固定。每格獨立鏡像重複，配合邊界留白與線性過濾避免相鄰材質滲色；編碼貼圖仍維持精確取樣。Pattern amount 與 Pattern size 只更新 shader 參數，不重建 atlas 或物理場景。

## Contour

啟用時先把累積 alpha 輸出為獨立 RGBA8 黑白 difference texture，再比較中心與八方向位移取樣，取最大差值作為輪廓 alpha，畫入第二張透明底 texture。位移途中每隔不超過一個 framebuffer pixel 取樣，避免粗輪廓跨過細柱後產生分離線；邊緣以線性取樣處理小數像素，畫面邊界採 clamp，不從另一側捲回。

最後以 alpha blending 將深色輪廓疊在已完成的 Color／Difference 畫面。線寬以 CSS pixels 計算，預設 1.5 倍 canvas 解析度下維持相同視覺粗細。沒有 CPU framebuffer readback，也不分析色票或 pattern 的顏色。

新增兩張 FBO 隨 resize 釋放重建，總計五張 FBO；Contour 關閉與 Normal 模式會跳過輪廓的三個 fullscreen passes，但保留已配置的貼圖。Contour 依黑白 difference 的奇偶交疊結果找邊界，完全重合且互相抵消的輪廓不會顯示。

### Contour 驗收

- 初版瀏覽器確認開關、1.5／6 pixels 線寬、球／方塊／細柱與交疊輪廓，以及空場景不殘留輪廓；pattern 內部保持原樣。目前線寬範圍已縮為 0.5–2，預設 0.5。
- Difference shading 1 仍只有物件輪廓；暫停後切換 Difference／Normal／Color，再回到原設定，前後 Color 畫布截圖完全一致，無 shader／WebGL 警告或錯誤。
- 獨立程式審查指出並已修正粗輪廓跳過細柱的取樣問題。相關 JavaScript 語法與差異格式檢查通過；當時將自動化測試及 production build 留至提交階段，結果見上方本次提交驗收，尚未量測新增 passes 的 FPS 成本。

## 圖樣材質驗收

- 瀏覽器確認預設混合、Pattern amount 0 的純色與 1 的全圖樣，以及 Pattern size 160／80；操作立春、大寒與原有 Coral / sage 配色，均正常顯示。
- 暫停物理後切換色票及 Difference／Normal／Color，再回到原設定，畫布截圖比較完全相同；瀏覽器未出現 shader／WebGL 警告或錯誤。
- 16 個相關 JavaScript 檔案通過語法檢查，差異格式檢查通過；獨立程式審查未發現實質問題。
- 當時將自動化回歸測試與 production build 留至提交階段，結果見上方本次提交驗收；尚未量測 FPS 或逐一操作全部 27 組配色。

## 細長柱驗收

- 已在瀏覽器確認預設 4 根細長柱與球／方塊共同聚集，Color 與 Normal 都正常呈現柱身；三維初始朝向與尺寸由同一 seeded stream 產生。
- 已確認 Width 預設 0.05，Length 可調到 50；16 顆球＋16 個長方體＋8 根柱、Length 50 的預覽能生成，沒有 shader／WebGL 錯誤。當時使用自動取景；目前改為固定相機距離，允許長柱超出畫面。
- 生成用膠囊距離、Box collider／mesh 尺寸及第 33–40 個物件的 B 通道編碼已經獨立程式審查。自動化回歸案例與 production build 已於本次提交驗收執行；尚未對極細長柱進行高速碰撞或所有 seed 的驗證。

## 交疊上色驗收

- 開發預覽編譯成功；12／32 物件、空場景、單一旋轉長方體均正常顯示，瀏覽器沒有 shader／WebGL 警告或錯誤。
- 三種顯示模式、三組 palette、暫停／繼續及拖曳旋轉已操作。暫停後反覆切換 Difference／Color，前後 Color 截圖完全一致。
- 480×800／1200×800 與原始視窗切換後，framebuffer 維持 3、texture 維持 7（含 palette）。Canvas 1920×1080 對應 CSS 1280×720，維持 1.5 倍解析度。
- 獨立程式審查未發現阻擋問題；當時以瀏覽器驗收，自動化測試與 production build 的後續結果見上方本次提交驗收。尚未量測 FPS，也尚未建立指定交疊編碼的 GPU 回歸案例。

## 首次提交驗收（ae72c37）

- 開發預覽編譯成功；瀏覽器確認物件向中心聚集，以及 Normal／Difference／灰階明暗的差異。
- 已觀察三個 seed，並操作暫停／繼續、空場景、單一方塊、12／32 物件與 PNG 匯出。
- 暫停後連續重播 20 次，前後瀏覽器截圖完全一致。
- 480×800／1200×800 重複切換後，開發紀錄中的 framebuffer 維持 3、texture 維持 6；窄視窗的相機構圖已修正。
- 獨立程式審查未發現阻擋問題；已修正 fxpreview 早於第一幀繪製的時序。
- 提交前執行 `npm test`：19 項全部通過，涵蓋 seeded 配置、長方體三邊與 collider、有限重試、三種碰撞配對與碰撞旋轉、30／60／120 Hz、掉幀上限、重播、清理，以及三個 seed 各 60 秒的聚集模擬。
- `npm run build` 成功；已比對 ZIP 與 `dist/`，檔案清單及內容一致。

這輪的瀏覽器觀察不代表所有 seed 與裝置都已測過，也尚未量測 FPS 或建立指定前後重疊的 GPU 測試場景。Canvas 與離屏貼圖的寬高固定為視窗寬高的 1.5 倍，透過 CSS width／height 100% 填滿視窗，未加入額外抗鋸齒 pass。

`npm run build` 設定為輸出 `dist/` 與 `dist-zipped/project.zip`。完整設計及後續驗收項目見 [PLAN.md](./PLAN.md)。
