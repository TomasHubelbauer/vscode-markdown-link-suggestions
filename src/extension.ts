'use strict';

import MarkDownDOM from 'markdown-dom';
import { ExtensionContext, languages, TextDocument, Position, CancellationToken, CompletionContext, CompletionItem, CompletionItemProvider, Range, workspace, Uri, CompletionItemKind } from 'vscode';

export function activate(context: ExtensionContext) {
    const linkProvider = new LinkProvider();
    context.subscriptions.push(languages.registerCompletionItemProvider({ scheme: 'file', language: 'markdown'}, linkProvider, '('));
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

        const files = await workspace.findFiles('**/*.*', undefined); // Exclude default exclusions using `undefined`
        const items: CompletionItem[] = [];
        for (const file of files) {
            if (file.scheme !== 'file') {
                return;
            }

            const label = file.fsPath.substring(workspace.getWorkspaceFolder(Uri.file(file.fsPath))!.uri.fsPath.length + 1);
            items.push({ label: label, kind: CompletionItemKind.File });

            if (file.fsPath.endsWith('.md')) {
                const textDocument = await workspace.openTextDocument(file);
                const lines = textDocument.getText().split(/\r|\n/).filter(line => line.trim().startsWith('#'));
                for (const line of lines) {
                    const header = this.strip(line);
    
                    const anchor = header.toLowerCase().replace(/\s/g, '-');
                    items.push({ label: label + ' ' + header, insertText: label + '#' + anchor, kind: CompletionItemKind.Reference });
                }
            }
        }

        return items;
    }

    strip(line: string) {
        try {
            const dom = MarkDownDOM.parse(line);
            let header = '';
            // TODO: Fix weird types
            for (const span of (dom as any).blocks[0].spans) {
                if (span.type === 'run') {
                    header += span.text;
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
        // TODO: Dispose if the cache.
    }
}