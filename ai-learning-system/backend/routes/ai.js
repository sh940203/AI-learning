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

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

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

const auth = require('../middleware/authMiddleware');
const User = require('../models/User');

// AI Tutor Chat API with daily limits and knowledge base grounding
router.post('/tutor', auth, async (req, res) => {
  try {
    const { history, message, contextText } = req.body;
    
    // 1. Check daily limit
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: '找不到使用者' });
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastReset = user.aiUsage?.lastResetDate ? new Date(user.aiUsage.lastResetDate) : new Date(0);
    lastReset.setHours(0, 0, 0, 0);

    // Reset if it's a new day
    if (today > lastReset) {
      if (!user.aiUsage) user.aiUsage = {};
      user.aiUsage.count = 0;
      user.aiUsage.lastResetDate = new Date();
    }

    if (user.aiUsage.count >= 5) {
      return res.status(403).json({ 
        success: false, 
        message: '今日 AI 提問次數已達上限 (5/5)！請明天再來。' 
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        success: true,
        isMock: true,
        reply: "⚠️ GEMINI_API_KEY 未設定，此為 Mock 回應。請配置環境變數。",
        remainingCount: 5 - user.aiUsage.count
      });
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      systemInstruction: `你現在是一位專為「高職商科學生」設計的 AI 學習導師。你的回答必須符合高職生的理解能力，語氣要像是個有耐心的高中老師。
${contextText ? `\n【重要指令：知識庫限制】\n使用者上傳了以下文件內容，你**必須嚴格限制**只能根據這份內容回答問題。如果使用者的問題無法在這份內容中找到答案，請直接回答：「講義中未提及此內容」，絕對不可以自己編造或依賴外部知識回答。\n\n[文件內容開始]\n${contextText}\n[文件內容結束]` : ''}`
    });

    const formattedHistory = (history || []).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const chat = model.startChat({
      history: formattedHistory,
      generationConfig: {
        maxOutputTokens: 1000,
      },
    });

    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    // 扣除額度
    user.aiUsage.count += 1;
    await user.save();

    return res.json({
      success: true,
      isMock: false,
      reply: text,
      remainingCount: 5 - user.aiUsage.count
    });

  } catch (error) {
    console.error("❌ Gemini Tutor API Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
      reply: "抱歉，家教系統目前發生錯誤，請稍後再試。"
    });
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
