const fs = require('fs');
const path = require('path');
const MDBReader = require('mdb-reader').default || require('mdb-reader');

// 定位「題庫資料庫」資料夾 (AI-learning/題庫資料庫)
const QB_DIR = path.resolve(__dirname, '../../../題庫資料庫');

class QBFileService {
  constructor() {
    this.textbooks = [
      '數位科技應用(上)',
      '數位科技應用(下)',
      '數位科技概論(上)',
      '數位科技概論(下)'
    ];
    this.isInitialized = false;
    this.isLoading = false;
    this.initError = null;
    this.lastLoadedAt = null;

    // 快取結構
    this.questions = []; // 全部題目
    this.questionsById = new Map();
    this.hierarchy = []; // 教材 -> 章 -> 節 結構
    this.stats = {
      totalQuestions: 0,
      totalTextbooks: 4,
      totalChapters: 0,
      totalSections: 0,
      totalImages: 0,
      byTextbook: {},
      byDifficulty: { 1: 0, 2: 0, 3: 0 },
      byType: {}
    };
  }

  // 清洗 Word 導出的 HTML 並重寫圖片 URL
  cleanWordHtml(html, textbook) {
    if (!html) return '';
    let str = String(html);

    // 移除 Word VML 與 MSO 條件註釋 (留純標準標籤)
    str = str.replace(/<!--\[if gte vml 1\]>[\s\S]*?<!\[endif\]-->/gi, '');
    str = str.replace(/<!--\[if gte mso 9\]>[\s\S]*?<!\[endif\]-->/gi, '');
    str = str.replace(/<!\[if !vml\]>/gi, '');
    str = str.replace(/<!\[if !supportLineBreakNewLine\]>/gi, '');
    str = str.replace(/<!\[endif\]>/gi, '');
    str = str.replace(/<o:p>[\s\S]*?<\/o:p>/gi, '');

    // 重寫圖片 src
    str = str.replace(/src=["']([^"']+\.(?:jpg|jpeg|png|gif|bmp|emz|wmz))["']/gi, (match, p1) => {
      let finalPath = p1;
      // 若原始圖片為 .emz 或 .wmz，檢查是否有同目錄的 .png
      if (finalPath.endsWith('.emz') || finalPath.endsWith('.wmz')) {
        const pngPath = finalPath.replace(/\.(?:emz|wmz)$/i, '.png');
        const fullPng = path.join(QB_DIR, textbook, 'data', pngPath);
        if (fs.existsSync(fullPng)) {
          finalPath = pngPath;
        }
      }
      return `src="/api/qb-files/media/${encodeURIComponent(textbook)}/data/${finalPath}"`;
    });

    // 清理 word 特定 class 與無用空樣式
    str = str.replace(/style=['"]layout-grid-mode:char;mso-layout-grid-align:none['"]/gi, '');
    str = str.replace(/style=['"]\s*['"]/gi, '');

    return str.trim();
  }

  // 取得純文字內容 (去除 HTML 標籤)
  stripHtml(html) {
    if (!html) return '';
    return String(html)
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // 答案數字轉字母 (1->A, 2->B, 3->C, 4->D)
  formatAnswerLetter(ans) {
    if (ans === null || ans === undefined) return '';
    // 若包含 HTML 標籤（Word 導出的 .mdb 常見），先去除標籤再取字母
    let cleaned = String(ans);
    if (cleaned.includes('<')) {
      cleaned = cleaned.replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/gi, ' ');
    }
    cleaned = cleaned.trim();
    if (cleaned === '1' || cleaned === 1) return 'A';
    if (cleaned === '2' || cleaned === 2) return 'B';
    if (cleaned === '3' || cleaned === 3) return 'C';
    if (cleaned === '4' || cleaned === 4) return 'D';
    // 取第一個大寫英文字母
    const match = cleaned.match(/[ABCD]/i);
    if (match) return match[0].toUpperCase();
    // 數字型
    if (ans === 1) return 'A';
    if (ans === 2) return 'B';
    if (ans === 3) return 'C';
    if (ans === 4) return 'D';
    return cleaned;
  }

  // 難度文字
  formatDifficulty(level) {
    const l = Number(level);
    if (l === 1) return { code: 1, label: '基礎' };
    if (l === 2) return { code: 2, label: '中等' };
    if (l === 3) return { code: 3, label: '進階' };
    return { code: l || 1, label: '一般' };
  }

  // 題型文字
  formatQuestionType(type) {
    const t = Number(type);
    if (t === 2) return { code: 2, label: '單選題' };
    if (t === 1) return { code: 1, label: '是非題' };
    if (t === 3) return { code: 3, label: '多選題' };
    if (t === 4) return { code: 4, label: '問答題' };
    return { code: t || 2, label: '單選題' };
  }

  // 初始化與載入題庫
  async init() {
    if (this.isLoading) return;
    this.isLoading = true;
    this.initError = null;

    console.log(`[QBFileService] 正在載入題庫資料庫目錄: ${QB_DIR}...`);

    if (!fs.existsSync(QB_DIR)) {
      this.initError = `找不到題庫資料庫資料夾: ${QB_DIR}`;
      console.error(`[QBFileService] ❌ ${this.initError}`);
      this.isLoading = false;
      return;
    }

    try {
      const allQuestions = [];
      const questionsById = new Map();
      const hierarchy = [];
      const stats = {
        totalQuestions: 0,
        totalTextbooks: this.textbooks.length,
        totalChapters: 0,
        totalSections: 0,
        totalImages: 0,
        byTextbook: {},
        byDifficulty: { 1: 0, 2: 0, 3: 0 },
        byType: { '單選題': 0, '多選題': 0, '是非題': 0 }
      };

      for (const textbook of this.textbooks) {
        const tbDir = path.join(QB_DIR, textbook);
        const mdbPath = path.join(tbDir, 'data.mdb');

        if (!fs.existsSync(mdbPath)) {
          console.warn(`[QBFileService] ⚠️ 找不到 ${mdbPath}`);
          continue;
        }

        const textbookStats = {
          textbook,
          totalQuestions: 0,
          chaptersCount: 0,
          sectionsCount: 0,
          imagesCount: 0
        };

        const tbHierarchy = {
          textbook,
          chapters: []
        };

        const buffer = fs.readFileSync(mdbPath);
        const reader = new MDBReader(buffer);
        const tableNames = reader.getTableNames();

        // 1. 整理章節資訊 (例如 DA101_chap, DA101E_chap, DA101F_chap)
        // 章節 map: key = `${bookPrefix}_${章}_${節}` -> { chapterName, sectionName }
        const chapterMap = new Map();
        const chapTables = tableNames.filter(t => t.endsWith('_chap'));

        for (const ct of chapTables) {
          const prefix = ct.replace('_chap', '');
          try {
            const chapData = reader.getTable(ct).getData();
            for (const cRow of chapData) {
              const chapNum = Number(cRow['章']);
              const secNum = Number(cRow['節']);
              const chapName = String(cRow['章名'] || '').trim();
              const secName = String(cRow['節名'] || '').trim();

              const key = `${prefix}_${chapNum}_${secNum}`;
              chapterMap.set(key, { chapNum, secNum, chapName, secName });

              // 加入層級結構
              let chNode = tbHierarchy.chapters.find(c => c.chapNum === chapNum);
              if (!chNode) {
                chNode = { chapNum, chapName, sections: [], questionCount: 0 };
                tbHierarchy.chapters.push(chNode);
              }
              if (!chNode.sections.find(s => s.secNum === secNum)) {
                chNode.sections.push({ secNum, secName, questionCount: 0 });
              }
            }
          } catch (e) {
            console.error(`[QBFileService] 讀取章節表 ${ct} 失敗:`, e.message);
          }
        }

        // 2. 整理內容表 (例如 DA101_1_content, DA101_2_content...)
        // 對應索引表 (例如 DA101_1, DA101_2...)
        const contentTables = tableNames.filter(t => t.endsWith('_content'));

        for (const ct of contentTables) {
          const baseTable = ct.replace('_content', ''); // e.g. DA101_1
          const match = baseTable.match(/^([A-Za-z0-9]+)_(\d+)$/);
          const bookPrefix = match ? match[1] : baseTable;
          const partNum = match ? Number(match[2]) : 1;

          try {
            const contentTableData = reader.getTable(ct).getData();
            let indexTableData = [];
            if (tableNames.includes(baseTable)) {
              try {
                indexTableData = reader.getTable(baseTable).getData();
              } catch (idxErr) {
                console.warn(`[QBFileService] 讀取索引表 ${baseTable} 失敗:`, idxErr.message);
              }
            }

            // 建立索引 map (以 參照行號 為 key)
            const indexMap = new Map();
            for (const idxRow of indexTableData) {
              indexMap.set(Number(idxRow['參照行號']), idxRow);
            }

            for (const cRow of contentTableData) {
              const refLine = Number(cRow['參照行號']);
              const idxInfo = indexMap.get(refLine) || {};

              const chapNum = Number(idxInfo['章'] || 1);
              const secNum = Number(idxInfo['節'] || 1);
              const qNum = Number(idxInfo['題號'] || refLine);
              const pageNum = Number(idxInfo['頁碼'] || 0);

              // 查找章名與節名
              const chapInfo = chapterMap.get(`${bookPrefix}_${chapNum}_${secNum}`) ||
                               chapterMap.get(`${bookPrefix}_chap_${chapNum}_${secNum}`) ||
                               { chapName: `第 ${chapNum} 章`, secName: `第 ${secNum} 節` };

              const qId = `qb_${textbook}_${baseTable}_${refLine}`;
              const rawHtml = String(cRow['題目'] || '');
              const cleanedHtml = this.cleanWordHtml(rawHtml, textbook);
              const plainText = this.stripHtml(cleanedHtml);

              // 檢查是否有附圖
              const hasImage = cleanedHtml.includes('<img');
              const imageMatches = cleanedHtml.match(/src="([^"]+)"/g) || [];
              const imagePaths = imageMatches.map(m => m.replace(/^src="/, '').replace(/"$/, ''));

              if (hasImage) {
                stats.totalImages += imagePaths.length;
                textbookStats.imagesCount += imagePaths.length;
              }

              // 選項處理
              const optRaw = [
                { id: 'A', raw: cRow['選項1'] },
                { id: 'B', raw: cRow['選項2'] },
                { id: 'C', raw: cRow['選項3'] },
                { id: 'D', raw: cRow['選項4'] }
              ];

              const correctLetter = this.formatAnswerLetter(cRow['答案'] || idxInfo['答案']);

              const options = optRaw.map(opt => {
                const optCleanHtml = this.cleanWordHtml(opt.raw, textbook);
                const optText = this.stripHtml(optCleanHtml);
                return {
                  id: opt.id,
                  html: optCleanHtml,
                  text: optText,
                  isCorrect: opt.id === correctLetter
                };
              });

              // 詳解與出處
              const explHtml = this.cleanWordHtml(cRow['解析'] || '', textbook);
              const explText = this.stripHtml(explHtml);
              const origin = this.stripHtml(cRow['出處'] || '');

              const diff = this.formatDifficulty(idxInfo['困難度'] || 2);
              const qType = this.formatQuestionType(idxInfo['題型'] || 2);

              const qObj = {
                id: qId,
                textbook,
                bookPrefix,
                partNum,
                tableCode: baseTable,
                refLine,
                chapter: chapNum,
                section: secNum,
                chapterName: chapInfo.chapName,
                sectionName: chapInfo.secName,
                questionNumber: qNum,
                page: pageNum,
                difficulty: diff.code,
                difficultyLabel: diff.label,
                type: qType.code,
                typeLabel: qType.label,
                questionHtml: cleanedHtml,
                questionText: plainText,
                options,
                answer: correctLetter,
                explanationHtml: explHtml,
                explanationText: explText,
                origin,
                hasImage,
                imagePaths
              };

              allQuestions.push(qObj);
              questionsById.set(qId, qObj);
              textbookStats.totalQuestions += 1;

              // 更新統計
              stats.byDifficulty[diff.code] = (stats.byDifficulty[diff.code] || 0) + 1;
              stats.byType[qType.label] = (stats.byType[qType.label] || 0) + 1;

              // 更新階層計數
              const chNode = tbHierarchy.chapters.find(c => c.chapNum === chapNum);
              if (chNode) {
                chNode.questionCount = (chNode.questionCount || 0) + 1;
                const secNode = chNode.sections.find(s => s.secNum === secNum);
                if (secNode) {
                  secNode.questionCount = (secNode.questionCount || 0) + 1;
                }
              }
            }
          } catch (contentErr) {
            console.error(`[QBFileService] 讀取內容表 ${ct} 失敗:`, contentErr.message);
          }
        }

        textbookStats.chaptersCount = tbHierarchy.chapters.length;
        textbookStats.sectionsCount = tbHierarchy.chapters.reduce((acc, c) => acc + c.sections.length, 0);
        stats.byTextbook[textbook] = textbookStats;
        stats.totalChapters += tbHierarchy.chapters.length;
        tbHierarchy.chapters.forEach(c => {
          stats.totalSections += c.sections.length;
        });
        hierarchy.push(tbHierarchy);
      }

      stats.totalQuestions = allQuestions.length;

      this.questions = allQuestions;
      this.questionsById = questionsById;
      this.hierarchy = hierarchy;
      this.stats = stats;
      this.isInitialized = true;
      this.lastLoadedAt = new Date().toISOString();

      console.log(`[QBFileService] ✅ 成功載入題庫資料庫！總題目數: ${stats.totalQuestions} 筆，附圖數: ${stats.totalImages} 張`);
    } catch (err) {
      this.initError = err.message;
      console.error('[QBFileService] ❌ 題庫初始化發生錯誤:', err);
    } finally {
      this.isLoading = false;
    }
  }

  // 取得統計概覽
  getSummary() {
    return {
      isInitialized: this.isInitialized,
      isLoading: this.isLoading,
      initError: this.initError,
      lastLoadedAt: this.lastLoadedAt,
      stats: this.stats
    };
  }

  // 取得章節目錄階層
  getHierarchy(textbook) {
    if (textbook) {
      return this.hierarchy.find(h => h.textbook === textbook) || null;
    }
    return this.hierarchy;
  }

  // 搜尋與篩選題目 (支援分頁)
  searchQuestions({
    textbook,
    chapter,
    section,
    difficulty,
    type,
    hasImage,
    keyword,
    page = 1,
    limit = 20
  }) {
    let result = this.questions;

    if (textbook) {
      result = result.filter(q => q.textbook === textbook);
    }
    if (chapter !== undefined && chapter !== '' && chapter !== null) {
      const c = Number(chapter);
      result = result.filter(q => q.chapter === c);
    }
    if (section !== undefined && section !== '' && section !== null) {
      const s = Number(section);
      result = result.filter(q => q.section === s);
    }
    if (difficulty) {
      const d = Number(difficulty);
      result = result.filter(q => q.difficulty === d);
    }
    if (type) {
      result = result.filter(q => q.typeLabel === type || q.type === Number(type));
    }
    if (hasImage === true || hasImage === 'true') {
      result = result.filter(q => q.hasImage);
    }
    if (keyword && String(keyword).trim()) {
      const kw = String(keyword).trim().toLowerCase();
      result = result.filter(q =>
        q.questionText.toLowerCase().includes(kw) ||
        q.chapterName.toLowerCase().includes(kw) ||
        q.sectionName.toLowerCase().includes(kw) ||
        q.explanationText.toLowerCase().includes(kw) ||
        q.options.some(o => o.text.toLowerCase().includes(kw))
      );
    }

    const total = result.length;
    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (p - 1) * l;
    const items = result.slice(offset, offset + l);

    return {
      total,
      page: p,
      limit: l,
      totalPages: Math.ceil(total / l),
      data: items
    };
  }

  // 根據 ID 查詢題目
  getQuestionById(id) {
    return this.questionsById.get(id) || null;
  }

  // 選項是否有內容 (純圖片選項也算)
  hasOptionContent(opt) {
    if (opt.text && opt.text.trim()) return true;
    return Boolean(opt.html && /<img/i.test(opt.html));
  }

  // 能否當成選擇題作答：至少 2 個有內容的選項，且正確答案對應到其中一個
  // 題庫中的問答題 (題型 4) 與部分填充題 (題型 3，答案為「詞 | 詞」) 沒有選項，不能派給學生作答
  isAnswerable(q) {
    const filled = (q.options || []).filter(o => this.hasOptionContent(o));
    return filled.length >= 2 && filled.some(o => o.isCorrect);
  }

  // 依照標籤/弱點概念 撈取母題 (用於「確保觀念生成題」)，只從可作答的選擇題中抽
  getQuestionsByTagsOrConcept(tags = [], count = 5) {
    const pool = this.questions.filter(q => this.isAnswerable(q));

    if (!tags || tags.length === 0) {
      // 隨機抽選
      const shuffled = [...pool].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count);
    }

    const normalizedTags = tags.map(t => String(t).trim().toLowerCase()).filter(Boolean);

    // 計算關聯權重分數
    const scored = pool.map(q => {
      let score = 0;
      const fullStr = `${q.textbook} ${q.chapterName} ${q.sectionName} ${q.questionText} ${q.explanationText}`.toLowerCase();
      
      for (const tag of normalizedTags) {
        if (q.chapterName.toLowerCase().includes(tag)) score += 10;
        if (q.sectionName.toLowerCase().includes(tag)) score += 8;
        if (q.textbook.toLowerCase().includes(tag)) score += 5;
        if (q.questionText.toLowerCase().includes(tag)) score += 3;
        if (q.explanationText.toLowerCase().includes(tag)) score += 2;
      }
      return { question: q, score };
    });

    const matches = scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score);

    if (matches.length >= count) {
      return matches.slice(0, count).map(m => m.question);
    }

    if (matches.length > 0) {
      // 補足數量
      const matchedIds = new Set(matches.map(m => m.question.id));
      const remaining = pool.filter(q => !matchedIds.has(q.id));
      const shuffled = remaining.sort(() => 0.5 - Math.random());
      const filled = [...matches.map(m => m.question), ...shuffled.slice(0, count - matches.length)];
      return filled;
    }

    // 若完全無匹配，回傳隨機
    return [...pool].sort(() => 0.5 - Math.random()).slice(0, count);
  }

  // 依學生問題在題庫中檢索上下文 (用於「AI自主學習中心」)
  getQuestionsForAIContext(userQuery, limit = 3) {
    if (!userQuery || !this.questions.length) return [];
    const query = String(userQuery).toLowerCase();
    
    // 1. 提取英數單字
    const engWords = (query.match(/[a-z0-9]{2,}/g) || []);
    
    // 2. 提取連續中文，並產生 2-gram 與 3-gram
    const stopWords = new Set(['哪些', '什麼', '可以', '下列', '何者', '如何', '請問', '假設', '一個', '這個', '那個', '不是', '就是', '以及']);
    const chineseBlocks = (query.match(/[\u4e00-\u9fa5]+/g) || []);
    const cjkTokens = [];
    
    for (const block of chineseBlocks) {
      if (block.length <= 4 && !stopWords.has(block)) {
        cjkTokens.push(block);
      }
      for (let i = 0; i < block.length - 1; i++) {
        const bi = block.substr(i, 2);
        if (!stopWords.has(bi)) cjkTokens.push(bi);
        if (i < block.length - 2) {
          const tri = block.substr(i, 3);
          if (!stopWords.has(tri)) cjkTokens.push(tri);
        }
      }
    }

    const allTokens = [...new Set([...engWords, ...cjkTokens])];
    if (allTokens.length === 0) return [];

    const scored = this.questions.map(q => {
      let score = 0;
      const combined = `${q.chapterName} ${q.sectionName} ${q.questionText} ${q.explanationText}`.toLowerCase();
      
      for (const token of allTokens) {
        if (q.chapterName.toLowerCase().includes(token)) score += 8;
        if (q.sectionName.toLowerCase().includes(token)) score += 6;
        if (q.questionText.toLowerCase().includes(token)) score += token.length >= 3 ? 5 : 3;
        if (q.explanationText.toLowerCase().includes(token)) score += 2;
      }
      return { question: q, score };
    });

    return scored
      .filter(s => s.score >= 5)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.question);
  }

  getQbDir() {
    return QB_DIR;
  }
}

// 單例模式導出
const qbFileService = new QBFileService();
module.exports = qbFileService;
