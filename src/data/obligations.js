/**
 * Recurring program obligations — shown on CalendarView as purple "obligation" events.
 * Each entry produces events across the current ± 6-month window.
 *
 * type: 'monthly' | 'quarterly' | 'annual'
 * day:  day-of-month (for monthly)
 * months: [0-based month indices] (for quarterly/annual)
 */
export const OBLIGATIONS = [
  {
    id: 'pcard-15',
    title: 'P-Card Reconciliation Due',
    description: 'PaymentNet: submit all P-Card transactions by the 15th of each month.',
    type: 'monthly',
    day: 15,
    color: 'purple',
  },
  {
    id: 'quarterly-report-q1',
    title: 'Quarterly Progress Report',
    description: 'NIH/NIMHD quarterly progress report due.',
    type: 'quarterly',
    months: [2, 5, 8, 11], // Mar, Jun, Sep, Dec (0-based)
    day: 30,
    color: 'purple',
  },
  {
    id: 'annual-budget-review',
    title: 'Annual Budget Review',
    description: 'Review full-year budget actuals and projections.',
    type: 'annual',
    months: [8], // September
    day: 1,
    color: 'purple',
  },
  {
    id: 'effort-reporting',
    title: 'Effort Reporting Certification',
    description: 'Semi-annual effort reporting window — certify personnel effort.',
    type: 'quarterly',
    months: [1, 7], // Feb, Aug
    day: 28,
    color: 'purple',
  },
];

/**
 * Expand OBLIGATIONS into concrete event objects for a given date range.
 * @param {Date} rangeStart
 * @param {Date} rangeEnd
 * @returns {Array<{id, title, description, date: string, type: 'obligation', color: string}>}
 */
export const expandObligations = (rangeStart, rangeEnd) => {
  const events = [];

  OBLIGATIONS.forEach(ob => {
    if (ob.type === 'monthly') {
      // Generate one event per month in range
      const d = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
      while (d <= rangeEnd) {
        const eventDate = new Date(d.getFullYear(), d.getMonth(), ob.day);
        if (eventDate >= rangeStart && eventDate <= rangeEnd) {
          events.push({
            id: `${ob.id}-${eventDate.toISOString().slice(0, 7)}`,
            title: ob.title,
            description: ob.description,
            date: eventDate.toISOString().slice(0, 10),
            type: 'obligation',
            color: ob.color,
          });
        }
        d.setMonth(d.getMonth() + 1);
      }
    } else if (ob.type === 'quarterly' || ob.type === 'annual') {
      const d = new Date(rangeStart.getFullYear(), 0, 1);
      const endYear = rangeEnd.getFullYear() + 1;
      for (let year = d.getFullYear(); year <= endYear; year++) {
        ob.months.forEach(month => {
          const eventDate = new Date(year, month, ob.day);
          if (eventDate >= rangeStart && eventDate <= rangeEnd) {
            events.push({
              id: `${ob.id}-${year}-${month}`,
              title: ob.title,
              description: ob.description,
              date: eventDate.toISOString().slice(0, 10),
              type: 'obligation',
              color: ob.color,
            });
          }
        });
      }
    }
  });

  return events;
};
