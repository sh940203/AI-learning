const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Setup Gemini API client if API key is provided
let genAI = null;
if (process.env.GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

router.post('/suggest', async (req, res) => {
  try {
    const { title, notes } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      console.log("⚠️ GEMINI_API_KEY is not defined in .env. Falling back to mockup content.");
      return res.json({
        success: true,
        isMock: true,
        guide: getMockSuggestions(title)
      });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const prompt = `
你是一位專業的學術指導導師。
使用者即將進行一個學習任務：
- 任務標題：${title}
- 任務備註：${notes || '無備註'}

請根據這個任務，為使用者提供 3 點精簡、實用、有深度的「考前重點複習大綱」或「學習步驟建議」。
要求：
1. 請提供正體中文。
2. 每一點開頭使用合適的表情符號（例如 🧠、🔍、💡）。
3. 每一點限 30 到 50 字以內。
4. 請直接回傳一個 JSON 陣列格式，例如：["🧠 建議一...", "🔍 建議二...", "💡 建議三..."]。不要包含任何 markdown 標記（如 \`\`\`json ）。
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    try {
      let cleanText = text.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.substring(7);
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.substring(3);
      }
      if (cleanText.endsWith('```')) {
        cleanText = cleanText.substring(0, cleanText.length - 3);
      }
      cleanText = cleanText.trim();
      
      const suggestionsArray = JSON.parse(cleanText);
      return res.json({ success: true, isMock: false, guide: suggestionsArray });
    } catch (parseError) {
      console.warn("⚠️ Failed to parse Gemini response as JSON. Returning split text instead.", parseError);
      const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0).slice(0, 3);
      return res.json({ success: true, isMock: false, guide: lines });
    }

  } catch (error) {
    console.error("❌ Gemini API Error:", error);
    return res.json({
      success: true,
      isMock: true,
      error: error.message,
      guide: getMockSuggestions(title)
    });
  }
});

const User = require('../models/User');
const KnowledgeBase = require('../models/KnowledgeBase');
const AIChatSession = require('../models/AIChatSession');
const UnansweredLog = require('../models/UnansweredLog');
const path = require('path');
const fs = require('fs');

// Helper function to read Base64 image and convert to Gemini format
const base64ToGenerativePart = (base64String) => {
  if (!base64String) return null;
  // Format: data:image/jpeg;base64,...
  const mimeType = base64String.split(';')[0].split(':')[1];
  const data = base64String.replace(/^data:image\/\w+;base64,/, '');
  return {
    inlineData: {
      data,
      mimeType
    },
  };
};

// GET /api/ai/sessions - Get all chat sessions for the current device
router.get('/sessions', async (req, res) => {
  try {
    const deviceId = req.header('X-Device-Id');
    if (!deviceId) return res.status(400).json({ success: false, message: 'Missing Device ID' });
    
    const sessions = await AIChatSession.find({ deviceId })
      .select('-messages')
      .sort({ updatedAt: -1 });
    res.json({ success: true, sessions });
  } catch (error) {
    console.error("❌ Fetch Sessions Error:", error);
    res.status(500).json({ success: false, message: '無法獲取對話紀錄' });
  }
});

// GET /api/ai/sessions/:id - Get a specific chat session
router.get('/sessions/:id', async (req, res) => {
  try {
    const deviceId = req.header('X-Device-Id');
    if (!deviceId) return res.status(400).json({ success: false, message: 'Missing Device ID' });
    
    const session = await AIChatSession.findOne({ _id: req.params.id, deviceId });
    if (!session) return res.status(404).json({ success: false, message: '找不到對話紀錄' });
    res.json({ success: true, session });
  } catch (error) {
    console.error("❌ Fetch Session Error:", error);
    res.status(500).json({ success: false, message: '無法獲取對話內容' });
  }
});

