const { getOrCreateUser } = require('../../services/userService');

module.exports = (bot) => {
  bot.start(async (ctx) => {
    try {
      const user = await getOrCreateUser(ctx);
      const message = 
        `🎮 **GACHA BOT**\n\n` +
        `👤 **Your Profile**\n` +
        `💰 Coins: **${user.coins}**\n` +
        `📦 Characters: **${user.inventory.length}**\n\n` +
        `🎯 **Features**\n` +
        `🎴 Collect rare waifus and characters\n` +
        `💎 Build your own anime harem\n` +
        `🎲 80% claim success rate\n\n` +
        `⚡ Tap a button below to start!`;

      ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🎴 PULL NOW', callback_data: 'action_pull' },
              { text: '📦 INVENTORY', callback_data: 'action_inventory' }
            ],
            [
              { text: '❓ HELP', callback_data: 'action_help' },
              { text: '💡 INFO', callback_data: 'action_info' }
            ]
          ]
        }
      });
    } catch (err) {
      console.error('Start error:', err);
      ctx.reply('❌ Error starting bot.');
    }
  });
};

