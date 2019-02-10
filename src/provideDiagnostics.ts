import { TextDocument, commands, SymbolKind, Uri, Diagnostic, DiagnosticSeverity, workspace, DocumentSymbol } from "vscode";
import resolvePath from "./resolvePath";
import { pathExists, stat } from "fs-extra";
import anchorize from "./anchorize";
import applicationInsights from './telemetry';
import isLinkDocumentSymbol from "./isLinkDocumentSymbol";

export default async function provideDiagnostics(document: TextDocument) {
  const diagnostics: Diagnostic[] = [];
  const symbols = (await commands.executeCommand('vscode.executeDocumentSymbolProvider', document.uri)) as DocumentSymbol[] | undefined;
  if (symbols === undefined) {
    return diagnostics;
  }

  for (const symbol of symbols) {
    // Filter down only link symbols - string symbol with exactly one other string symbol child
    if (!isLinkDocumentSymbol(symbol)) {
      continue;
    }

    const linkPath = symbol.children[0].name;
    const { scheme, path, fragment } = Uri.parse(linkPath);
    if (scheme && scheme !== 'file') {
      continue;
    }

    const absolutePath = resolvePath(document, path);
    const relativePath = workspace.asRelativePath(absolutePath);
    const range = symbol.children[0].selectionRange;
    if (!await pathExists(absolutePath)) {
      const diagnostic = new Diagnostic(range, `The path ${relativePath} doesn't exist on the disk.`, DiagnosticSeverity.Error);
      diagnostic.source = 'MarkDown Link Suggestions';
      // TODO: Similar enough path exists? Use `code` and suggest rewriting.
      // TODO: Use `code` and suggest creating.
      diagnostic.code = 'no-file;' + absolutePath; // TODO: Unhack this passage of path, do it somehow righter
      diagnostics.push(diagnostic);
    } else if (fragment !== '' && (await stat(absolutePath)).isFile()) {
      let headers: DocumentSymbol[];
      try {
        headers = flattenStringSymbols((await commands.executeCommand('vscode.executeDocumentSymbolProvider', Uri.file(absolutePath))) as DocumentSymbol[] | undefined || []);
      } catch (error) {
        applicationInsights.sendTelemetryEvent('provideDiagnostics-executeDocumentSymbolProvider-error');
        continue;
      }

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
    // Ignore link symbols so that we don't get false positives where "# header" and "[#link path]" would look the same (string with "# content")
    if (isLinkDocumentSymbol(symbol) || symbol.kind !== SymbolKind.String) {
      continue;
    }

    results.push(symbol);
    flattenStringSymbols(symbol.children, results);
  }

  return results;
}
