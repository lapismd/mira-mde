/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import { codes, types } from "micromark-util-symbol";
import { markdownLineEnding, markdownSpace } from "micromark-util-character";
import {
  TYPE_BODY,
  TYPE_CELL,
  TYPE_HEADER,
  TYPE_FOOTER,
  TYPE_TABLE,
  TYPE_GRID_DIVIDER,
  TYPE_ROW_LINE,
} from "./types.js";

// the cell divider: | or +
const TYPE_CELL_DIVIDER = "cellDivider";

const V_ALIGN_CODES = {
  [codes.lowercaseV]: "bottom",
  [codes.lowercaseX]: "middle",
  [codes.caret]: "top",
};

// Tolerance for column position matching (characters)
const COLUMN_TOLERANCE = 20;

function parse() {
  return {
    tokenize: tokenizeTable,
    resolve: resolveTable,
    resolveAll: resolveAllTable,
    concrete: true,
  };

  // Helper function to find the nearest column position within tolerance
  // @ts-ignore
  function findNearestColumn(cols, position, tolerance = COLUMN_TOLERANCE) {
    let nearest = -1;
    let minDistance = Infinity;

    for (const col of cols) {
      const distance = Math.abs(col - position);
      if (distance <= tolerance && distance < minDistance) {
        minDistance = distance;
        nearest = col;
      }
    }

    return nearest;
  }

  // special tokenizer to check for the line start. this is needed to we can avoid consuming
  // the line ending after the table
  // @ts-ignore
  function tokenizeLineStart(effects, ok, nok) {
    // @ts-ignore
    function lineStart(code) {
      if (code === codes.plusSign || code === codes.verticalBar) {
        return ok(code);
      }
      return nok(code);
    }
    // @ts-ignore
    function lineEnding(code) {
      // consume line ending
      effects.enter(types.lineEnding);
      effects.consume(code);
      effects.exit(types.lineEnding);
      return lineStart;
    }

    return lineEnding;
  }

  // @ts-ignore
  function tokenizeTable(effects, ok, nok) {
    // positions of columns
    const cols = [0];
    let numRows = 0;
    let numCols = 0;
    let colPos = 0;
    // @ts-ignore
    let rowLine = null;
    let align = "";
    let valign = "";
    return start;

    // @ts-ignore
    function start(code) {
      effects.enter(TYPE_TABLE)._cols = cols;
      effects.enter(TYPE_BODY);
      return lineStart(code);
    }

    // @ts-ignore
    function lineStart(code) {
      rowLine = effects.enter(TYPE_ROW_LINE);
      effects.enter(TYPE_CELL_DIVIDER);
      effects.consume(code);
      effects.exit(TYPE_CELL_DIVIDER);
      colPos = 0;
      numCols = 0;
      return cellOrGridStart;
    }

    // @ts-ignore
    function cellOrGridStart(code) {
      align = "";
      valign = "";
      if (
        code === codes.dash ||
        code === codes.equalsTo ||
        code === codes.colon ||
        code === codes.greaterThan
      ) {
        effects.enter(TYPE_GRID_DIVIDER)._colStart = colPos;
        colPos += 1;
        if (code === codes.colon) {
          align = "left";
        } else if (code === codes.greaterThan) {
          align = "justify";
        }
        effects.consume(code);
        return gridDivider;
      }

      if (code === codes.eof || markdownLineEnding(code)) {
        return lineEnd(code);
      }

      effects.enter(TYPE_CELL)._colStart = colPos;
      colPos += 1;
      effects.consume(code);

      if (markdownSpace(code)) {
        return cellSpace;
      }
      return cell;
    }

    // @ts-ignore
    function cellSpace(code) {
      if (code === codes.eof || markdownLineEnding(code)) {
        // mark as discarded, will be filtered out in transform
        effects.exit(TYPE_CELL)._discard = true;
        return lineEnd(code);
      }
      if (markdownSpace(code)) {
        colPos += 1;
        effects.consume(code);
        return cellSpace;
      }
      return cell(code);
    }

    // @ts-ignore
    function endTable(code) {
      if (numRows < 3) {
        return nok(code);
      }
      effects.exit(TYPE_BODY);
      effects.exit(TYPE_TABLE);
      return ok(code);
    }

    // @ts-ignore
    function lineEnd(code) {
      if (numCols === 0) {
        return nok(code);
      }
      effects.exit(TYPE_ROW_LINE);
      numRows += 1;

      if (code === codes.eof) {
        return endTable(code);
      }

      // since this function is only called for lineEnding or EOF, we can assume EOL here

      // let's check if the grid table is finished and if not, go to line start
      // this is needed so that we don't consume the line ending after the table
      return effects.check(
        { tokenize: tokenizeLineStart },
        // @ts-ignore
        (cd) => {
          effects.enter(types.lineEnding);
          effects.consume(cd);
          effects.exit(types.lineEnding);
          return lineStart;
        },

        endTable,
      )(code);
    }

    // @ts-ignore
    function gridDivider(code) {
      colPos += 1;
      if (code === codes.dash || code === codes.equalsTo) {
        // @ts-ignore
        if (!rowLine._type) {
          // @ts-ignore
          rowLine._type = code;
        }
        effects.consume(code);
        return gridDivider;
      }
      if (code === codes.colon) {
        if (!align) {
          align = "right";
        } else if (align === "left") {
          align = "center";
        } else {
          return nok(code);
        }
        effects.consume(code);
        return gridDividerEnd;
      }
      if (code === codes.lessThan) {
        if (align !== "justify") {
          return nok(code);
        }
        effects.consume(code);
        return gridDividerEnd;
      }

      // @ts-ignore
      if (V_ALIGN_CODES[code]) {
        if (valign) {
          return nok(code);
        }
        // @ts-ignore
        valign = V_ALIGN_CODES[code];
        effects.consume(code);
        return gridDivider;
      }
      if (code === codes.plusSign || code === codes.verticalBar) {
        colPos -= 1;
        return gridDividerEnd(code);
      }
      return nok(code);
    }

    // @ts-ignore
    function gridDividerEnd(code) {
      if (code !== codes.plusSign && code !== codes.verticalBar) {
        return nok(code);
      }
      // for a super small column, assume dash
      // @ts-ignore
      if (!rowLine._type) {
        // @ts-ignore
        rowLine._type = code.dash;
      }
      colPos += 1;
      // remember cols
      const idx = cols.indexOf(colPos);
      if (idx < 0) {
        cols.push(colPos);
        cols.sort((c0, c1) => c0 - c1);
      }
      const token = effects.exit(TYPE_GRID_DIVIDER);
      token._colEnd = colPos;
      token._align = align;
      token._valign = valign;
      effects.enter(TYPE_CELL_DIVIDER);
      effects.consume(code);
      effects.exit(TYPE_CELL_DIVIDER);
      numCols += 1;
      return cellOrGridStart;
    }

    // @ts-ignore
    function cell(code) {
      colPos += 1;
      // MODIFIED: Use flexible column matching instead of exact position matching
      if (code === codes.verticalBar || code === codes.plusSign) {
        const nearestCol = findNearestColumn(cols, colPos);
        if (nearestCol >= 0) {
          // Found a nearby column position - treat as cell divider
          const currentCell = effects.exit(TYPE_CELL);
          currentCell._colEnd = nearestCol;

          // If we're not exactly at the column position, we may need to adjust
          // by consuming any whitespace between current position and column
          const adjustDistance = nearestCol - colPos;
          if (adjustDistance > 0) {
            // We need to move forward - this shouldn't happen in normal cases
            // but we'll handle it by updating colPos
            colPos = nearestCol;
          } else if (adjustDistance < 0) {
            // We've gone past the column - backtrack conceptually
            colPos = nearestCol;
          }

          effects.enter(TYPE_CELL_DIVIDER);
          effects.consume(code);
          effects.exit(TYPE_CELL_DIVIDER);
          numCols += 1;
          return cellOrGridStart;
        }
        // If no nearby column found, treat as regular cell content
        effects.consume(code);
        return cell;
      }
      if (code === codes.eof) {
        // row with cells never terminate eof
        return nok(code);
      }

      effects.consume(code);
      return code === codes.backslash ? cellEscaped : cell;
    }

    // @ts-ignore
    function cellEscaped(code) {
      if (
        code === codes.backslash ||
        code === codes.verticalBar ||
        code === codes.plusSign
      ) {
        colPos += 1;
        effects.consume(code);
        return cell;
      }
      return cell(code);
    }
  }

  // @ts-ignore
  function resolveHeaderAndFooter(events, context) {
    // detect headers:
    // no `=` lines -> only body
    // 1 `=` line -> header + body
    // 2 `=` lines -> header + body + footer
    const fatLines = [];
    let bodyStart = -1; // should default to 1. but just be sure

    for (let idx = 0; idx < events.length; idx += 1) {
      const [e, node] = events[idx];
      const { type } = node;
      if (type === TYPE_BODY) {
        if (e === "enter") {
          bodyStart = idx;
        } else {
          let [hdrIdx, ftrIdx] = fatLines;
          const bdy = node;
          if (hdrIdx > bodyStart + 1) {
            // insert header above body
            const hdr = {
              type: TYPE_HEADER,
              start: bdy.start,
              end: events[hdrIdx][1].end,
            };
            bdy.start = hdr.end;
            events[bodyStart][1] = hdr;
            events.splice(
              hdrIdx,
              0,
              ["exit", hdr, context],
              ["enter", bdy, context],
            );
            idx += 2;
            ftrIdx += 2;
          }

          if (ftrIdx) {
            // insert footer below body
            const ftr = {
              type: TYPE_FOOTER,
              start: events[ftrIdx][1].start,
              end: bdy.end,
            };
            bdy.end = ftr.start;
            events.splice(
              ftrIdx,
              0,
              ["exit", bdy, context],
              ["enter", ftr, context],
            );
            idx += 2;
            events[idx][1] = ftr;
          }
        }
      } else if (
        type === TYPE_ROW_LINE &&
        e === "enter" &&
        node._type === codes.equalsTo
      ) {
        fatLines.push(idx);
      }
    }
    return events;
  }

  // @ts-ignore
  function resolveTable(events, context) {
    // remove discarded
    // @ts-ignore
    events = events.filter(([, node]) => !node._discard);
    events = resolveHeaderAndFooter(events, context);
    return events;
  }

  // @ts-ignore
  function resolveAllTable(events, context) {
    // since we create a detached parser for each cell content later (in from-markdown.js)
    // we need to remember the definitions of the overall document. otherwise the cell parsers
    // would not detect the image and link references.
    const { defined } = context.parser;

    // find all grid tables and remember the definitions
    for (const [evt, node] of events) {
      if (evt === "enter" && node.type === TYPE_TABLE) {
        node._definitions = defined;
      }
    }
    return events;
  }
}

export const gridTables = {
  flow: {
    [codes.plusSign]: parse(),
  },
};
