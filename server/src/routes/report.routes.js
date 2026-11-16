// =============================================================================
// routes/report.routes.js — Laporan & Stok Opname (admin only)
// =============================================================================

import { Router } from 'express';

import { getSummaryReport } from '../controllers/report.controller.js';
import { verifyToken, authorizeRole } from '../middleware/auth.js';
import { validateReportQuery } from '../validators/report.validator.js';
import { handleValidationErrors } from '../validators/auth.validator.js';

const router = Router();

// Hanya admin yang bisa export laporan
router.use(verifyToken, authorizeRole(['admin']));

// GET /api/reports/summary
router.get(
  '/summary',
  validateReportQuery,
  handleValidationErrors,
  getSummaryReport
);

export default router;

