import { CodeActionProvider, TextDocument, Range, CodeActionContext, CancellationToken, CodeAction, CodeActionKind } from "vscode";

// TODO: Test this.
export default class MarkDownLinkCodeActionProvider implements CodeActionProvider {
  public provideCodeActions(document: TextDocument, range: Range, context: CodeActionContext, _token: CancellationToken) {
    const codeActions: CodeAction[] = [];
    for (const diagnostic of context.diagnostics) {
      if (diagnostic.range.intersection(range) === undefined) {
        continue;
      }

      // TODO: Unhack
      if (diagnostic.source === 'MarkDown Link Suggestions' && diagnostic.code && diagnostic.code.toString().startsWith('no-file;')) {
        const filePath = diagnostic.code.toString().substr('no-file;'.length);

        const codeAction = new CodeAction('Create the missing file', CodeActionKind.Empty);
        // TODO: Use VS Code command
        codeAction.command = { title: '', command: 'extension.createMissingFile', tooltip: '', arguments: [filePath, document.uri] };

        codeActions.push(codeAction);
      }
    }

    return codeActions;
  }
}
