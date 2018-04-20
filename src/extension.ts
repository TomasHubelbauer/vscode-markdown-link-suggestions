'use strict';

import { ExtensionContext, languages, TextDocument, Position, CancellationToken, CompletionContext, CompletionItem, CompletionItemProvider, Range, workspace, Uri } from 'vscode';

export function activate(context: ExtensionContext) {
    const linkProvider = new LinkProvider();
    context.subscriptions.push(languages.registerCompletionItemProvider({ scheme: 'file', language: 'markdown'}, linkProvider, '('));
    context.subscriptions.push(linkProvider);
}

class LinkProvider implements CompletionItemProvider {
    constructor() {
    }

    // https://github.com/Microsoft/vscode/issues/48255
    async provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext) {
        const check = document.getText(new Range(position.translate(0, -2), position));
        if (check !== '](') {
            return;
        }

        const files = await workspace.findFiles('**/*.md');
        const items: CompletionItem[] = [];
        for (const file of files) {
            if (file.scheme !== 'file') {
                return;
            }

            const label = file.fsPath.substring(workspace.getWorkspaceFolder(Uri.file(file.fsPath))!.uri.fsPath.length + 1);
            items.push({ label: label });

            const textDocument = await workspace.openTextDocument(file);
            const lines = textDocument.getText().split(/\r|\n/).filter(line => line.trim().startsWith('#'));
            for (const line of lines) {
                // TODO: Trim inline formatting properly, for now only removing links!

                let anchor = line.substring(line.indexOf('# ') + '# '.length).toLowerCase().replace(/\s/g, '-');

                // Remove link.
                if (anchor.startsWith('[')) {
                    anchor = anchor.substring('['.length, anchor.indexOf(']'));
                }

                items.push({ label: label + '#' + anchor });
            }
        }

        return items;
    }

    dispose() {

    }
}
