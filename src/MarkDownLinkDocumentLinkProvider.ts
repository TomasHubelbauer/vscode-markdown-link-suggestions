import { DocumentLinkProvider, TextDocument, CancellationToken, commands, SymbolInformation, DocumentLink, Uri, SymbolKind, Range } from "vscode";
import resolvePath from "./resolvePath";

export default class MarkDownLinkDocumentLinkProvider implements DocumentLinkProvider {
  public async provideDocumentLinks(document: TextDocument, _token: CancellationToken) {
    const symbols = (await commands.executeCommand('vscode.executeDocumentSymbolProvider', document.uri)) as SymbolInformation[] | undefined;
    if (symbols === undefined) {
      return [];
    }

    const links: DocumentLink[] = [];
    for (const { kind, name, location: { range: { start, end } } } of symbols) {
      if (kind !== SymbolKind.Package || !name.startsWith('[') || !name.endsWith(')')) {
        continue;
      }

      const [, path] = /]\((.*)\)/.exec(name)!;
      const uri = Uri.parse(path);
      if (uri.scheme && uri.scheme !== 'file') {
        continue;
      }

      links.push(new DocumentLink(new Range(start.translate(0, 1), end.translate(0, 0 - 1 - path.length - 2)), Uri.file(resolvePath(document, path))));
    }

    return links;
  }
}
