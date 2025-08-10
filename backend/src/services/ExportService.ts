// Stub for ExportService
class ExportService {
  static getInstance() {
    return new ExportService();
  }

  async exportData() {
    return { message: 'Export service temporarily disabled' };
  }

  async exportToExcel() {
    return Buffer.from('Export service temporarily disabled');
  }

  async exportToPDF() {
    return Buffer.from('Export service temporarily disabled');
  }

  async exportToCSV() {
    return Buffer.from('Export service temporarily disabled');
  }

  async scheduleExport() {
    return { message: 'Export scheduling temporarily disabled' };
  }

  async getScheduledExports() {
    return [];
  }

  async deleteScheduledExport() {
    return { message: 'Export deletion temporarily disabled' };
  }
}

export default ExportService;
