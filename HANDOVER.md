# 專案交接文檔 (Handover Documentation)

> **建立時間**：2026-10-15  
> **交接對象**：Claude Code / 後續接手 AI 助理  
> **專案名稱**：AI 智慧輔助學習系統 (AI-Learning-System)  
> **專案路徑**：`/Users/sh/Desktop/AI learning`  
> **Git Repository**：`https://github.com/sh940203/AI-learning.git`（分支：`main`）

---

## ⚠️ 給接手 AI（Claude Code）的最高優先級指示

> [!IMPORTANT]
> **請在進行任何程式碼修改前，務必先閱讀以下規範與目錄架構，嚴禁推倒重構或擅自更改設計風格！**
> 1. 本系統前端使用 **React (Vite) + CSS Modules + Lucide-React**，整體風格為現代 Notion / 線性感設計（乾淨、簡潔、高對比度卡片）。
> 2. 後端使用 **Node.js (Express) + MongoDB Atlas (Mongoose)**，搭配 **Google Gemini API (`@google/generative-ai`)**。
> 3. 本機運作埠號：前端 `http://localhost:5173`，後端 `http://127.0.0.1:5001`（Vite 已設定 `/api` proxy 轉發至 5001）。
> 4. 請維護程式碼註解、既有架構的一致性，勿更換套件庫或引入非必要的大型相依項。

---

## 一、專案核心架構與目錄指南

```
/Users/sh/Desktop/AI learning/
├── 題庫資料庫/                      # 離線題庫主幹 (共 2,649 題、4 本教材、146 張附圖)
│   ├── images/                     # 考題附圖資源
│   └── *.json                      # 統測/學測等題庫原始資料
├── ai-learning-system/
│   ├── backend/
│   │   ├── constants/              # 分類與常數定義
│   │   ├── middleware/             # authMiddleware.js (JWT 鑑權)
│   │   ├── models/                 # Mongoose Schema
│   │   │   ├── Exam.js             # 考卷模型 (含 isGenerated 標籤)
│   │   │   ├── Question.js         # 題目主體模型 (HTML, options, explanation)
│   │   │   ├── UserExamProgress.js # 作答紀錄、完成率、分數
│   │   │   ├── AIChatSession.js    # AI 對話歷程
│   │   │   └── ...
│   │   ├── routes/
│   │   │   ├── ai.js               # AI 導師對話、標題自動摘要
│   │   │   ├── analysis.js         # 錯題分析 GET /wrong-questions、GET /mastery、POST /ai-explain
│   │   │   ├── quiz.js             # 錯題生成 POST /generate、POST /generate-dynamic
│   │   │   ├── exams.js            # 考卷列表 GET /published、GET /:id
│   │   │   └── qbFiles.js          # 離線題庫資料庫檔案管理員 API
│   │   ├── services/
│   │   │   └── qbFileService.js    # 題庫資料庫快速抽取與解析服務 (2649題母題庫)
│   │   ├── .env                    # 環境變數 (PORT=5001, MONGODB_URI, JWT_SECRET, GEMINI_API_KEY)
│   │   └── server.js               # 伺服器入口點 (Express)
│   └── frontend/
│       ├── src/
│       │   ├── components/
│       │   │   ├── ExamRenderCore.jsx       # 核心答題渲染引擎 (支援 LaTeX, 題組分割, 滾動流)
│       │   │   └── ExamRenderCore.module.css
│       │   ├── pages/
│       │   │   ├── AILearning.jsx           # AI 自主學習導師聊天室
│       │   │   ├── Tests.jsx                # 考試中心 (歷屆試卷大廳、分卷清單)
│       │   │   ├── TakeExam.jsx             # 實際考試作答頁面
│       │   │   └── ErrorAnalysis.jsx        # 錯題分析報告 & 確保觀念生成題
│       │   ├── services/
│       │   │   └── examService.js           # 前端 API 串接服務
│       │   └── styles/
│       │       └── variables.css            # 全域色彩與主題變數
│       └── vite.config.js                   # Vite 配置與 proxy 設定
```

---

## 二、目前進度與近期修改歷史 (截至 2026-10-15)

1. **AI 學習導師歷史對話標題優化** (`routes/ai.js`, `AILearning.jsx`, `AILearning.module.css`):
   - 放寬標題截斷限制至 50 字並濾除上傳附件標籤。
   - 解決側邊欄編輯/刪除按鈕與雙行文字重疊破圖問題 (`padding-right: 56px`)。
