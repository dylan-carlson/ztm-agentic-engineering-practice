const { sendEmail } = require('./email');

/**
 * @description Sends the welcome email to a newly created user.
 *
 * @param {{ name: string, email: string }} user - The new user.
 * @returns {Promise<{ sent: boolean, to: string, subject: string }>} The result from sendEmail.
 */
function sendWelcomeEmail(user) {
  return sendEmail({
    to: user.email,
    subject: 'Welcome to Taskr!',
    body: `Hi ${user.name}, your account is ready. Start managing your tasks at taskr.io.`
  });
}

module.exports = { sendWelcomeEmail };
