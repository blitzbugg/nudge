import { isScheduledForDate, scheduledDaysPerWeek, frequencyLabel } from '@/utils/scheduling';

describe('Scheduling Engine', () => {
  describe('isScheduledForDate - daily', () => {
    it('returns true for every day', () => {
      expect(isScheduledForDate('daily', '2026-08-20', '2026-08-01', 127, 1, 3)).toBe(true);
    });

    it('returns false before creation date', () => {
      expect(isScheduledForDate('daily', '2026-07-30', '2026-08-01', 127, 1, 3)).toBe(false);
    });
  });

  describe('isScheduledForDate - specific_days', () => {
    it('returns true for matching days', () => {
      // Aug 20, 2026 is Thursday (4)
      // Mon=1, Wed=3, Fri=5 => mask = 2 + 8 + 32 = 42
      expect(isScheduledForDate('specific_days', '2026-08-20', '2026-08-01', 42, 1, 3)).toBe(false);
      // Monday = 1 => mask = 2
      expect(isScheduledForDate('specific_days', '2026-08-17', '2026-08-01', 2, 1, 3)).toBe(true);
    });
  });

  describe('isScheduledForDate - interval', () => {
    it('returns true on interval days from creation', () => {
      // Created Aug 1, interval 2: Aug 1, 3, 5, 7, ...
      expect(isScheduledForDate('interval', '2026-08-01', '2026-08-01', 127, 2, 3)).toBe(true);
      expect(isScheduledForDate('interval', '2026-08-03', '2026-08-01', 127, 2, 3)).toBe(true);
      expect(isScheduledForDate('interval', '2026-08-02', '2026-08-01', 127, 2, 3)).toBe(false);
    });
  });

  describe('scheduledDaysPerWeek', () => {
    it('returns 7 for daily', () => {
      expect(scheduledDaysPerWeek('daily', 127, 1, 3)).toBe(7);
    });

    it('counts specific days', () => {
      // Mon, Wed, Fri => 3
      expect(scheduledDaysPerWeek('specific_days', 42, 1, 3)).toBe(3);
    });

    it('estimates interval days per week', () => {
      expect(scheduledDaysPerWeek('interval', 127, 2, 3)).toBe(4); // ~3.5 rounded
    });

    it('returns weekly target', () => {
      expect(scheduledDaysPerWeek('weekly_target', 127, 1, 5)).toBe(5);
    });
  });

  describe('frequencyLabel', () => {
    it('generates daily label', () => {
      expect(frequencyLabel('daily', 127, 1, 3)).toBe('Every day');
    });

    it('generates specific days label', () => {
      // Mon=1, Wed=3, Fri=5 => mask = 42
      expect(frequencyLabel('specific_days', 42, 1, 3)).toBe('Mon, Wed, Fri');
    });

    it('generates interval label', () => {
      expect(frequencyLabel('interval', 127, 3, 3)).toBe('Every 3 days');
    });

    it('generates weekly target label', () => {
      expect(frequencyLabel('weekly_target', 127, 1, 5)).toBe('5 times/week');
    });
  });
});
