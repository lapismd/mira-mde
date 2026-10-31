import type { Plugin } from "unified";
import type { Root } from "hast";
import upstreamRemarkMath from "remark-math";
import upstreamRehypeKatex from "rehype-katex";

// Private build boundary. Keep the upstream implementations and plugin order.
export const remarkMath: Plugin = upstreamRemarkMath;
export const rehypeKatex: Plugin<[], Root> = upstreamRehypeKatex;
