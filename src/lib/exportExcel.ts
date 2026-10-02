import * as XLSX from 'xlsx';

export function exportToExcel(data: Record<string, any>[], filename: string = 'rapor.xlsx', sheetName: string = 'Veriler') {
  if (!data || data.length === 0) {
    alert('Dışa aktarılacak veri bulunamadı.');
    return;
  }
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`);
}

export function exportToCSV(data: Record<string, any>[], filename: string = 'rapor.csv') {
  if (!data || data.length === 0) {
    alert('Dışa aktarılacak veri bulunamadı.');
    return;
  }
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob(['\uFEFF' + csvOutput], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
