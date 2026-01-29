/**
 * AnimationQueue - Manages sequential and parallel animation playback.
 *
 * Supports:
 * - Sequential animations (played one after another)
 * - Parallel animation groups (played simultaneously)
 * - Pause/resume functionality
 * - Error handling with callbacks
 */

/**
 * Animation interface - any object that can be played.
 */
export interface Animation {
  play(): Promise<void>;
}

/**
 * Queue entry - either a single animation or a parallel group.
 */
type QueueEntry = Animation | Animation[];

/**
 * AnimationQueue class for managing animation playback.
 */
export class AnimationQueue {
  private queue: QueueEntry[] = [];
  private paused = false;
  private playing = false;
  private resolveResume: (() => void) | null = null;
  private errorHandler: ((error: Error, animation: Animation) => void) | null = null;

  /**
   * Check if the queue is empty.
   */
  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * Get the number of entries in the queue.
   */
  get length(): number {
    return this.queue.length;
  }

  /**
   * Add a single animation to the queue.
   */
  add(animation: Animation): void {
    this.queue.push(animation);
  }

  /**
   * Add a group of animations to play in parallel.
   */
  addParallel(animations: Animation[]): void {
    this.queue.push(animations);
  }

  /**
   * Play all animations in the queue.
   */
  async playAll(onComplete?: () => void): Promise<void> {
    // If already playing, wait for completion
    if (this.playing) {
      return;
    }

    this.playing = true;

    while (this.queue.length > 0) {
      // Check if paused
      if (this.paused) {
        await new Promise<void>((resolve) => {
          this.resolveResume = resolve;
        });
      }

      const entry = this.queue.shift();
      if (!entry) continue;

      if (Array.isArray(entry)) {
        // Parallel group
        await this.playParallel(entry);
      } else {
        // Single animation
        await this.playSingle(entry);
      }
    }

    this.playing = false;
    onComplete?.();
  }

  /**
   * Play a single animation with error handling.
   */
  private async playSingle(animation: Animation): Promise<void> {
    try {
      await animation.play();
    } catch (error) {
      this.errorHandler?.(error as Error, animation);
    }
  }

  /**
   * Play a group of animations in parallel.
   */
  private async playParallel(animations: Animation[]): Promise<void> {
    const validAnimations = animations.filter((a) => a != null);
    if (validAnimations.length === 0) return;

    await Promise.all(
      validAnimations.map((animation) => this.playSingle(animation))
    );
  }

  /**
   * Pause queue processing.
   */
  pause(): void {
    this.paused = true;
  }

  /**
   * Resume queue processing.
   */
  resume(): void {
    this.paused = false;
    this.resolveResume?.();
    this.resolveResume = null;
  }

  /**
   * Check if the queue is paused.
   */
  isPaused(): boolean {
    return this.paused;
  }

  /**
   * Clear all pending animations (does not stop currently playing).
   */
  clear(): void {
    this.queue = [];
  }

  /**
   * Set error handler for animation failures.
   */
  setErrorHandler(handler: (error: Error, animation: Animation) => void): void {
    this.errorHandler = handler;
  }
}
