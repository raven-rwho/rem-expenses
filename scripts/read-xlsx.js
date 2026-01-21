const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'Abrechnung Januar 26.xlsx');

try {
  const workbook = XLSX.readFile(filePath);

  console.log('Sheet Names:', workbook.SheetNames);
  console.log('\n');

  workbook.SheetNames.forEach(sheetName => {
    console.log(`\n=== Sheet: ${sheetName} ===`);
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    console.log('Data:');
    jsonData.forEach((row, idx) => {
      if (idx < 20) { // Show first 20 rows
        console.log(`Row ${idx}:`, row);
      }
    });

    if (jsonData.length > 20) {
      console.log(`... (${jsonData.length - 20} more rows)`);
    }
  });
} catch (error) {
  console.error('Error reading file:', error);
}
