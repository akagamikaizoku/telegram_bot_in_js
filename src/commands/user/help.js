module.exports = (bot) => {
  bot.command('help', async (ctx) => {
    const message = 
      `📚 **Gacha Bot Commands**\n\n` +
      `🎮 **User Commands**\n` +
      `/pull - Pull a random character (10 coins)\n` +
      `/inventory - View your collection\n` +
      `/exit - Cancel active pull\n` +
      `/start - Back to home\n` +
      `/help - Show this menu\n\n` +
      `👑 **Admin Commands**\n` +
      `/addchar <name> <rarity> <attack> <defense> [url] - Add character\n` +
      `/listchar - List all characters\n` +
      `/give <userId> <amount> - Give coins to user\n` +
      `/ban <userId> - Ban a user\n` +
      `/unban <userId> - Unban a user\n\n` +
      `ℹ️ **Info**\n` +
      `💰 Each pull costs 10 coins\n` +
      `🎲 Rarity: 60% Common, 25% Rare, 10% Epic, 5% Legendary\n` +
      `🎴 Claim success: 80% | Fail: 20%`;

    ctx.reply(message, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🏠 Back to Home', callback_data: 'menu_home' }]
        ]
      }
    });
  });
};
