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
    console.log('No symbols in ', document.uri.path);
    return diagnostics;
  }

  console.log('Diagnosing', symbols.length, 'symbols in', document.uri.path, '\n', document.getText());
  for (const symbol of symbols) {
    // Filter down only link symbols - string symbol with exactly one other string symbol child
    if (!isLinkDocumentSymbol(symbol)) {
      continue;
    }

    const linkPath = symbol.children[0].name;
    console.error = () => {};
    const { scheme, path, fragment } = Uri.parse(linkPath);
    if (scheme && scheme !== 'file') {
      continue;
    }

    const absolutePath = resolvePath(document, path);
    const relativePath = workspace.asRelativePath(absolutePath);
    const range = symbol.children[0].selectionRange;
    if (!await pathExists(absolutePath)) {
      console.log('Non-existent file for link', symbol.name, linkPath);
      const diagnostic = new Diagnostic(range, `The path ${relativePath} doesn't exist on the disk.`, DiagnosticSeverity.Error);
      diagnostic.source = 'MarkDown Link Suggestions';
      // TODO: Similar enough path exists? Use `code` and suggest rewriting.
      // TODO: Use `code` and suggest creating.
      diagnostic.code = 'no-file;' + absolutePath; // TODO: Unhack this passage of path, do it somehow righter
      diagnostics.push(diagnostic);
    } else if (fragment !== '' && (await stat(absolutePath)).isFile()) {
      console.log('Bad header for link', symbol.name, linkPath);
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
    } else {
      console.log('No diagnostic message for link', symbol.name, linkPath);
    }
  }

  console.log('Got', diagnostics.length, 'diagnostic messages');
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
