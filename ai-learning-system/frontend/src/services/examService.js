const API_BASE = '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const fetchPublishedExams = async (filters = {}) => {
  const { examCategory, search } = filters;
  const params = new URLSearchParams();
  
  if (examCategory && examCategory !== '全部') {
    // 將「學測」/「統測」映射回後端的 「GSAT」/「TVEJE」
    const mappedCategory = examCategory === '學測' ? 'GSAT' : examCategory === '統測' ? 'TVEJE' : examCategory;
    params.append('examCategory', mappedCategory);
  }
  
  if (search) {
    params.append('search', search);
  }

  const res = await fetch(`${API_BASE}/exams/published?${params.toString()}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || '無法獲取發布試卷');
  return data.data;
};

export const fetchDashboardStats = async () => {
  const res = await fetch(`${API_BASE}/progress/stats`, {
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || '無法獲取學習統計數據');
  return data.data;
};

export const fetchUserExamProgress = async () => {
  const res = await fetch(`${API_BASE}/progress/exams`, {
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || '無法獲取使用者練習進度');
  return data.data;
};

export const seedProgressMockData = async () => {
  const res = await fetch(`${API_BASE}/progress/seed`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || '產生測試進度數據失敗');
  return data;
};

export const updateExamProgress = async (examId, progressData) => {
  const res = await fetch(`${API_BASE}/progress/update`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ examId, ...progressData })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || '更新進度失敗');
  return data.data;
};

export const fetchExamById = async (examId) => {
  const res = await fetch(`${API_BASE}/exams/${examId}`, {
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || '無法獲取考卷資訊');
  return data.data;
};

// ── 錯題分析相關 API ──────────────────────────────────────────

export const fetchWrongQuestions = async ({ examId, subject } = {}) => {
  const params = new URLSearchParams();
  if (examId) params.append('examId', examId);
  if (subject) params.append('subject', subject);
  const res = await fetch(`${API_BASE}/analysis/wrong-questions?${params.toString()}`, {
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || '無法獲取錯題列表');
  return data.data;
};

export const fetchMasteryStats = async ({ examId, subject } = {}) => {
  const params = new URLSearchParams();
  if (examId) params.append('examId', examId);
  if (subject) params.append('subject', subject);
  const res = await fetch(`${API_BASE}/analysis/mastery?${params.toString()}`, {
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || '無法獲取掌握度統計');
  return data.data;
};

export const fetchAIExplain = async ({ questionId, studentSelected, correctOptions, questionHtml }) => {
  const res = await fetch(`${API_BASE}/analysis/ai-explain`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ questionId, studentSelected, correctOptions, questionHtml })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'AI 解析失敗');
  return data.data;
};

export const fetchQuizGenerate = async ({ tags = [], count = 10, excludeExamId } = {}) => {
  const res = await fetch(`${API_BASE}/quiz/generate`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ tags, count, excludeExamId })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || '生成測驗失敗');
  return data.data;
};

