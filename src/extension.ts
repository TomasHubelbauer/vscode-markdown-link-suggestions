'use strict';

import * as fsExtra from 'fs-extra';
import * as path from 'path';
import { CancellationToken, CompletionContext, CompletionItem, CompletionItemKind, CompletionItemProvider, Diagnostic, DiagnosticCollection, DiagnosticSeverity, ExtensionContext, FileSystemWatcher, Position, Range, RelativePattern, TextDocument, TextEdit, Uri, languages, workspace, CodeActionProvider, CodeActionContext, CodeAction, Command, CodeActionKind, commands, SymbolInformation, SymbolKind } from 'vscode';
import MarkDownLinkDocumentSymbolProvider from './MarkDownLinkDocumentSymbolProvider';
import MarkDownLinkDocumentLinkProvider from './MarkDownLinkDocumentLinkProvider';
import resolvePath from './resolvePath';

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
    const linkCompletionItemProvider = new LinkCompletionItemProvider(allowFullSuggestMode, allowSuggestionsForHeaders);
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
        const headers = symbols.filter(symbol => symbol.kind === SymbolKind.String && symbol.name.startsWith('#')); // VS Code API detected headers
        const links = symbols
            .filter(symbol => symbol.kind === SymbolKind.String)
            .map(pathSymbol => {
                const textSymbol = symbols.find(symbol => symbol.kind === SymbolKind.String && symbol.location.range.end.isEqual(pathSymbol.location.range.start.translate(0, -2)));
                return { pathSymbol, textSymbol };
            })
            .filter(({ pathSymbol, textSymbol }) => {
                if (pathSymbol === undefined || textSymbol === undefined) {
                    return false;
                }

                const uri = Uri.parse(pathSymbol.name);
                if (uri.scheme && uri.scheme !== 'file') {
                    return false;
                }

                return true;
            })
            .map(({ pathSymbol }) => pathSymbol);
        console.log(links);

        for (const link of links) {
            const absolutePath = resolvePath(textDocument, link.name);
            if (!await fsExtra.pathExists(absolutePath)) {
                const diagnostic = new Diagnostic(link.location.range, `The path ${absolutePath} doesn't exist on the disk.`, DiagnosticSeverity.Error);
                diagnostic.source = 'MarkDown Link Suggestions';
                // TODO: Similar enough path exists? Use `code` and suggest rewriting.
                // TODO: Use `code` and suggest creating.
                diagnostic.code = 'no-file;' + absolutePath; // TODO: Unhack this passage of path, do it somehow righter
                yield diagnostic;
            }

            const uri = Uri.parse(link.name);
            if (uri.scheme && uri.scheme !== 'file') {
                continue;
            }

            if (uri.fragment !== '' && (await fsExtra.stat(absolutePath)).isFile()) {
                let headerExists = false;
                for (const header of headers) {
                    // Remove periods in fragment because the extension used to not remove them and thus generated fragments which are now invalid
                    if (anchorize(header.name) === uri.fragment.replace('.', '')) {
                        headerExists = true;
                        break;
                    }
                }

                if (!headerExists) {
                    const diagnostic = new Diagnostic(link.location.range, `The header ${uri.fragment} doesn't exist in file ${absolutePath}.`, DiagnosticSeverity.Error);
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

export class LinkCompletionItemProvider implements CompletionItemProvider {
    public allowFullSuggestMode = false;
    public allowSuggestionsForHeaders = true;

    constructor(allowFullSuggestMode: boolean, allowSuggestionsForHeaders: boolean) {
        // TODO: Cache workspace files
        // TODO: Update cache when workspace file is saved (`workspace.onDidSaveTextDocument`)
        this.allowFullSuggestMode = allowFullSuggestMode;
        this.allowSuggestionsForHeaders = allowSuggestionsForHeaders;
    }

    public async provideCompletionItems(document: TextDocument, position: Position, _token: CancellationToken, context: CompletionContext) {
        const character = context.triggerCharacter || /* Ctrl + Space */ document.getText(new Range(position.translate(0, -1), position));

        // TODO: Extend to be able to handle suggestions after backspacing (see if this fires but we already have some text)
        const fullSuggestMode = character === '[';
        if (fullSuggestMode && !this.allowFullSuggestMode) {
            return;
        }

        const documentDirectoryPath = path.dirname(document.uri.fsPath);
        const items: CompletionItem[] = [];

        let fullSuggestModeBraceCompleted = false;
        let partialSuggestModeBraceCompleted = false;
        const braceCompletionRange = new Range(position, position.translate(0, 1));
        if (fullSuggestMode) {
            fullSuggestModeBraceCompleted = document.getText(braceCompletionRange) === ']';
        } else {
            // TODO: Handle a case where there is only '(' on the line
            const linkConfirmationRange = new Range(position.translate(0, -2), position);
            if (character === '(') {
                if (document.getText(linkConfirmationRange) === '](') {
                    partialSuggestModeBraceCompleted = document.getText(braceCompletionRange) === ')';
                    // TODO: Read the link text to be able to rank items matching it higher
                } else {
                    // Bail if this is just a regular parentheses, not MarkDown link
                    return;
                }
            } else {
                const headerLinkConfirmationRange = new Range(position.translate(0, -3), position);
                // TODO: Integrate this in a bit nicer if possible
                if (character === '#' && document.getText(headerLinkConfirmationRange) === '](#') {
                    partialSuggestModeBraceCompleted = document.getText(braceCompletionRange) === ')';
                    // Only suggest local file headers
                    const symbols = (await commands.executeCommand('vscode.executeDocumentSymbolProvider', document.uri)) as SymbolInformation[];
                    const headers = symbols.filter(symbol => symbol.kind === SymbolKind.String); // VS Code API detected headers
                    for (let order = 1; order <= headers.length; order++) {
                        const header = headers[order - 1];
                        const text = header.name.replace(/^#+/g, '').trim();
                        items.push(this.item(CompletionItemKind.Reference, document.uri.fsPath, { order, text }, documentDirectoryPath, fullSuggestMode, fullSuggestModeBraceCompleted, partialSuggestModeBraceCompleted, braceCompletionRange, true));
                    }

                    items.forEach(item => item.filterText = item.insertText + ';' + item.filterText);
                    return items;
                } else {
                    // Bail if we are in neither full suggest mode nor partial (link target) suggest mode nor header mode
                    return;
                }
            }
        }

        // TODO: https://github.com/TomasHubelbauer/vscode-extension-findFilesWithExcludes
        // TODO: https://github.com/Microsoft/vscode/issues/48674
        const excludes = await workspace.getConfiguration('search', null).get('exclude')!;
        const globs = Object.keys(excludes).map(exclude => new RelativePattern(workspace.workspaceFolders![0], exclude));
        const occurences: { [fsPath: string]: number; } = {};
        for (const glob of globs) {
            // TODO: https://github.com/Microsoft/vscode/issues/47645
            for (const file of await workspace.findFiles('**/*.*', glob)) {
                occurences[file.fsPath] = (occurences[file.fsPath] || 0) + 1;
            }
        }

        // Accept only files not excluded in any of the globs
        const files = Object.keys(occurences).filter(fsPath => occurences[fsPath] === globs.length).map(file => Uri.file(file));
        for (const file of files) {
            if (file.scheme !== 'file') {
                return;
            }

            items.push(this.item(CompletionItemKind.File, file.fsPath, null, documentDirectoryPath, fullSuggestMode, fullSuggestModeBraceCompleted, partialSuggestModeBraceCompleted, braceCompletionRange));
            if (path.extname(file.fsPath).toUpperCase() === '.MD' && this.allowSuggestionsForHeaders) {
                const symbols = (await commands.executeCommand('vscode.executeDocumentSymbolProvider', file)) as SymbolInformation[];
                const headers = symbols.filter(symbol => symbol.kind === SymbolKind.String); // VS Code API detected headers
                for (let order = 1; order <= headers.length; order++) {
                    const header = headers[order - 1];
                    const text = header.name.replace(/^#+/g, '').trim();
                    items.push(this.item(CompletionItemKind.Reference, file.fsPath, { order, text }, documentDirectoryPath, fullSuggestMode, fullSuggestModeBraceCompleted, partialSuggestModeBraceCompleted, braceCompletionRange));
                }
            }
        }

        const directories = files.reduce((directoryPaths, filePath) => {
            const directoryPath = path.dirname(filePath.fsPath);
            if (!directoryPaths.includes(directoryPath)) {
                directoryPaths.push(directoryPath);
            }

            return directoryPaths;
        }, [] as string[]);

        for (const directory of directories) {
            items.push(this.item(CompletionItemKind.Folder, directory, null, documentDirectoryPath, fullSuggestMode, fullSuggestModeBraceCompleted, partialSuggestModeBraceCompleted, braceCompletionRange));
        }

        return items;
    }

    private item(kind: CompletionItemKind, absoluteFilePath: string, header: { order: number; text: string; } | null, absoluteDocumentDirectoryPath: string, fullSuggestMode: boolean, fullSuggestModeBraceCompleted: boolean, partialSuggestModeBraceCompleted: boolean, braceCompletionRange: Range, hack?: boolean) {
        // Extract and join the file name with header (if any) for displaying in the label
        const fileName = path.basename(absoluteFilePath);
        let fileNameWithHeader = fileName;
        if (header !== null) {
            fileNameWithHeader = hack ? header.text : (fileNameWithHeader + ' # ' + header.text);
        }

        // Put together a label in a `name#header (directory if not current)` format
        let label = fileNameWithHeader;
        const relativeDirectoryPath = path.relative(absoluteDocumentDirectoryPath, path.dirname(absoluteFilePath));
        if (relativeDirectoryPath !== '') {
            label += ` (${relativeDirectoryPath})`;
        }

        // Construct the completion item based on the label and the provided kind
        const item = new CompletionItem(label, kind);
        // Display standalone header, otherwise fall back to displaying the name we then know doesn't have fragment (header)
        item.detail = header ? header.text : fileName;
        // Display expanded and normalized absolute path for inspection
        item.documentation = path.normalize(absoluteFilePath);
        // Derive anchorized version of the header to ensure working linkage
        const anchor = header === null ? '' : anchorize(header.text);
        // Compute suggested file path relative to the currently edited file's directory path
        let relativeFilePath = path.relative(absoluteDocumentDirectoryPath, absoluteFilePath) || '.';
        // TODO: URL encode path minimally (to make VS Code work, like replacing + sign and other otherwise linkage breaking characters)
        relativeFilePath = relativeFilePath; // TODO
        // Insert either relative file path with anchor only or file name without anchor in the MarkDown link syntax if in full suggest mode
        if (fullSuggestMode) {
            item.insertText = `${fileName}](${relativeFilePath}${anchor ? '#' + anchor : ''})`;
        } else {
            item.insertText = hack ? anchor : (anchor ? relativeFilePath + '#' + anchor : relativeFilePath);

            if (!partialSuggestModeBraceCompleted) {
                item.insertText += ')';
            }
        }

        // Sort by the relative path name for now (predictable but not amazingly helpful)
        // TODO: Contribute a setting for sorting by timestamp then by this
        item.sortText = relativeFilePath; // TODO
        if (header !== null) {
            // Sort headers in the document order
            item.sortText += ` ${header.order.toString().padStart(5, '0')} # ${header.text}`;
        }

        // Offer both forwards slash and backwards slash filter paths so that the user can type regardless of the platform
        item.filterText = [absoluteFilePath.replace(/\\/g, '/'), absoluteFilePath.replace(/\//g, '\\')].join();
        // Remove brace-completed closing square bracket if any (may be turned off) when in full suggest mode because we insert our own and then some
        if (fullSuggestMode && fullSuggestModeBraceCompleted) {
            item.additionalTextEdits = [TextEdit.delete(braceCompletionRange)];
        }

        return item;
    }
}

function anchorize(header: string) {
    return header.toLowerCase().replace(/\s/g, '-').replace(/\./g, '');
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
