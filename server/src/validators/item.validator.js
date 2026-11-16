// =============================================================================
// validators/item.validator.js — Validasi & Sanitasi input Items
// =============================================================================

import { body, param } from 'express-validator';

export const validateItemBody = [
  body('kode_barang')
    .trim()
    .notEmpty()
    .withMessage('Kode barang wajib diisi.')
    .isLength({ max: 30 })
    .withMessage('Kode barang maksimal 30 karakter.')
    .escape(),

  body('nama_barang')
    .trim()
    .notEmpty()
    .withMessage('Nama barang wajib diisi.')
    .isLength({ max: 100 })
    .withMessage('Nama barang maksimal 100 karakter.')
    .escape(),

  body('kategori')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 50 })
    .withMessage('Kategori maksimal 50 karakter.')
    .escape(),

  body('satuan')
    .trim()
    .notEmpty()
    .withMessage('Satuan wajib diisi.')
    .isIn(['pcs', 'gram', 'liter', 'dus'])
    .withMessage('Satuan harus salah satu dari: pcs, gram, liter, dus.'),

  body('stok_saat_ini')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stok saat ini harus bilangan bulat >= 0.')
    .toInt(),

  body('stok_minimum')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stok minimum harus bilangan bulat >= 0.')
    .toInt(),

  body('harga_beli')
    .notEmpty()
    .withMessage('Harga beli wajib diisi.')
    .isFloat({ min: 0 })
    .withMessage('Harga beli harus angka >= 0.')
    .toFloat(),

  body('supplier_id')
    .optional({ values: 'null' })
    .isUUID()
    .withMessage('supplier_id harus UUID yang valid.'),
];

export const validateItemId = [
  param('id')
    .isUUID()
    .withMessage('Parameter id harus UUID yang valid.'),
];

