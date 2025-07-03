import fs from 'fs';
import path from 'path';

export interface PDFExportData {
  title: string;
  filters?: string[];
  headers: string[];
  rows: string[][];
  totals?: string[];
}

export class PDFGenerator {
  static generatePDFText(data: PDFExportData): Buffer {
    let content = '';
    
    // Title
    content += `═══════════════════════════════════════════════════════════════════════════════\n`;
    content += `                           ${data.title.toUpperCase()}\n`;
    content += `═══════════════════════════════════════════════════════════════════════════════\n\n`;
    
    // Filters section
    if (data.filters && data.filters.length > 0) {
      content += `📋 FILTROS APLICADOS:\n`;
      content += `───────────────────────────────────────────────────────────────────────────────\n`;
      data.filters.forEach(filter => {
        content += `   • ${filter}\n`;
      });
      content += `\n`;
    }
    
    // Data table
    if (data.rows.length > 0) {
      content += `📊 DADOS:\n`;
      content += `───────────────────────────────────────────────────────────────────────────────\n`;
      
      // Headers
      const headerLine = data.headers.join(' │ ');
      content += headerLine + '\n';
      content += '─'.repeat(headerLine.length) + '\n';
      
      // Data rows
      data.rows.forEach(row => {
        const rowLine = row.join(' │ ');
        content += rowLine + '\n';
      });
      
      content += `\n`;
    } else {
      content += `📊 DADOS:\n`;
      content += `───────────────────────────────────────────────────────────────────────────────\n`;
      content += `   ⚠️  Nenhum registro encontrado com os filtros aplicados.\n\n`;
    }
    
    // Totals section
    if (data.totals && data.totals.length > 0) {
      content += `💰 TOTALIZADORES:\n`;
      content += `───────────────────────────────────────────────────────────────────────────────\n`;
      data.totals.forEach(total => {
        content += `   • ${total}\n`;
      });
      content += `\n`;
    }
    
    // Footer
    content += `═══════════════════════════════════════════════════════════════════════════════\n`;
    content += `📅 Gerado em: ${new Date().toLocaleString('pt-BR')}\n`;
    content += `🏢 Sistema de Almoxarifado - Relatório de Movimentações\n`;
    content += `═══════════════════════════════════════════════════════════════════════════════\n`;
    
    return Buffer.from(content, 'utf-8');
  }
  
  static formatRowData(movement: any): string[] {
    return [
      new Date(movement.date || movement.createdAt).toLocaleDateString('pt-BR'),
      movement.displayType || (movement.type === 'entry' ? 'Entrada' : movement.type === 'exit' ? 'Saída' : 'Devolução'),
      movement.material?.name || '-',
      `${movement.quantity || 0} ${movement.material?.unit || ''}`,
      `R$ ${(movement.totalValue || 0).toFixed(2).replace('.', ',')}`,
      movement.originDestination || '-',
      movement.responsiblePerson || '-',
      movement.costCenter ? `${movement.costCenter.code} - ${movement.costCenter.name}` : '-'
    ];
  }
}