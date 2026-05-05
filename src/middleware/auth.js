const ADMIN_IDS = (process.env.ADMIN_IDS || '').split(',').map(id => id.trim()).filter(Boolean);

const isAdmin = (userId) => ADMIN_IDS.includes(String(userId));

const adminOnly = async (ctx, next) => {
  if (!isAdmin(ctx.from.id)) {
    return ctx.reply('🔒 Admin only.');
  }
  return next();
};

module.exports = { isAdmin, adminOnly };
