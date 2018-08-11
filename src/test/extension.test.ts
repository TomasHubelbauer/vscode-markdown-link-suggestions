import * as assert from 'assert';
import { workspace, CancellationTokenSource, CompletionTriggerKind, window, CompletionItemKind, CompletionItem, commands } from 'vscode';
import { LinkCompletionItemProvider } from '../extension';
import * as path from 'path';
import * as fsExtra from 'fs-extra';

// NOTE: Workspace is `out/test` so suggestions are from those files
// TODO: Add tests for full suggest mode and header suggestions configuration settings
// TODO: Add tests for no dash and dash header links
// TODO: Add tests for link provider adn ignoring links in code blocks and inline code spans
suite("Extension Tests", function () {

    const token = new CancellationTokenSource().token;

    test("Suggest at [", async function () {
        await fsExtra.writeFile(path.resolve(__dirname, 'README.md'), `
# Test

## Header 1

## Header 2
`);
        const filePath = path.resolve(__dirname, /* out/test */'../../demo/README.md');
        const textDocument = await workspace.openTextDocument(filePath);
        const textEditor = await window.showTextDocument(textDocument);
        const triggerCharacter = '[';
        const triggerPosition = textDocument.lineAt(textDocument.lineCount - 1).rangeIncludingLineBreak.end;
        await textEditor.edit((editBuilder) => {
            editBuilder.insert(triggerPosition, '\n' + triggerCharacter);
        });

        const items = await new LinkCompletionItemProvider(true, true).provideCompletionItems(textDocument, triggerPosition, token, {
            triggerKind: CompletionTriggerKind.TriggerCharacter,
            triggerCharacter,
        });
        await commands.executeCommand('workbench.action.closeActiveEditor');

        const fileItem = findItem(items!, CompletionItemKind.File, 'README.md');
        assert.equal(fileItem.detail, 'README.md');
        assert.equal(normalizePath(fileItem.documentation! as string).endsWith('/out/test/README.md'), true);
        assert.equal(fileItem.filterText!.split(',').length, 2);
        assert.equal(fileItem.filterText!.split(',')[0].endsWith('/out/test/README.md'), true);
        assert.equal(fileItem.filterText!.split(',')[1].endsWith('/out/test/README.md'.replace(/\//g, '\\')), true);
        assert.equal(normalizePath(fileItem.insertText! as string), 'README.md](../out/test/README.md)');
        assert.equal(normalizePath(fileItem.label), 'README.md (../out/test)');
        assert.equal(normalizePath(fileItem.sortText!), '..' + '/out/test/README.md');

        const referenceItemHeader = findItem(items!, CompletionItemKind.Reference, 'Test');
        assert.equal(referenceItemHeader.detail, 'Test');
        assert.equal(normalizePath(referenceItemHeader.documentation! as string).endsWith('/out/test/README.md'), true);
        assert.equal(referenceItemHeader.filterText!.split(',').length, 2);
        assert.equal(referenceItemHeader.filterText!.split(',')[0].endsWith('/out/test/README.md'), true);
        assert.equal(referenceItemHeader.filterText!.split(',')[1].endsWith('/out/test/README.md'.replace(/\//g, '\\')), true);
        assert.equal(normalizePath(referenceItemHeader.insertText! as string), 'README.md](../out/test/README.md#test)');
        assert.equal(normalizePath(referenceItemHeader.label), 'README.md # Test (../out/test)');
        assert.equal(normalizePath(referenceItemHeader.sortText!), '..' + '/out/test/README.md#00001test');

        const referenceItemHeaderSpace = findItem(items!, CompletionItemKind.Reference, 'Header 1');
        assert.equal(referenceItemHeaderSpace.detail, 'Header 1');
        assert.equal(normalizePath(referenceItemHeaderSpace.documentation! as string).endsWith('/out/test/README.md'), true);
        assert.equal(referenceItemHeaderSpace.filterText!.split(',').length, 2);
        assert.equal(referenceItemHeaderSpace.filterText!.split(',')[0].endsWith('/out/test/README.md'), true);
        assert.equal(referenceItemHeaderSpace.filterText!.split(',')[1].endsWith('/out/test/README.md'.replace(/\//g, '\\')), true);
        assert.equal(normalizePath(referenceItemHeaderSpace.insertText! as string), 'README.md](../out/test/README.md#header-1)');
        assert.equal(normalizePath(referenceItemHeaderSpace.label), 'README.md # Header 1 (../out/test)');
        assert.equal(normalizePath(referenceItemHeaderSpace.sortText!), '..' + '/out/test/README.md#00002header-1');

        const folderItem = findItem(items!, CompletionItemKind.Folder, 'test');
        assert.equal(folderItem.detail, 'test');
        assert.equal(normalizePath(folderItem.documentation! as string).endsWith('/out/test'), true);
        assert.equal(folderItem.filterText!.split(',').length, 2);
        assert.equal(folderItem.filterText!.split(',')[0].endsWith('/out/test'), true);
        assert.equal(folderItem.filterText!.split(',')[1].endsWith('/out/test'.replace(/\//g, '\\')), true);
        assert.equal(normalizePath(folderItem.insertText! as string), 'test](../out/test)');
        assert.equal(normalizePath(folderItem.label), 'test (../out)');
        assert.equal(normalizePath(folderItem.sortText!), '..' + '/out/test');
    }).timeout(15000);

    test("Suggest at (", async function () {
        await fsExtra.writeFile(path.resolve(__dirname, 'README.md'), `
# Test

## Header 1

## Header 2
`);
        const filePath = path.resolve(__dirname, /* out/test */'../../demo/README.md');
        const textDocument = await workspace.openTextDocument(filePath);
        const textEditor = await window.showTextDocument(textDocument);
        const triggerCharacter = '(';
        let triggerPosition = textDocument.lineAt(textDocument.lineCount - 1).rangeIncludingLineBreak.end;
        await textEditor.edit((editBuilder) => {
            editBuilder.insert(triggerPosition, '\n[test]' + triggerCharacter);
        });

        triggerPosition = textDocument.lineAt(textDocument.lineCount - 1).range.start.translate(0, '[test]'.length + triggerCharacter.length);

        const items = await new LinkCompletionItemProvider(true, true).provideCompletionItems(textDocument, triggerPosition, token, {
            triggerKind: CompletionTriggerKind.TriggerCharacter,
            triggerCharacter,
        });

        const fileItem = findItem(items!, CompletionItemKind.File, 'README.md');
        assert.equal(fileItem.detail, 'README.md');
        assert.equal(normalizePath(fileItem.documentation! as string).endsWith('/out/test/README.md'), true);
        assert.equal(fileItem.filterText!.split(',').length, 2);
        assert.equal(fileItem.filterText!.split(',')[0].endsWith('/out/test/README.md'), true);
        assert.equal(fileItem.filterText!.split(',')[1].endsWith('/out/test/README.md'.replace(/\//g, '\\')), true);
        assert.equal(normalizePath(fileItem.insertText! as string), '../out/test/README.md)');
        assert.equal(normalizePath(fileItem.label), 'README.md (../out/test)');
        assert.equal(normalizePath(fileItem.sortText!), '..' + '/out/test/README.md');

        const referenceItemHeader = findItem(items!, CompletionItemKind.Reference, 'Test');
        assert.equal(referenceItemHeader.detail, 'Test');
        assert.equal(normalizePath(referenceItemHeader.documentation! as string).endsWith('/out/test/README.md'), true);
        assert.equal(referenceItemHeader.filterText!.split(',').length, 2);
        assert.equal(referenceItemHeader.filterText!.split(',')[0].endsWith('/out/test/README.md'), true);
        assert.equal(referenceItemHeader.filterText!.split(',')[1].endsWith('/out/test/README.md'.replace(/\//g, '\\')), true);
        assert.equal(normalizePath(referenceItemHeader.insertText! as string), '../out/test/README.md#test)');
        assert.equal(normalizePath(referenceItemHeader.label), 'README.md # Test (../out/test)');
        assert.equal(normalizePath(referenceItemHeader.sortText!), '..' + '/out/test/README.md#00001test');

        const referenceItemHeaderSpace = findItem(items!, CompletionItemKind.Reference, 'Header 1');
        assert.equal(referenceItemHeaderSpace.detail, 'Header 1');
        assert.equal(normalizePath(referenceItemHeaderSpace.documentation! as string).endsWith('/out/test/README.md'), true);
        assert.equal(referenceItemHeaderSpace.filterText!.split(',').length, 2);
        assert.equal(referenceItemHeaderSpace.filterText!.split(',')[0].endsWith('/out/test/README.md'), true);
        assert.equal(referenceItemHeaderSpace.filterText!.split(',')[1].endsWith('/out/test/README.md'.replace(/\//g, '\\')), true);
        assert.equal(normalizePath(referenceItemHeaderSpace.insertText! as string), '../out/test/README.md#header-1)');
        assert.equal(normalizePath(referenceItemHeaderSpace.label), 'README.md # Header 1 (../out/test)');
        assert.equal(normalizePath(referenceItemHeaderSpace.sortText!), '..' + '/out/test/README.md#00002header-1');

        const folderItem = findItem(items!, CompletionItemKind.Folder, 'test');
        assert.equal(folderItem.detail, 'test');
        assert.equal(normalizePath(folderItem.documentation! as string).endsWith('/out/test'), true);
        assert.equal(folderItem.filterText!.split(',').length, 2);
        assert.equal(folderItem.filterText!.split(',')[0].endsWith('/out/test'), true);
        assert.equal(folderItem.filterText!.split(',')[1].endsWith('/out/test'.replace(/\//g, '\\')), true);
        assert.equal(normalizePath(folderItem.insertText! as string), '../out/test)');
        assert.equal(normalizePath(folderItem.label), 'test (../out)');
        assert.equal(normalizePath(folderItem.sortText!), '..' + '/out/test');
    }).timeout(15000);
});

function findItem(items: CompletionItem[], kind: CompletionItemKind, detail: string) {
    return items.find(item => item.kind === kind && item.detail === detail)!;
}

function normalizePath(path: string) {
    return path.replace(/\\/g, '/');
}
