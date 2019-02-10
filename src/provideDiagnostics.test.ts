import { workspace, commands, window, DiagnosticSeverity, Range } from "vscode";
import { join } from "path";
import { writeFile, remove } from "fs-extra";
import provideDiagnostics from "./provideDiagnostics";
import { equal, ok } from "assert";

const workspaceDirectoryPath = workspace.workspaceFolders![0].uri.fsPath;
const readmeMdFilePath = join(workspaceDirectoryPath, 'README.md');
const readme2MdFilePath = join(workspaceDirectoryPath, 'README2.md');
const dotGitIgnoreFilePath = join(workspaceDirectoryPath, '.gitignore');
const ignoredMdFilePath = join(workspaceDirectoryPath, 'ignored.md');

test('provideDiagnostics', async () => {
  try {
    ok(workspace.workspaceFolders);

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
[](README2.md#outward-bad)
[](README2.md#working)
[](README2.md#a-header-with-inline-code-and-formatting)
`);

    await writeFile(readme2MdFilePath, `
# Hello

## Broken (Broken)

## Working

## A header with \`inline code\` and **formatting**
`);

    await writeFile(dotGitIgnoreFilePath, `
ignored.*
`);

    await writeFile(ignoredMdFilePath, `
This file is ignored!

[This link](broken.md) won't fail the diagnosis!
`);

    const textDocument = await workspace.openTextDocument(readmeMdFilePath);
    await commands.executeCommand('workbench.action.files.revert', textDocument.uri); // Reload from disk
    const textEditor = await window.showTextDocument(textDocument);

    let diagnostics = await provideDiagnostics(textDocument);
    equal(diagnostics.length, 5);

    equal(diagnostics[0].severity, DiagnosticSeverity.Error);
    equal(diagnostics[0].message, 'The header nope doesn\'t exist in file README.md.');
    ok(diagnostics[0].range.isEqual(new Range(2, 24, 2, 37)));

    equal(diagnostics[1].severity, DiagnosticSeverity.Error);
    equal(diagnostics[1].message, 'The path DO-NOT-README.md doesn\'t exist on the disk.');
    ok(diagnostics[1].range.isEqual(new Range(3, 17, 3, 32)));

    equal(diagnostics[2].severity, DiagnosticSeverity.Error);
    equal(diagnostics[2].message, 'The header implicit-bad doesn\'t exist in file README.md.');
    ok(diagnostics[2].range.isEqual(new Range(13, 3, 13, 15)));

    equal(diagnostics[3].severity, DiagnosticSeverity.Error);
    equal(diagnostics[3].message, 'The header explicit-bad doesn\'t exist in file README.md.');
    ok(diagnostics[3].range.isEqual(new Range(14, 3, 14, 24)));

    equal(diagnostics[4].severity, DiagnosticSeverity.Error);
    equal(diagnostics[4].message, 'The header outward-bad doesn\'t exist in file README2.md.');
    ok(diagnostics[4].range.isEqual(new Range(15, 3, 15, 24)));

    await textEditor.edit(editBuilder => {
      editBuilder.replace(new Range(2, 34, 2, 38), 'working');
      editBuilder.replace(new Range(13, 4, 13, 16), 'working');
      editBuilder.replace(new Range(14, 13, 14, 25), 'working');
      editBuilder.delete(new Range(3, 17, 3, 24));
      editBuilder.delete(new Range(15, 0, 15, 26));
    });

    await textDocument.save();

    diagnostics = await provideDiagnostics(textDocument);
    equal(diagnostics.length, 0);
  } finally {
    await commands.executeCommand('workbench.action.closeActiveEditor');
    await remove(readmeMdFilePath);
    await remove(readme2MdFilePath);
    await remove(dotGitIgnoreFilePath);
    await remove(ignoredMdFilePath);
  }
});
