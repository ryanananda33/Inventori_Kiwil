// =============================================================================
// validators/report.validator.js — Validasi query params endpoint Reports
// =============================================================================

import { query } from 'express-validator';

export const validateReportQuery = [
  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('start_date harus format ISO 8601 (YYYY-MM-DD).'),

  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('end_date harus format ISO 8601 (YYYY-MM-DD).'),
];

