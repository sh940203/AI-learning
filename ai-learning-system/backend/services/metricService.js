const SystemMetric = require('../models/SystemMetric');

/**
 * Log API usage and estimated tokens
 * @param {number} tokens - Estimated or actual token count used
 * @param {boolean} isError - True if the API call resulted in an error
 */
const logApiUsage = async (tokens = 0, isError = false) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const currentHour = new Date().getHours();

    let metric = await SystemMetric.findOne({ date: today });
    if (!metric) {
      metric = new SystemMetric({ date: today });
    }

    metric.apiCalls += 1;
    metric.estimatedTokens += Math.round(tokens);
    
    if (isError) {
      metric.errors += 1;
    }

    // Ensure array length
    if (!metric.hourlyApiCalls || metric.hourlyApiCalls.length !== 24) {
      metric.hourlyApiCalls = Array(24).fill(0);
    }
    if (!metric.hourlyTokens || metric.hourlyTokens.length !== 24) {
      metric.hourlyTokens = Array(24).fill(0);
    }

    metric.hourlyApiCalls[currentHour] += 1;
    metric.hourlyTokens[currentHour] += Math.round(tokens);

    // markModified is needed when modifying elements of an array in Mongoose sometimes
    metric.markModified('hourlyApiCalls');
    metric.markModified('hourlyTokens');

    await metric.save();
  } catch (error) {
    console.error('Error logging API usage:', error);
  }
};

module.exports = {
  logApiUsage
};
