const { adminOnly } = require('../../middleware/auth');
const Character = require('../../models/Character');
const { validateCharInput } = require('../../utils/validator');

module.exports = (bot) => {
  bot.command('addchar', adminOnly, async (ctx) => {
    try {
      const args = ctx.message.text.replace('/addchar', '').trim().split(/\s+/);
      
      if (args.length < 4) {
        return ctx.reply(
          '❌ Usage: `/addchar <name> <rarity> <attack> <defense>`\n\n' +
          'Example: `/addchar Naruto legendary 100 80`',
          { parse_mode: 'Markdown' }
        );
      }

      const errors = validateCharInput(args);
      if (errors.length) {
        return ctx.reply(`❌ ${errors.join('\n')}`);
      }

      const [name, rarity, attack, defense] = args;
      const character = await Character.create({
        name,
        rarity,
        attack: parseInt(attack),
        defense: parseInt(defense),
        addedBy: String(ctx.from.id)
      });

      ctx.reply(
        `✅ Added **${character.name}** [${character.rarity.toUpperCase()}]\n` +
        `⚔️ ${character.attack} | 🛡️ ${character.defense}`,
        { parse_mode: 'Markdown' }
      );
    } catch (err) {
      console.error('Addchar error:', err);
      ctx.reply('❌ Error adding character.');
    }
  });
};
