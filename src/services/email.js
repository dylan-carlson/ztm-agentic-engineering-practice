// TODO: replace with real email provider (SendGrid, SES, etc.)

/**
 * @description Stub that logs an email instead of sending it.
 *
 * @param {Object} message - The email to send.
 * @param {string} message.to - Recipient address.
 * @param {string} message.subject - Subject line.
 * @param {string} message.body - Message body (unused by the stub).
 * @returns {Promise<{ sent: boolean, to: string, subject: string }>} Resolves once the email is "sent".
 */
function sendEmail({ to, subject, body }) {
  console.log('[EMAIL] Sending to:', to, '| Subject:', subject);
  return Promise.resolve({ sent: true, to, subject });
}

module.exports = { sendEmail };
