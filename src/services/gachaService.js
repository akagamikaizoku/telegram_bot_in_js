const Character = require('../models/Character');
const { weightedRandom } = require('../utils/random');

const RARITY_WEIGHTS = [
  { value: 'common',    weight: 60 },
  { value: 'rare',      weight: 25 },
  { value: 'epic',      weight: 10 },
  { value: 'legendary', weight: 5  },
];

// Roll a rarity then pick a random character of that rarity
const rollCharacter = async () => {
  const rarity = weightedRandom(RARITY_WEIGHTS);
  const characters = await Character.find({ rarity });
  if (!characters.length) return null;
  return characters[Math.floor(Math.random() * characters.length)];
};

// 80% success, 20% fail on claim
const attemptClaim = () => Math.random() < parseFloat(process.env.PULL_SUCCESS_RATE || 0.8);

module.exports = { rollCharacter, attemptClaim };
