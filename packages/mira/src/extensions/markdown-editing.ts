export type MiraMarkdownTextState = Readonly<{
  readonly: boolean;
  dirty: boolean;
  saving: boolean;
  error: Error | null;
  value: string;
  persistedValue: string;
}>;

/** Storage owners finalize recovery only after validating their external snapshot. */
export type MiraMarkdownRecoveryLease = {
  acceptLocal(): void;
  useExternal(value: string): void;
  release(): void;
};

export type MiraMarkdownTextSession = {
  readonly state: MiraMarkdownTextState;
  subscribe(listener: (state: MiraMarkdownTextState) => void): () => void;
  protectRecovery(): Promise<MiraMarkdownRecoveryLease>;
};

/** A portable persistence barrier owned by one source-bound Markdown writer. */
export type MiraMarkdownEditingSession = {
  readonly dirty: boolean;
  flush(): Promise<void>;
  protect(): Promise<() => void>;
  readonly text?: MiraMarkdownTextSession;
};

/** Binding replaces ordinary writes and registration for this session only. */
export type MiraMarkdownEditingBinding = {
  write(value: string): void | Promise<void>;
  release(): void;
};
