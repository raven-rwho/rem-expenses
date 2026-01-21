const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '..', 'Abrechnung Januar 26.xlsx');

try {
  const workbook = XLSX.readFile(filePath);
  console.log('Sheet Names:', workbook.SheetNames);
  console.log('\n');

  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  const jsonData = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: '',
    raw: false,
    blankrows: true
  });

  console.log('=== Full Days (Volle Tage) - Starting from Row 58 ===');
  for (let i = 57; i < 72; i++) {
    if (jsonData[i]) {
      console.log(`Row ${i + 1}:`, jsonData[i]);
    }
  }

  console.log('\n=== Arrival/Departure Days (An und Abreisetage) - Starting from Row 72 ===');
  for (let i = 71; i < 90; i++) {
    if (jsonData[i]) {
      console.log(`Row ${i + 1}:`, jsonData[i]);
    }
  }

} catch (error) {
  console.error('Error reading file:', error);
}
