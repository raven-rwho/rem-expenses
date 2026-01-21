const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'Abrechnung Januar 26.xlsx');

try {
  const workbook = XLSX.readFile(filePath);

  workbook.SheetNames.forEach(sheetName => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Sheet: ${sheetName}`);
    console.log('='.repeat(60));

    const worksheet = workbook.Sheets[sheetName];
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

    console.log(`Range: ${worksheet['!ref']}`);
    console.log(`Rows: ${range.e.r + 1}, Columns: ${range.e.c + 1}\n`);

    // Get all data with original formatting
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      raw: false,
      blankrows: true
    });

    console.log('All rows (first 100):');
    jsonData.slice(0, 100).forEach((row, idx) => {
      if (row.some(cell => cell !== '' && cell !== null && cell !== undefined)) {
        console.log(`Row ${idx}:`, JSON.stringify(row));
      }
    });

    if (jsonData.length > 100) {
      console.log(`\n... (${jsonData.length - 100} more rows, checking last 50 rows)`);
      jsonData.slice(-50).forEach((row, idx) => {
        if (row.some(cell => cell !== '' && cell !== null && cell !== undefined)) {
          console.log(`Row ${jsonData.length - 50 + idx}:`, JSON.stringify(row));
        }
      });
    }
  });
} catch (error) {
  console.error('Error reading file:', error);
}
