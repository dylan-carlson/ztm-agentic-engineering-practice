const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

/**
 * Converts page-based query params into SQL LIMIT/OFFSET values.
 * Missing or non-numeric values fall back to page 1 and DEFAULT_PAGE_SIZE;
 * page is clamped to at least 1 and pageSize is capped at MAX_PAGE_SIZE.
 *
 * @param {string|number} [page] - 1-based page number, usually from req.query.
 * @param {string|number} [pageSize] - Number of rows per page, usually from req.query.
 * @returns {{ limit: number, offset: number }} Values for the SQL LIMIT and OFFSET clauses.
 */
function paginate(page, pageSize) {
  const p = Math.max(1, parseInt(page) || 1);
  const ps = Math.min(MAX_PAGE_SIZE, parseInt(pageSize) || DEFAULT_PAGE_SIZE);
  return { limit: ps, offset: (p - 1) * ps };
}

module.exports = { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE, paginate };
