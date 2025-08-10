// Stub for LocalizationService
class LocalizationService {
  static getInstance() {
    return new LocalizationService();
  }

  async translate(key: string, locale?: string) {
    return key; // Return key as-is for now
  }

  async formatCurrency(amount: number, locale?: string) {
    return `${amount.toFixed(2)} RWF`;
  }
}

export default LocalizationService;