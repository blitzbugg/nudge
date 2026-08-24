import {
  dateStr,
  parseDate,
  addDays,
  getDayOfWeek,
  compareDates,
  diffDays,
  firstDayOfMonth,
  lastDayOfMonth,
  datesInMonth,
  weekStart,
  weekDates,
  lastNDays,
  isToday,
  isBeforeOrEqual,
  dayMaskForDate,
} from '@/utils/date';

describe('Date Utilities', () => {
  describe('dateStr', () => {
    it('converts Date to YYYY-MM-DD', () => {
      const d = new Date(2026, 0, 5); // Jan 5, 2026
      expect(dateStr(d)).toBe('2026-01-05');
    });

    it('pads single digit months and days', () => {
      const d = new Date(2026, 2, 9); // Mar 9, 2026
      expect(dateStr(d)).toBe('2026-03-09');
    });
  });

  describe('parseDate', () => {
    it('parses YYYY-MM-DD to Date at noon', () => {
      const d = parseDate('2026-08-20');
      expect(d.getFullYear()).toBe(2026);
      expect(d.getMonth()).toBe(7); // August = 7
      expect(d.getDate()).toBe(20);
      expect(d.getHours()).toBe(12);
    });
  });

  describe('addDays', () => {
    it('adds days correctly', () => {
      expect(addDays('2026-08-20', 5)).toBe('2026-08-25');
    });

    it('handles month boundaries', () => {
      expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    });

    it('handles negative days', () => {
      expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    });
  });

  describe('getDayOfWeek', () => {
    it('returns correct day (0=Sunday)', () => {
      // Aug 20, 2026 is a Thursday (4)
      expect(getDayOfWeek('2026-08-20')).toBe(4);
    });
  });

  describe('compareDates', () => {
    it('compares dates correctly', () => {
      expect(compareDates('2026-01-01', '2026-01-02')).toBe(-1);
      expect(compareDates('2026-01-02', '2026-01-01')).toBe(1);
      expect(compareDates('2026-01-01', '2026-01-01')).toBe(0);
    });
  });

  describe('diffDays', () => {
    it('calculates day difference', () => {
      expect(diffDays('2026-08-01', '2026-08-08')).toBe(7);
      expect(diffDays('2026-08-08', '2026-08-01')).toBe(-7);
    });

    it('returns 0 for same date', () => {
      expect(diffDays('2026-08-20', '2026-08-20')).toBe(0);
    });
  });

  describe('firstDayOfMonth', () => {
    it('returns first day', () => {
      expect(firstDayOfMonth('2026-08-20')).toBe('2026-08-01');
    });
  });

  describe('lastDayOfMonth', () => {
    it('returns last day of month', () => {
      expect(lastDayOfMonth('2026-02-15')).toBe('2026-02-28');
    });

    it('handles leap year', () => {
      expect(lastDayOfMonth('2024-02-10')).toBe('2024-02-29');
    });
  });

  describe('datesInMonth', () => {
    it('returns all dates in a month', () => {
      const dates = datesInMonth('2026-02-15');
      expect(dates).toHaveLength(28);
      expect(dates[0]).toBe('2026-02-01');
      expect(dates[27]).toBe('2026-02-28');
    });
  });

  describe('weekStart', () => {
    it('returns Sunday before date', () => {
      // Aug 20, 2026 is Thursday
      expect(weekStart('2026-08-20')).toBe('2026-08-16');
    });
  });

  describe('lastNDays', () => {
    it('returns N dates', () => {
      const dates = lastNDays(7);
      expect(dates).toHaveLength(7);
    });
  });

  describe('isBeforeOrEqual', () => {
    it('compares correctly', () => {
      expect(isBeforeOrEqual('2026-01-01', '2026-01-02')).toBe(true);
      expect(isBeforeOrEqual('2026-01-01', '2026-01-01')).toBe(true);
      expect(isBeforeOrEqual('2026-01-02', '2026-01-01')).toBe(false);
    });
  });

  describe('dayMaskForDate', () => {
    it('returns correct bitmask', () => {
      // Aug 20, 2026 = Thursday = 4, mask = 16
      expect(dayMaskForDate('2026-08-20')).toBe(16);
    });
  });
});
