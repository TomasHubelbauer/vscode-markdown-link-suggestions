import { DocumentSymbolProvider, TextDocument, CancellationToken, SymbolInformation, SymbolKind, Location, Position, Range } from "vscode";

export default class MarkDownLinkDocumentSymbolProvider implements DocumentSymbolProvider {
  public provideDocumentSymbols(document: TextDocument, _token: CancellationToken) {
    let isInCodeBlock = false;
    const items: SymbolInformation[] = [];
    for (let index = 0; index < document.lineCount; index++) {
      const line = document.lineAt(index);

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
        const path = match[2];
        if (text === undefined || path === undefined) {
          continue;
        }

        const textPosition = new Position(index, match.index + 1 /* [ */);
        const textRange = new Range(textPosition, textPosition.translate(0, text.length));
        items.push(new SymbolInformation(text, SymbolKind.String, '', new Location(document.uri, textRange)));

        const pathPosition = new Position(index, match.index + 1 /* [ */ + text.length + 2 /* ]( */);
        const pathRange = new Range(pathPosition, pathPosition.translate(0, path.length));
        items.push(new SymbolInformation(path, SymbolKind.String, '', new Location(document.uri, pathRange)));
      }
    }

    return items;
  }
}
