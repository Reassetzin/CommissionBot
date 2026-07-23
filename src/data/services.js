// Single source of truth for commission service options.
// price: null means "custom quote" (used for the Other option).
module.exports = {
  model3d: { label: '3D Model', price: 30, emoji: '🧊' },
  mapbuild: { label: 'Map Build', price: 150, emoji: '🗺️' },
  uiframe: { label: 'UI per Frame', price: 38, emoji: '🎨' },
  uifull: { label: 'UI Full Game Deal', price: 500, emoji: '🖼️' },
  other: { label: 'Not sure / Other', price: null, emoji: '❓' },
};
