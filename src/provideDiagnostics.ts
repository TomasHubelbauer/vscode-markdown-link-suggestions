import { TextDocument, commands, SymbolKind, Uri, Diagnostic, DiagnosticSeverity, workspace, DocumentSymbol } from "vscode";
import resolvePath from "./resolvePath";
import { pathExists, stat } from "fs-extra";
import anchorize from "./anchorize";
import applicationInsights from './telemetry';

export default async function provideDiagnostics(document: TextDocument) {
  const diagnostics: Diagnostic[] = [];
  const symbols = (await commands.executeCommand('vscode.executeDocumentSymbolProvider', document.uri)) as DocumentSymbol[] | undefined;
  if (symbols === undefined) {
    return diagnostics;
  }

  for (const { name, kind, children } of symbols) {
    // Filter down only link symbols - string symbol with exactly one other string symbol child
    if (kind !== SymbolKind.String || children.length !== 1 || children[0].kind !== SymbolKind.String || children[0].detail !== name) {
      continue;
    }

    const linkPath = children[0].name;
    const { scheme, path, fragment } = Uri.parse(linkPath);
    if (scheme && scheme !== 'file') {
      continue;
    }

    const absolutePath = resolvePath(document, path);
    const relativePath = workspace.asRelativePath(absolutePath);
    const range = children[0].selectionRange;
    if (!await pathExists(absolutePath)) {
      const diagnostic = new Diagnostic(range, `The path ${relativePath} doesn't exist on the disk.`, DiagnosticSeverity.Error);
      diagnostic.source = 'MarkDown Link Suggestions';
      // TODO: Similar enough path exists? Use `code` and suggest rewriting.
      // TODO: Use `code` and suggest creating.
      diagnostic.code = 'no-file;' + absolutePath; // TODO: Unhack this passage of path, do it somehow righter
      diagnostics.push(diagnostic);
    }

    if (fragment !== '' && (await stat(absolutePath)).isFile()) {
      let symbols: DocumentSymbol[];
      try {
        symbols = ((await commands.executeCommand('vscode.executeDocumentSymbolProvider', Uri.file(absolutePath))) as DocumentSymbol[] | undefined) || [];
      } catch (error) {
        applicationInsights.sendTelemetryEvent('provideDiagnostics-executeDocumentSymbolProvider-error');
        continue;
      }

      let headers = flattenStringSymbols(symbols);

      // Remove periods in fragment because the extension used to not remove them and thus generated fragments which are now invalid
      const header = headers.find(symbol => symbol.kind === SymbolKind.String && anchorize(symbol.name) === anchorize(fragment));
      if (header === undefined) {
        const diagnostic = new Diagnostic(range, `The header ${fragment} doesn't exist in file ${relativePath}.`, DiagnosticSeverity.Error);
        diagnostic.source = 'MarkDown Link Suggestions';
        // TODO: Similar enough path exists? Use `code` and `relatedInformation` and suggest rewriting.
        // TODO: Use `code` and suggest appending to the file (maybe quick pick after which header).
        diagnostics.push(diagnostic);
      }
    }
  }

  return diagnostics;
}

function flattenStringSymbols(symbols: DocumentSymbol[], results: DocumentSymbol[] = []) {
  for (let symbol of symbols) {
    if (symbol.kind !== SymbolKind.String) {
      continue;
    }

    results.push(symbol);
    flattenStringSymbols(symbol.children, results);
  }

  return results;
}
