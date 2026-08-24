import {
  createTimer,
  startTimer,
  pauseTimer,
  resetTimer,
  getElapsedMs,
  getRemainingMs,
  getTimerProgress,
  isTimerComplete,
  formatElapsed,
  minutesToMs,
  hoursToMs,
  msToMinutes,
  formatTargetDuration,
} from '@/utils/timer';

describe('Timer Engine', () => {
  describe('createTimer', () => {
    it('creates idle timer with correct target', () => {
      const timer = createTimer('habit-1', minutesToMs(20));
      expect(timer.status).toBe('idle');
      expect(timer.habit_id).toBe('habit-1');
      expect(timer.target_duration).toBe(minutesToMs(20));
      expect(timer.elapsed_before_pause).toBe(0);
    });
  });

  describe('startTimer', () => {
    it('transitions idle to running', () => {
      const timer = createTimer('habit-1', minutesToMs(20));
      const running = startTimer(timer);
      expect(running.status).toBe('running');
      expect(typeof running.started_at).toBe('number');
      expect(running.started_at).toBeGreaterThan(0);
    });

    it('resumes from paused with accumulated time', () => {
      const timer = createTimer('habit-1', minutesToMs(30));
      const running = startTimer(timer);
      // Simulate 5 minutes elapsed by setting started_at in the past
      running.started_at = Date.now() - minutesToMs(5);
      const paused = pauseTimer(running);
      // paused.elapsed_before_pause should be ~5 minutes
      expect(getElapsedMs(paused)).toBeGreaterThanOrEqual(minutesToMs(4));

      const resumed = startTimer(paused);
      expect(resumed.status).toBe('running');
      // elapsed_before_pause should carry over
      expect(resumed.elapsed_before_pause).toBeGreaterThanOrEqual(minutesToMs(4));
    });
  });

  describe('pauseTimer', () => {
    it('transitions running to paused', () => {
      const timer = createTimer('habit-1', minutesToMs(20));
      const running = startTimer(timer);
      const paused = pauseTimer(running);
      expect(paused.status).toBe('paused');
      expect(paused.started_at).toBeNull();
    });

    it('accumulates elapsed time', () => {
      const timer = createTimer('habit-1', minutesToMs(20));
      const running = startTimer(timer);
      running.started_at = Date.now() - 1000;
      const paused = pauseTimer(running);
      expect(paused.elapsed_before_pause).toBeGreaterThanOrEqual(1000);
    });
  });

  describe('resetTimer', () => {
    it('resets to idle', () => {
      const timer = createTimer('habit-1', minutesToMs(20));
      const running = startTimer(timer);
      const reset = resetTimer(running);
      expect(reset.status).toBe('idle');
      expect(reset.elapsed_before_pause).toBe(0);
      expect(reset.started_at).toBeNull();
    });
  });

  describe('getElapsedMs', () => {
    it('returns elapsed_before_pause when paused', () => {
      const timer = createTimer('habit-1', minutesToMs(20));
      const running = startTimer(timer);
      running.started_at = Date.now() - 5000;
      const paused = pauseTimer(running);
      expect(getElapsedMs(paused)).toBeGreaterThanOrEqual(5000);
    });
  });

  describe('getRemainingMs', () => {
    it('returns target when no time elapsed', () => {
      const timer = createTimer('habit-1', minutesToMs(20));
      expect(getRemainingMs(timer)).toBe(minutesToMs(20));
    });
  });

  describe('getTimerProgress', () => {
    it('returns 0 for idle timer', () => {
      const timer = createTimer('habit-1', minutesToMs(20));
      expect(getTimerProgress(timer)).toBe(0);
    });
  });

  describe('isTimerComplete', () => {
    it('returns false for new timer', () => {
      const timer = createTimer('habit-1', minutesToMs(20));
      expect(isTimerComplete(timer)).toBe(false);
    });
  });

  describe('formatElapsed', () => {
    it('formats minutes and seconds', () => {
      expect(formatElapsed(0)).toBe('00:00');
      expect(formatElapsed(65000)).toBe('01:05');
    });

    it('formats hours, minutes, seconds', () => {
      expect(formatElapsed(3661000)).toBe('1:01:01');
    });
  });

  describe('duration conversions', () => {
    it('converts minutes to ms', () => {
      expect(minutesToMs(30)).toBe(30 * 60 * 1000);
    });

    it('converts hours to ms', () => {
      expect(hoursToMs(2)).toBe(2 * 60 * 60 * 1000);
    });

    it('converts ms to minutes', () => {
      expect(msToMinutes(60000)).toBe(1);
    });
  });

  describe('formatTargetDuration', () => {
    it('formats minutes', () => {
      expect(formatTargetDuration(minutesToMs(30))).toBe('30 min');
    });

    it('formats hours only', () => {
      expect(formatTargetDuration(hoursToMs(2))).toBe('2 hr');
    });

    it('formats hours and minutes', () => {
      expect(formatTargetDuration(hoursToMs(1) + minutesToMs(30))).toBe('1h 30m');
    });
  });
});
