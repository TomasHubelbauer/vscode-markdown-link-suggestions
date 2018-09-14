import { workspace, commands, window, DiagnosticSeverity, Range } from "vscode";
import { join } from "path";
import { writeFile, remove } from "fs-extra";
import provideDiagnostics from "./provideDiagnostics";
import { equal, ok, deepEqual } from "assert";

const workspaceDirectoryPath = workspace.workspaceFolders![0].uri.fsPath;
const readmeMdFilePath = join(workspaceDirectoryPath, 'README.md');

test('provideDiagnostics', async () => {
  try {
    await writeFile(readmeMdFilePath, `
[exists](README.md)
[exists but bad header](README.md#nope)
[does not exist](DO-NOT-README.md)
[exists - variant without period](README.md#self-vs-self)
[exists - variant with period](README.md#self-vs.-self)

## Working

## Self vs. Self

https://github.com/TomasHubelbauer/vscode-markdown-link-suggestions/issues/5

[](#implicit-bad)
[](README.md#explicit-bad)
`);

    const textDocument = await workspace.openTextDocument(readmeMdFilePath);
    await commands.executeCommand('workbench.action.files.revert', textDocument.uri); // Reload from disk
    const textEditor = await window.showTextDocument(textDocument);

    let diagnostics = await provideDiagnostics(textDocument);
    equal(diagnostics.length, 4);

    equal(diagnostics[0].severity, DiagnosticSeverity.Error);
    ok(diagnostics[0].message.startsWith('The header nope doesn\'t exist in file'));
    deepEqual(diagnostics[0].range, new Range(2, 34, 2, 38));

    equal(diagnostics[1].severity, DiagnosticSeverity.Error);
    ok(diagnostics[1].message.startsWith('The path') && diagnostics[1].message.endsWith('doesn\'t exist on the disk.'));
    deepEqual(diagnostics[1].range, new Range(3, 17, 3, 33));

    equal(diagnostics[2].severity, DiagnosticSeverity.Error);
    ok(diagnostics[2].message.startsWith('The header implicit-bad doesn\'t exist in file'));
    deepEqual(diagnostics[2].range, new Range(13, 4, 13, 16));

    equal(diagnostics[3].severity, DiagnosticSeverity.Error);
    ok(diagnostics[3].message.startsWith('The header explicit-bad doesn\'t exist in file'));
    deepEqual(diagnostics[3].range, new Range(14, 13, 14, 25));

    await textEditor.edit(editBuilder => {
      editBuilder.replace(new Range(2, 34, 2, 38), 'working');
      editBuilder.replace(new Range(13, 4, 13, 16), 'working');
      editBuilder.replace(new Range(14, 13, 14, 25), 'working');
      editBuilder.delete(new Range(3, 17, 3, 24));
    });

    await textDocument.save();

    diagnostics = await provideDiagnostics(textDocument);
    equal(diagnostics.length, 0);
  } finally {
    await commands.executeCommand('workbench.action.closeActiveEditor');
    await remove(readmeMdFilePath);
  }
});