2. **答題頁面 UX 體驗升級** (`ExamRenderCore.jsx`, `ExamRenderCore.module.css`):
   - 在單選/多選/是非題滾動清單底部，新增「第一部分完成！✓ → 第二部分前往作答」導航引導橫幅。
   - 左側題號面板加入「第一部分」「第二部分」分類標籤，題組題按鈕改以藍色邊框凸顯。
3. **題庫讀取與連線修復**:
   - 確保 Vite Proxy 能正確連線至 `127.0.0.1:5001` 後端，已發布考卷 13 筆讀取正常。

---

## 三、待辦清單 (Critical Checklist)

### ✅ 待辦 1：右上角「AI 錯題分析」按鈕無動作問題（已完成，commit `352354f`）
- **完成狀態**：點擊後滾動至目前選中的錯題卡並召喚 AI 解析，已解析過則直接展開結果；無錯題或解析中時按鈕停用。
- **位置**：[ErrorAnalysis.jsx](file:///Users/sh/Desktop/AI%20learning/ai-learning-system/frontend/src/pages/ErrorAnalysis.jsx#L298-L300)
- **現況**：`<button className={styles.primaryBtn}><BarChart2 size={16} /> AI 錯題分析</button>` 目前**沒有綁定 `onClick` 事件**，只是一個純裝飾按鈕。
- **接手任務**：
  - 定義點擊動作：可滾動聚焦至下方錯題卡片、或一鍵批次觸發畫面上所有錯題的 AI 深度解析、或切換檢視維度。

### ✅ 待辦 2：「AI 觀念導正」解析 JSON 報錯（已完成，commit `5b6ea8a`）
- **完成狀態**：`maxOutputTokens` 調至 1024；新增 `parseAIExplainJson` 容錯解析（完整解析 → 逐欄 regex 抽取 → 預設文案補齊）。
- **位置**：[analysis.js](file:///Users/sh/Desktop/AI%20learning/ai-learning-system/backend/routes/analysis.js#L235-L255) 的 `POST /api/analysis/ai-explain`
- **現況報錯**：`Unterminated string in JSON at position 34 (line 2 column 33)`。
- **原因**：Gemini 生成長字串時若受限於 `maxOutputTokens: 512` 或包含未轉義字元，導致 JSON 截斷，`JSON.parse()` 崩潰並拋出錯誤。
- **接手任務**：
  1. 將 `maxOutputTokens` 調高至 `1024` 或 `2048`。
  2. 加入更強固的 JSON 解析與容錯機制（如 regex 提取各欄位，或在 parse 失敗時使用容錯抽取 fallback）。

### ✅ 待辦 3：「確保觀念生成題」功能驗證與登入狀態整合（已完成，commit `0244864`）
- **完成狀態**：修正題目同步至 MongoDB 失敗的根因（difficulty 型別錯誤、`Question` 新增 `originalQbId` 避免重複建題、題型對應與空白選項）。未登入狀態下 10/30/50 題皆可生成並開卷（API 層已驗證）。
- **尚待確認**：重啟後端後，登入狀態下在瀏覽器實際走一次「生成 → 開始強化練習」與「AI 錯題分析」按鈕。
- **位置**：[quiz.js](file:///Users/sh/Desktop/AI%20learning/ai-learning-system/backend/routes/quiz.js) (`POST /api/quiz/generate`) 與 [ErrorAnalysis.jsx](file:///Users/sh/Desktop/AI%20learning/ai-learning-system/frontend/src/pages/ErrorAnalysis.jsx)
- **現況**：已將硬性 auth 改為 `optionalAuth`，並修復了深色灰底的視覺樣式 bug（目前處於未 commit 狀態）。
- **接手任務**：
  - 測試從「確保觀念生成題」點擊 10/30/50 題後，產生的微測驗是否能正常導向至 `/tests/take/:examId` 並進行作答。
  - 將已驗證的程式碼進行 commit。

### 🟢 待辦 4：11/12 二口報告準備事項（參見會議記錄）
- 詳見 `meeting_minutes_1013.md`：
  1. 一口評審意見逐條對照與改善成果。
  2. UIUX 改版前後對比（截圖保留）。
  3. AI 篇幅加強（包含 AI 導師、AI 錯題三維度解析、AI 觀念精準派題）。
  4. 11/12 二口到 12/17 正式展示的未來展望。

---

## 四、本地開發環境重啟指令

```bash
# 後端啟動 (Port 5001)
cd "ai-learning-system/backend"
npm start

# 前端啟動 (Port 5173)
cd "ai-learning-system/frontend"
npm run dev
```
