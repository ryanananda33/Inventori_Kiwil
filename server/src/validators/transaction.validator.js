// =============================================================================
// validators/transaction.validator.js — Validasi & Sanitasi input Transactions
// =============================================================================

import { body, query } from 'express-validator';

export const validateTransactionBody = [
  body('item_id')
    .notEmpty()
    .withMessage('item_id wajib diisi.')
    .isUUID()
    .withMessage('item_id harus UUID yang valid.'),

  body('tipe_transaksi')
    .notEmpty()
    .withMessage('Tipe transaksi wajib diisi.')
    .isIn(['MASUK', 'KELUAR'])
    .withMessage('Tipe transaksi harus "MASUK" atau "KELUAR".'),

  body('jumlah')
    .notEmpty()
    .withMessage('Jumlah wajib diisi.')
    .isInt({ min: 1 })
    .withMessage('Jumlah harus bilangan bulat > 0.')
    .toInt(),

  body('keterangan')
    .optional({ values: 'null' })
    .trim()
    .isLength({ max: 500 })
    .withMessage('Keterangan maksimal 500 karakter.')
    .escape(),
];

export const validateTransactionQuery = [
  query('tipe')
    .optional()
    .isIn(['MASUK', 'KELUAR'])
    .withMessage('Filter tipe harus "MASUK" atau "KELUAR".'),

  query('item_id')
    .optional()
    .isUUID()
    .withMessage('Filter item_id harus UUID yang valid.'),

  query('start_date')
    .optional()
    .isISO8601()
    .withMessage('start_date harus format ISO 8601 (YYYY-MM-DD).'),

  query('end_date')
    .optional()
    .isISO8601()
    .withMessage('end_date harus format ISO 8601 (YYYY-MM-DD).'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('page harus bilangan bulat >= 1.')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('limit harus bilangan bulat 1–100.')
    .toInt(),
];

