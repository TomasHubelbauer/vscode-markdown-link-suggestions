'use strict';

import * as fsExtra from 'fs-extra';
import { ExtensionContext, Uri, languages, workspace, commands } from 'vscode';
import LinkContextRecognizerBase from './LinkContextRecognizerBase';
import drainAsyncIterator from './drainAsyncIterator';
import LinkDiagnosticProvider from './LinkDiagnosticProvider';
import LinkCompletionItemProvider from './LinkCompletionItemProvider';
import LinkCodeActionProvider from './LinkCodeActionProvider';
import LinkDocumentLinkProvider from './LinkDocumentLinkProvider';

// Fix for Node runtime (VS Code is running Node 8.9.3 but this will natively work in Node 10)
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
  context.subscriptions.push(languages.registerCompletionItemProvider(markDownDocumentSelector, linkCompletionItemProvider, ...LinkContextRecognizerBase.getTriggerCharacters()));
  const linkDiagnosticProvider = new LinkDiagnosticProvider();
  context.subscriptions.push(linkDiagnosticProvider);

  languages.registerDocumentLinkProvider(markDownDocumentSelector, new LinkDocumentLinkProvider());
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
