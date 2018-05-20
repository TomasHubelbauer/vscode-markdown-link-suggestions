'use strict';

import MarkDownDOM from 'markdown-dom';
import * as path from 'path';
import * as fsExtra from 'fs-extra';
import { CancellationToken, CompletionContext, CompletionItem, CompletionItemKind, CompletionItemProvider, Diagnostic, DiagnosticCollection, DiagnosticSeverity, ExtensionContext, FileSystemWatcher, Position, Range, RelativePattern, TextDocument, Uri, languages, workspace, TextEdit } from 'vscode';

export function activate(context: ExtensionContext) {
    if (workspace.workspaceFolders === undefined) {
        // Ignore files opened without a folder.
        return;
    }

    context.subscriptions.push(languages.registerCompletionItemProvider({ scheme: 'file', language: 'markdown' }, new LinkProvider(), '[', '('));

    const linkChecker = new LinkChecker();
    context.subscriptions.push(linkChecker);
}

class LinkChecker {
    private static ignoredSchemes = ['http', 'https', 'mailto'];
    private readonly diagnosticCollection: DiagnosticCollection;
    private readonly watcher: FileSystemWatcher;

    constructor() {
        this.diagnosticCollection = languages.createDiagnosticCollection('MarkDown Links');
        this.watcher = workspace.createFileSystemWatcher('**/*.md');

        this.watcher.onDidChange(async uri => {
            const textDocument = await workspace.openTextDocument(uri);
            // https://stackoverflow.com/q/50234481/2715716 when used with `AsyncIterableIterator<Diagnostic>`
            //const diags = [...await this.diag(textDocument)];
            this.diagnosticCollection.set(uri, await this.diag(textDocument));
        });

        this.watcher.onDidCreate(async uri => {
            const textDocument = await workspace.openTextDocument(uri);
            // https://stackoverflow.com/q/50234481/2715716 when used with `AsyncIterableIterator<Diagnostic>`
            //const diags = [...await this.diag(textDocument)];
            this.diagnosticCollection.set(uri, await this.diag(textDocument));
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
            // https://stackoverflow.com/q/50234481/2715716 when used with `AsyncIterableIterator<Diagnostic>`
            //const diags = [...await this.diag(textDocument)];
            this.diagnosticCollection.set(uri, await this.diag(textDocument));
        }
    }

    // TODO: Use MarkDownDOM for finding the links within the document
    private async /* `*`diag */diag(textDocument: TextDocument)/*: AsyncIterableIterator<Diagnostic> */ {
        const regex = /(?:__|[*#])|\[.*?\]\((.*?)\)/gm;
        const text = textDocument.getText();
        let match: RegExpExecArray;
        // https://stackoverflow.com/q/50234481/2715716 when used with `AsyncIterableIterator<Diagnostic>`
        const diags: Diagnostic[] = [];
        while ((match = regex.exec(text)!) !== null) {
            const target = match[1];
            if (target === undefined) {
                continue;
            }

            const uri = Uri.parse(target);
            if (LinkChecker.ignoredSchemes.includes(uri.scheme)) {
                continue;
            }

            const relativePath = uri.fsPath;
            const documentDirectoryPath = path.dirname(textDocument.uri.fsPath);
            const absolutePath = path.resolve(documentDirectoryPath, relativePath);
            if (!await fsExtra.pathExists(absolutePath)) {
                const range = new Range(textDocument.positionAt(match.index), textDocument.positionAt(match.index + match.length));
                // https://stackoverflow.com/q/50234481/2715716 when used with `AsyncIterableIterator<Diagnostic>`
                // yield new Diagnostic…
                diags.push(new Diagnostic(range, `The path ${absolutePath} doesn't exist on the disk.`, DiagnosticSeverity.Error));
            }
        }

        return diags;
    }

    public dispose() {
        this.diagnosticCollection.dispose();
        this.watcher.dispose();
    }
}

export class LinkProvider implements CompletionItemProvider {
    constructor() {
        // TODO: Cache workspace files
        // TODO: Update cache when workspace file is saved (`workspace.onDidSaveTextDocument`)
    }

    async provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext) {
        // TODO: Extend to be able to handle suggestions after backspacing (see if this fires but we already have some text)
        const fullSuggestMode = context.triggerCharacter === '[';
        let fullSuggestModeBraceCompleted = false;
        let partialSuggestModeBraceCompleted = false;
        const braceCompletionRange = new Range(position, position.translate(0, 1));
        if (fullSuggestMode) {
            fullSuggestModeBraceCompleted = document.getText(braceCompletionRange) === ']';
        } else {
            const linkConfirmationRange = new Range(position.translate(0, -2), position);
            if (context.triggerCharacter === '(') {
                if (document.getText(linkConfirmationRange) === '](') {
                    partialSuggestModeBraceCompleted = document.getText(braceCompletionRange) === ')';
                } else {
                    // Bail if this is just a regular parentheses, not MarkDown link
                    return;
                }
            } else {
                // Bail if we are in neither full suggest mode nor partial (link target) suggest mode
                return;
            }
        }

        const documentDirectoryPath = path.dirname(document.uri.fsPath);

        // TODO: https://github.com/TomasHubelbauer/vscode-extension-findFilesWithExcludes
        // TODO: https://github.com/Microsoft/vscode/issues/48674
        const excludes = await workspace.getConfiguration('search').get('exclude')!;
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

        const items: CompletionItem[] = [];
        for (const file of files) {
            if (file.scheme !== 'file') {
                return;
            }

            items.push(this.item(CompletionItemKind.File, file.fsPath, null, documentDirectoryPath, fullSuggestMode, fullSuggestModeBraceCompleted, partialSuggestModeBraceCompleted, braceCompletionRange));
            if (path.extname(file.fsPath).toUpperCase() === '.MD') {
                const textDocument = await workspace.openTextDocument(file);
                const lines = textDocument.getText().split(/\r|\n/).filter(line => line.trim().startsWith('#'));
                for (let index = 0; index < lines.length; index++) {
                    const line = lines[index];
                    const text = this.strip(line);
                    items.push(this.item(CompletionItemKind.Reference, file.fsPath, { index, text }, documentDirectoryPath, fullSuggestMode, fullSuggestModeBraceCompleted, partialSuggestModeBraceCompleted, braceCompletionRange));
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

    private strip(line: string) {
        try {
            const dom = MarkDownDOM.parse(line);
            let header = '';

            const block = dom.blocks[0];
            if (block.type !== 'header') {
                throw new Error('Not a header block!');
            }

            for (const span of block.spans) {
                switch (span.type) {
                    case 'run': header += span.text; break;
                    case 'link': header += span.text; break;
                    default: {
                        // TODO: Telemetry.
                    }
                }
            }

            return header.trim();
        } catch (error) {
            let header = line.substring(line.indexOf('# ') + '# '.length);

            // Remove link.
            if (header.startsWith('[')) {
                header = header.substring('['.length, header.indexOf(']'));
            }

            return header;
        }
    }

    private item(kind: CompletionItemKind, absoluteFilePath: string, header: { index: number; text: string; } | null, absoluteDocumentDirectoryPath: string, fullSuggestMode: boolean, fullSuggestModeBraceCompleted: boolean, partialSuggestModeBraceCompleted: boolean, braceCompletionRange: Range) {
        // Extract and join the file name with header (if any) for displaying in the label
        const fileName = path.basename(absoluteFilePath);
        let fileNameWithHeader = fileName;
        if (header !== null) {
            fileNameWithHeader += ' # ' + header.text;
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
        const anchor = header === null ? '' : '#' + header.text.toLowerCase().replace(/\s/g, '-');
        // Compute suggested file path relative to the currently edited file's directory path
        let relativeFilePath = path.relative(absoluteDocumentDirectoryPath, absoluteFilePath);
        // TODO: URL encode path minimally (to make VS Code work, like replacing + sign and other otherwise linkage breaking characters)
        relativeFilePath = relativeFilePath; // TODO
        // Insert either relative file path with anchor only or file name without anchor in the MarkDown link syntax if in full suggest mode
        if (fullSuggestMode) {
            item.insertText = `${fileName}](${relativeFilePath}${anchor})`;
        } else {
            item.insertText = relativeFilePath + anchor;
            if (!partialSuggestModeBraceCompleted) {
                item.insertText += ')';
            }
        }

        // Sort by the relative path name for now (predictable but not amazingly helpful)
        // TODO: Contribute a setting for sorting by timestamp then by this
        item.sortText = relativeFilePath; // TODO
        if (header !== null) {
            // Sort headers in the document order
            item.sortText += header.index.toString().padStart(5, '0');
            item.sortText += anchor;
        }

        // Offer both forwards slash and backwards slash filter paths so that the user can type regardless of the platform
        item.filterText = [absoluteFilePath.replace(/\\/g, '/'), absoluteFilePath.replace(/\//g, '\\')].join();
        // Remove brace-completed closing square bracket if any (may be turned off) when in full suggest mode because we insert our own and then some
        if (fullSuggestMode && fullSuggestModeBraceCompleted) {
            item.additionalTextEdits = [new TextEdit(braceCompletionRange, '')];
        }

        return item;
    }
}
