'use strict';

import * as path from 'path';
import MarkDownDOM from 'markdown-dom';
import { ExtensionContext, languages, TextDocument, Position, CancellationToken, CompletionContext, CompletionItem, CompletionItemProvider, Range, workspace, Uri, CompletionItemKind, RelativePattern } from 'vscode';

export function activate(context: ExtensionContext) {
    if (workspace.workspaceFolders === undefined) {
        // Ignore files opened without a folder.
        return;
    }

    const linkProvider = new LinkProvider();
    context.subscriptions.push(languages.registerCompletionItemProvider({ scheme: 'file', language: 'markdown' }, linkProvider, '('));
    context.subscriptions.push(linkProvider);
}

class LinkProvider implements CompletionItemProvider {
    constructor() {
        // TODO: Cache workspace files
        // TODO: Update cache when workspace file is saved (`workspace.onDidSaveTextDocument`)
    }

    async provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext) {
        const check = document.getText(new Range(position.translate(0, -2), position));
        // Bail if we're not within the context of the target reference portion of a MarkDown link.
        if (check !== '](') {
            return;
        }

        const documentDirectoryPath = path.dirname(document.uri.fsPath);

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

            const absoluteFilePath = file.fsPath;
            const relativeFilePath = path.relative(documentDirectoryPath, absoluteFilePath);

            const fileItem = new CompletionItem(relativeFilePath, CompletionItemKind.File);
            fileItem.detail = path.basename(relativeFilePath);
            fileItem.documentation = absoluteFilePath;
            fileItem.insertText = relativeFilePath;
            fileItem.sortText = relativeFilePath;
            fileItem.filterText = [absoluteFilePath.replace(/\\/g, '/'), absoluteFilePath.replace(/\//g, '\\')].join();
            items.push(fileItem);

            if (path.extname(relativeFilePath).toUpperCase() === '.MD') {
                const textDocument = await workspace.openTextDocument(file);
                const lines = textDocument.getText().split(/\r|\n/).filter(line => line.trim().startsWith('#'));
                for (const line of lines) {
                    const header = this.strip(line);
                    const anchor = header.toLowerCase().replace(/\s/g, '-');

                    const headerItem = new CompletionItem(`${header} (${relativeFilePath})`, CompletionItemKind.Reference);
                    headerItem.detail = header;
                    headerItem.documentation = absoluteFilePath;
                    headerItem.insertText = relativeFilePath + '#' + anchor;
                    headerItem.sortText = relativeFilePath + '#' + anchor;
                    headerItem.filterText = [absoluteFilePath.replace(/\\/g, '/'), absoluteFilePath.replace(/\//g, '\\'), header, anchor].join();
                    items.push(headerItem);
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
            const absoluteDirectoryPath = directory;
            const relativeDirectoryPath = path.relative(documentDirectoryPath, absoluteDirectoryPath);

            const directoryItem = new CompletionItem(relativeDirectoryPath, CompletionItemKind.Folder);
            directoryItem.detail = path.basename(relativeDirectoryPath);
            directoryItem.documentation = absoluteDirectoryPath;
            directoryItem.insertText = relativeDirectoryPath;
            directoryItem.sortText = relativeDirectoryPath;
            directoryItem.filterText = [absoluteDirectoryPath.replace(/\\/g, '/'), absoluteDirectoryPath.replace(/\//g, '\\')].join();
            items.push(directoryItem);
        }

        return items;
    }

    strip(line: string) {
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

    dispose() {
        // TODO: Dispose of the cache.
    }
}
