const { jsPDF } = require('jspdf');
import * as XLSX from 'xlsx';

// Types for export data
interface ExportColumn {
  key: string;
  label: string;
  width?: number;
}

interface ExportData {
  title: string;
  columns: ExportColumn[];
  data: any[];
  filters?: string[];
  totals?: string[];
}

export class ExportService {
  // Generate professional PDF with no truncation
  static generatePDF(exportData: ExportData): Buffer {
    // Create document in landscape for maximum width
    const doc = new jsPDF('landscape', 'mm', 'a4');
    const pageW = 297; // A4 Landscape width
    const pageH = 210; // A4 Landscape height
    
    // Professional header
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(exportData.title, 15, 15);
    
    // Timestamp
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    const timestamp = new Date().toLocaleString('pt-BR');
    doc.text(`Gerado em: ${timestamp}`, pageW - 60, 15);
    
    // Filters in compact format
    let yPos = 25;
    if (exportData.filters && exportData.filters.length > 0) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('FILTROS:', 15, yPos);
      
      doc.setFont('helvetica', 'normal');
      const filtersText = exportData.filters.join(' • ');
      doc.text(filtersText, 35, yPos);
      yPos += 8;
    }
    
    // Dynamic column width calculation
    const margins = 30;
    const availableWidth = pageW - margins;
    
    const baseWidths: { [key: string]: number } = {
      'Data': 25,
      'Tipo': 20,
      'Material': 55,
      'Quantidade': 30,
      'Valor Total': 30,
      'Origem/Destino': 50,
      'Centro de Custo': 60
    };
    
    // Calculate proportional widths
    let totalWidth = 0;
    exportData.columns.forEach(col => {
      totalWidth += baseWidths[col.label] || 35;
    });
    
    const scaleFactor = availableWidth / totalWidth;
    const colWidths: { [key: string]: number } = {};
    exportData.columns.forEach(col => {
      const baseW = baseWidths[col.label] || 35;
      colWidths[col.label] = Math.floor(baseW * scaleFactor);
    });
    
    // Column positions
    const colPositions: number[] = [];
    let currentX = 15;
    exportData.columns.forEach(col => {
      colPositions.push(currentX);
      currentX += colWidths[col.label];
    });
    
    // Professional table header
    doc.setFillColor(240, 240, 240);
    doc.rect(15, yPos - 2, currentX - 15, 8, 'F');
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(60, 60, 60);
    
    exportData.columns.forEach((col, index) => {
      const headerText = col.label;
      const words = headerText.split(' ');
      
      if (words.length > 1 && headerText.length > colWidths[col.label] / 3) {
        // Multi-line header for long titles
        doc.text(words[0], colPositions[index] + 1, yPos + 2);
        if (words[1]) {
          doc.text(words.slice(1).join(' '), colPositions[index] + 1, yPos + 5);
        }
      } else {
        doc.text(headerText, colPositions[index] + 1, yPos + 3);
      }
    });
    
    // Header separator
    yPos += 8;
    doc.setLineWidth(0.3);
    doc.setDrawColor(180, 180, 180);
    doc.line(15, yPos, currentX - 5, yPos);
    yPos += 3;
    
