import ExcelJS from 'exceljs';
import { ExpenseReport } from './types';

export async function exportToExcel(report: ExpenseReport, employeeName: string = 'Mitarbeiter') {
  const { travelDetails, expenses, summary, total } = report;

  // Create workbook and worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Deutsch');

  // Extract month and year from departure date
  const [day, month, year] = travelDetails.departureDate.split('.');

  // Header rows
  worksheet.mergeCells('A1:K1');
  const titleCell = worksheet.getCell('A1');
  titleCell.value = `Reisekosten und Spesen  ${employeeName}`;
  titleCell.font = { bold: true, size: 14 };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  worksheet.mergeCells('A2:K2');
  const periodCell = worksheet.getCell('A2');
  periodCell.value = `Abrechnungszeitraum  [${month}, ${year}]`;
  periodCell.font = { bold: true };
  periodCell.alignment = { horizontal: 'center', vertical: 'middle' };

  // Empty row
  worksheet.addRow([]);

  // Column headers
  const headerRow = worksheet.addRow([
    'Reisebeginn /\n-ende (Datum)',
    'Abwesenheit von /bis (Uhrzeit) \n*',
    'Reiseanlass\n**',
    'Fahrt (von/bis)\n***',
    'öffentliche Verkehrsmittel',
    'Hotel/Übernachtung (mit Frühstück)',
    'Hotel/Übernachtung (ohne Frühstück)',
    'Verpflegungs-mehraufwand ****',
    'gefahrene km / Privatfahr- zeug',
    'Fahrzeug- kosten \n*****',
    'sonstige Kosten \n******'
  ]);

  // Style header row
  headerRow.height = 40;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
  });

  // Empty row
  worksheet.addRow([]);

  // Data row
  const dateRange = `${travelDetails.departureDate}-${travelDetails.returnDate}`;
  const timeRange = `${travelDetails.departureTime} -${travelDetails.returnTime}`;
  const route = `${travelDetails.startLocation} - ${travelDetails.destination} - ${travelDetails.startLocation}`;

  const dataRow = worksheet.addRow([
    dateRange,
    timeRange,
    travelDetails.travelReason,
    route,
    summary.publicTransportTotal,
    summary.hotelWithBreakfastTotal,
    summary.hotelWithoutBreakfastTotal,
    summary.mealAllowance,
    expenses.vehicleKilometers.reduce((sum, item) => sum + item.amount, 0),
    summary.vehicleCosts,
    summary.otherCostsTotal
  ]);

  dataRow.eachCell((cell) => {
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
    cell.alignment = { vertical: 'middle' };
  });

  // Empty row
  worksheet.addRow([]);

  // Subtotals row
  const subtotalRow = worksheet.addRow([
    'Zwischensummen',
    '',
    '',
    '',
    summary.publicTransportTotal,
    summary.hotelWithBreakfastTotal,
    summary.hotelWithoutBreakfastTotal,
    summary.mealAllowance,
    '',
    summary.vehicleCosts,
    summary.otherCostsTotal
  ]);

  subtotalRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF0F0F0' }
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
    cell.alignment = { vertical: 'middle' };
  });

  // Total row
  const totalRow = worksheet.addRow([
    'Gesamt',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    total
  ]);

  totalRow.eachCell((cell) => {
    cell.font = { bold: true, size: 12 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD0D0D0' }
    };
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
    cell.alignment = { vertical: 'middle' };
  });

  // Empty row
  worksheet.addRow([]);

  // General information
  worksheet.addRow([
    'Allgemeines\n' +
    ' - Die Belege zu den Reisekosten und Spesen sind digital einzureichen und der Abrechnung beizufügen\n' +
    ' - Alle Belege sind auf die Ringier Emerging Markets GmbH, Axel-Springer-Straße 65, 10969 Berlin auszustellen\n' +
    ' - Reisekosten und Spesen in einer anderen Währung als in € sind mit dem Tageskurs bei der Erstellung der Abrechnung umzurechnen. Der Tageskurs kann unter dem folgenden Link\n' +
    '   ermittelt werden: https://bankenverband.de/service/waehrungsrechner/'
  ]);

  worksheet.addRow(['Erläuterungen']);
  worksheet.addRow(['*', 'Abwesenheit von/bis (Uhrzeit)']);
  worksheet.addRow(['**', 'Bsp. Besprechung, Meeting, Workshop, Kundentermin']);
  worksheet.addRow(['***', 'Bsp. München - Zürich - München']);

  worksheet.addRow([
    '****',
    'INLAND\n' +
    ' - Bei einer Abwesenheitsdauer von mindestens 24 Stunden je Kalendertag (=24h): € 40.00 \n' +
    ' - Für den An- und Abreisetag sowie bei einer Abwesenheitsdauer von mehr als 8 Stunden aber weniger als 24 Stunden (<8 - >24): € 20.00'
  ]);

  worksheet.addRow([
    '',
    'AUSLAND\n' +
    ' - Bei der Anreise vom Inland in das Ausland oder vom Ausland in das Inland jeweils ohne Tätigwerden ist der entsprechende Pauschbetrag des Ortes maßgebend, \n' +
    '   der vor 24 Uhr Ortszeit erreicht wird\n' +
    ' - Bei der Abreise vom Ausland in das Inland oder vom Inland in das Ausland ist der entsprechende Pauschbetrag des letzten Tätigkeitsortes maßgebend\n' +
    ' - Für die Tage zwischen Anreise- und Abreisetag (Zwischentage) ist in der Regel der entsprechende Pauschbetrag des Ortes maßgebend, der vor 24 Uhr Ortszeit\n' +
    '   erreicht wird\n' +
    ' - Die Verpflegungsmehraufwendungen sind um 20% des Pauschbetrages zu kürzen, wenn der Arbeitgeber das Frühstück des Mitarbeiters beispielsweise im\n' +
    '   Rahmen einer Hotelübernachtung bezahlt\n' +
    ' - Die Verpflegungsmehraufwendungen sind um € 5,60 zu kürzen, wenn der Arbeitgeber das Frühstück des Mitarbeiters beispielsweise im Rahmen einer\n' +
    '   Hotelübernachtung bezahlt\n' +
    ' - Die Pauschale für den Verpflegungsmehraufwand bei Reisen ins Ausland variiert: '
  ]);

  worksheet.addRow([
    '*****',
    'Die insgesamt gefahrenen Kilometer sind mit € 0,30 zu multiplizieren'
  ]);

  worksheet.addRow([
    '******',
    'Bsp. Kosten für Taxi, Parken, Maut, Gepäckbeförderung/-aufbewahrung'
  ]);

  // Set column widths
  worksheet.columns = [
    { width: 20 },  // Reisebeginn
    { width: 20 },  // Abwesenheit
    { width: 30 },  // Reiseanlass
    { width: 30 },  // Fahrt
    { width: 15 },  // öffentliche Verkehrsmittel
    { width: 20 },  // Hotel mit Frühstück
    { width: 20 },  // Hotel ohne Frühstück
    { width: 20 },  // Verpflegungsmehraufwand
    { width: 15 },  // gefahrene km
    { width: 15 },  // Fahrzeugkosten
    { width: 15 },  // sonstige Kosten
  ];

  // Set row heights
  worksheet.getRow(1).height = 25;  // Title
  worksheet.getRow(2).height = 20;  // Period

  // Generate buffer and download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Reisekosten_${travelDetails.departureDate.replace(/\./g, '-')}_${travelDetails.returnDate.replace(/\./g, '-')}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}
