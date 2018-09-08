import * as fsExtra from 'fs-extra';
import { DiagnosticCollection, FileSystemWatcher, languages, workspace, RelativePattern, TextDocument, Diagnostic, DiagnosticSeverity, Uri } from "vscode";
import drainAsyncIterator from './drainAsyncIterator';
import getFileLinks from './getFileLinks';
import resolvePath from './resolvePath';
import getHeaders from './getHeaders';
import anchorize from './anchorize';

export default class LinkDiagnosticProvider {
  private readonly diagnosticCollection: DiagnosticCollection;
  private readonly watcher: FileSystemWatcher;

  constructor(test: boolean = false) {
    this.diagnosticCollection = languages.createDiagnosticCollection('MarkDown Links' + (test ? ' Test' : ''));
    this.watcher = workspace.createFileSystemWatcher('**/*.md');

    this.watcher.onDidChange(async uri => {
      const textDocument = await workspace.openTextDocument(uri);
      this.diagnosticCollection.set(uri, await drainAsyncIterator(this.provideDiagnostics(textDocument)));
    });

    this.watcher.onDidCreate(async uri => {
      const textDocument = await workspace.openTextDocument(uri);
      this.diagnosticCollection.set(uri, await drainAsyncIterator(this.provideDiagnostics(textDocument)));
    });

    this.watcher.onDidDelete(uri => this.diagnosticCollection.delete(uri));

    this.index();
  }

  private async index() {
    // TODO: https://github.com/Microsoft/vscode/issues/48674
    const excludes = await workspace.getConfiguration('search', null).get('exclude')!;
    const globs = Object.keys(excludes).map(exclude => new RelativePattern(workspace.workspaceFolders![0], exclude));
    const occurences: { [fsPath: string]: number; } = {};
    for (const glob of globs) {
      // TODO: https://github.com/Microsoft/vscode/issues/47645
      for (const file of await workspace.findFiles('**/*.md', glob)) {
        occurences[file.fsPath] = (occurences[file.fsPath] || 0) + 1;
      }
    }

    // Accept only files not excluded in any of the globs
    const files = Object.keys(occurences).filter(fsPath => occurences[fsPath] === globs.length);
    for (const file of files) {
      const uri = Uri.file(file);
      const textDocument = await workspace.openTextDocument(uri);
      this.diagnosticCollection.set(uri, await drainAsyncIterator(this.provideDiagnostics(textDocument)));
    }
  }

  // TODO: Use MarkDownDOM for finding the links within the document
  public async *provideDiagnostics(textDocument: TextDocument): AsyncIterableIterator<Diagnostic> {
    for (const link of getFileLinks(textDocument)) {
      const absolutePath = resolvePath(textDocument, link.uri);
      if (!await fsExtra.pathExists(absolutePath)) {
        const diagnostic = new Diagnostic(link.uriRange, `The path ${absolutePath} doesn't exist on the disk.`, DiagnosticSeverity.Error);
        diagnostic.source = 'MarkDown Link Suggestions';
        // TODO: Similar enough path exists? Use `code` and suggest rewriting.
        // TODO: Use `code` and suggest creating.
        diagnostic.code = 'no-file;' + absolutePath; // TODO: Unhack this passage of path, do it somehow righter
        yield diagnostic;
      }

      if (link.uri.fragment !== '' && (await fsExtra.stat(absolutePath)).isFile()) {
        let headerExists = false;
        for (const { text } of getHeaders(await workspace.openTextDocument(absolutePath))) {
          // Remove periods in fragment because the extension used to not remove them and thus generated fragments which are now invalid
          if (anchorize(text) === link.uri.fragment.replace('.', '')) {
            headerExists = true;
            break;
          }
        }

        if (!headerExists) {
          const diagnostic = new Diagnostic(link.uriRange, `The header ${link.uri.fragment} doesn't exist in file ${absolutePath}.`, DiagnosticSeverity.Error);
          diagnostic.source = 'MarkDown Link Suggestions';
          // TODO: Similar enough path exists? Use `code` and `relatedInformation` and suggest rewriting.
          // TODO: Use `code` and suggest appending to the file (maybe quick pick after which header).
          yield diagnostic;
        }
      }
    }
  }

  public dispose() {
    this.diagnosticCollection.dispose();
    this.watcher.dispose();
  }
}
