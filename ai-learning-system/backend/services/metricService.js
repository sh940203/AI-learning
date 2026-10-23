const SystemMetric = require('../models/SystemMetric');

/**
 * 以原子操作累加當日 SystemMetric 計數，避免多個請求同時 findOne + save
 * 造成 Mongoose 樂觀鎖 VersionError 而遺失計數。
 * @param {object} inc
 * @param {number} inc.apiCalls - 要累加的 API 呼叫次數
 * @param {number} inc.tokens - 要累加的 token 數
 * @param {number} inc.errors - 要累加的錯誤次數
 */
const incrementMetrics = async ({ apiCalls = 0, tokens = 0, errors = 0 } = {}) => {
  const today = new Date().toISOString().split('T')[0];
  const currentHour = new Date().getHours();

  // 先確保當日文件存在且 hourly 陣列已初始化為 24 格
  // （若直接以 upsert + $inc 'hourlyApiCalls.N' 建立新文件，Mongo 會建立物件而非陣列）
  try {
    await SystemMetric.updateOne(
      { date: today },
      {
        $setOnInsert: {
          apiCalls: 0,
          estimatedTokens: 0,
          errors: 0,
          hourlyApiCalls: Array(24).fill(0),
          hourlyTokens: Array(24).fill(0)
        }
      },
      { upsert: true }
    );
  } catch (err) {
    // 併發 upsert 撞到 date 唯一索引時代表文件已被其他請求建立，可忽略
    if (err.code !== 11000) throw err;
  }

  const roundedTokens = Math.round(tokens);
  const $inc = {};
  if (apiCalls) {
    $inc.apiCalls = apiCalls;
    $inc[`hourlyApiCalls.${currentHour}`] = apiCalls;
  }
  if (roundedTokens) {
    $inc.estimatedTokens = roundedTokens;
    $inc[`hourlyTokens.${currentHour}`] = roundedTokens;
  }
  if (errors) {
    $inc.errors = errors;
  }
  if (Object.keys($inc).length === 0) return;

  await SystemMetric.updateOne({ date: today }, { $inc });
};

/**
 * Log API usage and estimated tokens
 * @param {number} tokens - Estimated or actual token count used
 * @param {boolean} isError - True if the API call resulted in an error
 */
const logApiUsage = async (tokens = 0, isError = false) => {
  try {
    await incrementMetrics({ apiCalls: 1, tokens, errors: isError ? 1 : 0 });
  } catch (error) {
    console.error('Error logging API usage:', error);
  }
};

module.exports = {
  incrementMetrics,
  logApiUsage
};
