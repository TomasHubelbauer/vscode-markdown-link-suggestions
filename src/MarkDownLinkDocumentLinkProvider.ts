import { DocumentLinkProvider, TextDocument, CancellationToken, commands, SymbolInformation, SymbolKind, DocumentLink, Uri } from "vscode";
import resolvePath from "./resolvePath";

export default class MarkDownLinkDocumentLinkProvider implements DocumentLinkProvider {
  public async provideDocumentLinks(document: TextDocument, _token: CancellationToken) {
    const symbols = (await commands.executeCommand('vscode.executeDocumentSymbolProvider', document.uri)) as SymbolInformation[];
    return symbols
      .filter(symbol => symbol.kind === SymbolKind.String)
      .map(textSymbol => {
        const pathSymbol = symbols.find(symbol => symbol.kind === SymbolKind.String && symbol.location.range.start.isEqual(textSymbol.location.range.end.translate(0, 2)));
        return { textSymbol, pathSymbol };
      })
      .filter(({ pathSymbol }) => {
        if (pathSymbol === undefined) {
          return false;
        }

        const uri = Uri.parse(pathSymbol.name);
        if (uri.scheme && uri.scheme !== 'file') {
          return false;
        }

        return true;
      })
      .map(link => new DocumentLink(link.textSymbol.location.range, Uri.file(resolvePath(document, link.pathSymbol!.name))));
  }
}
