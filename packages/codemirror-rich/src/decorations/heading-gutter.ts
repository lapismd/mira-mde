import {
  RangeSet,
  StateField,
  type EditorState,
  type Extension,
  type Range,
} from "@codemirror/state";
import { GutterMarker, gutterLineClass } from "@codemirror/view";

class HeadingGutterMarker extends GutterMarker {
  override readonly elementClass: string;

  constructor(readonly level: number) {
    super();
    this.elementClass = `cm-gutterHeader cm-gutterHeader-${level}`;
  }

  override eq(other: GutterMarker): boolean {
    return other instanceof HeadingGutterMarker && other.level === this.level;
  }
}

export function headingGutterExtension(): Extension {
  return StateField.define<RangeSet<GutterMarker>>({
    create(state) {
      return createHeadingGutterMarkers(state);
    },
    update(markers, transaction) {
      if (transaction.docChanged) {
        return createHeadingGutterMarkers(transaction.state);
      }
      return markers;
    },
    provide: (field) => gutterLineClass.from(field),
  });
}

function createHeadingGutterMarkers(
  state: EditorState,
): RangeSet<GutterMarker> {
  const markers: Range<GutterMarker>[] = [];

  for (let index = 1; index <= state.doc.lines; index += 1) {
    const line = state.doc.line(index);
    const level = getHeadingLevel(line.text);
    if (level !== null) {
      markers.push(new HeadingGutterMarker(level).range(line.from));
    }
  }

  return RangeSet.of(markers);
}

function getHeadingLevel(text: string): number | null {
  const headingMatch = text.match(/^(#{1,6})\s/);
  return headingMatch?.[1]?.length ?? null;
}