// AI Tutor Chat API (Multi-step Agent Workflow)
router.post('/tutor', async (req, res) => {
  try {
    const deviceId = req.header('X-Device-Id');
    if (!deviceId) return res.status(400).json({ success: false, message: 'Missing Device ID' });

    const { sessionId, history, message, imageUrl } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.json({ success: false, message: '伺服器未設定 GEMINI_API_KEY' });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    
    // 準備圖片 Part (imageUrl 現在是 Base64 string)
    const imagePart = imageUrl ? base64ToGenerativePart(imageUrl) : null;
    const initialInputParts = imagePart ? [message, imagePart] : [message];

    // --- Step 1: 意圖分析與關鍵字提取 (Agent Analysis) ---
    const extractPrompt = `
分析以下學生的問題（與附件圖片），判斷並回傳3個核心知識點關鍵字、所屬科目、所屬章節。
請嚴格以 JSON 格式回傳，格式範例：{"keywords": ["資產","負債","業主權益"], "subject": "會計學", "chapter": "會計方程式"}
若無法判斷，請盡量猜測。不要回傳 markdown 代碼塊，只回傳純 JSON 字串。
學生問題：${message}
    `;
    const extractResult = await model.generateContent([extractPrompt, ...(imagePart ? [imagePart] : [])]);
    let extractionText = extractResult.response.text().trim();
    if (extractionText.startsWith('```json')) extractionText = extractionText.replace(/```json|```/g, '').trim();
    if (extractionText.startsWith('```')) extractionText = extractionText.replace(/```/g, '').trim();

    let extractedInfo = { keywords: [], subject: '', chapter: '' };
    try {
      extractedInfo = JSON.parse(extractionText);
    } catch (e) {
      console.warn('Agent Step 1 擷取失敗，使用預設值', extractionText);
      extractedInfo = { keywords: [message.slice(0,5)], subject: '未分類', chapter: '' };
    }

    // --- Step 2: 系統檢索 (RAG Vector Search) ---
    let kbContext = '無相符的教材資料';
    if (genAI) {
      try {
        // 將學生的原問題轉為向量
        const embedModel = genAI.getGenerativeModel({ model: "gemini-embedding-2" });
        const embedResult = await embedModel.embedContent(message);
        const queryVector = embedResult.embedding.values;

        // 使用 MongoDB Atlas Vector Search 進行相似度比對
        const kbs = await KnowledgeBase.aggregate([
          {
            $vectorSearch: {
              index: "vector_index", // 注意：需在 Atlas 後台建立名為 vector_index 的 Search Index
              path: "embedding",
              queryVector: queryVector,
              numCandidates: 10,
              limit: 3
            }
          }
        ]);

        if (kbs.length > 0) {
          kbContext = kbs.map(k => `【科目】${k.subject} 【章節】${k.chapter}\n${k.content}`).join('\n\n---\n\n');
        }
      } catch (searchError) {
        console.error("❌ Vector Search 失敗 (確認是否已在 Atlas 建立 vector_index):", searchError);
        kbContext = '系統搜尋教材時發生錯誤，請通知管理員。';
      }
    }

    // --- Step 3: 最終推論與解答 (Final Output) ---
    const systemInstruction = `
你現在是一位專為「高職商科學生」設計的 AI 學習導師。你的回答語氣要像是個有耐心的高職老師。
【工作流與守門員機制規定】
你「嚴格且僅能」根據以下檢索到的「中央知識庫檢索結果」來回答學生的問題。請遵循以下步驟作答：
1. 【嚴格限制】如果你判斷學生的問題「完全無法」用以下的知識庫內容回答（也就是超出教材範圍），你必須直接拒絕回答，並回覆：『這似乎超出了目前的學科教材範圍喔！請確認是否傳錯範圍了。』。並且，當你拒絕回答時，請務必在回覆的最前面加上隱藏標籤：[OUT_OF_SCOPE]。絕對不可使用你自己的常識或捏造答案。
2. 分析意圖：如果可以回答，明確告訴學生這題考的是什麼知識點。
3. 逐步拆解：根據知識庫內容，一步步帶領學生解析問題。

【中央知識庫檢索結果】
${kbContext}
    `;

    const finalModel = genAI.getGenerativeModel({ 
      model: "gemini-flash-latest",
      systemInstruction
    });

    const formattedHistory = (history || []).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const chat = finalModel.startChat({
      history: formattedHistory,
      generationConfig: { maxOutputTokens: 1500 },
    });

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // 發送 agent 分析結果
    res.write(`data: ${JSON.stringify({ type: 'agentLog', agentLog: extractedInfo })}\n\n`);

    let fullResponseText = '';
    let isOutOfScope = false;
    const resultStream = await chat.sendMessageStream(initialInputParts);

    for await (const chunk of resultStream.stream) {
      let chunkText = chunk.text();
      if (chunkText.includes('[OUT_OF_SCOPE]')) {
        isOutOfScope = true;
        chunkText = chunkText.replace('[OUT_OF_SCOPE]', '');
      }
      fullResponseText += chunkText;
      if (chunkText) {
        res.write(`data: ${JSON.stringify({ type: 'chunk', text: chunkText })}\n\n`);
      }
    }

    // --- Save to Session ---
    let session;
    if (sessionId) {
      session = await AIChatSession.findOne({ _id: sessionId, deviceId });
    }
    
    if (session) {
      // Append messages
      session.messages.push({ role: 'user', content: message });
      session.messages.push({ role: 'model', content: fullResponseText });
      await session.save();
    } else {
      // Create new session
      const autoTitle = message.length > 15 ? message.substring(0, 15) + '...' : message;
      session = new AIChatSession({
        deviceId,
        title: autoTitle,
        imageUrl: imageUrl || '',
        messages: [
          { role: 'user', content: message },
          { role: 'model', content: fullResponseText }
        ]
      });
      await session.save();
    }

    // --- Check for Unanswered Log ---
    if (isOutOfScope) {
      try {
        await UnansweredLog.create({
          question: message,
          deviceId
        });
      } catch (logErr) {
        console.error("Failed to log unanswered question:", logErr);
      }
    }

    res.write(`data: ${JSON.stringify({ type: 'done', sessionId: session._id })}\n\n`);
    return res.end();

  } catch (error) {
    console.error("❌ Agent Workflow Error:", error);
    // 如果 Header 已經送出，則使用 res.write 發送錯誤
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ type: 'error', reply: "抱歉，Agent 工作流目前發生錯誤，請稍後再試。" })}\n\n`);
      return res.end();
    } else {
      return res.status(500).json({
        success: false,
        error: error.message,
        reply: "抱歉，Agent 工作流目前發生錯誤，請稍後再試。"
      });
    }
  }
});


