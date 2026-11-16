// =============================================================================
// routes/transaction.routes.js
//
// RBAC: admin & kasir bisa catat transaksi dan lihat riwayat
// =============================================================================

import { Router } from 'express';
import { param } from 'express-validator';

import {
  getAllTransactions,
  getTransactionById,
  createTransaction,
} from '../controllers/transaction.controller.js';
import { verifyToken } from '../middleware/auth.js';
import { auditMiddleware } from '../middleware/auditLogger.js';
import {
  validateTransactionBody,
  validateTransactionQuery,
} from '../validators/transaction.validator.js';
import { handleValidationErrors } from '../validators/auth.validator.js';

const router = Router();

router.use(verifyToken);

router.get(
  '/',
  validateTransactionQuery,
  handleValidationErrors,
  getAllTransactions
);

router.get(
  '/:id',
  [param('id').isUUID().withMessage('id harus UUID yang valid.')],
  handleValidationErrors,
  getTransactionById
);

router.post(
  '/',
  validateTransactionBody,
  handleValidationErrors,
  auditMiddleware('CREATE_TRANSACTION'),
  createTransaction
);

export default router;

