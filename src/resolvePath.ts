import { TextDocument, Uri } from "vscode";
import { dirname, resolve } from "path";

export default function resolvePath(textDocument: TextDocument, target: Uri) {
  const relativePath = target.fsPath;
  const documentDirectoryPath = dirname(textDocument.uri.fsPath);
  const absolutePath = resolve(documentDirectoryPath, relativePath);
  return absolutePath;
}
