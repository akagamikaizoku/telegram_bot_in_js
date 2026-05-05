const { getOrCreateUser } = require('../../services/userService');

module.exports = (bot) => {
  bot.start(async (ctx) => {
    try {
      const user = await getOrCreateUser(ctx);
      const message = 
        `╭────── ˹ ɪɴғᴏʀᴍᴀᴛɪᴏɴ ˼ ⏤͟͞‌‌‌‌★\n` +
        `┊◍ ʜᴇʏ : ${ctx.from.first_name} 🦋 !\n` +
        `┆◍ ɪ ᴀᴍ : Gᴀᴄʜᴀ Bᴏᴛ !\n` +
        `┴─────────────────────────•\n\n` +
        `❖ ᴄᴏʟʟᴇᴄᴛ ʏᴏᴜʀ ғᴀᴠ ᴄʜᴀʀᴀᴄᴛᴇʀs!\n` +
        `❖ ʙᴜɪʟᴅ ʏᴏᴜʀ ᴏᴡɴ ᴀɴɪᴍᴇ ʜᴀʀᴇᴍ!\n` +
        `❖ ғɪɴᴅ ᴀɴᴅ ᴄᴏʟʟᴇᴄᴛ ʀᴀʀᴇ ᴄʜᴀʀᴀᴄᴛᴇʀs!\n` +
        `•───────────────────────────•\n\n` +
        `👤 **ʏᴏᴜʀ ᴘʀᴏғɪʟᴇ**\n` +
        `💰 ᴄᴏɪɴs: **${user.coins}**\n` +
        `📦 ᴄʜᴀʀᴀᴄᴛᴇʀs: **${user.inventory.length}**\n` +
        `•───────────────────────────•`;

      ctx.reply(message, {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '🎴 ᴘᴜʟʟ', callback_data: 'action_pull' },
              { text: '📦 ɪɴᴠᴇɴᴛᴏʀʏ', callback_data: 'action_inventory' }
            ],
            [
              { text: '❓ ʜᴇʟᴘ', callback_data: 'action_help' },
              { text: '💡 ɪɴғᴏ', callback_data: 'action_info' }
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

