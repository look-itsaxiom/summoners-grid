/**
 * AnimationQueue Tests
 *
 * TDD tests for the animation queue system that manages
 * sequential and parallel animation playback.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Import the AnimationQueue (will fail until implemented)
import { AnimationQueue, type Animation } from '../AnimationQueue';

describe('AnimationQueue', () => {
  let queue: AnimationQueue;

  beforeEach(() => {
    vi.useFakeTimers();
    queue = new AnimationQueue();
  });

  afterEach(() => {
    vi.runAllTimers();
    vi.useRealTimers();
  });

  /**
   * HAPPY PATH SCENARIOS
   * Basic functionality under normal conditions
   */
  describe('happy path scenarios', () => {
    it('should create an empty queue', () => {
      expect(queue).toBeDefined();
      expect(queue.isEmpty()).toBe(true);
      expect(queue.length).toBe(0);
    });

    it('should add an animation to the queue', () => {
      const animation: Animation = {
        play: vi.fn().mockResolvedValue(undefined),
      };

      queue.add(animation);

      expect(queue.isEmpty()).toBe(false);
      expect(queue.length).toBe(1);
    });

    it('should add multiple animations to the queue', () => {
      const anim1: Animation = { play: vi.fn().mockResolvedValue(undefined) };
      const anim2: Animation = { play: vi.fn().mockResolvedValue(undefined) };
      const anim3: Animation = { play: vi.fn().mockResolvedValue(undefined) };

      queue.add(anim1);
      queue.add(anim2);
      queue.add(anim3);

      expect(queue.length).toBe(3);
    });

    it('should play animations sequentially', async () => {
      const order: number[] = [];

      const anim1: Animation = {
        play: vi.fn().mockImplementation(async () => {
          order.push(1);
        }),
      };
      const anim2: Animation = {
        play: vi.fn().mockImplementation(async () => {
          order.push(2);
        }),
      };

      queue.add(anim1);
      queue.add(anim2);

      await queue.playAll();

      expect(order).toEqual([1, 2]);
      expect(anim1.play).toHaveBeenCalledTimes(1);
      expect(anim2.play).toHaveBeenCalledTimes(1);
    });

    it('should clear the queue after playing all animations', async () => {
      const anim: Animation = { play: vi.fn().mockResolvedValue(undefined) };

      queue.add(anim);
      await queue.playAll();

      expect(queue.isEmpty()).toBe(true);
    });
  });

  /**
   * SUCCESS SCENARIOS
   * Verifying operations complete successfully
   */
  describe('success scenarios', () => {
    it('should call completion callback after all animations finish', async () => {
      const onComplete = vi.fn();
      const anim: Animation = { play: vi.fn().mockResolvedValue(undefined) };

      queue.add(anim);
      await queue.playAll(onComplete);

      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('should resolve promise when queue finishes', async () => {
      const anim: Animation = { play: vi.fn().mockResolvedValue(undefined) };

      queue.add(anim);

      await expect(queue.playAll()).resolves.toBeUndefined();
    });

    it('should handle async animations correctly', async () => {
      let resolved = false;

      const anim: Animation = {
        play: vi.fn().mockImplementation(async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          resolved = true;
        }),
      };

      queue.add(anim);

      const playPromise = queue.playAll();

      // Animation should not be resolved yet
      expect(resolved).toBe(false);

      // Advance timers
      vi.advanceTimersByTime(100);
      await playPromise;

      expect(resolved).toBe(true);
    });
  });

  /**
   * PARALLEL ANIMATION SCENARIOS
   * Support for parallel animation groups
   */
  describe('parallel animation scenarios', () => {
    it('should play parallel animation group simultaneously', async () => {
      const startTimes: number[] = [];
      let currentTime = 0;

      const anim1: Animation = {
        play: vi.fn().mockImplementation(async () => {
          startTimes.push(currentTime);
          await new Promise((r) => setTimeout(r, 50));
        }),
      };
      const anim2: Animation = {
        play: vi.fn().mockImplementation(async () => {
          startTimes.push(currentTime);
          await new Promise((r) => setTimeout(r, 50));
        }),
      };

      queue.addParallel([anim1, anim2]);

      const playPromise = queue.playAll();

      // Both should start at the same time
      expect(startTimes).toEqual([0, 0]);

      vi.advanceTimersByTime(50);
      await playPromise;
    });

    it('should wait for all parallel animations to complete', async () => {
      let anim1Done = false;
      let anim2Done = false;

      const anim1: Animation = {
        play: vi.fn().mockImplementation(async () => {
          await new Promise((r) => setTimeout(r, 50));
          anim1Done = true;
        }),
      };
      const anim2: Animation = {
        play: vi.fn().mockImplementation(async () => {
          await new Promise((r) => setTimeout(r, 100));
          anim2Done = true;
        }),
      };

      queue.addParallel([anim1, anim2]);

      const playPromise = queue.playAll();

      // After 50ms, anim1 should be done but not anim2
      vi.advanceTimersByTime(50);
      await Promise.resolve(); // Let microtasks run

      expect(anim1Done).toBe(true);
      expect(anim2Done).toBe(false);

      // After another 50ms (100ms total), both should be done
      vi.advanceTimersByTime(50);
      await playPromise;

      expect(anim2Done).toBe(true);
    });

    it('should mix sequential and parallel animations', async () => {
      const order: string[] = [];

      const seq1: Animation = {
        play: vi.fn().mockImplementation(async () => {
          order.push('seq1');
        }),
      };
      const par1: Animation = {
        play: vi.fn().mockImplementation(async () => {
          order.push('par1');
        }),
      };
      const par2: Animation = {
        play: vi.fn().mockImplementation(async () => {
          order.push('par2');
        }),
      };
      const seq2: Animation = {
        play: vi.fn().mockImplementation(async () => {
          order.push('seq2');
        }),
      };

      queue.add(seq1);
      queue.addParallel([par1, par2]);
      queue.add(seq2);

      await queue.playAll();

      // seq1 first, then par1 and par2 (order between them undefined), then seq2
      expect(order[0]).toBe('seq1');
      expect(order.slice(1, 3).sort()).toEqual(['par1', 'par2']);
      expect(order[3]).toBe('seq2');
    });
  });

  /**
   * PAUSE/RESUME SCENARIOS
   */
  describe('pause/resume scenarios', () => {
    it('should pause queue processing', async () => {
      const played: number[] = [];

      const anim1: Animation = {
        play: vi.fn().mockImplementation(async () => {
          played.push(1);
        }),
      };
      const anim2: Animation = {
        play: vi.fn().mockImplementation(async () => {
          played.push(2);
        }),
      };

      queue.add(anim1);
      queue.add(anim2);

      // Start playing
      const playPromise = queue.playAll();

      // Pause after first animation
      queue.pause();

      // Run pending microtasks
      await Promise.resolve();

      expect(queue.isPaused()).toBe(true);
    });

    it('should resume queue processing', async () => {
      const played: number[] = [];

      const anim1: Animation = {
        play: vi.fn().mockImplementation(async () => {
          played.push(1);
          queue.pause(); // Pause during first animation
        }),
      };
      const anim2: Animation = {
        play: vi.fn().mockImplementation(async () => {
          played.push(2);
        }),
      };

      queue.add(anim1);
      queue.add(anim2);

      // Start playing - will pause during anim1
      const playPromise = queue.playAll();

      // Wait for anim1 to complete and pause
      await Promise.resolve();

      expect(played).toEqual([1]);

      // Resume
      queue.resume();

      // Wait for completion
      await playPromise;

      expect(played).toEqual([1, 2]);
    });

    it('should report not paused initially', () => {
      expect(queue.isPaused()).toBe(false);
    });
  });

  /**
   * CLEAR QUEUE SCENARIOS
   */
  describe('clear queue scenarios', () => {
    it('should clear all pending animations', () => {
      const anim1: Animation = { play: vi.fn().mockResolvedValue(undefined) };
      const anim2: Animation = { play: vi.fn().mockResolvedValue(undefined) };

      queue.add(anim1);
      queue.add(anim2);

      expect(queue.length).toBe(2);

      queue.clear();

      expect(queue.isEmpty()).toBe(true);
      expect(queue.length).toBe(0);
    });

    it('should not affect currently playing animation', async () => {
      let animPlayed = false;

      const anim1: Animation = {
        play: vi.fn().mockImplementation(async () => {
          await new Promise((r) => setTimeout(r, 100));
          animPlayed = true;
        }),
      };
      const anim2: Animation = { play: vi.fn().mockResolvedValue(undefined) };

      queue.add(anim1);
      queue.add(anim2);

      const playPromise = queue.playAll();

      // Clear while anim1 is playing
      queue.clear();

      vi.advanceTimersByTime(100);
      await playPromise;

      // anim1 should still complete, but anim2 should not play
      expect(animPlayed).toBe(true);
      expect(anim2.play).not.toHaveBeenCalled();
    });
  });

  /**
   * FAILURE SCENARIOS
   * Graceful handling of missing/invalid data
   */
  describe('failure scenarios', () => {
    it('should handle empty queue playAll gracefully', async () => {
      const onComplete = vi.fn();

      await queue.playAll(onComplete);

      // Should complete immediately without error
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('should handle animation that throws error', async () => {
      const error = new Error('Animation failed');

      const anim1: Animation = {
        play: vi.fn().mockRejectedValue(error),
      };
      const anim2: Animation = {
        play: vi.fn().mockResolvedValue(undefined),
      };

      queue.add(anim1);
      queue.add(anim2);

      // Should not throw, but should continue with next animation
      await expect(queue.playAll()).resolves.toBeUndefined();

      // Second animation should still play
      expect(anim2.play).toHaveBeenCalled();
    });

    it('should handle null animation in parallel group', async () => {
      const anim: Animation = { play: vi.fn().mockResolvedValue(undefined) };

      // TypeScript would catch this, but runtime should handle it
      queue.addParallel([anim, null as unknown as Animation]);

      await expect(queue.playAll()).resolves.toBeUndefined();
    });
  });

  /**
   * ERROR SCENARIOS
   * Exception handling
   */
  describe('error scenarios', () => {
    it('should call error handler when animation fails', async () => {
      const error = new Error('Animation error');
      const onError = vi.fn();

      const anim: Animation = {
        play: vi.fn().mockRejectedValue(error),
      };

      queue.setErrorHandler(onError);
      queue.add(anim);

      await queue.playAll();

      expect(onError).toHaveBeenCalledWith(error, anim);
    });
  });

  /**
   * EDGE CASES
   * Boundary conditions and unusual scenarios
   */
  describe('edge cases', () => {
    it('should handle rapid add/play cycles', async () => {
      for (let i = 0; i < 10; i++) {
        const anim: Animation = { play: vi.fn().mockResolvedValue(undefined) };
        queue.add(anim);
        await queue.playAll();
      }

      expect(queue.isEmpty()).toBe(true);
    });

    it('should handle adding during playback', async () => {
      const played: number[] = [];

      const anim1: Animation = {
        play: vi.fn().mockImplementation(async () => {
          played.push(1);
          // Add another animation during playback
          queue.add({
            play: vi.fn().mockImplementation(async () => {
              played.push(3);
            }),
          });
        }),
      };
      const anim2: Animation = {
        play: vi.fn().mockImplementation(async () => {
          played.push(2);
        }),
      };

      queue.add(anim1);
      queue.add(anim2);

      await queue.playAll();

      // All three should have played
      expect(played).toEqual([1, 2, 3]);
    });

    it('should handle empty parallel group', async () => {
      queue.addParallel([]);

      await expect(queue.playAll()).resolves.toBeUndefined();
    });

    it('should handle single animation in parallel group', async () => {
      const anim: Animation = { play: vi.fn().mockResolvedValue(undefined) };

      queue.addParallel([anim]);
      await queue.playAll();

      expect(anim.play).toHaveBeenCalledTimes(1);
    });

    it('should maintain correct state after multiple operations', async () => {
      const anim: Animation = { play: vi.fn().mockResolvedValue(undefined) };

      // Add, clear, add again
      queue.add(anim);
      queue.clear();
      queue.add(anim);

      expect(queue.length).toBe(1);

      // Play, clear, add
      await queue.playAll();
      queue.clear();
      queue.add(anim);

      expect(queue.length).toBe(1);
    });

    it('should handle resume when not paused', () => {
      expect(() => queue.resume()).not.toThrow();
    });

    it('should handle pause when already paused', () => {
      queue.pause();
      expect(() => queue.pause()).not.toThrow();
      expect(queue.isPaused()).toBe(true);
    });

    it('should handle playAll when already playing', async () => {
      let firstCallComplete = false;

      const anim: Animation = {
        play: vi.fn().mockImplementation(async () => {
          await new Promise((r) => setTimeout(r, 100));
          firstCallComplete = true;
        }),
      };

      queue.add(anim);

      // Start first playAll
      const promise1 = queue.playAll();

      // Second playAll should return immediately or wait
      const promise2 = queue.playAll();

      vi.advanceTimersByTime(100);
      await Promise.all([promise1, promise2]);

      // Animation should only play once
      expect(anim.play).toHaveBeenCalledTimes(1);
    });
  });
});