    // Data rows with smart formatting
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5); // Compact font for more content
    doc.setTextColor(40, 40, 40);
    
    exportData.data.forEach((item, rowIndex) => {
      const cellContents: { text: string[], x: number, width: number }[] = [];
      let maxLines = 1;
      
      // Prepare all cell contents with intelligent text wrapping
      exportData.columns.forEach((col, colIndex) => {
        const value = this.getNestedValue(item, col.key);
        let formattedValue = this.formatValue(value);
        
        // Apply abbreviations for Quantidade
        if (col.label === 'Quantidade') {
          formattedValue = this.abbreviateUnit(formattedValue);
        }
        
        const colW = colWidths[col.label];
        const maxCharsPerLine = Math.floor(colW * 0.5);
        
        const lines: string[] = [];
        
        if (!formattedValue || formattedValue === '-' || formattedValue === 'N/A') {
          lines.push('-');
        } else if (formattedValue.length <= maxCharsPerLine) {
          lines.push(formattedValue);
        } else {
          // Smart text wrapping - NO TRUNCATION
          let remainingText = formattedValue;
          while (remainingText.length > 0) {
            if (remainingText.length <= maxCharsPerLine) {
              lines.push(remainingText);
              break;
            }
            
            // Find optimal break point
            let breakPoint = maxCharsPerLine;
            let foundBreak = false;
            
            // Look for space, hyphen, or punctuation
            for (let i = maxCharsPerLine; i > Math.floor(maxCharsPerLine * 0.6); i--) {
              if (/[\s\-.,;:()]/.test(remainingText[i])) {
                breakPoint = i;
                foundBreak = true;
                break;
              }
            }
            
            // If no good break point, force break but don't lose characters
            if (!foundBreak) {
              breakPoint = maxCharsPerLine - 1;
            }
            
            lines.push(remainingText.substring(0, breakPoint).trim());
            remainingText = remainingText.substring(breakPoint).trim();
          }
        }
        
        cellContents.push({
          text: lines,
          x: colPositions[colIndex] + 1,
          width: colW
        });
        
        maxLines = Math.max(maxLines, lines.length);
      });
      
      // Calculate row height
      const rowHeight = Math.max(8, maxLines * 3.5 + 2);
      
      // Zebra striping
      if (rowIndex % 2 === 0) {
        doc.setFillColor(252, 252, 252);
        doc.rect(15, yPos - 1, currentX - 15, rowHeight, 'F');
      }
      
      // Draw cell borders for professional look
      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.1);
      cellContents.forEach((cell, colIndex) => {
        doc.rect(colPositions[colIndex], yPos - 1, colWidths[exportData.columns[colIndex].label], rowHeight);
      });
      
      // Draw text content
      cellContents.forEach(cell => {
        cell.text.forEach((line, lineIndex) => {
          if (line && line.trim()) {
            doc.text(line, cell.x, yPos + 2 + (lineIndex * 3.5));
          }
        });
      });
      
      yPos += rowHeight;
      
      // Smart page break with header repetition
      if (yPos > pageH - 30) {
        doc.addPage('landscape', 'a4');
        yPos = 20;
        
        // Repeat headers on new page
        doc.setFillColor(240, 240, 240);
        doc.rect(15, yPos - 2, currentX - 15, 8, 'F');
        
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(60, 60, 60);
        
        exportData.columns.forEach((col, index) => {
          doc.text(col.label, colPositions[index] + 1, yPos + 3);
        });
        
        yPos += 8;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(40, 40, 40);
      }
    });
    
    // Add totals if provided
    if (exportData.totals && exportData.totals.length > 0) {
      yPos += 10;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('TOTALIZADORES:', 15, yPos);
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      yPos += 6;
      exportData.totals.forEach(total => {
        doc.text(`• ${total}`, 20, yPos);
        yPos += 4;
      });
    }
    
    // Footer
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text('Sistema de Gerenciamento de Almoxarifado', 15, pageH - 10);
    
    return Buffer.from(doc.output('arraybuffer'));
  }
  
  // Generate Excel export
  static generateExcel(exportData: ExportData): Buffer {
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
      wch: col.width ? col.width / 4 : 15
    }));
    worksheet['!cols'] = columnWidths;
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Dados');
    
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
      if (value % 1 !== 0 && value < 1000000) {
        return `R$ ${value.toFixed(2).replace('.', ',')}`;
      }
      return value.toLocaleString('pt-BR');
    }
    return String(value);
  }

  // Helper method to abbreviate units in Quantidade field
  private static abbreviateUnit(value: string): string {
    if (!value || value === '-') return value;
    
    const abbreviations: { [key: string]: string } = {
      'unidade': 'un.',
      'unidades': 'un.',
      'kilogram': 'kg',
      'kilograms': 'kg',
      'quilogram': 'kg',
      'quilogramas': 'kg',
      'metro': 'm',
      'metros': 'm',
      'litro': 'L',
      'litros': 'L',
      'peça': 'pç',
      'peças': 'pç',
      'caixa': 'cx',
      'caixas': 'cx',
      'pacote': 'pct',
      'pacotes': 'pct'
    };
    
    let result = value;
    for (const [full, abbrev] of Object.entries(abbreviations)) {
      const regex = new RegExp(`\\b${full}\\b`, 'gi');
      result = result.replace(regex, abbrev);
    }
    
    return result;
  }
}

// Export configurations for different data types
export const EXPORT_CONFIGS = {
  materials: {
    title: 'Relatório de Materiais',
    columns: [
      { key: 'name', label: 'Nome' },
      { key: 'description', label: 'Descrição' },
      { key: 'category.name', label: 'Categoria' },
      { key: 'supplier.name', label: 'Fornecedor' },
      { key: 'unit', label: 'Unidade' },
      { key: 'currentStock', label: 'Estoque Atual' },
      { key: 'minStock', label: 'Estoque Mínimo' },
      { key: 'location', label: 'Localização' }
    ]
  },
  categories: {
    title: 'Relatório de Categorias',
    columns: [
      { key: 'name', label: 'Nome' },
      { key: 'description', label: 'Descrição' },
      { key: 'code', label: 'Código' }
    ]
  },
  employees: {
    title: 'Relatório de Funcionários',
    columns: [
      { key: 'name', label: 'Nome' },
      { key: 'department', label: 'Departamento' },
      { key: 'position', label: 'Cargo' },
      { key: 'email', label: 'E-mail' },
      { key: 'phone', label: 'Telefone' },
      { key: 'isActive', label: 'Status' }
    ]
  },
  suppliers: {
    title: 'Relatório de Fornecedores',
    columns: [
      { key: 'name', label: 'Nome' },
      { key: 'cnpj', label: 'CNPJ' },
      { key: 'contact', label: 'Contato' },
      { key: 'email', label: 'E-mail' },
      { key: 'phone', label: 'Telefone' },
      { key: 'address', label: 'Endereço' },
      { key: 'isActive', label: 'Status' }
    ]
  },
  thirdParties: {
    title: 'Relatório de Terceiros',
    columns: [
      { key: 'name', label: 'Nome' },
      { key: 'company', label: 'Empresa' },
      { key: 'contact', label: 'Contato' },
      { key: 'email', label: 'E-mail' },
      { key: 'phone', label: 'Telefone' },
      { key: 'isActive', label: 'Status' }
    ]
  },
  costCenters: {
    title: 'Relatório de Centros de Custo',
    columns: [
      { key: 'code', label: 'Código' },
      { key: 'name', label: 'Nome' },
      { key: 'department', label: 'Departamento' },
      { key: 'budget', label: 'Orçamento' },
      { key: 'isActive', label: 'Status' },
      { key: 'description', label: 'Descrição' }
    ]
  }
};

// Legacy class for backward compatibility
export class PDFGenerator {
  static generatePDFText(exportData: ExportData): string {
    // This method is deprecated, use ExportService.generatePDF instead
    return ExportService.generatePDF(exportData).toString();
  }
}