import { TextDocument } from "vscode";
import { basename, dirname, resolve } from "path";

export default function resolvePath(textDocument: TextDocument, linkPath: string) {
  const relativePath = linkPath || basename(textDocument.fileName); // Fragment-only self-link
  const documentDirectoryPath = dirname(textDocument.uri.fsPath);
  const absolutePath = resolve(documentDirectoryPath, relativePath);
  return absolutePath;
}
