import { workspace, commands, window, CompletionList, CompletionItemKind } from "vscode";
import { join, normalize, extname } from "path";
import { writeFile } from "fs";
import { ok, equal } from "assert";
import { remove, ensureDir, emptyDir } from "fs-extra";

const workspaceDirectoryPath = workspace.workspaceFolders![0].uri.fsPath;
const readmeMdFilePath = join(workspaceDirectoryPath, 'README.md');
const testMdFilePath = join(workspaceDirectoryPath, 'test.md');
const nestedDirectoryPath = join(workspaceDirectoryPath, 'nested');
const nestedTestMdRelativeFilePath = normalize('nested/test.md');
const nestedTestMdAbsoluteFilePath = join(workspaceDirectoryPath, nestedTestMdRelativeFilePath);
const nestedSettingsJsonRelativeFilePath = normalize('.vscode/settings.json');

test('CompletionItemProvider headers', async () => {
  try {
    await writeFile(readmeMdFilePath, `
# Test

## Header 1

## Header 2

`);

    const textDocument = await workspace.openTextDocument(readmeMdFilePath);
    await commands.executeCommand('workbench.action.files.revert', textDocument.uri); // Reload from disk
    const textEditor = await window.showTextDocument(textDocument);
    await textEditor.edit(editBuilder => editBuilder.insert(textDocument.lineAt(textDocument.lineCount - 1).rangeIncludingLineBreak.end, '\n' + '[](#'));

    const { items } = await commands.executeCommand('vscode.executeCompletionItemProvider', textDocument.uri, textDocument.lineAt(textDocument.lineCount - 1).range.end) as CompletionList;

    ok(items);
    equal(items.length, 3);

    // Sort items by sort text because by default the order is based on file system enumeration which is not portable
    items.sort((a, b) => a.sortText!.toString().localeCompare(b.sortText!.toString()));

    // Keep this separate so in case items are added or (re)moved and we don't need to rewrite all indices, we can just reorder code blocks
    let index = -1;

    //console.log(++index, items[index--]);
    //console.log(items.map(item => item.insertText));

    equal(items[++index].kind, CompletionItemKind.Reference);
    equal(items[index].insertText, 'test)');
    equal(items[index].sortText, 'README.md:00001');
    equal(items[index].detail, '# Test');
    equal(items[index].label, '# Test');
    equal(items[index].documentation, readmeMdFilePath);
    ok(items[index].filterText!.includes(readmeMdFilePath));

    equal(items[++index].kind, CompletionItemKind.Reference);
    equal(items[index].insertText, 'header-1)');
    equal(items[index].sortText, 'README.md:00003');
    equal(items[index].detail, '## Header 1');
    equal(items[index].label, '## Header 1');
    equal(items[index].documentation, readmeMdFilePath);
    ok(items[index].filterText!.includes(readmeMdFilePath));

    equal(items[++index].kind, CompletionItemKind.Reference);
    equal(items[index].insertText, 'header-2)');
    equal(items[index].sortText, 'README.md:00005');
    equal(items[index].detail, '## Header 2');
    equal(items[index].label, '## Header 2');
    equal(items[index].documentation, readmeMdFilePath);
    ok(items[index].filterText!.includes(readmeMdFilePath));

    await commands.executeCommand('workbench.action.closeActiveEditor');
  } finally {
    await remove(readmeMdFilePath);
  }
});


