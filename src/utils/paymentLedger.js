const PAYMENT_RECORD_PATTERN = /```json\n([\s\S]*?)\n```/;

/**
 * Payments are logged as small JSON blobs posted to the payment log channel
 * (see handlers/markPaid.js). This paginates through that channel's full
 * history — using Discord itself as the ledger means no separate database
 * is needed.
 */
async function fetchPaymentMessages(channel) {
  const messages = [];
  let lastId;

  for (let page = 0; page < 50; page++) {
    const options = { limit: 100 };
    if (lastId) options.before = lastId;

    const batch = await channel.messages.fetch(options);
    if (batch.size === 0) break;

    for (const m of batch.values()) {
      if (PAYMENT_RECORD_PATTERN.test(m.content || '')) messages.push(m);
    }

    lastId = batch.last().id;
    if (batch.size < 100) break;
  }

  return messages;
}

async function fetchPaymentRecords(channel) {
  const messages = await fetchPaymentMessages(channel);
  const records = [];

  for (const m of messages) {
    const match = m.content.match(PAYMENT_RECORD_PATTERN);
    try {
      records.push(JSON.parse(match[1]));
    } catch {
      // Not a valid payment record, skip.
    }
  }

  return records;
}

module.exports = { fetchPaymentRecords, fetchPaymentMessages };
