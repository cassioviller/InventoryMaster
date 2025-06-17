import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface ExportData {
  title: string;
  filename: string;
  headers: string[];
  data: any[][];
}

export function exportToPDF(exportData: ExportData) {
  const doc = new jsPDF();
  
  // Título do relatório
  doc.setFontSize(18);
  doc.text(exportData.title, 20, 25);
  
  // Data e hora da geração
  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR');
  doc.setFontSize(10);
  doc.text(`Gerado em: ${dateStr} às ${timeStr}`, 20, 35);
  
  // Tabela com os dados
  autoTable(doc, {
    head: [exportData.headers],
    body: exportData.data,
    startY: 45,
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [66, 139, 202],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { top: 45, right: 20, bottom: 20, left: 20 },
  });
  
  // Download do arquivo
  doc.save(`${exportData.filename}.pdf`);
}

export function exportToExcel(exportData: ExportData) {
  // Criar workbook
  const wb = XLSX.utils.book_new();
  
  // Preparar dados com cabeçalhos
  const wsData = [exportData.headers, ...exportData.data];
  
  // Criar worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Ajustar largura das colunas
  const colWidths = exportData.headers.map(() => ({ width: 20 }));
  ws['!cols'] = colWidths;
  
  // Adicionar worksheet ao workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
  
  // Download do arquivo
  XLSX.writeFile(wb, `${exportData.filename}.xlsx`);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('pt-BR');
}