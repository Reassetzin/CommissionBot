/**
 * Payments are logged as small JSON blobs posted to the payment log channel
 * (see handlers/markPaid.js). This reads them back out for /revenue — using
 * Discord itself as the ledger means no separate database is needed.
 */
async function fetchPaymentRecords(channel) {
  const records = [];
  let lastId;

  for (let page = 0; page < 50; page++) {
    const options = { limit: 100 };
    if (lastId) options.before = lastId;

    const messages = await channel.messages.fetch(options);
    if (messages.size === 0) break;

    for (const m of messages.values()) {
      const match = m.content?.match(/```json\n([\s\S]*?)\n```/);
      if (match) {
        try {
          records.push(JSON.parse(match[1]));
        } catch {
          // Not a valid payment record, skip.
        }
      }
    }

    lastId = messages.last().id;
    if (messages.size < 100) break;
  }

  return records;
}

module.exports = { fetchPaymentRecords };
