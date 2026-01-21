'use client';

import { useState, useEffect, useCallback } from 'react';
import { TravelDetails, ExpenseItem, ExpenseReport, LineItem, ExpenseSummary } from '@/lib/types';
import { getGroupedCountries } from '@/lib/countryRates';
import {
  calculateVehicleCosts,
  calculateMealAllowance,
  calculateMealAllowanceBreakdown,
} from '@/lib/calculations';
import { SUPPORTED_CURRENCIES, convertToEUR, getExchangeRate } from '@/lib/currencyService';
import ExpenseTable from './ExpenseTable';
import { Calendar } from 'primereact/calendar';
import 'primereact/resources/themes/lara-light-blue/theme.css';
import 'primeicons/primeicons.css';

const STORAGE_KEY = 'rem_expenses_draft';

interface StoredDraft {
  travelDetails: TravelDetails;
  expenses: ExpenseItem;
  departureDate: string | null;
  departureTime: string | null;
  returnDate: string | null;
  returnTime: string | null;
}

// PrimeReact Calendar with German DD.MM.YYYY format and 24h time
export default function ExpenseForm() {
  const [isLoaded, setIsLoaded] = useState(false);

  // State for date/time as Date objects for PrimeReact Calendar
  const [departureDate, setDepartureDate] = useState<Date | null>(null);
  const [departureTime, setDepartureTime] = useState<Date | null>(null);
  const [returnDate, setReturnDate] = useState<Date | null>(null);
  const [returnTime, setReturnTime] = useState<Date | null>(null);

  const [travelDetails, setTravelDetails] = useState<TravelDetails>({
    employeeName: '',
    startLocation: 'Oranienburg',
    destination: 'Zürich',
    departureDate: '',
    departureTime: '',
    returnDate: '',
    returnTime: '',
    destinationCountry: '',
    travelReason: '',
  });

  // Helper functions to convert Date to German format strings
  const dateToGermanString = (date: Date | null): string => {
    if (!date) return '';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const timeToString = (time: Date | null): string => {
    if (!time) return '';
    const hours = String(time.getHours()).padStart(2, '0');
    const minutes = String(time.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  // Helper function to parse German number format (comma as decimal separator)
  const parseGermanNumber = (value: string): number => {
    if (!value) return 0;
    // Replace comma with dot for parsing
    const normalizedValue = value.replace(',', '.');
    return parseFloat(normalizedValue) || 0;
  };

  const [expenses, setExpenses] = useState<ExpenseItem>({
    publicTransport: [],
    hotelWithBreakfast: [],
    hotelWithoutBreakfast: [],
    mealAllowance: 0,
    mealAllowanceBreakdown: [],
    vehicleKilometers: [],
    vehicleCosts: 0,
    otherCosts: [],
  });

  const [showResults, setShowResults] = useState(false);
  const [report, setReport] = useState<ExpenseReport | null>(null);

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const draft: StoredDraft = JSON.parse(stored);
        setTravelDetails(draft.travelDetails);
        setExpenses(draft.expenses);
        if (draft.departureDate) setDepartureDate(new Date(draft.departureDate));
        if (draft.departureTime) setDepartureTime(new Date(draft.departureTime));
        if (draft.returnDate) setReturnDate(new Date(draft.returnDate));
        if (draft.returnTime) setReturnTime(new Date(draft.returnTime));
      }
    } catch (error) {
      console.error('Failed to load draft from localStorage:', error);
    }
    setIsLoaded(true);
  }, []);

  // Save draft to localStorage whenever state changes
  const saveDraft = useCallback(() => {
    if (!isLoaded) return;
    try {
      const draft: StoredDraft = {
        travelDetails,
        expenses,
        departureDate: departureDate?.toISOString() ?? null,
        departureTime: departureTime?.toISOString() ?? null,
        returnDate: returnDate?.toISOString() ?? null,
        returnTime: returnTime?.toISOString() ?? null,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } catch (error) {
      console.error('Failed to save draft to localStorage:', error);
    }
  }, [isLoaded, travelDetails, expenses, departureDate, departureTime, returnDate, returnTime]);

  useEffect(() => {
    saveDraft();
  }, [saveDraft]);

  const clearDraft = () => {
    localStorage.removeItem(STORAGE_KEY);
    setTravelDetails({
      employeeName: '',
      startLocation: '',
      destination: '',
      departureDate: '',
      departureTime: '',
      returnDate: '',
      returnTime: '',
      destinationCountry: '',
      travelReason: '',
    });
    setExpenses({
      publicTransport: [],
      hotelWithBreakfast: [],
      hotelWithoutBreakfast: [],
      mealAllowance: 0,
      mealAllowanceBreakdown: [],
      vehicleKilometers: [],
      vehicleCosts: 0,
      otherCosts: [],
    });
    setDepartureDate(null);
    setDepartureTime(null);
    setReturnDate(null);
    setReturnTime(null);
  };

  const groupedCountries = getGroupedCountries();

  const handleTravelDetailChange = (field: keyof TravelDetails, value: string) => {
    setTravelDetails((prev) => ({ ...prev, [field]: value }));
  };

  const addLineItem = (category: keyof Pick<ExpenseItem, 'publicTransport' | 'hotelWithBreakfast' | 'hotelWithoutBreakfast' | 'vehicleKilometers' | 'otherCosts'>) => {
    setExpenses((prev) => ({
      ...prev,
      [category]: [...prev[category], { description: '', amount: 0, currency: 'EUR', amountEUR: 0, exchangeRate: 1 }],
    }));
  };

  const updateLineItem = async (
    category: keyof Pick<ExpenseItem, 'publicTransport' | 'hotelWithBreakfast' | 'hotelWithoutBreakfast' | 'vehicleKilometers' | 'otherCosts'>,
    index: number,
    field: keyof LineItem,
    value: string | number
  ) => {
    setExpenses((prev) => {
      const items = [...prev[category]];
      items[index] = { ...items[index], [field]: value };

      // If amount or currency changed, trigger conversion
      if (field === 'amount' || field === 'currency') {
        const item = items[index];
        const amount = typeof value === 'number' && field === 'amount' ? value : item.amount;
        const currency = field === 'currency' ? String(value) : (item.currency || 'EUR');

        // Perform conversion asynchronously
        if (amount > 0 && currency) {
          convertToEUR(amount, currency)
            .then((amountEUR) => {
              getExchangeRate(currency, 'EUR').then((exchangeRate) => {
                setExpenses((prevExpenses) => {
                  const updatedItems = [...prevExpenses[category]];
                  updatedItems[index] = {
                    ...updatedItems[index],
                    amountEUR,
                    exchangeRate,
                  };
                  return { ...prevExpenses, [category]: updatedItems };
                });
              });
            })
            .catch((error) => {
              console.error('Currency conversion failed:', error);
            });
        }
      }

      return { ...prev, [category]: items };
    });
  };

  const removeLineItem = (
    category: keyof Pick<ExpenseItem, 'publicTransport' | 'hotelWithBreakfast' | 'hotelWithoutBreakfast' | 'vehicleKilometers' | 'otherCosts'>,
    index: number
  ) => {
    setExpenses((prev) => ({
      ...prev,
      [category]: prev[category].filter((_, i) => i !== index),
    }));
  };

  const calculateReport = () => {
    // Sync Date objects to travelDetails strings
    const updatedTravelDetails = {
      ...travelDetails,
      departureDate: dateToGermanString(departureDate),
      departureTime: timeToString(departureTime),
      returnDate: dateToGermanString(returnDate),
      returnTime: timeToString(returnTime),
    };

    // Calculate totals for each category using EUR-converted amounts
    const publicTransportTotal = expenses.publicTransport.reduce((sum, item) => sum + (item.amountEUR || item.amount), 0);
    const hotelWithBreakfastTotal = expenses.hotelWithBreakfast.reduce((sum, item) => sum + (item.amountEUR || item.amount), 0);
    const hotelWithoutBreakfastTotal = expenses.hotelWithoutBreakfast.reduce((sum, item) => sum + (item.amountEUR || item.amount), 0);
    const otherCostsTotal = expenses.otherCosts.reduce((sum, item) => sum + (item.amountEUR || item.amount), 0);

    // Calculate total kilometers and vehicle costs
    const totalKilometers = expenses.vehicleKilometers.reduce((sum, item) => sum + item.amount, 0);
    const vehicleCosts = calculateVehicleCosts(totalKilometers);

    // Calculate meal allowance
    const hasBreakfast = hotelWithBreakfastTotal > 0;
    const mealAllowance = calculateMealAllowance(
      updatedTravelDetails.departureDate,
      updatedTravelDetails.departureTime,
      updatedTravelDetails.returnDate,
      updatedTravelDetails.returnTime,
      updatedTravelDetails.destinationCountry,
      hasBreakfast
    );

    // Calculate meal allowance breakdown
    const mealAllowanceBreakdown = calculateMealAllowanceBreakdown(
      updatedTravelDetails.departureDate,
      updatedTravelDetails.departureTime,
      updatedTravelDetails.returnDate,
      updatedTravelDetails.returnTime,
      updatedTravelDetails.destinationCountry,
      hasBreakfast
    );

    const summary: ExpenseSummary = {
      publicTransportTotal,
      hotelWithBreakfastTotal,
      hotelWithoutBreakfastTotal,
      mealAllowance,
      vehicleCosts,
      otherCostsTotal,
    };

    const total =
      summary.publicTransportTotal +
      summary.hotelWithBreakfastTotal +
      summary.hotelWithoutBreakfastTotal +
      summary.mealAllowance +
      summary.vehicleCosts +
      summary.otherCostsTotal;

    const updatedExpenses = {
      ...expenses,
      mealAllowance,
      mealAllowanceBreakdown,
      vehicleCosts,
    };

    const newReport: ExpenseReport = {
      travelDetails: updatedTravelDetails,
      expenses: updatedExpenses,
      summary,
      total,
    };

    setReport(newReport);
    setShowResults(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    calculateReport();
  };

  const resetForm = () => {
    setShowResults(false);
    setReport(null);
    clearDraft();
  };

  if (showResults && report) {
    return <ExpenseTable report={report} onReset={resetForm} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-md rounded-lg p-8">
          <div className="flex justify-between items-start mb-2">
            <h1 className="text-3xl font-bold text-gray-900">
              REM expenses
            </h1>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
              Entwurf wird automatisch gespeichert
            </span>
          </div>
          <p className="text-gray-600 mb-8">
            Reisekosten und Spesen - Travel Expenses and Reimbursement Report
          </p>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Travel Details Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Reisedetails
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name des Mitarbeiters
                  </label>
                  <input
                    type="text"
                    required
                    value={travelDetails.employeeName}
                    onChange={(e) =>
                      handleTravelDetailChange('employeeName', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="z.B. Max Mustermann"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Startpunkt
                  </label>
                  <input
                    type="text"
                    required
                    value={travelDetails.startLocation}
                    onChange={(e) =>
                      handleTravelDetailChange('startLocation', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="z.B. München"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zielort
                  </label>
                  <input
                    type="text"
                    required
                    value={travelDetails.destination}
                    onChange={(e) =>
                      handleTravelDetailChange('destination', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="z.B. Zürich"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Abreisedatum
                  </label>
                  <Calendar
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.value as Date)}
                    dateFormat="dd.mm.yy"
                    placeholder="TT.MM.JJJJ"
                    showIcon
                    className="w-full"
                    inputClassName="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Abreisezeit (24h)
                  </label>
                  <Calendar
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.value as Date)}
                    timeOnly
                    hourFormat="24"
                    placeholder="HH:MM"
                    showIcon
                    className="w-full"
                    inputClassName="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rückkehrdatum
                  </label>
                  <Calendar
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.value as Date)}
                    dateFormat="dd.mm.yy"
                    placeholder="TT.MM.JJJJ"
                    showIcon
                    className="w-full"
                    inputClassName="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rückkehrzeit (24h)
                  </label>
                  <Calendar
                    value={returnTime}
                    onChange={(e) => setReturnTime(e.value as Date)}
                    timeOnly
                    hourFormat="24"
                    placeholder="HH:MM"
                    showIcon
                    className="w-full"
                    inputClassName="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Zielland
                  </label>
                  <select
                    required
                    value={travelDetails.destinationCountry}
                    onChange={(e) =>
                      handleTravelDetailChange('destinationCountry', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Bitte wählen...</option>
                    {groupedCountries.ungrouped.map((country) => (
                      <option key={country} value={country}>
                        {country}
                      </option>
                    ))}
                    {groupedCountries.groups.map((group) => (
                      <optgroup key={group.label} label={group.label}>
                        {group.countries.map((country) => (
                          <option key={country} value={country}>
                            {country}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reiseanlass
                  </label>
                  <input
                    type="text"
                    required
                    value={travelDetails.travelReason}
                    onChange={(e) =>
                      handleTravelDetailChange('travelReason', e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="z.B. Meeting, Workshop"
                  />
                </div>
              </div>
            </div>

            {/* Expenses Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Ausgaben
              </h2>

              {/* Public Transport */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Öffentliche Verkehrsmittel
                  </label>
                  <button
                    type="button"
                    onClick={() => addLineItem('publicTransport')}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    + Hinzufügen
                  </button>
                </div>
                {expenses.publicTransport.map((item, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Beschreibung"
                      value={item.description}
                      onChange={(e) =>
                        updateLineItem('publicTransport', index, 'description', e.target.value)
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={item.currency || 'EUR'}
                      onChange={(e) =>
                        updateLineItem('publicTransport', index, 'currency', e.target.value)
                      }
                      className="w-24 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      {SUPPORTED_CURRENCIES.map((curr) => (
                        <option key={curr.code} value={curr.code}>
                          {curr.code}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Betrag"
                      value={item.amount || ''}
                      onChange={(e) =>
                        updateLineItem('publicTransport', index, 'amount', e.target.value)
                      }
                      onBlur={(e) =>
                        updateLineItem('publicTransport', index, 'amount', parseGermanNumber(e.target.value))
                      }
                      className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeLineItem('publicTransport', index)}
                      className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {/* Hotel with Breakfast */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Hotel/Übernachtung (mit Frühstück)
                  </label>
                  <button
                    type="button"
                    onClick={() => addLineItem('hotelWithBreakfast')}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    + Hinzufügen
                  </button>
                </div>
                {expenses.hotelWithBreakfast.map((item, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Beschreibung"
                      value={item.description}
                      onChange={(e) =>
                        updateLineItem('hotelWithBreakfast', index, 'description', e.target.value)
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={item.currency || 'EUR'}
                      onChange={(e) =>
                        updateLineItem('hotelWithBreakfast', index, 'currency', e.target.value)
                      }
                      className="w-24 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      {SUPPORTED_CURRENCIES.map((curr) => (
                        <option key={curr.code} value={curr.code}>
                          {curr.code}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Betrag"
                      value={item.amount || ''}
                      onChange={(e) =>
                        updateLineItem('hotelWithBreakfast', index, 'amount', e.target.value)
                      }
                      onBlur={(e) =>
                        updateLineItem('hotelWithBreakfast', index, 'amount', parseGermanNumber(e.target.value))
                      }
                      className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeLineItem('hotelWithBreakfast', index)}
                      className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {/* Hotel without Breakfast */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Hotel/Übernachtung (ohne Frühstück)
                  </label>
                  <button
                    type="button"
                    onClick={() => addLineItem('hotelWithoutBreakfast')}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    + Hinzufügen
                  </button>
                </div>
                {expenses.hotelWithoutBreakfast.map((item, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Beschreibung"
                      value={item.description}
                      onChange={(e) =>
                        updateLineItem('hotelWithoutBreakfast', index, 'description', e.target.value)
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={item.currency || 'EUR'}
                      onChange={(e) =>
                        updateLineItem('hotelWithoutBreakfast', index, 'currency', e.target.value)
                      }
                      className="w-24 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      {SUPPORTED_CURRENCIES.map((curr) => (
                        <option key={curr.code} value={curr.code}>
                          {curr.code}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Betrag"
                      value={item.amount || ''}
                      onChange={(e) =>
                        updateLineItem('hotelWithoutBreakfast', index, 'amount', e.target.value)
                      }
                      onBlur={(e) =>
                        updateLineItem('hotelWithoutBreakfast', index, 'amount', parseGermanNumber(e.target.value))
                      }
                      className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeLineItem('hotelWithoutBreakfast', index)}
                      className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>

              {/* Vehicle Kilometers */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Gefahrene km (Privatfahrzeug)
                  </label>
                  <button
                    type="button"
                    onClick={() => addLineItem('vehicleKilometers')}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    + Hinzufügen
                  </button>
                </div>
                {expenses.vehicleKilometers.map((item, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Beschreibung (z.B. Strecke)"
                      value={item.description}
                      onChange={(e) =>
                        updateLineItem('vehicleKilometers', index, 'description', e.target.value)
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="km"
                      value={item.amount || ''}
                      onChange={(e) =>
                        updateLineItem('vehicleKilometers', index, 'amount', e.target.value)
                      }
                      onBlur={(e) =>
                        updateLineItem('vehicleKilometers', index, 'amount', parseGermanNumber(e.target.value))
                      }
                      className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeLineItem('vehicleKilometers', index)}
                      className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {expenses.vehicleKilometers.length > 0 && (
                  <p className="text-sm text-gray-500 mt-2">
                    Gesamt: {expenses.vehicleKilometers.reduce((sum, item) => sum + item.amount, 0)} km → €{' '}
                    {calculateVehicleCosts(expenses.vehicleKilometers.reduce((sum, item) => sum + item.amount, 0)).toFixed(2)}
                  </p>
                )}
              </div>

              {/* Other Costs */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Sonstige Kosten
                  </label>
                  <button
                    type="button"
                    onClick={() => addLineItem('otherCosts')}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    + Hinzufügen
                  </button>
                </div>
                {expenses.otherCosts.map((item, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      placeholder="Beschreibung (z.B. Taxi, Parken)"
                      value={item.description}
                      onChange={(e) =>
                        updateLineItem('otherCosts', index, 'description', e.target.value)
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select
                      value={item.currency || 'EUR'}
                      onChange={(e) =>
                        updateLineItem('otherCosts', index, 'currency', e.target.value)
                      }
                      className="w-24 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      {SUPPORTED_CURRENCIES.map((curr) => (
                        <option key={curr.code} value={curr.code}>
                          {curr.code}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="Betrag"
                      value={item.amount || ''}
                      onChange={(e) =>
                        updateLineItem('otherCosts', index, 'amount', e.target.value)
                      }
                      onBlur={(e) =>
                        updateLineItem('otherCosts', index, 'amount', parseGermanNumber(e.target.value))
                      }
                      className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeLineItem('otherCosts', index)}
                      className="px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={clearDraft}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
              >
                Formular zurücksetzen
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Abrechnung erstellen
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
