// =============================================================================
// routes/item.routes.js
//
// RBAC:
//   admin  → full CRUD
//   kasir  → GET only (list & detail)
//
// Anti-XSS & Anti-SQLi:
//   Semua input divalidasi & disanitasi via express-validator sebelum
//   masuk ke controller yang menggunakan Parameterized Queries.
// =============================================================================

import { Router } from 'express';

import {
  getAllItems,
  getLowStockItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
} from '../controllers/item.controller.js';
import { verifyToken, authorizeRole } from '../middleware/auth.js';
import { auditMiddleware } from '../middleware/auditLogger.js';
import {
  validateItemBody,
  validateItemId,
} from '../validators/item.validator.js';
import { handleValidationErrors } from '../validators/auth.validator.js';

const router = Router();

// Semua route item memerlukan autentikasi
router.use(verifyToken);

// GET — admin & kasir boleh mengakses
router.get('/low-stock', getLowStockItems);           // Harus di atas /:id
router.get('/', getAllItems);
router.get('/:id', validateItemId, handleValidationErrors, getItemById);

// CUD — admin only
router.post(
  '/',
  authorizeRole(['admin']),
  validateItemBody,
  handleValidationErrors,
  auditMiddleware('CREATE_ITEM'),
  createItem
);

router.put(
  '/:id',
  authorizeRole(['admin']),
  validateItemId,
  validateItemBody,
  handleValidationErrors,
  auditMiddleware('UPDATE_ITEM'),
  updateItem
);

router.delete(
  '/:id',
  authorizeRole(['admin']),
  validateItemId,
  handleValidationErrors,
  auditMiddleware('DELETE_ITEM'),
  deleteItem
);

export default router;

