import { TextDocument, commands, SymbolInformation, SymbolKind, Uri, Range, Diagnostic, DiagnosticSeverity } from "vscode";
import resolvePath from "./resolvePath";
import { pathExists, stat } from "fs-extra";
import anchorize from "./anchorize";

export default async function provideDiagnostics(document: TextDocument) {
  const symbols = (await commands.executeCommand('vscode.executeDocumentSymbolProvider', document.uri)) as SymbolInformation[] || undefined;
  const diagnostics: Diagnostic[] = [];
  for (const { kind, name, location } of symbols) {
    if (kind !== SymbolKind.Package || !name.startsWith('[') || !name.endsWith(')')) {
      continue;
    }

    const [, path] = /]\((.*)\)/.exec(name)!;
    const uri = Uri.parse(path);
    if (uri.scheme && uri.scheme !== 'file') {
      continue;
    }

    const absolutePath = resolvePath(document, uri.path);
    if (!await pathExists(absolutePath)) {
      const range = new Range(location.range.end.translate(0, 0 - 1 - path.length), location.range.end.translate(0, -1));
      const diagnostic = new Diagnostic(range, `The path ${absolutePath} doesn't exist on the disk.`, DiagnosticSeverity.Error);
      diagnostic.source = 'MarkDown Link Suggestions';
      // TODO: Similar enough path exists? Use `code` and suggest rewriting.
      // TODO: Use `code` and suggest creating.
      diagnostic.code = 'no-file;' + absolutePath; // TODO: Unhack this passage of path, do it somehow righter
      diagnostics.push(diagnostic);
    }

    if (uri.fragment !== '' && (await stat(absolutePath)).isFile()) {
      // Remove periods in fragment because the extension used to not remove them and thus generated fragments which are now invalid
      const header = symbols.find(symbol => symbol.kind === SymbolKind.String && anchorize(symbol.name) === anchorize(uri.fragment));
      if (header === undefined) {
        const range = new Range(location.range.end.translate(0, 0 - 1 - uri.fragment.length), location.range.end.translate(0, -1));
        const diagnostic = new Diagnostic(range, `The header ${uri.fragment} doesn't exist in file ${absolutePath}.`, DiagnosticSeverity.Error);
        diagnostic.source = 'MarkDown Link Suggestions';
        // TODO: Similar enough path exists? Use `code` and `relatedInformation` and suggest rewriting.
        // TODO: Use `code` and suggest appending to the file (maybe quick pick after which header).
        diagnostics.push(diagnostic);
      }
    }
  }

  return diagnostics;
}
