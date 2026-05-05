const User = require('../models/User');

const bannedCheck = async (ctx, next) => {
  try {
    const user = await User.findOne({ userId: String(ctx.from.id) });
    if (user?.isBanned) {
      return ctx.reply('🚫 You are banned from this bot.');
    }
  } catch (err) {
    console.error('Ban check error:', err);
  }
  return next();
};

module.exports = bannedCheck;
