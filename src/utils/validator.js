const VALID_RARITIES = ['common', 'rare', 'epic', 'legendary'];

const validateCharInput = (args) => {
  const [name, rarity, attack, defense] = args;
  const errors = [];

  if (!name) errors.push('Name is required.');
  if (!VALID_RARITIES.includes(rarity)) errors.push(`Rarity must be one of: ${VALID_RARITIES.join(', ')}`);
  if (isNaN(attack) || parseInt(attack) < 0)  errors.push('Attack must be a positive number.');
  if (isNaN(defense) || parseInt(defense) < 0) errors.push('Defense must be a positive number.');

  return errors;
};

module.exports = { validateCharInput, VALID_RARITIES };
