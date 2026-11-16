// =============================================================================
// routes/audit.routes.js — Audit Logs (admin only)
// =============================================================================

import { Router } from 'express';
import { query } from 'express-validator';

import { getAuditLogs } from '../controllers/audit.controller.js';
import { verifyToken, authorizeRole } from '../middleware/auth.js';
import { handleValidationErrors } from '../validators/auth.validator.js';

const router = Router();

router.use(verifyToken, authorizeRole(['admin']));

router.get(
  '/',
  [
    query('user_id').optional().isUUID().withMessage('user_id harus UUID yang valid.'),
    query('aksi').optional().isString().trim().escape(),
    query('start_date').optional().isISO8601().withMessage('start_date harus format ISO 8601.'),
    query('end_date').optional().isISO8601().withMessage('end_date harus format ISO 8601.'),
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  ],
  handleValidationErrors,
  getAuditLogs
);

export default router;

