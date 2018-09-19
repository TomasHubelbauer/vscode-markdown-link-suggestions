import { TextDocument, commands, SymbolInformation, SymbolKind, Uri, Range, Diagnostic, DiagnosticSeverity, workspace } from "vscode";
import resolvePath from "./resolvePath";
import { pathExists, stat } from "fs-extra";
import anchorize from "./anchorize";
import applicationInsights from './telemetry';

export default async function provideDiagnostics(document: TextDocument) {
  const diagnostics: Diagnostic[] = [];
  const symbols = (await commands.executeCommand('vscode.executeDocumentSymbolProvider', document.uri)) as SymbolInformation[] | undefined;
  if (symbols === undefined) {
    return diagnostics;
  }

  for (const { kind, name, location } of symbols) {
    if (kind !== SymbolKind.Package || !name.startsWith('[') || !name.endsWith(')')) {
      continue;
    }

    const [, linkPath] = /]\((.*)\)/.exec(name)!;
    const { scheme, path, fragment } = Uri.parse(linkPath);
    if (scheme && scheme !== 'file') {
      continue;
    }

    const absolutePath = resolvePath(document, path);
    const relativePath = workspace.asRelativePath(absolutePath);
    if (!await pathExists(absolutePath)) {
      const range = new Range(location.range.end.translate(0, 0 - 1 - path.length), location.range.end.translate(0, -1));
      const diagnostic = new Diagnostic(range, `The path ${relativePath} doesn't exist on the disk.`, DiagnosticSeverity.Error);
      diagnostic.source = 'MarkDown Link Suggestions';
      // TODO: Similar enough path exists? Use `code` and suggest rewriting.
      // TODO: Use `code` and suggest creating.
      diagnostic.code = 'no-file;' + absolutePath; // TODO: Unhack this passage of path, do it somehow righter
      diagnostics.push(diagnostic);
    }

    if (fragment !== '' && (await stat(absolutePath)).isFile()) {
      let fileSymbols: SymbolInformation[];
      try {
        fileSymbols = ((await commands.executeCommand('vscode.executeDocumentSymbolProvider', Uri.file(absolutePath))) as SymbolInformation[] | undefined) || [];
      } catch (error) {
        applicationInsights.sendTelemetryEvent('provideDiagnostics-executeDocumentSymbolProvider-error');
        continue;
      }

      // Remove periods in fragment because the extension used to not remove them and thus generated fragments which are now invalid
      const header = fileSymbols.find(symbol => symbol.kind === SymbolKind.String && anchorize(symbol.name) === anchorize(fragment));
      if (header === undefined) {
        const range = new Range(location.range.end.translate(0, 0 - 1 - fragment.length), location.range.end.translate(0, -1));
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