// Helper for offline mockups
function getMockSuggestions(title) {
  if (title.includes('計算機概論')) {
    return [
      "🔍 本次專案考核重點為資料結構演算法之「時間與空間複雜度分析」。",
      "📂 請確保您的 PDF 報告中附帶了 Big-O 的理論推導與執行時間圖表對照。",
      "💡 檢查程式碼：記憶體配置與洩漏（Memory Leak）檢驗，變數命名是否符合規範。"
    ];
  } else if (title.includes('深度學習')) {
    return [
      "🧠 核心觀念提示：深入理解 CNN 卷積層（特徵提取）與池化層（降維）的運作機制。",
      "⚖️ 常見考點：梯度消失（Vanishing Gradient）的解決方案，諸如引入 ReLU 激活函數與殘差連接。",
      "📝 自我評測：試著在紙上不看書推導一次 Backpropagation 反向傳播鏈鎖法則。"
    ];
  } else if (title.includes('資料結構') || title.includes('演算法')) {
    return [
      "🌲 重點複習：紅黑樹（Red-Black Tree）的五大核心性質（紅色節點其子必為黑、根為黑、任一路徑黑高度相同等）。",
      "🔄 必考實作：熟練掌握 LL、RR、LR、RL 四大旋轉操作（Rotation）。",
      "⚖️ 對比分析：紅黑樹相較於 AVL 樹，在頻繁插入與刪除場景下的效能優勢（旋轉次數更少）。"
    ];
  } else {
    return [
      "💡 AI 小建議：將複雜的任務切割成 20 分鐘的番茄鐘區間進行高專注力研讀。",
      "🤖 AI 重點複習：利用『費曼學習法』嘗試在心中對自己解釋一次這個主題，可以迅速揪出觀念盲區。",
      "🧪 實戰大師：自己設計一至兩個範例，動手實作寫出來，遠比光讀書吸收快 3 倍！"
    ];
  }
}

module.exports = router;
