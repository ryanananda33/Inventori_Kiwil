// =============================================================================
// validators/supplier.validator.js — Validasi & Sanitasi input Suppliers
// =============================================================================

import { body, param } from 'express-validator';

export const validateSupplierBody = [
  body('nama_supplier')
    .trim()
    .notEmpty()
    .withMessage('Nama supplier wajib diisi.')
    .isLength({ max: 100 })
    .withMessage('Nama supplier maksimal 100 karakter.')
    .escape(),

  body('kontak')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 50 })
    .withMessage('Kontak maksimal 50 karakter.')
    .escape(),

  body('alamat')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Alamat maksimal 500 karakter.')
    .escape(),
];

export const validateSupplierId = [
  param('id')
    .isUUID()
    .withMessage('Parameter id harus UUID yang valid.'),
];

