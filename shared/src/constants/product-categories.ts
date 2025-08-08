// Product category constants
export enum ProductCategory {
  PHONE_ACCESSORIES = 'PHONE_ACCESSORIES',
  CABLES = 'CABLES',
  CHARGERS = 'CHARGERS',
  CASES = 'CASES',
  SCREEN_PROTECTORS = 'SCREEN_PROTECTORS',
  AUDIO = 'AUDIO',
  POWER_BANKS = 'POWER_BANKS',
  STORAGE = 'STORAGE',
  OTHER = 'OTHER'
}

export const PRODUCT_CATEGORY_LABELS = {
  [ProductCategory.PHONE_ACCESSORIES]: 'Phone Accessories',
  [ProductCategory.CABLES]: 'Cables',
  [ProductCategory.CHARGERS]: 'Chargers',
  [ProductCategory.CASES]: 'Cases & Covers',
  [ProductCategory.SCREEN_PROTECTORS]: 'Screen Protectors',
  [ProductCategory.AUDIO]: 'Audio Accessories',
  [ProductCategory.POWER_BANKS]: 'Power Banks',
  [ProductCategory.STORAGE]: 'Storage Devices',
  [ProductCategory.OTHER]: 'Other'
} as const

export const POPULAR_BRANDS = [
  'Apple',
  'Samsung',
  'Huawei',
  'Xiaomi',
  'Oppo',
  'Vivo',
  'Infinix',
  'Tecno',
  'Nokia',
  'Generic'
] as const
