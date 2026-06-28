/**
 * Token and mdast node type for the grid table
 *
 * @type {string}
 */
export const TYPE_TABLE = "gridTable";

/**
 * Token and mdast node type for the grid table header
 *
 * @type {string}
 */
export const TYPE_HEADER = "gtHeader";

/**
 * Token and mdast node type for the grid table body
 *
 * @type {string}
 */
export const TYPE_BODY = "gtBody";

/**
 * Token and mdast node type for the grid table footer
 *
 * @type {string}
 */
export const TYPE_FOOTER = "gtFooter";

/**
 * Mdast node type for a grid table row
 *
 * @type {string}
 */
export const TYPE_ROW = "gtRow";

/**
 * Mdast node type for a grid table cell
 *
 * @type {string}
 */
export const TYPE_CELL = "gtCell";

/**
 * Token type for a grid table row-line. The row line represents a line within a
 * row. It can have cells or dividers or both (in case of row spans).
 *
 * @type {string}
 */
export const TYPE_ROW_LINE = "gtRowLine";

/**
 * Token type for a grid table grid-divider. The grid divider is the section of
 * `-` and `=` of a grid line between to grid delimiters `|`.
 *
 * @type {string}
 */
export const TYPE_GRID_DIVIDER = "gtGridDivider";
