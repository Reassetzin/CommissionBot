/**
 * Fetches full message history for a text channel and renders it as a plain-text
 * transcript, oldest message first. Paginates in batches of 100 via the REST API
 * (this does NOT require the privileged Message Content intent).
 */
async function buildTranscript(channel) {
  const allMessages = [];
  let lastId;

  // Safety cap so a runaway channel can't loop forever (5000 messages ~ 50 pages).
  for (let page = 0; page < 50; page++) {
    const options = { limit: 100 };
    if (lastId) options.before = lastId;

    const messages = await channel.messages.fetch(options);
    if (messages.size === 0) break;

    allMessages.push(...messages.values());
    lastId = messages.last().id;

    if (messages.size < 100) break;
  }

  allMessages.reverse();

  if (allMessages.length === 0) {
    return 'No messages in this channel.';
  }

  const lines = allMessages.map((m) => {
    const time = m.createdAt.toISOString();
    const author = m.author?.tag || m.author?.id || 'Unknown';
    let content = m.content || '';

    if (m.attachments.size > 0) {
      const files = [...m.attachments.values()].map((a) => `[attachment: ${a.url}]`).join(' ');
      content = content ? `${content} ${files}` : files;
    }
    if (m.embeds.length > 0) {
      content += content ? ` [${m.embeds.length} embed(s)]` : `[${m.embeds.length} embed(s)]`;
    }
    if (!content) content = '[no content]';

    return `[${time}] ${author}: ${content}`;
  });

  return lines.join('\n');
}

module.exports = { buildTranscript };
