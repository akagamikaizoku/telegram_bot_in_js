const { getOrCreateUser } = require('../../services/userService');
const { getUserInventory } = require('../../services/inventoryService');

module.exports = (bot) => {
  bot.command('inventory', async (ctx) => {
    try {
      const userId = String(ctx.from.id);
      const user = await getOrCreateUser(ctx);
      const inventory = await getUserInventory(userId);

      if (!inventory.length) {
        return ctx.reply('📦 Your collection is empty. Pull some characters!');
      }

      const rarityEmoji = { common: '⚪', rare: '🔵', epic: '🟣', legendary: '🟡' };
      let message = `📦 Your Collection (${inventory.length} characters)\n\n`;

      inventory.forEach(char => {
        const emoji = rarityEmoji[char.rarity] || '⚪';
        message += `${emoji} **${char.name}** — ${char.rarity.toUpperCase()}\n`;
        message += `⚔️ ${char.attack} | 🛡️ ${char.defense}\n`;
        if (char.imageUrl) message += `🖼️ Has image\n`;
        message += '\n';
      });

      ctx.reply(message, { parse_mode: 'Markdown' });

      // Send photos if available (up to 5 to avoid spam)
      const photosToSend = inventory.filter(c => c.imageUrl).slice(0, 5);
      for (const char of photosToSend) {
        ctx.replyWithPhoto(char.imageUrl, {
          caption: `**${char.name}**`,
          parse_mode: 'Markdown'
        }).catch(() => {});
      }
    } catch (err) {
      console.error('Inventory error:', err);
      ctx.reply('❌ Error retrieving inventory.');
    }
  });
};
