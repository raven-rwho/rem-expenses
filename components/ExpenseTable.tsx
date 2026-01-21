'use client';

import { ExpenseReport } from '@/lib/types';
import { exportToExcel } from '@/lib/exportToExcel';

interface ExpenseTableProps {
  report: ExpenseReport;
  onReset: () => void;
}

export default function ExpenseTable({ report, onReset }: ExpenseTableProps) {
  const { travelDetails, expenses, summary, total } = report;

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white shadow-md rounded-lg p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                REM expenses
              </h1>
              <p className="text-gray-600">Reisekostenabrechnung - Travel Expense Report</p>
            </div>
            <button
              onClick={onReset}
              className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Neue Abrechnung
            </button>
          </div>

          {/* Travel Details Summary */}
          <div className="mb-8 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Reisedetails
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="md:col-span-2">
                <span className="font-medium text-gray-700">Mitarbeiter:</span>{' '}
                <span className="text-gray-600">
                  {travelDetails.employeeName}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Route:</span>{' '}
                <span className="text-gray-600">
                  {travelDetails.startLocation} - {travelDetails.destination} -{' '}
                  {travelDetails.startLocation}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Zielland:</span>{' '}
                <span className="text-gray-600">
                  {travelDetails.destinationCountry}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Abreise:</span>{' '}
                <span className="text-gray-600">
                  {travelDetails.departureDate} um {travelDetails.departureTime}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Rückkehr:</span>{' '}
                <span className="text-gray-600">
                  {travelDetails.returnDate} um {travelDetails.returnTime}
                </span>
              </div>
              <div className="md:col-span-2">
                <span className="font-medium text-gray-700">Reiseanlass:</span>{' '}
                <span className="text-gray-600">{travelDetails.travelReason}</span>
              </div>
            </div>
          </div>

          {/* Expense Breakdown Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Kostenkategorie
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Betrag
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Public Transport */}
                {expenses.publicTransport.length > 0 && (
                  <>
                    <tr className="bg-gray-50">
                      <td
                        colSpan={2}
                        className="px-6 py-2 text-sm font-semibold text-gray-900"
                      >
                        Öffentliche Verkehrsmittel
                      </td>
                    </tr>
                    {expenses.publicTransport.map((item, index) => (
                      <tr key={`pt-${index}`}>
                        <td className="px-6 py-3 pl-12 text-sm text-gray-700">
                          {item.description}
                          {item.currency && item.currency !== 'EUR' && item.exchangeRate && (
                            <span className="block text-xs text-gray-500">
                              ({item.currency} {item.amount.toFixed(2)} × {item.exchangeRate.toFixed(4)} = {formatCurrency(item.amountEUR || 0)})
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(item.amountEUR || item.amount)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-blue-50">
                      <td className="px-6 py-3 pl-12 text-sm font-medium text-gray-900">
                        Zwischensumme Öffentliche Verkehrsmittel
                      </td>
                      <td className="px-6 py-3 text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(summary.publicTransportTotal)}
                      </td>
                    </tr>
                  </>
                )}

                {/* Hotel with Breakfast */}
                {expenses.hotelWithBreakfast.length > 0 && (
                  <>
                    <tr className="bg-gray-50">
                      <td
                        colSpan={2}
                        className="px-6 py-2 text-sm font-semibold text-gray-900"
                      >
                        Hotel/Übernachtung (mit Frühstück)
                      </td>
                    </tr>
                    {expenses.hotelWithBreakfast.map((item, index) => (
                      <tr key={`hwb-${index}`}>
                        <td className="px-6 py-3 pl-12 text-sm text-gray-700">
                          {item.description}
                          {item.currency && item.currency !== 'EUR' && item.exchangeRate && (
                            <span className="block text-xs text-gray-500">
                              ({item.currency} {item.amount.toFixed(2)} × {item.exchangeRate.toFixed(4)} = {formatCurrency(item.amountEUR || 0)})
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(item.amountEUR || item.amount)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-blue-50">
                      <td className="px-6 py-3 pl-12 text-sm font-medium text-gray-900">
                        Zwischensumme Hotel (mit Frühstück)
                      </td>
                      <td className="px-6 py-3 text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(summary.hotelWithBreakfastTotal)}
                      </td>
                    </tr>
                  </>
                )}

                {/* Hotel without Breakfast */}
                {expenses.hotelWithoutBreakfast.length > 0 && (
                  <>
                    <tr className="bg-gray-50">
                      <td
                        colSpan={2}
                        className="px-6 py-2 text-sm font-semibold text-gray-900"
                      >
                        Hotel/Übernachtung (ohne Frühstück)
                      </td>
                    </tr>
                    {expenses.hotelWithoutBreakfast.map((item, index) => (
                      <tr key={`hwob-${index}`}>
                        <td className="px-6 py-3 pl-12 text-sm text-gray-700">
                          {item.description}
                          {item.currency && item.currency !== 'EUR' && item.exchangeRate && (
                            <span className="block text-xs text-gray-500">
                              ({item.currency} {item.amount.toFixed(2)} × {item.exchangeRate.toFixed(4)} = {formatCurrency(item.amountEUR || 0)})
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(item.amountEUR || item.amount)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-blue-50">
                      <td className="px-6 py-3 pl-12 text-sm font-medium text-gray-900">
                        Zwischensumme Hotel (ohne Frühstück)
                      </td>
                      <td className="px-6 py-3 text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(summary.hotelWithoutBreakfastTotal)}
                      </td>
                    </tr>
                  </>
                )}

                {/* Meal Allowance */}
                {expenses.mealAllowanceBreakdown && expenses.mealAllowanceBreakdown.length > 0 && (
                  <>
                    <tr className="bg-gray-50">
                      <td
                        colSpan={2}
                        className="px-6 py-2 text-sm font-semibold text-gray-900"
                      >
                        Verpflegungsmehraufwand
                      </td>
                    </tr>
                    {expenses.mealAllowanceBreakdown.map((day, index) => (
                      <tr key={`meal-${index}`}>
                        <td className="px-6 py-3 pl-12 text-sm text-gray-700">
                          {day.date} - {day.type}
                          {day.breakfastDeduction > 0 && (
                            <span className="block text-xs text-gray-500">
                              (Pauschale: {formatCurrency(day.baseAmount)}, Frühstücksabzug: -{formatCurrency(day.breakfastDeduction)})
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-900 text-right">
                          {formatCurrency(day.finalAmount)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-blue-50">
                      <td className="px-6 py-3 pl-12 text-sm font-medium text-gray-900">
                        Zwischensumme Verpflegungsmehraufwand
                        <span className="block text-xs text-gray-600 font-normal">
                          (Berechnet nach Reisedauer und {travelDetails.destinationCountry})
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(expenses.mealAllowance)}
                      </td>
                    </tr>
                  </>
                )}

                {/* Vehicle Kilometers */}
                {expenses.vehicleKilometers.length > 0 && (
                  <>
                    <tr className="bg-gray-50">
                      <td
                        colSpan={2}
                        className="px-6 py-2 text-sm font-semibold text-gray-900"
                      >
                        Fahrzeugkosten (Privatfahrzeug)
                      </td>
                    </tr>
                    {expenses.vehicleKilometers.map((item, index) => (
                      <tr key={`vk-${index}`}>
                        <td className="px-6 py-3 pl-12 whitespace-nowrap text-sm text-gray-700">
                          {item.description}
                          <span className="text-xs text-gray-500 ml-2">
                            ({item.amount} km)
                          </span>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(item.amount * 0.3)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-blue-50">
                      <td className="px-6 py-3 pl-12 text-sm font-medium text-gray-900">
                        Zwischensumme Fahrzeugkosten
                        <span className="block text-xs text-gray-600 font-normal">
                          (
                          {expenses.vehicleKilometers.reduce(
                            (sum, item) => sum + item.amount,
                            0
                          )}{' '}
                          km × €0.30)
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(summary.vehicleCosts)}
                      </td>
                    </tr>
                  </>
                )}

                {/* Other Costs */}
                {expenses.otherCosts.length > 0 && (
                  <>
                    <tr className="bg-gray-50">
                      <td
                        colSpan={2}
                        className="px-6 py-2 text-sm font-semibold text-gray-900"
                      >
                        Sonstige Kosten
                      </td>
                    </tr>
                    {expenses.otherCosts.map((item, index) => (
                      <tr key={`oc-${index}`}>
                        <td className="px-6 py-3 pl-12 text-sm text-gray-700">
                          {item.description}
                          {item.currency && item.currency !== 'EUR' && item.exchangeRate && (
                            <span className="block text-xs text-gray-500">
                              ({item.currency} {item.amount.toFixed(2)} × {item.exchangeRate.toFixed(4)} = {formatCurrency(item.amountEUR || 0)})
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                          {formatCurrency(item.amountEUR || item.amount)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-blue-50">
                      <td className="px-6 py-3 pl-12 text-sm font-medium text-gray-900">
                        Zwischensumme Sonstige Kosten
                      </td>
                      <td className="px-6 py-3 text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(summary.otherCostsTotal)}
                      </td>
                    </tr>
                  </>
                )}
              </tbody>
              <tfoot className="bg-gray-100">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-gray-900">
                    Gesamtsumme
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-base font-bold text-gray-900 text-right">
                    {formatCurrency(total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Notes Section */}
          <div className="mt-8 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
            <h3 className="text-sm font-semibold text-yellow-800 mb-2">
              Hinweise
            </h3>
            <ul className="text-xs text-yellow-700 space-y-1">
              <li>
                • Alle Belege sind digital einzureichen und der Abrechnung beizufügen
              </li>
              <li>
                • Belege müssen auf Ringier Emerging Markets GmbH ausgestellt sein
              </li>
              <li>
                • Fremdwährungen sind mit dem Tageskurs umzurechnen
              </li>
              <li>
                • Verpflegungsmehraufwand wurde automatisch nach{' '}
                {travelDetails.destinationCountry} Pauschalen berechnet
              </li>
              {summary.hotelWithBreakfastTotal > 0 && (
                <li>
                  • Frühstücksabzug (€5.60 pro Tag) wurde bereits vom
                  Verpflegungsmehraufwand abgezogen
                </li>
              )}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex gap-4 justify-end">
            <button
              onClick={async () => await exportToExcel(report, travelDetails.employeeName)}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
            >
              Als Excel herunterladen
            </button>
            <button
              onClick={() => window.print()}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Drucken
            </button>
            <button
              onClick={onReset}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Neue Abrechnung erstellen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
