export type SerializedMarkdownWriterState = {
  dirty: boolean;
  saving: boolean;
  error: Error | null;
  value: string;
  persistedValue: string;
};

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
      dirty: this.value !== this.persistedValue,
      saving: this.saving,
      error: this.error,
      value: this.value,
      persistedValue: this.persistedValue,
    };
  }

  update(value: string): void {
    this.value = value;
    this.error = null;
    this.schedule();
    this.emit();
  }

  replaceExternal(value: string): boolean {
    if (this.state.dirty || this.saving) {
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
    if (this.flushPromise) {
      const saved = await this.flushPromise;
      if (!saved) {
        return false;
      }
      return this.state.dirty ? this.flush() : true;
    }

    this.flushPromise = this.flushLatest();
    try {
      return await this.flushPromise;
    } finally {
      this.flushPromise = null;
    }
  }

  destroy(): void {
    this.clearTimer();
    if (this.state.dirty) {
      void this.flush();
    }
  }

  private schedule(): void {
    this.clearTimer();
    if (!this.state.dirty) {
      return;
    }

    this.timer = setTimeout(() => {
      this.timer = null;
      void this.flush();
    }, this.delay);
  }

  private async flushLatest(): Promise<boolean> {
    while (this.value !== this.persistedValue) {
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
  }
}
