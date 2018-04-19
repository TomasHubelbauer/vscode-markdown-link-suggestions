'use strict';

import { ExtensionContext, languages, TextDocument, Position, CancellationToken, CompletionContext, CompletionItem, CompletionItemProvider } from 'vscode';

export function activate(context: ExtensionContext) {
    const linkProvider = new LinkProvider();
    context.subscriptions.push(languages.registerCompletionItemProvider({ scheme: 'file', language: 'markdown'}, linkProvider));
    context.subscriptions.push(linkProvider);
}

class LinkProvider implements CompletionItemProvider {
    constructor() {
        console.log('Instantiate');
    }

    provideCompletionItems(document: TextDocument, position: Position, token: CancellationToken, context: CompletionContext) {
        console.log('Provide?');
        // https://github.com/Microsoft/vscode/issues/48194
        return [
            { label: '_provide test_' }
        ];
    }

    dispose() {

    }
}
