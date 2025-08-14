import { z } from 'zod';
import { idSchema, decimalSchema, phoneSchema } from './common.schemas';

export const createPaymentSchema = z.object({
  saleId: idSchema.optional(),
  amount: decimalSchema,
  method: z.enum(['CASH', 'MOBILE_MONEY', 'BANK_TRANSFER', 'CREDIT']),
  transactionId: z.string().max(100).optional(),
  referenceNumber: z.string().max(100).optional(),
  momoPhoneNumber: phoneSchema.optional(),
  bankAccount: z.string().max(100).optional(),
  changeGiven: decimalSchema.optional(),
  changeMethod: z.enum(['CASH', 'MOBILE_MONEY']).optional(),
  notes: z.string().max(500).optional(),
}).refine(data => {
  // Validate MoMo payments have phone number
  if (data.method === 'MOBILE_MONEY' && !data.momoPhoneNumber) {
    return false;
  }
  // Validate bank transfers have account info
  if (data.method === 'BANK_TRANSFER' && !data.bankAccount) {
    return false;
  }
  return true;
}, {
  message: "Missing required payment method details",
});

export const momoRequestSchema = z.object({
  amount: decimalSchema,
  phoneNumber: phoneSchema,
  externalId: z.string().max(100).optional(),
  payerMessage: z.string().max(200).optional(),
  payeeNote: z.string().max(200).optional(),
});

export const momoCallbackSchema = z.object({
  externalId: z.string(),
  amount: z.string(),
  currency: z.string(),
  payer: z.object({
    partyIdType: z.string(),
    partyId: z.string(),
  }),
  status: z.enum(['PENDING', 'SUCCESSFUL', 'FAILED']),
  reason: z.object({
    code: z.string(),
    message: z.string(),
  }).optional(),
  financialTransactionId: z.string().optional(),
});
