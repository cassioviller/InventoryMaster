import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';

export interface ExportColumn {
  key: string;
  label: string;
  width?: number;
}

export interface ExportData {
  title: string;
  columns: ExportColumn[];
  data: any[];
  filters?: string[];
}

export class ExportService {
  // Generate PDF export - return as text for now
  static generatePDF(exportData: ExportData): Buffer {
    // For now, return a text file that can be opened instead of complex PDF
    let content = `RELATÓRIO: ${exportData.title}\n`;
    content += '='.repeat(50) + '\n\n';
    
    if (exportData.filters && exportData.filters.length > 0) {
      content += 'FILTROS APLICADOS:\n';
      exportData.filters.forEach(filter => {
        content += `- ${filter}\n`;
      });
      content += '\n';
    }
    
    // Add headers
    const headers = exportData.columns.map(col => col.label).join(' | ');
    content += headers + '\n';
    content += '-'.repeat(headers.length) + '\n';
    
    // Add data rows
    exportData.data.forEach(item => {
      const row = exportData.columns.map(col => {
        const value = this.getNestedValue(item, col.key);
        return this.formatValue(value);
      }).join(' | ');
      content += row + '\n';
    });
    
    content += '\n' + '='.repeat(50) + '\n';
    content += `Gerado em: ${new Date().toLocaleString('pt-BR')}\n`;
    content += 'Sistema de Almoxarifado - Relatório de Movimentações\n';
    
    return Buffer.from(content, 'utf-8');
  }
  
  // Generate Excel export
  static generateExcel(exportData: ExportData): Buffer {
    // Create workbook
    const workbook = XLSX.utils.book_new();
    
    // Prepare data with headers
    const headers = exportData.columns.map(col => col.label);
    const rows = exportData.data.map(item => 
      exportData.columns.map(col => {
        const value = this.getNestedValue(item, col.key);
        return this.formatValue(value);
      })
    );
    
    // Create worksheet data
    const worksheetData = [headers, ...rows];
    
    // Add filters as comments in first rows if any
    if (exportData.filters && exportData.filters.length > 0) {
      exportData.filters.forEach((filter, index) => {
        worksheetData.splice(index, 0, [filter, ...Array(headers.length - 1).fill('')]);
      });
      worksheetData.splice(exportData.filters.length, 0, ['']); // Empty row separator
    }
    
    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Set column widths
    const columnWidths = exportData.columns.map(col => ({
      wch: col.width ? col.width / 4 : 15 // Convert to Excel width units
    }));
    worksheet['!cols'] = columnWidths;
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dados');
    
    // Generate buffer
    const excelBuffer = XLSX.write(workbook, { 
      type: 'buffer', 
      bookType: 'xlsx' 
    });
    
    return excelBuffer;
  }
  
  // Helper method to get nested object values
  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : '';
    }, obj);
  }
  
  // Helper method to format values for display
  private static formatValue(value: any): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
    if (value instanceof Date) return value.toLocaleString('pt-BR');
    if (typeof value === 'number') {
      // Check if it's a currency value (has decimal places)
      if (value % 1 !== 0 && value < 1000000) {
        return `R$ ${value.toFixed(2).replace('.', ',')}`;
      }
      return value.toLocaleString('pt-BR');
    }
    return String(value);
  }
}

// Export configurations for different entities
export const EXPORT_CONFIGS = {
  materials: {
    title: 'Relatório de Materiais',
    columns: [
      { key: 'id', label: 'ID', width: 30 },
      { key: 'name', label: 'Nome', width: 100 },
      { key: 'category.name', label: 'Categoria', width: 80 },
      { key: 'currentStock', label: 'Estoque Atual', width: 60 },
      { key: 'minimumStock', label: 'Estoque Mínimo', width: 60 },
      { key: 'unit', label: 'Unidade', width: 50 },
      { key: 'unitPrice', label: 'Preço Unitário', width: 70 },
      { key: 'description', label: 'Descrição', width: 120 },
    ]
  },
  categories: {
    title: 'Relatório de Categorias',
    columns: [
      { key: 'id', label: 'ID', width: 30 },
      { key: 'name', label: 'Nome', width: 100 },
      { key: 'description', label: 'Descrição', width: 150 },
      { key: 'createdAt', label: 'Data de Criação', width: 80 },
    ]
  },
  employees: {
    title: 'Relatório de Funcionários',
    columns: [
      { key: 'id', label: 'ID', width: 30 },
      { key: 'name', label: 'Nome', width: 100 },
      { key: 'department', label: 'Departamento', width: 80 },
      { key: 'email', label: 'E-mail', width: 120 },
      { key: 'phone', label: 'Telefone', width: 80 },
      { key: 'isActive', label: 'Status', width: 50 },
      { key: 'createdAt', label: 'Data de Criação', width: 80 },
    ]
  },
  suppliers: {
    title: 'Relatório de Fornecedores',
    columns: [
      { key: 'id', label: 'ID', width: 30 },
      { key: 'name', label: 'Nome', width: 100 },
      { key: 'cnpj', label: 'CNPJ', width: 80 },
      { key: 'email', label: 'E-mail', width: 120 },
      { key: 'phone', label: 'Telefone', width: 80 },
      { key: 'address', label: 'Endereço', width: 150 },
      { key: 'isActive', label: 'Status', width: 50 },
      { key: 'createdAt', label: 'Data de Criação', width: 80 },
    ]
  },
  thirdParties: {
    title: 'Relatório de Terceiros',
    columns: [
      { key: 'id', label: 'ID', width: 30 },
      { key: 'name', label: 'Nome', width: 100 },
      { key: 'documentType', label: 'Tipo Doc', width: 60 },
      { key: 'document', label: 'Documento', width: 80 },
      { key: 'email', label: 'E-mail', width: 120 },
      { key: 'phone', label: 'Telefone', width: 80 },
      { key: 'address', label: 'Endereço', width: 150 },
      { key: 'isActive', label: 'Status', width: 50 },
      { key: 'createdAt', label: 'Data de Criação', width: 80 },
    ]
  },
  costCenters: {
    title: 'Relatório de Centros de Custo',
    columns: [
      { key: 'id', label: 'ID', width: 30 },
      { key: 'code', label: 'Código', width: 60 },
      { key: 'name', label: 'Nome', width: 100 },
      { key: 'description', label: 'Descrição', width: 120 },
      { key: 'department', label: 'Departamento', width: 80 },
      { key: 'manager', label: 'Responsável', width: 80 },
      { key: 'monthlyBudget', label: 'Orçamento Mensal', width: 80 },
      { key: 'annualBudget', label: 'Orçamento Anual', width: 80 },
      { key: 'isActive', label: 'Status', width: 50 },
    ]
  },
  movements: {
    title: 'Relatório de Movimentações',
    columns: [
      { key: 'id', label: 'ID', width: 30 },
      { key: 'date', label: 'Data', width: 70 },
      { key: 'displayType', label: 'Tipo', width: 60 },
      { key: 'materialName', label: 'Material', width: 100 },
      { key: 'quantity', label: 'Quantidade', width: 60 },
      { key: 'unitPrice', label: 'Preço Unit.', width: 60 },
      { key: 'totalValue', label: 'Valor Total', width: 70 },
      { key: 'originDestination', label: 'Origem/Destino', width: 100 },
      { key: 'costCenter', label: 'Centro de Custo', width: 80 },
      { key: 'notes', label: 'Observações', width: 120 },
    ]
  }
};