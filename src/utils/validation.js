/**
 * Checks whether a value looks like an email address (something@domain.tld,
 * with no whitespace).
 *
 * @param {string} email - The value to check.
 * @returns {boolean} True if the value matches the email pattern.
 */
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Checks whether a value is a string containing at least one
 * non-whitespace character.
 *
 * @param {*} val - The value to check.
 * @returns {boolean} True if val is a non-blank string.
 */
function isNonEmptyString(val) {
  return typeof val === 'string' && val.trim().length > 0;
}

module.exports = { validateEmail, isNonEmptyString };
