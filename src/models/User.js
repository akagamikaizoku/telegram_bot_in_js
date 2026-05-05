const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId:    { type: String, required: true, unique: true },
  username:  { type: String, default: 'Unknown' },
  coins:     { type: Number, default: 100 },          // start with 100 coins
  isBanned:  { type: Boolean, default: false },
  inventory: [
    {
      characterId: { type: String, required: true },
      obtainedAt:  { type: Date, default: Date.now }
    }
  ],
  cooldowns: {
    pull: { type: Number, default: 0 }                // Unix timestamp ms
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
