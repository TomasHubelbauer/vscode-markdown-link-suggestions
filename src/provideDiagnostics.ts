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

  let buffer = '';
  buffer += document.uri.path + '\n';
  buffer += symbols.length + ' symbols\n';
  for (let index = 0; index < symbols.length; index++) {
    buffer += `${index} ${symbols[index].kind} ${symbols[index].name} ${isLinkDocumentSymbol(symbols[index])}\n`;
  }

  console.log(buffer);

  let counter = 0;
  for (const symbol of symbols) {
    counter++;

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
      console.log(counter, '/', symbols.length, 'non-existent file', linkPath);
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

      console.log(JSON.stringify(headers, null, 2));

      // Remove periods in fragment because the extension used to not remove them and thus generated fragments which are now invalid
      const header = headers.find(symbol => symbol.kind === SymbolKind.String && anchorize(symbol.name) === anchorize(fragment));
      if (header === undefined) {
        console.log(counter, '/', symbols.length, 'bad  header', linkPath);
        const diagnostic = new Diagnostic(range, `The header ${fragment} doesn't exist in file ${relativePath}.`, DiagnosticSeverity.Error);
        diagnostic.source = 'MarkDown Link Suggestions';
        // TODO: Similar enough path exists? Use `code` and `relatedInformation` and suggest rewriting.
        // TODO: Use `code` and suggest appending to the file (maybe quick pick after which header).
        diagnostics.push(diagnostic);
      } else {
        console.log(counter, '/', symbols.length, 'good  header', header.range, linkPath);
      }
    } else {
      console.log(counter, '/', symbols.length, 'no problem', linkPath);
    }
  }

  console.log('Got', diagnostics.length, 'diagnostic messages');
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
