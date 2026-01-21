const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'Abrechnung Januar 26.xlsx');

try {
  const workbook = XLSX.readFile(filePath, { cellStyles: true });

  console.log('Checking for embedded images...\n');

  workbook.SheetNames.forEach(sheetName => {
    console.log(`\n=== Sheet: ${sheetName} ===`);
    const worksheet = workbook.Sheets[sheetName];

    // Check if there are any images in the worksheet
    if (worksheet['!images']) {
      console.log(`Found ${worksheet['!images'].length} images`);
      worksheet['!images'].forEach((img, idx) => {
        console.log(`Image ${idx}:`, img);
      });
    }

    // Check for drawing objects
    if (worksheet['!drawing']) {
      console.log('Drawing objects found:', worksheet['!drawing']);
    }

    // Check workbook media
    if (workbook.media) {
      console.log('Media found in workbook');
    }
  });

  // Try to access workbook parts
  if (workbook.Workbook) {
    console.log('\nWorkbook properties:', Object.keys(workbook.Workbook));
  }

  // Check for Sheets property details
  workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    const keys = Object.keys(worksheet).filter(k => k.startsWith('!'));
    console.log(`\nSpecial properties in ${sheetName}:`, keys);
  });

} catch (error) {
  console.error('Error reading file:', error);
}
