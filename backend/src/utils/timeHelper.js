/**
 * Time Helper - TEST_MODE support
 * When TEST_MODE=true in .env, 1 day = 1 minute (for quick testing)
 * When TEST_MODE is false/absent, everything works in normal days
 */

const isTestMode = () => process.env.TEST_MODE === 'true';

// Returns "minutes" or "days"
const getTimeUnit = () => isTestMode() ? 'minutes' : 'days';

// Add duration: in test mode adds minutes, in normal mode adds days
const addDuration = (date, amount) => {
  const result = new Date(date);
  if (isTestMode()) {
    result.setMinutes(result.getMinutes() + amount);
  } else {
    result.setDate(result.getDate() + amount);
  }
  return result;
};

// Get duration between two dates: returns minutes in test mode, days in normal mode
const getDurationBetween = (startDate, endDate) => {
  const diffMs = new Date(endDate) - new Date(startDate);
  if (isTestMode()) {
    return Math.max(0, Math.floor(diffMs / (1000 * 60))); // minutes
  }
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24))); // days
};

// Cron schedule: every minute in test mode, daily in normal mode
const getCronSchedule = (normalSchedule) => {
  if (isTestMode()) {
    return '* * * * *'; // every minute
  }
  return normalSchedule;
};

module.exports = { isTestMode, getTimeUnit, addDuration, getDurationBetween, getCronSchedule };
