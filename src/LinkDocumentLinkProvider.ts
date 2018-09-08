import { DocumentLinkProvider, TextDocument, CancellationToken, DocumentLink, Uri } from "vscode";
import getFileLinks from "./getFileLinks";
import resolvePath from "./resolvePath";

export default class LinkDocumentLinkProvider implements DocumentLinkProvider {
  public provideDocumentLinks(document: TextDocument, _token: CancellationToken) {
    return [...getFileLinks(document)].map(({ textRange, uri }) => {
      return new DocumentLink(textRange, Uri.file(resolvePath(document, uri.fsPath)));
    });
  }
}
