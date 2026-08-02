const languageLabels: Record<string, string> = {
  bash: "Bash",
  c: "C",
  cmake: "CMake",
  conf: "Config",
  cpp: "C++",
  cs: "C#",
  csharp: "C#",
  css: "CSS",
  dockerfile: "Dockerfile",
  go: "Go",
  html: "HTML",
  java: "Java",
  javascript: "JavaScript",
  js: "JavaScript",
  json: "JSON",
  jsx: "JavaScript (JSX)",
  kotlin: "Kotlin",
  kt: "Kotlin",
  less: "Less",
  markdown: "Markdown",
  md: "Markdown",
  php: "PHP",
  postgres: "PostgreSQL",
  powershell: "PowerShell",
  ps1: "PowerShell",
  py: "Python",
  python: "Python",
  rb: "Ruby",
  rs: "Rust",
  ruby: "Ruby",
  rust: "Rust",
  sass: "Sass",
  scss: "SCSS",
  sh: "Shell",
  shell: "Shell",
  sql: "SQL",
  swift: "Swift",
  text: "Plain Text",
  toml: "TOML",
  ts: "TypeScript",
  tsx: "TypeScript (TSX)",
  typescript: "TypeScript",
  xml: "XML",
  yaml: "YAML",
  yml: "YAML",
  zsh: "Zsh",
};

export function codeLanguageLabel(className: string): string {
  const language = /(?:^|\s)language-([^\s]+)/u
    .exec(className)?.[1]
    ?.trim()
    .toLocaleLowerCase();
  if (!language) {
    return "";
  }
  return languageLabels[language] ?? language;
}
