import * as assert from 'assert';
import { workspace, window, commands, CompletionItemKind, Range, DiagnosticSeverity, DocumentLink, CompletionList } from 'vscode';
import { LinkDiagnosticProvider, drainAsyncIterator } from '../extension';
import * as path from 'path';
import * as fsExtra from 'fs-extra';

// TODO: Extend full/partial suggest mode with a check for the full mode disabling setting
suite("Extension Tests", async function () {
    assert.ok(workspace.workspaceFolders);

    const workspaceDirectoryPath = workspace.workspaceFolders![0].uri.fsPath;
    const readmeMdFilePath = path.join(workspaceDirectoryPath, 'README.md');
    const testMdFilePath = path.join(workspaceDirectoryPath, 'test.md');
    const nestedDirectoryPath = path.join(workspaceDirectoryPath, 'nested');
    const nestedTestMdRelativeFilePath = path.normalize('nested/test.md');
    const nestedTestMdAbsoluteFilePath = path.join(workspaceDirectoryPath, nestedTestMdRelativeFilePath);
    const nestedSettingsJsonRelativeFilePath = path.normalize('.vscode/settings.json');

    test('MarkDownLinkDocumentLinkProvider', async () => {
        try {
            await fsExtra.writeFile(readmeMdFilePath, `
[link](README.md)
->[link](README.md)<-
\`[nolink](README.md)\`
->\`[nolink](README.md)\`<-
\`->[nolink](README.md)<-\`
\`\`\`code
[nolink](README.md)
\`\`\`
[nofilelink](custom:README.md)
[link 1](README.md#1) & [link 2](README.md#2)
`);

            const textDocument = await workspace.openTextDocument(readmeMdFilePath);
            await commands.executeCommand('workbench.action.files.revert', textDocument.uri); // Reload from disk
            await window.showTextDocument(textDocument);
            const links = ((await commands.executeCommand('vscode.executeLinkProvider', textDocument.uri)) as DocumentLink[]).filter(link => link.target!.scheme === 'file');
            assert.equal(links.length, 4);
            assert.ok(links[0].range.isEqual(new Range(1, 1, 1, 5)));
            assert.equal(path.normalize(links[0].target!.fsPath).toUpperCase(), path.normalize(readmeMdFilePath).toUpperCase());
            assert.ok(links[1].range.isEqual(new Range(2, 3, 2, 7)));
            assert.equal(path.normalize(links[1].target!.fsPath).toUpperCase(), path.normalize(readmeMdFilePath).toUpperCase());
            assert.ok(links[2].range.isEqual(new Range(10, 1, 10, 7)));
            assert.equal(path.normalize(links[0].target!.fsPath).toUpperCase(), path.normalize(readmeMdFilePath).toUpperCase());
            assert.ok(links[3].range.isEqual(new Range(10, 25, 10, 31)));
            assert.equal(path.normalize(links[0].target!.fsPath).toUpperCase(), path.normalize(readmeMdFilePath).toUpperCase());
        } finally {
            await commands.executeCommand('workbench.action.closeActiveEditor');
            await fsExtra.remove(readmeMdFilePath);
        }
    });

    test('LinkCompletionItemProvider headers', async () => {
        try {
            await fsExtra.writeFile(readmeMdFilePath, `
# Test

## Header 1

## Header 2

`);

            const textDocument = await workspace.openTextDocument(readmeMdFilePath);
            await commands.executeCommand('workbench.action.files.revert', textDocument.uri); // Reload from disk
            const textEditor = await window.showTextDocument(textDocument);
            await textEditor.edit(editBuilder => editBuilder.insert(textDocument.lineAt(textDocument.lineCount - 1).rangeIncludingLineBreak.end, '\n' + '[](#'));

            const { items } = await commands.executeCommand('vscode.executeCompletionItemProvider', textDocument.uri, textDocument.lineAt(textDocument.lineCount - 1).range.end) as CompletionList;

            assert.ok(items);
            assert.equal(items.length, 3);

            // Sort items by sort text because by default the order is based on file system enumeration which is not portable
            items.sort((a, b) => a.sortText!.toString().localeCompare(b.sortText!.toString()));

            // Keep this separate so in case items are added or (re)moved and we don't need to rewrite all indices, we can just reorder code blocks
            let index = -1;

            //console.log(++index, items[index--]);
            //console.log(items.map(item => item.insertText));

            assert.equal(items[++index].kind, CompletionItemKind.Reference);
            assert.equal(items[index].insertText, 'test)');
            assert.equal(items[index].sortText, 'README.md:00001');
            assert.equal(items[index].detail, '# Test');
            assert.equal(items[index].label, '# Test');
            assert.equal(items[index].documentation, readmeMdFilePath);
            assert.ok(items[index].filterText!.includes(readmeMdFilePath));

            assert.equal(items[++index].kind, CompletionItemKind.Reference);
            assert.equal(items[index].insertText, 'header-1)');
            assert.equal(items[index].sortText, 'README.md:00003');
            assert.equal(items[index].detail, '## Header 1');
            assert.equal(items[index].label, '## Header 1');
            assert.equal(items[index].documentation, readmeMdFilePath);
            assert.ok(items[index].filterText!.includes(readmeMdFilePath));

            assert.equal(items[++index].kind, CompletionItemKind.Reference);
            assert.equal(items[index].insertText, 'header-2)');
            assert.equal(items[index].sortText, 'README.md:00005');
            assert.equal(items[index].detail, '## Header 2');
            assert.equal(items[index].label, '## Header 2');
            assert.equal(items[index].documentation, readmeMdFilePath);
            assert.ok(items[index].filterText!.includes(readmeMdFilePath));

            await commands.executeCommand('workbench.action.closeActiveEditor');
        } finally {
            await fsExtra.remove(readmeMdFilePath);
        }
    });


    test('LinkCompletionItemProvider full & partial', async () => {
        try {
            await fsExtra.writeFile(readmeMdFilePath, `
# Test

## Header 1

## Header 2
`);
            await fsExtra.writeFile(testMdFilePath, `
# Test

## Test Header
`);

            await fsExtra.ensureDir(nestedDirectoryPath);
            await fsExtra.writeFile(nestedTestMdAbsoluteFilePath, `
# Nested Test

## Nested Test Header
`);

            await workspace.getConfiguration('markdown-link-suggestions').update('allowFullSuggestMode', true);
            for (const fullMode of [true, false]) {
                const textDocument = await workspace.openTextDocument(readmeMdFilePath);
                await commands.executeCommand('workbench.action.files.revert', textDocument.uri); // Reload from disk
                const textEditor = await window.showTextDocument(textDocument);
                await textEditor.edit(editBuilder => editBuilder.insert(textDocument.lineAt(textDocument.lineCount - 1).rangeIncludingLineBreak.end, '\n' + (fullMode ? '[' : '[link](')));

                const { items } = await commands.executeCommand('vscode.executeCompletionItemProvider', textDocument.uri, textDocument.lineAt(textDocument.lineCount - 1).range.end) as CompletionList;

                assert.ok(items);
                assert.equal(items.length, 18);

                // Sort items by sort text because by default the order is based on file system enumeration which is not portable
                items.sort((a, b) => a.sortText!.toString().localeCompare(b.sortText!.toString()));

                // Keep this separate so in case items are added or (re)moved and we don't need to rewrite all indices, we can just reorder code blocks
                let index = -1;

                //console.log(++index, items[index--]);
                //console.log(items.map(item => item.insertText));

                assert.equal(items[++index].kind, CompletionItemKind.Folder);
                assert.equal(items[index].insertText, fullMode ? 'test](.)' : '.)');
                assert.equal(items[index].sortText, '.');
                assert.equal(items[index].detail, 'test');
                assert.equal(items[index].label, 'test (..)');
                assert.equal(items[index].documentation, workspaceDirectoryPath);
                assert.ok(items[index].filterText!.includes(workspaceDirectoryPath));

                assert.equal(items[++index].insertText, fullMode ? '.vscode](.vscode)' : '.vscode)');

                assert.equal(items[++index].insertText, fullMode ? `settings.json](${nestedSettingsJsonRelativeFilePath})` : `${nestedSettingsJsonRelativeFilePath})`);

                assert.equal(items[++index].insertText, fullMode ? 'extension.test.js](extension.test.js)' : 'extension.test.js)');

                assert.equal(items[++index].insertText, fullMode ? 'extension.test.js.map](extension.test.js.map)' : 'extension.test.js.map)');

                assert.equal(items[++index].insertText, fullMode ? 'index.js](index.js)' : 'index.js)');

                assert.equal(items[++index].insertText, fullMode ? 'index.js.map](index.js.map)' : 'index.js.map)');

                assert.equal(items[++index].kind, CompletionItemKind.Folder);
                assert.equal(items[index].insertText, fullMode ? 'nested](nested)' : 'nested)');
                assert.equal(items[index].sortText, 'nested');
                assert.equal(items[index].detail, 'nested');
                assert.equal(items[index].label, 'nested');
                assert.equal(items[index].documentation, nestedDirectoryPath);
                assert.ok(items[index].filterText!.includes(nestedDirectoryPath));

                assert.equal(items[++index].kind, CompletionItemKind.File);
                assert.equal(items[index].insertText, fullMode ? `test.md](${nestedTestMdRelativeFilePath})` : `${nestedTestMdRelativeFilePath})`);
                assert.equal(items[index].sortText, nestedTestMdRelativeFilePath);
                assert.equal(items[index].detail, 'test.md');
                assert.equal(items[index].label, 'test.md (nested)');
                assert.equal(items[index].documentation, nestedTestMdAbsoluteFilePath);
                assert.ok(items[index].filterText!.includes(nestedTestMdAbsoluteFilePath));

                assert.equal(items[++index].kind, CompletionItemKind.Reference);
                assert.equal(items[index].insertText, fullMode ? `test.md](${nestedTestMdRelativeFilePath}#nested-test)` : `${nestedTestMdRelativeFilePath}#nested-test)`);
                assert.equal(items[index].sortText, nestedTestMdRelativeFilePath + ':00001');
                assert.equal(items[index].detail, '# Nested Test');
                assert.equal(items[index].label, 'test.md # Nested Test (nested)');
                assert.equal(items[index].documentation, nestedTestMdAbsoluteFilePath);
                assert.ok(items[index].filterText!.includes(nestedTestMdAbsoluteFilePath));

                assert.equal(items[++index].kind, CompletionItemKind.Reference);
                assert.equal(items[index].insertText, fullMode ? `test.md](${nestedTestMdRelativeFilePath}#nested-test-header)` : `${nestedTestMdRelativeFilePath}#nested-test-header)`);
                assert.equal(items[index].sortText, nestedTestMdRelativeFilePath + ':00003');
                assert.equal(items[index].detail, '## Nested Test Header');
                assert.equal(items[index].label, 'test.md ## Nested Test Header (nested)');
                assert.equal(items[index].documentation, nestedTestMdAbsoluteFilePath);
                assert.ok(items[index].filterText!.includes(nestedTestMdAbsoluteFilePath));

                assert.equal(items[++index].kind, CompletionItemKind.File);
                assert.equal(items[index].insertText, fullMode ? 'README.md](README.md)' : 'README.md)');
                assert.equal(items[index].sortText, 'README.md');
                assert.equal(items[index].detail, 'README.md');
                assert.equal(items[index].label, 'README.md');
                assert.equal(items[index].documentation, readmeMdFilePath);
                assert.ok(items[index].filterText!.includes(readmeMdFilePath));

                assert.equal(items[++index].kind, CompletionItemKind.Reference);
                assert.equal(items[index].insertText, fullMode ? 'README.md](README.md#test)' : 'README.md#test)');
                assert.equal(items[index].sortText, 'README.md:00001');
                assert.equal(items[index].detail, '# Test');
                assert.equal(items[index].label, 'README.md # Test');
                assert.equal(items[index].documentation, readmeMdFilePath);
                assert.ok(items[index].filterText!.includes(readmeMdFilePath));

                assert.equal(items[++index].kind, CompletionItemKind.Reference);
                assert.equal(items[index].insertText, fullMode ? 'README.md](README.md#header-1)' : 'README.md#header-1)');
                assert.equal(items[index].sortText, 'README.md:00003');
                assert.equal(items[index].detail, '## Header 1');
                assert.equal(items[index].label, 'README.md ## Header 1');
                assert.equal(items[index].documentation, readmeMdFilePath);
                assert.ok(items[index].filterText!.includes(readmeMdFilePath));

                assert.equal(items[++index].kind, CompletionItemKind.Reference);
                assert.equal(items[index].insertText, fullMode ? 'README.md](README.md#header-2)' : 'README.md#header-2)');
                assert.equal(items[index].sortText, 'README.md:00005');
                assert.equal(items[index].detail, '## Header 2');
                assert.equal(items[index].label, 'README.md ## Header 2');
                assert.equal(items[index].documentation, readmeMdFilePath);
                assert.ok(items[index].filterText!.includes(readmeMdFilePath));

                assert.equal(items[++index].kind, CompletionItemKind.File);
                assert.equal(items[index].insertText, fullMode ? 'test.md](test.md)' : 'test.md)');
                assert.equal(items[index].sortText, 'test.md');
                assert.equal(items[index].detail, 'test.md');
                assert.equal(items[index].label, 'test.md');
                assert.equal(items[index].documentation, testMdFilePath);
                assert.ok(items[index].filterText!.includes(testMdFilePath));

                assert.equal(items[++index].kind, CompletionItemKind.Reference);
                assert.equal(items[index].insertText, fullMode ? 'test.md](test.md#test)' : 'test.md#test)');
                assert.equal(items[index].sortText, 'test.md:00001');
                assert.equal(items[index].detail, '# Test');
                assert.equal(items[index].label, 'test.md # Test');
                assert.equal(items[index].documentation, testMdFilePath);
                assert.ok(items[index].filterText!.includes(testMdFilePath));

                assert.equal(items[++index].kind, CompletionItemKind.Reference);
                assert.equal(items[index].insertText, fullMode ? 'test.md](test.md#test-header)' : 'test.md#test-header)');
                assert.equal(items[index].sortText, 'test.md:00003');
                assert.equal(items[index].detail, '## Test Header');
                assert.equal(items[index].label, 'test.md ## Test Header');
                assert.equal(items[index].documentation, testMdFilePath);
                assert.ok(items[index].filterText!.includes(testMdFilePath));

                await commands.executeCommand('workbench.action.closeActiveEditor');
            }
        } finally {
            await fsExtra.remove(readmeMdFilePath);
            await fsExtra.remove(testMdFilePath);
            await fsExtra.remove(nestedTestMdAbsoluteFilePath);
            await fsExtra.emptyDir(nestedDirectoryPath);
        }
    });

    test('LinkDiagnosticProvider', async () => {
        try {
            await fsExtra.writeFile(readmeMdFilePath, `
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

            let diagnostics = await drainAsyncIterator(new LinkDiagnosticProvider(true).provideDiagnostics(textDocument));
            assert.equal(diagnostics.length, 4);

            assert.equal(diagnostics[0].severity, DiagnosticSeverity.Error);
            assert.ok(diagnostics[0].message.startsWith('The header nope doesn\'t exist in file'));
            assert.deepEqual(diagnostics[0].range, new Range(2, 34, 2, 38));

            assert.equal(diagnostics[1].severity, DiagnosticSeverity.Error);
            assert.ok(diagnostics[1].message.startsWith('The path') && diagnostics[1].message.endsWith('doesn\'t exist on the disk.'));
            assert.deepEqual(diagnostics[1].range, new Range(3, 17, 3, 33));

            assert.equal(diagnostics[2].severity, DiagnosticSeverity.Error);
            assert.ok(diagnostics[2].message.startsWith('The header implicit-bad doesn\'t exist in file'));
            assert.deepEqual(diagnostics[2].range, new Range(13, 4, 13, 16));

            assert.equal(diagnostics[3].severity, DiagnosticSeverity.Error);
            assert.ok(diagnostics[3].message.startsWith('The header explicit-bad doesn\'t exist in file'));
            assert.deepEqual(diagnostics[3].range, new Range(14, 13, 14, 25));

            await textEditor.edit(editBuilder => {
                editBuilder.replace(new Range(2, 34, 2, 38), 'working');
                editBuilder.replace(new Range(13, 4, 13, 16), 'working');
                editBuilder.replace(new Range(14, 13, 14, 25), 'working');
                editBuilder.delete(new Range(3, 17, 3, 24));
            });

            await textDocument.save();

            diagnostics = await drainAsyncIterator(new LinkDiagnosticProvider(true).provideDiagnostics(textDocument));
            assert.equal(diagnostics.length, 0);
        } finally {
            await commands.executeCommand('workbench.action.closeActiveEditor');
            await fsExtra.remove(readmeMdFilePath);
        }
    });
});
