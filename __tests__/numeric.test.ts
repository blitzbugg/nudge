import { getTimerProgress, isTimerComplete, minutesToMs, createTimer, startTimer, pauseTimer, getElapsedMs } from '@/utils/timer';

describe('Numeric/Timer Habits', () => {
  describe('progress calculations', () => {
    it('calculates progress correctly', () => {
      const target = minutesToMs(30); // 30 minutes
      const timer = createTimer('h1', target);
      const running = startTimer(timer);
      // Simulate 15 minutes elapsed
      running.started_at = Date.now() - minutesToMs(15);
      const progress = getTimerProgress(running);
      expect(progress).toBeCloseTo(0.5, 1);
    });

    it('caps progress at 1.0', () => {
      const target = minutesToMs(10);
      const timer = createTimer('h1', target);
      const running = startTimer(timer);
      // Simulate 20 minutes elapsed (double the target)
      running.started_at = Date.now() - minutesToMs(20);
      const progress = getTimerProgress(running);
      expect(progress).toBe(1);
    });

    it('detects completion', () => {
      const target = minutesToMs(10);
      const timer = createTimer('h1', target);
      const running = startTimer(timer);
      // Simulate 10 minutes elapsed
      running.started_at = Date.now() - minutesToMs(10) - 1000;
      expect(isTimerComplete(running)).toBe(true);
    });
  });

  describe('timer pause/resume', () => {
    it('accumulates elapsed time across pauses', () => {
      const timer = createTimer('h1', minutesToMs(30));
      const running = startTimer(timer);
      running.started_at = Date.now() - minutesToMs(5);
      const paused1 = pauseTimer(running);
      expect(getElapsedMs(paused1)).toBeGreaterThanOrEqual(minutesToMs(5));

      const resumed = startTimer(paused1);
      resumed.started_at = Date.now() - minutesToMs(10);
      const paused2 = pauseTimer(resumed);
      // Should have accumulated ~15 minutes total
      expect(getElapsedMs(paused2)).toBeGreaterThanOrEqual(minutesToMs(14));
    });
  });
});
