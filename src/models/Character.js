const mongoose = require('mongoose');

const RARITIES = ['common', 'rare', 'epic', 'legendary'];

const characterSchema = new mongoose.Schema({
  name:    { type: String, required: true },
  rarity:  { type: String, enum: RARITIES, required: true },
  attack:  { type: Number, required: true, min: 0 },
  defense: { type: Number, required: true, min: 0 },
  imageUrl:{ type: String, default: null },          // optional art URL
  addedBy: { type: String },                         // admin userId who added it
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Character', characterSchema);
