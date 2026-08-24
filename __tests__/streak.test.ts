import { calculateStreaks } from '@/utils/streak';
import { todayStr, addDays } from '@/utils/date';

describe('Streak Engine', () => {
  const today = todayStr();
  const yesterday = addDays(today, -1);
  const twoDaysAgo = addDays(today, -2);
  const threeDaysAgo = addDays(today, -3);
  const fourDaysAgo = addDays(today, -4);
  const fiveDaysAgo = addDays(today, -5);

  // Aug 2026: Aug 3=Mon, 5=Wed, 7=Fri, 10=Mon, 12=Wed, 14=Fri, 17=Mon, 19=Wed, 21=Fri

  describe('calculateStreaks - empty', () => {
    it('returns zeros for no completions', () => {
      const result = calculateStreaks([], 'daily', '2026-01-01', 127, 1, 3);
      expect(result.current_streak).toBe(0);
      expect(result.longest_streak).toBe(0);
      expect(result.total_completions).toBe(0);
      expect(result.last_completed_date).toBeNull();
    });
  });

  describe('calculateStreaks - daily habits', () => {
    it('counts single completion today', () => {
      const result = calculateStreaks([today], 'daily', '2026-01-01', 127, 1, 3);
      expect(result.total_completions).toBe(1);
      expect(result.last_completed_date).toBe(today);
    });

    it('counts consecutive completions ending today', () => {
      const result = calculateStreaks(
        [threeDaysAgo, twoDaysAgo, yesterday, today],
        'daily',
        '2026-01-01',
        127,
        1,
        3,
      );
      expect(result.current_streak).toBe(4);
      expect(result.longest_streak).toBe(4);
      expect(result.total_completions).toBe(4);
    });

    it('counts longest streak separately from current', () => {
      // Old streak of 3, gap of 2 missed days, then current 2
      const result = calculateStreaks(
        [fiveDaysAgo, fourDaysAgo, threeDaysAgo, yesterday, today],
        'daily',
        '2026-01-01',
        127,
        1,
        3,
      );
      // fiveDaysAgo, fourDaysAgo, threeDaysAgo = streak of 3
      // twoDaysAgo = missed (scheduled daily, not completed) -> breaks
      // yesterday, today = streak of 2
      expect(result.longest_streak).toBe(3);
      expect(result.current_streak).toBe(2);
    });
  });

  describe('calculateStreaks - scheduled habits', () => {
    it('counts Mon/Wed/Fri completions as streak of 3', () => {
      // Aug 10 = Monday, Aug 12 = Wednesday, Aug 14 = Friday
      const result = calculateStreaks(
        ['2026-08-10', '2026-08-12', '2026-08-14'],
        'specific_days',
        '2026-08-01',
        42, // Mon(1<<1=2) + Wed(1<<3=8) + Fri(1<<5=32)
        1,
        3,
      );
      expect(result.total_completions).toBe(3);
      expect(result.longest_streak).toBe(3);
    });

    it('breaks streak when scheduled day is missed', () => {
      // Complete Mon and Fri, but miss Wed
      const result = calculateStreaks(
        ['2026-08-10', '2026-08-14'],
        'specific_days',
        '2026-08-01',
        42,
        1,
        3,
      );
      // Mon completed, Wed scheduled but missed -> streak breaks
      expect(result.longest_streak).toBe(1);
      expect(result.total_completions).toBe(2);
    });

    it('counts consecutive daily completions', () => {
      const result = calculateStreaks(
        [threeDaysAgo, twoDaysAgo, yesterday, today],
        'daily',
        '2026-01-01',
        127,
        1,
        3,
      );
      expect(result.current_streak).toBe(4);
      expect(result.longest_streak).toBe(4);
    });
  });

  describe('calculateStreaks - total completions', () => {
    it('counts total completions correctly', () => {
      const result = calculateStreaks(
        [fiveDaysAgo, threeDaysAgo, yesterday],
        'daily',
        '2026-01-01',
        127,
        1,
        3,
      );
      expect(result.total_completions).toBe(3);
    });
  });
});
