// Sistema de exportação simplificado e robusto
export interface SimpleExportData {
  title: string;
  filters?: string[];
  headers: string[];
  rows: string[][];
  totals?: string[];
}

export class SimpleExporter {
  static generatePDFText(data: SimpleExportData): Buffer {
    let content = '';
    
    // Header with title
    content += `═══════════════════════════════════════════════════════════════════════════════\n`;
    content += `                        ${data.title.toUpperCase()}\n`;
    content += `═══════════════════════════════════════════════════════════════════════════════\n\n`;
    
    // Filters section
    if (data.filters && data.filters.length > 0) {
      content += `📋 INFORMAÇÕES DO RELATÓRIO:\n`;
      content += `───────────────────────────────────────────────────────────────────────────────\n`;
      data.filters.forEach(filter => {
        content += `   • ${filter}\n`;
      });
      content += `\n`;
    }
    
    // Data table with professional formatting
    if (data.rows.length > 0) {
      content += `📊 DADOS DO RELATÓRIO:\n`;
      content += `───────────────────────────────────────────────────────────────────────────────\n\n`;
      
      // Calculate column widths for better formatting
      const colWidths = data.headers.map((header, i) => {
        const maxDataWidth = Math.max(...data.rows.map(row => String(row[i] || '').length));
        return Math.max(header.length, maxDataWidth, 8);
      });
      
      // Header row
      const headerRow = data.headers.map((header, i) => 
        header.padEnd(colWidths[i])
      ).join(' │ ');
      content += headerRow + '\n';
      
      // Separator
      const separator = colWidths.map(width => '─'.repeat(width)).join('─┼─');
      content += separator + '\n';
      
      // Data rows with proper alignment
      data.rows.forEach(row => {
        const formattedRow = row.map((cell, i) => 
          String(cell || '').padEnd(colWidths[i])
        ).join(' │ ');
        content += formattedRow + '\n';
      });
      
      content += `\n`;
    } else {
      content += `📊 DADOS:\n`;
      content += `───────────────────────────────────────────────────────────────────────────────\n`;
      content += `   ⚠️  Nenhum registro encontrado com os filtros aplicados.\n\n`;
    }
    
    // Totals section
    if (data.totals && data.totals.length > 0) {
      content += `💰 RESUMOS E TOTAIS:\n`;
      content += `───────────────────────────────────────────────────────────────────────────────\n`;
      data.totals.forEach(total => {
        content += `   • ${total}\n`;
      });
      content += `\n`;
    }
    
    // Footer
    content += `═══════════════════════════════════════════════════════════════════════════════\n`;
    content += `📅 Relatório gerado em: ${new Date().toLocaleString('pt-BR')}\n`;
    content += `🏢 Sistema de Gerenciamento de Almoxarifado\n`;
    content += `📋 Dados extraídos sem truncamento - Layout otimizado para visualização\n`;
    content += `═══════════════════════════════════════════════════════════════════════════════\n`;
    
    return Buffer.from(content, 'utf-8');
  }

  static generateExcelText(data: SimpleExportData): Buffer {
    let content = '';
    
    // Title and metadata
    content += `${data.title}\n`;
    content += `Gerado em: ${new Date().toLocaleString('pt-BR')}\n\n`;
    
    // Filters
    if (data.filters && data.filters.length > 0) {
      content += `Filtros:\n`;
      data.filters.forEach(filter => {
        content += `${filter}\n`;
      });
      content += `\n`;
    }
    
    // Headers (tab-separated for Excel compatibility)
    content += data.headers.join('\t') + '\n';
    
    // Data rows
    data.rows.forEach(row => {
      content += row.join('\t') + '\n';
    });
    
    // Totals
    if (data.totals && data.totals.length > 0) {
      content += `\nTotais:\n`;
      data.totals.forEach(total => {
        content += `${total}\n`;
      });
    }
    
    return Buffer.from(content, 'utf-8');
  }

  static abbreviateUnit(unit: string): string {
    const abbreviations: { [key: string]: string } = {
      'unidade': 'un.',
      'unidades': 'un.',
      'kilogram': 'kg',
      'quilogram': 'kg',
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
    return abbreviations[unit.toLowerCase()] || unit;
  }

  static formatCurrency(value: number): string {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  }

  static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}