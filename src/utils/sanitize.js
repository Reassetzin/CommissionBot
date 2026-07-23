/**
 * Turns a Discord username into a string safe for a Discord channel name:
 * lowercase, ascii letters/numbers/hyphens only, no leading/trailing/double hyphens.
 */
function sanitizeUsername(username) {
  let clean = String(username)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // strip accents (é -> e, etc.)
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (!clean) clean = 'user';
  return clean.slice(0, 80);
}

/** Deterministic ticket channel name for a given user, kept under Discord's 100-char limit. */
function ticketChannelName(username) {
  return `commission-${sanitizeUsername(username)}`.slice(0, 100);
}

module.exports = { sanitizeUsername, ticketChannelName };
