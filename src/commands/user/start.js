const { getOrCreateUser } = require('../../services/userService');

module.exports = (bot) => {
  bot.start(async (ctx) => {
    try {
      const user = await getOrCreateUser(ctx);
      ctx.reply(
        `👋 Welcome to **Gacha Bot**!\n\n` +
        `💰 Coins: **${user.coins}**\n\n` +
        `🎮 Commands:\n` +
        `/pull - Pull a character (10 coins)\n` +
        `/inventory - View your collection\n` +
        `/exit - Cancel active pull\n\n` +
        `⚙️ Admin: /addchar, /listchar, /give, /ban`,
        { parse_mode: 'Markdown' }
      );
    } catch (err) {
      console.error('Start error:', err);
      ctx.reply('❌ Error starting bot.');
    }
  });
};
