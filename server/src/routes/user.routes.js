// =============================================================================
// routes/user.routes.js — Manajemen User (admin only)
// =============================================================================

import { Router } from 'express';
import { body, param } from 'express-validator';

import {
  getAllUsers,
  getUserById,
  updateUserRole,
  resetUserPassword,
  deleteUser,
} from '../controllers/user.controller.js';
import { verifyToken, authorizeRole } from '../middleware/auth.js';
import { auditMiddleware } from '../middleware/auditLogger.js';
import { handleValidationErrors } from '../validators/auth.validator.js';

const router = Router();

// Semua endpoint user hanya untuk admin
router.use(verifyToken, authorizeRole(['admin']));

router.get('/', getAllUsers);

router.get(
  '/:id',
  [param('id').isUUID().withMessage('id harus UUID yang valid.')],
  handleValidationErrors,
  getUserById
);

// PUT /api/users/:id/role — Ubah role
router.put(
  '/:id/role',
  [
    param('id').isUUID().withMessage('id harus UUID yang valid.'),
    body('role')
      .isIn(['admin', 'kasir'])
      .withMessage('Role harus "admin" atau "kasir".'),
  ],
  handleValidationErrors,
  auditMiddleware('UPDATE_USER_ROLE'),
  updateUserRole
);

// PUT /api/users/:id/password — Reset password
router.put(
  '/:id/password',
  [
    param('id').isUUID().withMessage('id harus UUID yang valid.'),
    body('password')
      .isLength({ min: 8, max: 128 })
      .withMessage('Password minimal 8 karakter.')
      .matches(/[a-zA-Z]/)
      .withMessage('Password harus mengandung minimal satu huruf.')
      .matches(/[0-9]/)
      .withMessage('Password harus mengandung minimal satu angka.'),
  ],
  handleValidationErrors,
  auditMiddleware('RESET_USER_PASSWORD'),
  resetUserPassword
);

// DELETE /api/users/:id
router.delete(
  '/:id',
  [param('id').isUUID().withMessage('id harus UUID yang valid.')],
  handleValidationErrors,
  auditMiddleware('DELETE_USER'),
  deleteUser
);

export default router;

