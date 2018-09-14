'use strict';

import * as fsExtra from 'fs-extra';
import { CancellationToken, Diagnostic, DiagnosticCollection, DiagnosticSeverity, ExtensionContext, FileSystemWatcher, Range, RelativePattern, TextDocument, Uri, languages, workspace, CodeActionProvider, CodeActionContext, CodeAction, Command, CodeActionKind, commands, SymbolInformation, SymbolKind } from 'vscode';
import MarkDownLinkDocumentSymbolProvider from './MarkDownLinkDocumentSymbolProvider';
import MarkDownLinkDocumentLinkProvider from './MarkDownLinkDocumentLinkProvider';
import resolvePath from './resolvePath';
import MarkDownLinkCompletionItemProvider from './MarkDownLinkCompletionItemProvider';
import anchorize from './anchorize';

// Fix for Node runtime (VS Code is running Node 7 but this will natively work in Node 10)
if (Symbol["asyncIterator"] === undefined) {
    ((Symbol as any)["asyncIterator"]) = Symbol.for("asyncIterator");
}

export function activate(context: ExtensionContext) {
    if (workspace.workspaceFolders === undefined) {
        // Ignore files opened without a folder.
        return;
    }

    const markDownDocumentSelector = { scheme: 'file', language: 'markdown' };
    const { allowFullSuggestMode, allowSuggestionsForHeaders } = workspace.getConfiguration('markdown-link-suggestions');
    const linkCompletionItemProvider = new MarkDownLinkCompletionItemProvider(allowFullSuggestMode, allowSuggestionsForHeaders);
    context.subscriptions.push(languages.registerCompletionItemProvider(markDownDocumentSelector, linkCompletionItemProvider, '[', '(', '#'));
    const linkDiagnosticProvider = new LinkDiagnosticProvider();
    context.subscriptions.push(linkDiagnosticProvider);

    languages.registerDocumentSymbolProvider(markDownDocumentSelector, new MarkDownLinkDocumentSymbolProvider());
    languages.registerDocumentLinkProvider(markDownDocumentSelector, new MarkDownLinkDocumentLinkProvider());
    languages.registerCodeActionsProvider(markDownDocumentSelector, new LinkCodeActionProvider());

    commands.registerCommand('extension.createMissingFile', async (missingFilePath: string, reportingDocumentUri: Uri) => {
        await fsExtra.writeFile(missingFilePath, '');
        // TODO: Unhack
        const textDocument = await workspace.openTextDocument(reportingDocumentUri);
        (linkDiagnosticProvider as any).diagnosticCollection.set(reportingDocumentUri, await drainAsyncIterator(linkDiagnosticProvider.provideDiagnostics(textDocument)));
    });

    workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration('markdown-link-suggestions')) {
            const { allowFullSuggestMode, allowSuggestionsForHeaders } = workspace.getConfiguration('markdown-link-suggestions');
            linkCompletionItemProvider.allowFullSuggestMode = allowFullSuggestMode;
            linkCompletionItemProvider.allowSuggestionsForHeaders = allowSuggestionsForHeaders;
        }
    });
}

export class LinkDiagnosticProvider {
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
        const symbols = (await commands.executeCommand('vscode.executeDocumentSymbolProvider', textDocument.uri)) as SymbolInformation[];
        for (const { kind, name, location } of symbols) {
            if (kind !== SymbolKind.Package || !name.startsWith('[') || !name.endsWith(')')) {
                continue;
            }

            const [, path] = /]\((.*)\)/.exec(name)!;
            const uri = Uri.parse(path);
            if (uri.scheme && uri.scheme !== 'file') {
                continue;
            }

            const absolutePath = resolvePath(textDocument, uri.path);
            if (!await fsExtra.pathExists(absolutePath)) {
                const range = new Range(location.range.end.translate(0, 0 - 1 - path.length), location.range.end.translate(0, -1));
                const diagnostic = new Diagnostic(range, `The path ${absolutePath} doesn't exist on the disk.`, DiagnosticSeverity.Error);
                diagnostic.source = 'MarkDown Link Suggestions';
                // TODO: Similar enough path exists? Use `code` and suggest rewriting.
                // TODO: Use `code` and suggest creating.
                diagnostic.code = 'no-file;' + absolutePath; // TODO: Unhack this passage of path, do it somehow righter
                yield diagnostic;
            }

            if (uri.fragment !== '' && (await fsExtra.stat(absolutePath)).isFile()) {
                // Remove periods in fragment because the extension used to not remove them and thus generated fragments which are now invalid
                const header = symbols.find(symbol => symbol.kind === SymbolKind.String && anchorize(symbol.name) === anchorize(uri.fragment));
                if (header === undefined) {
                    const range = new Range(location.range.end.translate(0, 0 - 1 - uri.fragment.length), location.range.end.translate(0, -1));
                    const diagnostic = new Diagnostic(range, `The header ${uri.fragment} doesn't exist in file ${absolutePath}.`, DiagnosticSeverity.Error);
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

// TODO: Test this.
export class LinkCodeActionProvider implements CodeActionProvider {
    public provideCodeActions(document: TextDocument, range: Range, context: CodeActionContext, _token: CancellationToken): (Command | CodeAction)[] {
        const codeActions: CodeAction[] = [];
        for (const diagnostic of context.diagnostics) {
            if (diagnostic.range.intersection(range) === undefined) {
                continue;
            }

            // TODO: Unhack
            if (diagnostic.source === 'MarkDown Link Suggestions' && diagnostic.code && diagnostic.code.toString().startsWith('no-file;')) {
                const filePath = diagnostic.code.toString().substr('no-file;'.length);

                const codeAction = new CodeAction('Create the missing file', CodeActionKind.Empty);
                codeAction.command = { title: '', command: 'extension.createMissingFile', tooltip: '', arguments: [filePath, document.uri] };

                codeActions.push(codeAction);
            }
        }

        return codeActions;
    }
}

// https://stackoverflow.com/q/50234481/2715716 when used with `AsyncIterableIterator<Diagnostic>`
// TODO: Await for VS Code using Node 10 and then use native
//const diagnostics = [...await this.provideDiagnostics(textDocument)];
export async function drainAsyncIterator<T>(iterator: AsyncIterableIterator<T>): Promise<T[]> {
    const items: T[] = [];
    for await (const item of iterator) {
        items.push(item);
    }

    return items;
}
