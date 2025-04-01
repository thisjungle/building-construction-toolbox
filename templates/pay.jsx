import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Constants
const AWARD_RATES = {
  CW1: 25.88,
  CW2: 26.40,
  CW3: 27.17,
  CW4: 28.02,
  CW5: 28.88,
  CW6: 29.64,
  CW7: 30.49,
  CW8: 31.23,
  CW9: 31.78
};

const INDUSTRY_ALLOWANCES = {
  general: 61.94,
  residential: 49.55,
  civil: 61.94,
  metal: 61.94
};

const PUBLIC_HOLIDAYS_2024 = {
  NSW: [
    { date: '2024-01-01', name: "New Year's Day" },
    { date: '2024-01-26', name: "Australia Day" },
    { date: '2024-03-29', name: "Good Friday" },
    { date: '2024-03-30', name: "Easter Saturday" },
    { date: '2024-03-31', name: "Easter Sunday" },
    { date: '2024-04-01', name: "Easter Monday" },
    { date: '2024-04-25', name: "Anzac Day" },
    { date: '2024-06-10', name: "King's Birthday" },
    { date: '2024-10-07', name: "Labour Day" },
    { date: '2024-12-25', name: "Christmas Day" },
    { date: '2024-12-26', name: "Boxing Day" }
  ]
};

