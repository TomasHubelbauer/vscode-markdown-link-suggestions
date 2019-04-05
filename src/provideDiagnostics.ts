import { TextDocument, commands, SymbolKind, Uri, Diagnostic, DiagnosticSeverity, workspace, DocumentSymbol } from "vscode";
import resolvePath from "./resolvePath";
import { pathExists, stat } from "fs-extra";
import anchorize from "./anchorize";
import applicationInsights from './telemetry';
import isLinkDocumentSymbol from "./isLinkDocumentSymbol";
import extractHeaders from "./extractHeaders";

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

    // Ignore links such as `http`, `mailto` and other non-file protocols
    // TODO: Make sure schemes like `C` (incorrectly identified as scheme when it is drive letter)
    if (scheme && scheme !== 'file') {
      continue;
    }

    let verbatimPath = path;
    // Remove leading slash which `Uri.parse` puts there but isn't in the MarkDown
    if (path.startsWith('/')) {
      verbatimPath = verbatimPath.slice(1);
    }

    const absolutePath = resolvePath(document, verbatimPath);
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
        headers = extractHeaders((await commands.executeCommand('vscode.executeDocumentSymbolProvider', Uri.file(absolutePath))) as DocumentSymbol[] | undefined || []);
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
