import { TextDocument, Uri, Position, Range } from "vscode";

export default function* getFileLinks(textDocument: TextDocument) {
  let isInCodeBlock = false;
  for (let index = 0; index < textDocument.lineCount; index++) {
    const line = textDocument.lineAt(index);

    // TODO: Replace this logic with MarkDownDOM when ready
    if (line.text.trim().startsWith('```')) {
      isInCodeBlock = !isInCodeBlock;
      continue;
    }

    if (isInCodeBlock) {
      continue;
    }

    // TODO: Get rid of these hack by MarkDownDOM when ready
    const text = line.text
      // Do not confuse the regex by checkboxes by blanking them out
      .replace(/\[[ xX]\](.?)/g, '   $1')
      // Do not consufe the regex by inline code spans by blacking them out
      .replace(/`[^`]*`/g, match => ' '.repeat(match.length))
      ;

    const regex = /\[([^\]]*)\]\(([^\)]*)\)/g;
    let match: RegExpExecArray | null;
    // https://stackoverflow.com/q/50234481/2715716 when used with `AsyncIterableIterator<Diagnostic>`
    while ((match = regex.exec(text)) !== null) {
      const text = match[1];
      const target = match[2];
      if (text === undefined || target === undefined) {
        continue;
      }

      // TODO: https://github.com/Microsoft/vscode/issues/58250
      const uri = Uri.parse(target);
      if (uri.scheme && uri.scheme !== 'file') {
        continue;
      }

      const textPosition = new Position(index, match.index + 1 /* [ */);
      const textRange = new Range(textPosition, textPosition.translate(0, text.length));

      const uriPosition = new Position(index, match.index + 1 /* [ */ + text.length + 2 /* ]( */);
      const uriRange = new Range(uriPosition, uriPosition.translate(0, target.length));

      yield { text, textRange, uri, uriRange };
    }
  }
}
