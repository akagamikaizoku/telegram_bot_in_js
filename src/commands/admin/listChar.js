const { adminOnly } = require('../../middleware/auth');
const Character = require('../../models/Character');

module.exports = (bot) => {
  bot.command('listchar', adminOnly, async (ctx) => {
    try {
      const characters = await Character.find().sort({ createdAt: -1 });

      if (!characters.length) {
        return ctx.reply('📭 No characters in the pool yet.');
      }

      const rarityEmoji = { common: '⚪', rare: '🔵', epic: '🟣', legendary: '🟡' };
      let message = `📋 Character Pool (${characters.length} total)\n\n`;

      characters.forEach((char, idx) => {
        const emoji = rarityEmoji[char.rarity] || '⚪';
        message += `${idx + 1}. ${emoji} **${char.name}** [${char.rarity.toUpperCase()}]\n`;
        message += `⚔️ ${char.attack} | 🛡️ ${char.defense}`;
        if (char.imageUrl) message += ` | 🖼️`;
        message += '\n';
      });

      ctx.reply(message, { parse_mode: 'Markdown' });

      // Send photos if available (up to 5)
      const photosToSend = characters.filter(c => c.imageUrl).slice(0, 5);
      for (const char of photosToSend) {
        ctx.replyWithPhoto(char.imageUrl, {
          caption: `**${char.name}** [${char.rarity.toUpperCase()}]`,
          parse_mode: 'Markdown'
        }).catch(() => {});
      }
    } catch (err) {
      console.error('Listchar error:', err);
      ctx.reply('❌ Error listing characters.');
    }
  });
};
