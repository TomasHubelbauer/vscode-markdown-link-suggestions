import { TextDocument } from "vscode";
import MarkDownDOM from "markdown-dom";

export default function* getHeaders(textDocument: TextDocument) {
  let order = 0;
  for (let index = 0; index < textDocument.lineCount; index++) {
    const line = textDocument.lineAt(index);
    if (!line.text.startsWith('#')) {
      continue;
    }

    let text = '';
    try {
      const dom = MarkDownDOM.parse(line.text);
      const block = dom.blocks[0];
      if (block.type !== 'header') {
        throw new Error('Not a header block!');
      }

      for (const span of block.spans) {
        switch (span.type) {
          case 'run': text += span.text; break;
          case 'link': text += span.text; break;
          default: {
            // TODO: Telemetry.
          }
        }
      }

      text = text.trim();
    } catch (error) {
      text = line.text.substring(line.text.indexOf('# ') + '# '.length);

      // Remove link.
      if (text.startsWith('[')) {
        text = text.substring('['.length, text.indexOf(']'));
      }
    }

    order++;
    yield { order, text };
  }
}
