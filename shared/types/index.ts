// Re-export all type definitions
export * from './auth';
export * from './api';
export * from './products';
export * from './sales';
export * from './payments';
export * from './common';

// Re-export specific customer types to avoid conflicts
export type {
  Customer,
  CustomerSearchFilters,
  CreateCustomerRequest,
  UpdateCustomerRequest
} from './customers';
