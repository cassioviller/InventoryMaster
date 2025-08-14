import PDFDocument from 'pdfkit';

// Sistema de exportação simplificado e robusto
export interface SimpleExportData {
  title: string;
  filters?: string[];
  headers: string[];
  rows: string[][];
  totals?: string[];
}

export class SimpleExporter {
  static async generatePDF(data: SimpleExportData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          layout: 'landscape',
          margins: { top: 50, bottom: 50, left: 50, right: 50 }
        });

        const buffers: Buffer[] = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });

        let yPosition = 70;

        // Title
        doc.fontSize(16).font('Helvetica-Bold');
        doc.text(data.title.toUpperCase(), 50, yPosition, { align: 'center' });
        yPosition += 40;

        // Filters section
        if (data.filters && data.filters.length > 0) {
          doc.fontSize(12).font('Helvetica-Bold');
          doc.text('Filtros Aplicados:', 50, yPosition);
          yPosition += 20;
          
          doc.fontSize(10).font('Helvetica');
          data.filters.forEach(filter => {
            doc.text(`• ${filter}`, 60, yPosition);
            yPosition += 15;
          });
          yPosition += 10;
        }

        // Check if we need a new page
        if (yPosition > 500) {
          doc.addPage();
          yPosition = 50;
        }

        // Table
        if (data.rows.length > 0) {
          const tableTop = yPosition;
          const tableLeft = 50;
          const pageWidth = 750; // A4 landscape width minus margins
          const colWidth = pageWidth / data.headers.length;
          
          // Header row
          doc.fontSize(10).font('Helvetica-Bold');
          data.headers.forEach((header, i) => {
            const x = tableLeft + (i * colWidth);
            doc.text(header, x, tableTop, { width: colWidth - 5, align: 'left' });
          });
          
          yPosition = tableTop + 20;
          
          // Separator line
          doc.moveTo(tableLeft, yPosition)
             .lineTo(tableLeft + pageWidth, yPosition)
             .stroke();
          
          yPosition += 10;

          // Data rows
          doc.font('Helvetica').fontSize(9);
          data.rows.forEach((row, rowIndex) => {
            // Check if we need a new page
            if (yPosition > 520) {
              doc.addPage();
              yPosition = 50;
              
              // Repeat headers on new page
              doc.fontSize(10).font('Helvetica-Bold');
              data.headers.forEach((header, i) => {
                const x = tableLeft + (i * colWidth);
                doc.text(header, x, yPosition, { width: colWidth - 5, align: 'left' });
              });
              yPosition += 25;
            }

            row.forEach((cell, i) => {
              const x = tableLeft + (i * colWidth);
              const cellText = String(cell || '');
              doc.text(cellText, x, yPosition, { width: colWidth - 5, align: 'left' });
            });
            yPosition += 15;
          });
        } else {
          doc.fontSize(12).font('Helvetica');
          doc.text('Nenhum registro encontrado com os filtros aplicados.', 50, yPosition);
          yPosition += 30;
        }

        // Totals section
        if (data.totals && data.totals.length > 0) {
          yPosition += 20;
          
          if (yPosition > 500) {
            doc.addPage();
            yPosition = 50;
          }
          
          doc.fontSize(12).font('Helvetica-Bold');
          doc.text('Resumos e Totais:', 50, yPosition);
          yPosition += 20;
          
          doc.fontSize(10).font('Helvetica');
          data.totals.forEach(total => {
            doc.text(`• ${total}`, 60, yPosition);
            yPosition += 15;
          });
        }

        // Simple footer without page switching to avoid PDFKit bugs
        doc.fontSize(8).font('Helvetica');
        doc.text(
          `Gerado em: ${new Date().toLocaleString('pt-BR')} | Sistema de Almoxarifado`,
          50,
          550,
          { align: 'center' }
        );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

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