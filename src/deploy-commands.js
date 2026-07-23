// Optional manual trigger — the bot already registers commands automatically
// on every startup (see src/registerCommands.js, called from index.js). This
// script exists only if you want to force a re-registration without
// restarting the bot, e.g. right after editing a command's options.
const { registerCommands } = require('./registerCommands');

(async () => {
  await registerCommands();
  process.exit(0);
})();
