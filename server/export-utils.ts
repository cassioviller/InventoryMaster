import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';

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
  totals?: string[];
}

export class ExportService {
  // Generate real PDF using jsPDF
  static generatePDF(exportData: ExportData): Buffer {
    const doc = new jsPDF();
    
    // Set font for Portuguese characters
    doc.setFont('helvetica');
    
    // Add title
    doc.setFontSize(16);
    doc.text(exportData.title, 20, 20);
    
    // Add filters if present
    let yPosition = 35;
    if (exportData.filters && exportData.filters.length > 0) {
      doc.setFontSize(12);
      doc.text('FILTROS APLICADOS:', 20, yPosition);
      yPosition += 8;
      
      doc.setFontSize(10);
      exportData.filters.forEach(filter => {
        doc.text(`• ${filter}`, 25, yPosition);
        yPosition += 6;
      });
      yPosition += 5;
    }
    
    // Add table headers
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    let currentY = yPosition;
    
    // Draw headers
    const headers = exportData.columns.map(col => col.label);
    const colWidth = (170 / headers.length); // Distribute available width
    let currentX = 20;
    
    headers.forEach(header => {
      doc.text(header, currentX, currentY);
      currentX += colWidth;
    });
    
    currentY += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    
    // Draw data rows
    exportData.data.forEach(item => {
      currentX = 20;
      const rowValues = exportData.columns.map(col => {
        const value = this.getNestedValue(item, col.key);
        return this.formatValue(value);
      });
      
      rowValues.forEach(value => {
        // Truncate long values to fit column width
        const truncatedValue = value.length > 15 ? value.substring(0, 12) + '...' : value;
        doc.text(truncatedValue, currentX, currentY);
        currentX += colWidth;
      });
      
      currentY += 6;
      
      // Add new page if needed
      if (currentY > 270) {
        doc.addPage();
        currentY = 20;
      }
    });
    
    // Add totals if provided
    if (exportData.totals && exportData.totals.length > 0) {
      currentY += 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('TOTALIZADORES:', 20, currentY);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      currentY += 8;
      exportData.totals.forEach(total => {
        doc.text(`• ${total}`, 25, currentY);
        currentY += 6;
      });
    }
    
    // Add footer
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, pageHeight - 20);
    doc.text('Sistema de Gerenciamento de Almoxarifado', 20, pageHeight - 14);
    
    return Buffer.from(doc.output('arraybuffer'));
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
    
    // Add totals at the end if provided
    if (exportData.totals && exportData.totals.length > 0) {
      worksheetData.push(['']); // Empty row separator
      worksheetData.push(['TOTALIZADORES', ...Array(headers.length - 1).fill('')]);
      exportData.totals.forEach(total => {
        worksheetData.push([total, ...Array(headers.length - 1).fill('')]);
      });
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