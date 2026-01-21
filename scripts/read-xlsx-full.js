const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'Abrechnung Januar 26.xlsx');

try {
  const workbook = XLSX.readFile(filePath);

  workbook.SheetNames.forEach(sheetName => {
    console.log(`\n=== Sheet: ${sheetName} ===`);
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    // Filter out completely empty rows
    const nonEmptyRows = jsonData.filter(row =>
      row.some(cell => cell !== '' && cell !== null && cell !== undefined)
    );

    console.log(`Total non-empty rows: ${nonEmptyRows.length}`);
    console.log('\nData:');
    nonEmptyRows.forEach((row, idx) => {
      console.log(`Row ${idx}:`, row);
    });
  });
} catch (error) {
  console.error('Error reading file:', error);
}
