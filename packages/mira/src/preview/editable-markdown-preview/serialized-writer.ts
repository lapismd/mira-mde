import type {
  MiraMarkdownRecoveryLease,
  MiraMarkdownTextState,
} from "../../extensions/markdown-editing";
export type SerializedMarkdownWriterState = MiraMarkdownTextState;

type Options = {
  value: string;
  write: (value: string) => void | Promise<void>;
  delay?: number;
  onStateChange?: (state: SerializedMarkdownWriterState) => void;
};

export class SerializedMarkdownWriter {
  private readonly write: Options["write"];

  private readonly delay: number;

  private readonly onStateChange?: Options["onStateChange"];

  private timer: ReturnType<typeof setTimeout> | null = null;

  private flushPromise: Promise<boolean> | null = null;

  private value: string;

  private persistedValue: string;

  private saving = false;

  private protections = 0;
  private recoveries = 0;
  private readonly listeners = new Set<
    (state: SerializedMarkdownWriterState) => void
  >();

  private destroyed = false;

  private error: Error | null = null;

  constructor(options: Options) {
    this.value = options.value;
    this.persistedValue = options.value;
    this.write = options.write;
    this.delay = options.delay ?? 500;
    this.onStateChange = options.onStateChange;
    this.emit();
  }

  get state(): SerializedMarkdownWriterState {
    return {
      readonly: this.protections > 0 || this.destroyed,
      dirty: this.value !== this.persistedValue,
      saving: this.saving,
      error: this.error,
      value: this.value,
      persistedValue: this.persistedValue,
    };
  }

  update(value: string): boolean {
    if (this.protections > 0 || this.destroyed) return false;
    this.value = value;
    this.schedule();
    this.emit();
    return true;
  }

  subscribe(
    listener: (state: SerializedMarkdownWriterState) => void,
  ): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  async protectRecovery(): Promise<MiraMarkdownRecoveryLease> {
    this.protections++;
    this.recoveries++;
    let active = true;
    const release = () => {
      if (!active) return;
      active = false;
      this.protections--;
      this.recoveries--;
      this.emit();
    };
    const assertHeld = () => {
      if (!active) throw new Error("Markdown recovery lease expired");
      if (this.saving)
        throw new Error("Markdown recovery must settle persistence first");
    };
    try {
      this.clearTimer();
      this.emit();
      const flight = this.flushPromise;
      if (flight) await flight;
      return {
        acceptLocal: () => {
          assertHeld();
          this.persistedValue = this.value;
          this.error = null;
          this.emit();
        },
        useExternal: (value) => {
          assertHeld();
          this.value = value;
          this.persistedValue = value;
          this.error = null;
          this.emit();
        },
        release,
      };
    } catch (error) {
      release();
      throw error;
    }
  }

  hold(): () => void {
    this.protections++;
    this.emit();
    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.protections--;
      this.emit();
    };
  }

  async protect(): Promise<() => void> {
    const release = this.hold();
    try {
      if (!(await this.flush()))
        throw this.error ?? new Error("Unable to protect unsaved Markdown");
      return release;
    } catch (error) {
      release();
      throw error;
    }
  }

  replaceExternal(value: string): boolean {
    if (
      this.recoveries > 0 ||
      this.state.dirty ||
      this.saving ||
      this.error !== null
    ) {
      return false;
    }

    this.value = value;
    this.persistedValue = value;
    this.error = null;
    this.emit();
    return true;
  }

  async flush(): Promise<boolean> {
    this.clearTimer();
    if (this.recoveries > 0) return false;
    if (this.flushPromise) {
      const saved = await this.flushPromise;
      if (!saved) {
        return false;
      }
      return this.state.dirty ? this.flush() : true;
    }

    // Reserve the flight before notifying subscribers, which may request recovery.
    let resolve!: (saved: boolean) => void;
    let reject!: (error: unknown) => void;
    this.flushPromise = new Promise<boolean>((done, fail) => {
      resolve = done;
      reject = fail;
    });
    void this.flushLatest().then(resolve, reject);
    try {
      return await this.flushPromise;
    } finally {
      this.flushPromise = null;
    }
  }

  destroy(): void {
    this.destroyed = true;
    this.clearTimer();
    this.emit();
    if (this.state.dirty || this.error !== null) {
      void this.flush();
    }
  }

  private schedule(): void {
    this.clearTimer();
    if (!this.state.dirty && this.error === null) {
      return;
    }

    this.timer = setTimeout(() => {
      this.timer = null;
      void this.flush();
    }, this.delay);
  }

  private async flushLatest(): Promise<boolean> {
    while (this.value !== this.persistedValue || this.error !== null) {
      if (this.recoveries > 0) return false;
      const snapshot = this.value;
      this.saving = true;
      this.error = null;
      this.emit();

      try {
        await this.write(snapshot);
      } catch (cause) {
        this.saving = false;
        this.error =
          cause instanceof Error ? cause : new Error("Unable to save Markdown");
        this.emit();
        return false;
      }

      this.persistedValue = snapshot;
      this.saving = false;
      this.error = null;
      this.emit();
    }

    return true;
  }

  private clearTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private emit(): void {
    this.onStateChange?.(this.state);
    for (const listener of this.listeners) listener(this.state);
  }
}
