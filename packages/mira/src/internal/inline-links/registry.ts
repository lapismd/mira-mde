import { bundledLinkIcons } from "./icons";

export type MiraLinkIconPath = Readonly<{
  d: string;
  fill?: "currentColor" | "none";
  stroke?: "currentColor" | "none";
  strokeWidth?: number;
  strokeLinecap?: "butt" | "round" | "square";
  strokeLinejoin?: "miter" | "round" | "bevel";
  fillRule?: "nonzero" | "evenodd";
}>;

export type MiraLinkIconDefinition = Readonly<{
  name?: string;
  viewBox?: string;
  paths: readonly MiraLinkIconPath[];
}>;

export type MiraResolvedLinkIcon = Readonly<{
  id: string;
  icon: MiraLinkIconDefinition | null;
}>;

export type MiraLinkIconRegistry = Readonly<{
  resolve(href: string): MiraResolvedLinkIcon | undefined;
}>;

export type MiraLinkIconRegistryOptions = {
  defaults?: boolean;
  icons?: Readonly<Record<string, MiraLinkIconDefinition | null>>;
  hosts?: Readonly<Record<string, string | null>>;
  /** Matches descendants only, on a dot boundary. Does not match the root host. */
  subdomains?: Readonly<Record<string, string | null>>;
  fallback?: MiraLinkIconDefinition | null;
};

function freezeIcon(icon: MiraLinkIconDefinition): MiraLinkIconDefinition {
  return Object.freeze({
    name: icon.name,
    viewBox: icon.viewBox ?? "0 0 24 24",
    paths: Object.freeze(
      icon.paths.map((path) => {
        for (const color of [path.fill, path.stroke])
          if (
            color !== undefined &&
            color !== "none" &&
            color !== "currentColor"
          )
            throw new TypeError(
              "Link icons accept local currentColor geometry only",
            );
        return Object.freeze({
          d: path.d,
          fill: path.fill,
          stroke: path.stroke,
          strokeWidth: path.strokeWidth,
          strokeLinecap: path.strokeLinecap,
          strokeLinejoin: path.strokeLinejoin,
          fillRule: path.fillRule,
        });
      }),
    ),
  });
}

export const defaultMiraLinkIcons = Object.freeze(
  Object.fromEntries(
    Object.entries(bundledLinkIcons).map(([id, icon]) => [
      id,
      freezeIcon(icon),
    ]),
  ),
) as Readonly<Record<keyof typeof bundledLinkIcons, MiraLinkIconDefinition>>;

export const defaultMiraLinkFallbackIcon = freezeIcon({
  name: "Link",
  paths: [
    {
      d: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
    },
    {
      d: "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
    },
  ],
});

export const defaultMiraLinkHosts: Readonly<Record<string, string>> =
  Object.freeze({
    "github.com": "github",
    "gitlab.com": "gitlab",
    "forgejo.org": "forgejo",
    "code.forgejo.org": "forgejo",
    "codeberg.org": "codeberg",
    "bitbucket.org": "bitbucket",
    "facebook.com": "facebook",
    "m.facebook.com": "facebook",
    "fb.com": "facebook",
    "x.com": "x",
    "twitter.com": "x",
    "mobile.twitter.com": "x",
    "google.com": "google",
    "docs.google.com": "google",
    "drive.google.com": "google",
    "mail.google.com": "google",
    "calendar.google.com": "google",
    "meet.google.com": "google",
    "slack.com": "slack",
    "linear.app": "linear",
    "notion.so": "notion",
    "notion.site": "notion",
    "figma.com": "figma",
    "youtube.com": "youtube",
    "m.youtube.com": "youtube",
    "youtu.be": "youtube",
    "discord.com": "discord",
    "discord.gg": "discord",
    "reddit.com": "reddit",
    "old.reddit.com": "reddit",
    "stackoverflow.com": "stackoverflow",
  });

/** Parse only explicit safe web destinations; never resolve or fetch a URL. */
export function parseInlineLinkUrl(href: string): URL | undefined {
  try {
    const url = new URL(href);
    if (
      (url.protocol === "http:" || url.protocol === "https:") &&
      !url.username &&
      !url.password
    )
      return url;
  } catch {
    /* Non-web and relative links retain their existing renderer. */
  }
}

function normalizeHost(host: string): string {
  const url = new URL(`https://${host}`);
  if (
    !host ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    url.port ||
    url.username ||
    url.password ||
    /[\s/\\?#@:]/u.test(host)
  ) {
    throw new TypeError(`Expected a hostname, received ${host}`);
  }
  return url.hostname.toLowerCase().replace(/\.$/u, "");
}

export function createLinkIconRegistry(
  options: MiraLinkIconRegistryOptions = {},
): MiraLinkIconRegistry {
  const icons = new Map<string, MiraLinkIconDefinition | null>(
    Object.entries(options.defaults === false ? {} : defaultMiraLinkIcons),
  );
  for (const [id, icon] of Object.entries(options.icons ?? {}))
    icons.set(id, icon === null ? null : freezeIcon(icon));
  const fallback =
    options.fallback === undefined
      ? defaultMiraLinkFallbackIcon
      : options.fallback === null
        ? null
        : freezeIcon(options.fallback);
  const hosts = new Map<string, MiraResolvedLinkIcon>();
  const subdomains = new Map<string, MiraResolvedLinkIcon>();
  function add(
    target: Map<string, MiraResolvedLinkIcon>,
    entries: Readonly<Record<string, string | null>>,
  ) {
    for (const [host, id] of Object.entries(entries)) {
      if (id !== null && !icons.has(id))
        throw new TypeError(`Unknown link icon: ${id}`);
      target.set(
        normalizeHost(host),
        Object.freeze({
          id: id ?? "disabled",
          icon: id === null ? null : icons.get(id)!,
        }),
      );
    }
  }
  if (options.defaults !== false) {
    add(hosts, defaultMiraLinkHosts);
    // Keep www aliases explicit rather than stripping arbitrary host labels.
    add(
      hosts,
      Object.fromEntries(
        Object.entries(defaultMiraLinkHosts).map(([host, id]) => [
          `www.${host}`,
          id,
        ]),
      ),
    );
    add(subdomains, { "slack.com": "slack" });
  }
  add(hosts, options.hosts ?? {});
  add(subdomains, options.subdomains ?? {});
  const suffixes = [...subdomains].sort(([a], [b]) => b.length - a.length);
  const unknown = Object.freeze({ id: "unknown", icon: fallback });
  return Object.freeze({
    resolve(href: string) {
      const url = parseInlineLinkUrl(href);
      if (!url) return;
      const host = url.hostname.toLowerCase().replace(/\.$/u, "");
      return (
        hosts.get(host) ??
        suffixes.find(([suffix]) => host.endsWith(`.${suffix}`))?.[1] ??
        unknown
      );
    },
  });
}

export const defaultMiraLinkIconRegistry = createLinkIconRegistry();