// Utility Functions
const timeToMinutes = (timeString) => {
  if (!timeString) return 0;
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

const checkIfPublicHoliday = (date, state = 'NSW') => {
  const holidays = PUBLIC_HOLIDAYS_2024[state] || [];
  const dateString = date.toISOString().split('T')[0];
  return holidays.some(holiday => holiday.date === dateString);
};

const calculateDayPay = (dayData, employeeDetails, date, isPublicHoliday) => {
  if (!dayData.worked || !dayData.start || !dayData.end) {
    return {
      ordinaryHours: 0,
      overtimeHours: 0,
      penalties: 0,
      allowances: 0,
      rdoAccrual: 0,
      warnings: []
    };
  }

  const warnings = [];
  let totalMinutes = timeToMinutes(dayData.end) - timeToMinutes(dayData.start);

  // Subtract breaks
  const breakMinutes = dayData.breaks.reduce((total, breakTime) => {
    return total + (timeToMinutes(breakTime.end) - timeToMinutes(breakTime.start));
  }, 0);

  totalMinutes -= breakMinutes;
  let totalHours = totalMinutes / 60;

  // Handle casual minimum engagement
  if (employeeDetails.employmentType === 'casual' && totalHours > 0 && totalHours < 4) {
    warnings.push('Casual employees must receive minimum 4 hours pay per engagement');
    totalHours = 4;
  }

  // Calculate ordinary and overtime hours
  let ordinaryHours = Math.min(totalHours, 7.6);
  let overtimeHours = Math.max(0, totalHours - 7.6);

  // Calculate base rate and casual loading
  const baseRate = AWARD_RATES[employeeDetails.classification];
  const casualLoading = employeeDetails.employmentType === 'casual' ? 0.25 : 0;
  
  // Calculate penalties
  let penalties = 0;
  const effectiveBaseRate = baseRate * (1 + casualLoading);
  const workDate = date instanceof Date ? date : new Date(date);
  const dayOfWeek = workDate.getDay(); // 0 = Sunday, 6 = Saturday
  
  if (isPublicHoliday) {
    // Public holiday rate: 250%
    penalties += totalHours * effectiveBaseRate * 1.5; // Additional 150%
    if (totalHours < 4) {
      // Minimum 4 hours payment on public holidays
      penalties += (4 - totalHours) * effectiveBaseRate * 1.5;
      ordinaryHours = 4;
    }
  } else if (dayOfWeek === 0) {
    // Sunday - all hours at 200%
    penalties += totalHours * effectiveBaseRate;
  } else if (dayOfWeek === 6) {
    // Saturday
    const noonTime = new Date(workDate);
    noonTime.setHours(12, 0, 0);
    
    const startTime = new Date(workDate);
    const [startHours, startMinutes] = dayData.start.split(':').map(Number);
    startTime.setHours(startHours, startMinutes, 0);
    
    if (startTime >= noonTime) {
      // After noon - all hours at 200%
      penalties += totalHours * effectiveBaseRate;
    } else {
      // Before noon - first 2 hours at 150%, rest at 200%
      const firstTwoHours = Math.min(totalHours, 2);
      const remainingHours = Math.max(0, totalHours - 2);
      penalties += (firstTwoHours * effectiveBaseRate * 0.5);
      penalties += (remainingHours * effectiveBaseRate);
    }
  } else if (overtimeHours > 0) {
    // Regular weekday overtime
    const firstTwoOvertimeHours = Math.min(overtimeHours, 2);
    const remainingOvertime = Math.max(0, overtimeHours - 2);
    
    penalties += (firstTwoOvertimeHours * effectiveBaseRate * 0.5); // 150%
    penalties += (remainingOvertime * effectiveBaseRate); // 200%
  }

  // Calculate allowances
  let allowances = INDUSTRY_ALLOWANCES[employeeDetails.industry] / 5;

  if (dayData.conditions.heightWork) allowances += 0.87 * totalHours;
  if (dayData.conditions.confinedSpace) allowances += 0.87 * totalHours;
  if (dayData.conditions.toxicMaterials) allowances += 0.87 * totalHours;

  // RDO accrual (not for casuals)
  const rdoAccrual = employeeDetails.employmentType !== 'casual' && ordinaryHours > 0 ? 0.4 : 0;

  return {
    ordinaryHours,
    overtimeHours,
    penalties,
    allowances,
    rdoAccrual,
    warnings
  };
};

const WarningDisplay = ({ warnings }) => {
  if (!warnings?.length) return null;
  
  return (
    <div className="mt-2">
      {warnings.map((warning, index) => (
        <Alert key={index} variant="warning">
          <AlertDescription>{warning}</AlertDescription>
        </Alert>
      ))}
    </div>
  );
};

const DayEntry = ({ day, date, data, employeeDetails, warnings = [], updateDay }) => {
  const isPublicHoliday = checkIfPublicHoliday(date);
  
  return (
    <div className="border rounded-lg p-4 mb-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-semibold capitalize">{day}</h3>
          <p className="text-sm text-gray-600">{date.toLocaleDateString()}</p>
        </div>
        {isPublicHoliday && (
          <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">
            Public Holiday
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={data.worked}
            onChange={(e) => updateDay(day, 'worked', e.target.checked)}
            className="mr-2"
          />
          Worked this day
        </label>

        {data.worked && (
          <>
            <div>
              <label className="block text-sm mb-1">Start Time</label>
              <input
                type="time"
                value={data.start}
                onChange={(e) => updateDay(day, 'start', e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">End Time</label>
              <input
                type="time"
                value={data.end}
                onChange={(e) => updateDay(day, 'end', e.target.value)}
                className="w-full p-2 border rounded"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm mb-1">Breaks</label>
              <button
                onClick={() => updateDay(day, 'breaks', [...data.breaks, { start: '', end: '' }])}
                className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
              >
                Add Break
              </button>
              {data.breaks.map((breakTime, index) => (
                <div key={index} className="flex gap-2 mt-2">
                  <input
                    type="time"
                    value={breakTime.start}
                    onChange={(e) => {
                      const newBreaks = [...data.breaks];
                      newBreaks[index] = { ...breakTime, start: e.target.value };
                      updateDay(day, 'breaks', newBreaks);
                    }}
                    className="w-1/2 p-2 border rounded"
                  />
                  <input
                    type="time"
                    value={breakTime.end}
                    onChange={(e) => {
                      const newBreaks = [...data.breaks];
                      newBreaks[index] = { ...breakTime, end: e.target.value };
                      updateDay(day, 'breaks', newBreaks);
                    }}
                    className="w-1/2 p-2 border rounded"
                  />
                </div>
              ))}
            </div>

            <div className="col-span-2">
              <label className="block text-sm mb-1">Conditions</label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={data.conditions?.heightWork}
                    onChange={(e) => updateDay(day, 'conditions', {
                      ...data.conditions,
                      heightWork: e.target.checked
                    })}
                    className="mr-2"
                  />
                  Height Work
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={data.conditions?.confinedSpace}
                    onChange={(e) => updateDay(day, 'conditions', {
                      ...data.conditions,
                      confinedSpace: e.target.checked
                    })}
                    className="mr-2"
                  />
                  Confined Space
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={data.conditions?.toxicMaterials}
                    onChange={(e) => updateDay(day, 'conditions', {
                      ...data.conditions,
                      toxicMaterials: e.target.checked
                    })}
                    className="mr-2"
                  />
                  Toxic Materials
                </label>
              </div>
            </div>

            <WarningDisplay warnings={warnings} />
          </>
        )}
      </div>
    </div>
  );
};

const ConstructionPayCalculator = () => {
  const [employeeDetails, setEmployeeDetails] = useState({
    classification: 'CW1',
    employmentType: 'fulltime',
    state: 'NSW',
    industry: 'general'
  });

  const [weekData, setWeekData] = useState({
    startDate: new Date(),
    days: {
      monday: { worked: false, start: '', end: '', breaks: [], conditions: {} },
      tuesday: { worked: false, start: '', end: '', breaks: [], conditions: {} },
      wednesday: { worked: false, start: '', end: '', breaks: [], conditions: {} },
      thursday: { worked: false, start: '', end: '', breaks: [], conditions: {} },
      friday: { worked: false, start: '', end: '', breaks: [], conditions: {} },
      saturday: { worked: false, start: '', end: '', breaks: [], conditions: {} },
      sunday: { worked: false, start: '', end: '', breaks: [], conditions: {} }
    }
  });

  const [summary, setSummary] = useState({
    ordinaryHours: 0,
    overtimeHours: 0,
    penalties: 0,
    allowances: 0,
    rdoAccrual: 0,
    superannuation: 0,
    totalGross: 0
  });

  useEffect(() => {
    calculateWeeklyPay();
  }, [weekData, employeeDetails]);

  const calculateWeeklyPay = () => {
    let weekSummary = {
      ordinaryHours: 0,
      overtimeHours: 0,
      penalties: 0,
      allowances: 0,
      rdoAccrual: 0
    };

    Object.entries(weekData.days).forEach(([day, data], index) => {
      const date = new Date(weekData.startDate);
      date.setDate(date.getDate() + index);
      
      const isPublicHoliday = checkIfPublicHoliday(date, employeeDetails.state);
      const dayCalc = calculateDayPay(data, employeeDetails, isPublicHoliday);
      
      weekSummary.ordinaryHours += dayCalc.ordinaryHours;
      weekSummary.overtimeHours += dayCalc.overtimeHours;
      weekSummary.penalties += dayCalc.penalties;
      weekSummary.allowances += dayCalc.allowances;
      weekSummary.rdoAccrual += dayCalc.rdoAccrual;
    });

    const baseRate = AWARD_RATES[employeeDetails.classification];
    const superannuation = (weekSummary.ordinaryHours * baseRate + 
      weekSummary.penalties + weekSummary.allowances) * 0.11;

    setSummary({
      ...weekSummary,
      superannuation,
      totalGross: (weekSummary.ordinaryHours * baseRate + 
        weekSummary.penalties + weekSummary.allowances + superannuation)
    });
  };

  const updateDay = (day, field, value) => {
    setWeekData(prev => ({
      ...prev,
      days: {
        ...prev.days,
        [day]: {
          ...prev.days[day],
          [field]: value
        }
      }
    }));
  };

  return (
    <Card className="w-full max-w-7xl mx-auto">
      <CardHeader>
        <CardTitle>Construction Pay Calculator</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Employee Details */}
          <section className="border-b pb-6">
            <h2 className="text-xl font-semibold mb-4">Employee Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Classification</label>
                <select
                  value={employeeDetails.classification}
                  onChange={(e) => setEmployeeDetails(prev => ({
                    ...prev,
                    classification: e.target.value
                  }))}
                  className="w-full p-2 border rounded"
                >
                  {Object.keys(AWARD_RATES).map(rate => (
                    <option key={rate} value={rate}>{rate}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1">Employment Type</label>
                <select
                  value={employeeDetails.employmentType}
                  onChange={(e) => setEmployeeDetails(prev => ({
                    ...prev,
                    employmentType: e.target.value
                  }))}
                  className="w-full p-2 border rounded"
                >
                  <option value="fulltime">Full Time</option>
                  <option value="parttime">Part Time</option>
                  <option value="casual">Casual</option>
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1">Industry</label>
                <select
                  value={employeeDetails.industry}
                  onChange={(e) => setEmployeeDetails(prev => ({
                    ...prev,
                    industry: e.target.value
                  }))}
                  className="w-full p-2 border rounded"
                >
                  <option value="general">General Building & Construction</option>
                  <option value="residential">Residential</option>
                  <option value="civil">Civil Construction</option>
                  <option value="metal">Metal & Engineering</option>
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1">State</label>
                <select
                  value={employeeDetails.state}
                  onChange={(e) => setEmployeeDetails(prev => ({
                    ...prev,
                    state: e.target.value
                  }))}
                  className="w-full p-2 border rounded"
                >
                  <option value="NSW">New South Wales</option>
                  <option value="VIC">Victoria</option>
                  <option value="QLD">Queensland</option>
                  <option value="SA">South Australia</option>
                  <option value="WA">Western Australia</option>
                  <option value="TAS">Tasmania</option>
                  <option value="NT">Northern Territory</option>
                  <option value="ACT">Australian Capital Territory</option>
                </select>
              </div>
            </div>
          </section>

          {/* Week Entries */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Weekly Hours</h2>
              <input
                type="date"
                value={weekData.startDate.toISOString().split('T')[0]}
                onChange={(e) => setWeekData(prev => ({
                  ...prev,
                  startDate: new Date(e.target.value)
                }))}
                className="p-2 border rounded"
              />
            </div>

            {Object.entries(weekData.days).map(([day, data], index) => {
              const date = new Date(weekData.startDate);
              date.setDate(date.getDate() + index);
              const isPublicHoliday = checkIfPublicHoliday(date, employeeDetails.state);
              const dayCalc = calculateDayPay(data, employeeDetails, isPublicHoliday);
              
              return (
                <DayEntry
                  key={day}
                  day={day}
                  date={date}
                  data={data}
                  employeeDetails={employeeDetails}
                  warnings={dayCalc.warnings}
                  updateDay={updateDay}
                />
              );
            })}
          </section>

          {/* Summary */}
          <section className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">Pay Summary</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>Ordinary Hours:</div>
              <div>{summary.ordinaryHours.toFixed(2)} hours</div>
              
              <div>Overtime Hours:</div>
              <div>{summary.overtimeHours.toFixed(2)} hours</div>
              
              <div>Penalties:</div>
              <div>${summary.penalties.toFixed(2)}</div>
              
              <div>Allowances:</div>
              <div>${summary.allowances.toFixed(2)}</div>
              
              <div>RDO Accrual:</div>
              <div>{summary.rdoAccrual.toFixed(2)} hours</div>
              
              <div>Superannuation:</div>
              <div>${summary.superannuation.toFixed(2)}</div>
              
              <div className="font-bold">Total Gross:</div>
              <div className="font-bold">${summary.totalGross.toFixed(2)}</div>
            </div>
          </section>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConstructionPayCalculator;