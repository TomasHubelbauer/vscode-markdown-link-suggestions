import { DocumentLinkProvider, TextDocument, CancellationToken, commands, DocumentLink, Uri, DocumentSymbol } from "vscode";
import resolvePath from "./resolvePath";
import isLinkDocumentSymbol from "./isLinkDocumentSymbol";

export default class MarkDownLinkDocumentLinkProvider implements DocumentLinkProvider {
  public async provideDocumentLinks(document: TextDocument, _token: CancellationToken) {
    const symbols = (await commands.executeCommand('vscode.executeDocumentSymbolProvider', document.uri)) as DocumentSymbol[] | undefined;
    if (symbols === undefined) {
      return [];
    }

    const links: DocumentLink[] = [];
    for (const symbol of symbols) {
      if (!isLinkDocumentSymbol(symbol)) {
        continue;
      }

      const path = symbol.children[0].name;
      const uri = Uri.parse(path);
      if (uri.scheme && uri.scheme !== 'file') {
        continue;
      }

      links.push(new DocumentLink(symbol.children[0].selectionRange, Uri.file(resolvePath(document, path))));
    }

    return links;
  }
}
