import { DocumentSymbolProvider, TextDocument, CancellationToken, SymbolInformation, SymbolKind, Location, Range } from "vscode";

export default class MarkDownLinkDocumentSymbolProvider implements DocumentSymbolProvider {
  public provideDocumentSymbols(document: TextDocument, _token: CancellationToken) {
    let isInCodeBlock = false;
    const symbols: SymbolInformation[] = [];
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

        symbols.push(new SymbolInformation(match[0], SymbolKind.Package, '', new Location(document.uri, new Range(index, match.index, index, match.index + 1 + text.length + 2 + path.length + 1))));
      }
    }

    return symbols;
  }
}
