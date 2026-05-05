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
        message += `⚔️ ${char.attack} | 🛡️ ${char.defense}\n`;
      });

      ctx.reply(message, { parse_mode: 'Markdown' });
    } catch (err) {
      console.error('Listchar error:', err);
      ctx.reply('❌ Error listing characters.');
    }
  });
};
