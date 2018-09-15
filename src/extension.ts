import MarkDownLinkDocumentSymbolProvider from './MarkDownLinkDocumentSymbolProvider';
import MarkDownLinkDocumentLinkProvider from './MarkDownLinkDocumentLinkProvider';
import MarkDownLinkCompletionItemProvider from './MarkDownLinkCompletionItemProvider';
import getNonExcludedFiles from './getNonExcludedFiles';
import provideDiagnostics from './provideDiagnostics';
import MarkDownLinkCodeActionProvider from './MarkDownLinkCodeActionProvider';
import { ExtensionContext, workspace, languages, commands } from 'vscode';
import { writeFile } from 'fs-extra';

export async function activate(context: ExtensionContext) {
    // Ignore files opened without a folder.
    if (workspace.workspaceFolders === undefined) {
        return;
    }

    const markDownDocumentSelector = { scheme: 'file', language: 'markdown' };
    const { allowFullSuggestMode, allowSuggestionsForHeaders } = workspace.getConfiguration('markdown-link-suggestions');
    const linkCompletionItemProvider = new MarkDownLinkCompletionItemProvider(allowFullSuggestMode, allowSuggestionsForHeaders);
    context.subscriptions.push(languages.registerCompletionItemProvider(markDownDocumentSelector, linkCompletionItemProvider, '[', '(', '#'));
    // Spike:
    // context.subscriptions.push(languages.registerCompletionItemProvider(markDownDocumentSelector, linkCompletionItemProvider, ...LinkContextRecognizerBase.getTriggerCharacters()));
    context.subscriptions.push(languages.registerDocumentSymbolProvider(markDownDocumentSelector, new MarkDownLinkDocumentSymbolProvider()));
    context.subscriptions.push(languages.registerDocumentLinkProvider(markDownDocumentSelector, new MarkDownLinkDocumentLinkProvider()));
    context.subscriptions.push(languages.registerCodeActionsProvider(markDownDocumentSelector, new MarkDownLinkCodeActionProvider()));

    const diagnosticCollection = languages.createDiagnosticCollection('MarkDown Links');
    context.subscriptions.push(diagnosticCollection);
    const watcher = workspace.createFileSystemWatcher('**/*.md');
    context.subscriptions.push(watcher);

    watcher.onDidChange(async uri => {
        const textDocument = await workspace.openTextDocument(uri);
        diagnosticCollection.set(uri, await provideDiagnostics(textDocument));
    });

    watcher.onDidCreate(async uri => {
        const textDocument = await workspace.openTextDocument(uri);
        diagnosticCollection.set(uri, await provideDiagnostics(textDocument));
    });

    watcher.onDidDelete(uri => diagnosticCollection.delete(uri));

    // TODO: Replace this with the VS Code built-in command
    commands.registerCommand('extension.createMissingFile', async (missingFilePath: string, reportingDocumentUri: Uri) => {
        await writeFile(missingFilePath, '');
        // TODO: Unhack
        const textDocument = await workspace.openTextDocument(reportingDocumentUri);
        diagnosticCollection.set(reportingDocumentUri, await provideDiagnostics(textDocument));
    });

    workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration('markdown-link-suggestions')) {
            const { allowFullSuggestMode, allowSuggestionsForHeaders } = workspace.getConfiguration('markdown-link-suggestions');
            linkCompletionItemProvider.allowFullSuggestMode = allowFullSuggestMode;
            linkCompletionItemProvider.allowSuggestionsForHeaders = allowSuggestionsForHeaders;
        }
    });

    const files = await getNonExcludedFiles();
    for (const file of files) {
        const textDocument = await workspace.openTextDocument(file);
        diagnosticCollection.set(file, await provideDiagnostics(textDocument));
    }
}
