// =============================================================================
// routes/supplier.routes.js
//
// RBAC:
//   admin  → full CRUD
//   kasir  → GET only
// =============================================================================

import { Router } from 'express';

import {
  getAllSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from '../controllers/supplier.controller.js';
import { verifyToken, authorizeRole } from '../middleware/auth.js';
import { auditMiddleware } from '../middleware/auditLogger.js';
import {
  validateSupplierBody,
  validateSupplierId,
} from '../validators/supplier.validator.js';
import { handleValidationErrors } from '../validators/auth.validator.js';

const router = Router();

router.use(verifyToken);

// GET — admin & kasir
router.get('/', getAllSuppliers);
router.get('/:id', validateSupplierId, handleValidationErrors, getSupplierById);

// CUD — admin only
router.post(
  '/',
  authorizeRole(['admin']),
  validateSupplierBody,
  handleValidationErrors,
  auditMiddleware('CREATE_SUPPLIER'),
  createSupplier
);

router.put(
  '/:id',
  authorizeRole(['admin']),
  validateSupplierId,
  validateSupplierBody,
  handleValidationErrors,
  auditMiddleware('UPDATE_SUPPLIER'),
  updateSupplier
);

router.delete(
  '/:id',
  authorizeRole(['admin']),
  validateSupplierId,
  handleValidationErrors,
  auditMiddleware('DELETE_SUPPLIER'),
  deleteSupplier
);

export default router;

