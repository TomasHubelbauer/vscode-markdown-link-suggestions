import { TextDocument } from "vscode";
import { dirname, resolve } from "path";

export default function resolvePath(textDocument: TextDocument, relativePath: string) {
  const documentDirectoryPath = dirname(textDocument.uri.fsPath);
  const absolutePath = resolve(documentDirectoryPath, relativePath);
  return absolutePath;
}