test('CompletionItemProvider full & partial', async () => {
  try {
    await writeFile(readmeMdFilePath, `
# Test

## Header 1

## Header 2
`);
    await writeFile(testMdFilePath, `
# Test

## Test Header
`);

    await ensureDir(nestedDirectoryPath);
    await writeFile(nestedTestMdAbsoluteFilePath, `
# Nested Test

## Nested Test Header
`);

    await workspace.getConfiguration('markdown-link-suggestions').update('allowFullSuggestMode', true);
    for (const fullMode of [true, false]) {
      const textDocument = await workspace.openTextDocument(readmeMdFilePath);
      await commands.executeCommand('workbench.action.files.revert', textDocument.uri); // Reload from disk
      const textEditor = await window.showTextDocument(textDocument);
      await textEditor.edit(editBuilder => editBuilder.insert(textDocument.lineAt(textDocument.lineCount - 1).rangeIncludingLineBreak.end, '\n' + (fullMode ? '[' : '[link](')));

      const list = await commands.executeCommand('vscode.executeCompletionItemProvider', textDocument.uri, textDocument.lineAt(textDocument.lineCount - 1).range.end) as CompletionList;
      const bannedExtensions = ['.JS', '.MAP'];
      const items = list.items.filter(item => !bannedExtensions.includes(extname(item.documentation! as string).toUpperCase()));

      ok(items);
      equal(items.length, 14);

      // Sort items by sort text because by default the order is based on file system enumeration which is not portable
      items.sort((a, b) => a.sortText!.toString().localeCompare(b.sortText!.toString()));

      // Keep this separate so in case items are added or (re)moved and we don't need to rewrite all indices, we can just reorder code blocks
      let index = -1;

      //console.log(++index, items[index--]);
      //console.log(items.map(item => item.insertText));

      equal(items[++index].kind, CompletionItemKind.Folder);
      equal(items[index].insertText, fullMode ? 'out](.)' : '.)');
      equal(items[index].sortText, '.');
      equal(items[index].detail, 'out');
      equal(items[index].label, 'out (..)');
      equal(items[index].documentation, workspaceDirectoryPath);
      ok(items[index].filterText!.includes(workspaceDirectoryPath));

      equal(items[++index].insertText, fullMode ? '.vscode](.vscode)' : '.vscode)');

      equal(items[++index].insertText, fullMode ? `settings.json](${nestedSettingsJsonRelativeFilePath})` : `${nestedSettingsJsonRelativeFilePath})`);

      equal(items[++index].kind, CompletionItemKind.Folder);
      equal(items[index].insertText, fullMode ? 'nested](nested)' : 'nested)');
      equal(items[index].sortText, 'nested');
      equal(items[index].detail, 'nested');
      equal(items[index].label, 'nested');
      equal(items[index].documentation, nestedDirectoryPath);
      ok(items[index].filterText!.includes(nestedDirectoryPath));

      equal(items[++index].kind, CompletionItemKind.File);
      equal(items[index].insertText, fullMode ? `test.md](${nestedTestMdRelativeFilePath})` : `${nestedTestMdRelativeFilePath})`);
      equal(items[index].sortText, nestedTestMdRelativeFilePath);
      equal(items[index].detail, 'test.md');
      equal(items[index].label, 'test.md (nested)');
      equal(items[index].documentation, nestedTestMdAbsoluteFilePath);
      ok(items[index].filterText!.includes(nestedTestMdAbsoluteFilePath));

      equal(items[++index].kind, CompletionItemKind.Reference);
      equal(items[index].insertText, fullMode ? `test.md](${nestedTestMdRelativeFilePath}#nested-test)` : `${nestedTestMdRelativeFilePath}#nested-test)`);
      equal(items[index].sortText, nestedTestMdRelativeFilePath + ':00001');
      equal(items[index].detail, '# Nested Test');
      equal(items[index].label, 'test.md # Nested Test (nested)');
      equal(items[index].documentation, nestedTestMdAbsoluteFilePath);
      ok(items[index].filterText!.includes(nestedTestMdAbsoluteFilePath));

      equal(items[++index].kind, CompletionItemKind.Reference);
      equal(items[index].insertText, fullMode ? `test.md](${nestedTestMdRelativeFilePath}#nested-test-header)` : `${nestedTestMdRelativeFilePath}#nested-test-header)`);
      equal(items[index].sortText, nestedTestMdRelativeFilePath + ':00003');
      equal(items[index].detail, '## Nested Test Header');
      equal(items[index].label, 'test.md ## Nested Test Header (nested)');
      equal(items[index].documentation, nestedTestMdAbsoluteFilePath);
      ok(items[index].filterText!.includes(nestedTestMdAbsoluteFilePath));

      equal(items[++index].kind, CompletionItemKind.File);
      equal(items[index].insertText, fullMode ? 'README.md](README.md)' : 'README.md)');
      equal(items[index].sortText, 'README.md');
      equal(items[index].detail, 'README.md');
      equal(items[index].label, 'README.md');
      equal(items[index].documentation, readmeMdFilePath);
      ok(items[index].filterText!.includes(readmeMdFilePath));

      equal(items[++index].kind, CompletionItemKind.Reference);
      equal(items[index].insertText, fullMode ? 'README.md](README.md#test)' : 'README.md#test)');
      equal(items[index].sortText, 'README.md:00001');
      equal(items[index].detail, '# Test');
      equal(items[index].label, 'README.md # Test');
      equal(items[index].documentation, readmeMdFilePath);
      ok(items[index].filterText!.includes(readmeMdFilePath));

      equal(items[++index].kind, CompletionItemKind.Reference);
      equal(items[index].insertText, fullMode ? 'README.md](README.md#header-1)' : 'README.md#header-1)');
      equal(items[index].sortText, 'README.md:00003');
      equal(items[index].detail, '## Header 1');
      equal(items[index].label, 'README.md ## Header 1');
      equal(items[index].documentation, readmeMdFilePath);
      ok(items[index].filterText!.includes(readmeMdFilePath));

      equal(items[++index].kind, CompletionItemKind.Reference);
      equal(items[index].insertText, fullMode ? 'README.md](README.md#header-2)' : 'README.md#header-2)');
      equal(items[index].sortText, 'README.md:00005');
      equal(items[index].detail, '## Header 2');
      equal(items[index].label, 'README.md ## Header 2');
      equal(items[index].documentation, readmeMdFilePath);
      ok(items[index].filterText!.includes(readmeMdFilePath));

      equal(items[++index].kind, CompletionItemKind.File);
      equal(items[index].insertText, fullMode ? 'test.md](test.md)' : 'test.md)');
      equal(items[index].sortText, 'test.md');
      equal(items[index].detail, 'test.md');
      equal(items[index].label, 'test.md');
      equal(items[index].documentation, testMdFilePath);
      ok(items[index].filterText!.includes(testMdFilePath));

      equal(items[++index].kind, CompletionItemKind.Reference);
      equal(items[index].insertText, fullMode ? 'test.md](test.md#test)' : 'test.md#test)');
      equal(items[index].sortText, 'test.md:00001');
      equal(items[index].detail, '# Test');
      equal(items[index].label, 'test.md # Test');
      equal(items[index].documentation, testMdFilePath);
      ok(items[index].filterText!.includes(testMdFilePath));

      equal(items[++index].kind, CompletionItemKind.Reference);
      equal(items[index].insertText, fullMode ? 'test.md](test.md#test-header)' : 'test.md#test-header)');
      equal(items[index].sortText, 'test.md:00003');
      equal(items[index].detail, '## Test Header');
      equal(items[index].label, 'test.md ## Test Header');
      equal(items[index].documentation, testMdFilePath);
      ok(items[index].filterText!.includes(testMdFilePath));

      await commands.executeCommand('workbench.action.closeActiveEditor');
    }
  } finally {
    await remove(readmeMdFilePath);
    await remove(testMdFilePath);
    await remove(nestedTestMdAbsoluteFilePath);
    await emptyDir(nestedDirectoryPath);
  }
});
