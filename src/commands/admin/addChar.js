const { adminOnly } = require('../../middleware/auth');
const Character = require('../../models/Character');
const { validateCharInput } = require('../../utils/validator');

module.exports = (bot) => {
  bot.command('addchar', adminOnly, async (ctx) => {
    try {
      const args = ctx.message.text.replace('/addchar', '').trim().split(/\s+/);
      
      if (args.length < 4) {
        return ctx.reply(
          '❌ Usage: `/addchar <name> <rarity> <attack> <defense> [imageUrl]`\n\n' +
          'Example: `/addchar Naruto legendary 100 80 https://example.com/naruto.jpg`\n\n' +
          'Or reply to a photo with: `/addchar <name> <rarity> <attack> <defense>`',
          { parse_mode: 'Markdown' }
        );
      }

      const errors = validateCharInput(args);
      if (errors.length) {
        return ctx.reply(`❌ ${errors.join('\n')}`);
      }

      const [name, rarity, attack, defense] = args;
      let imageUrl = args[4] || null;

      // If replying to a photo, use that
      if (ctx.message.reply_to_message?.photo) {
        const photo = ctx.message.reply_to_message.photo;
        const fileId = photo[photo.length - 1].file_id;
        imageUrl = `tg://file/${fileId}`;
      }

      const character = await Character.create({
        name,
        rarity,
        attack: parseInt(attack),
        defense: parseInt(defense),
        imageUrl,
        addedBy: String(ctx.from.id)
      });

      ctx.reply(
        `✅ Added **${character.name}** [${character.rarity.toUpperCase()}]\n` +
        `⚔️ ${character.attack} | 🛡️ ${character.defense}` +
        (imageUrl ? '\n🖼️ Image added' : ''),
        { parse_mode: 'Markdown' }
      );
    } catch (err) {
      console.error('Addchar error:', err);
      ctx.reply('❌ Error adding character.');
    }
  });
};
