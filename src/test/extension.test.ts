import * as assert from 'assert';
import { workspace, CancellationTokenSource, CompletionTriggerKind, window, CompletionItemKind, CompletionItem, commands } from 'vscode';
import { LinkProvider } from '../extension';
import * as path from 'path';
import * as fsExtra from 'fs-extra';

// NOTE: Workspace is `out/test` so suggestions are from those files
suite("Extension Tests", function () {

    const token = new CancellationTokenSource().token;

    test("Suggest at [", async function () {
        await fsExtra.writeFile(path.resolve(__dirname, 'README.md'), '# Test\n\n## Header 1\n\n## Header 2\n');
        const filePath = path.resolve(__dirname, /* out/test */'../../demo/README.md');
        const textDocument = await workspace.openTextDocument(filePath);
        const textEditor = await window.showTextDocument(textDocument);
        const triggerCharacter = '[';
        const triggerPosition = textDocument.lineAt(textDocument.lineCount - 1).rangeIncludingLineBreak.end;
        await textEditor.edit((editBuilder) => {
            editBuilder.insert(triggerPosition, '\n' + triggerCharacter);
        });

        const items = await new LinkProvider().provideCompletionItems(textDocument, triggerPosition, token, {
            triggerKind: CompletionTriggerKind.TriggerCharacter,
            triggerCharacter,
        });
        await commands.executeCommand('workbench.action.closeActiveEditor');

        checkItem(
            findItem(items!, CompletionItemKind.File, 'README.md'),
            'README.md',
            '/out/test/README.md',
            'README.md](../out/test/README.md)',
            'README.md (../out/test)',
        );

        checkItem(
            findItem(items!, CompletionItemKind.Reference, 'Test'),
            'Test',
            '/out/test/README.md',
            'README.md](../out/test/README.md#test)',
            'README.md # Test (../out/test)',
        );

        checkItem(
            findItem(items!, CompletionItemKind.Reference, 'Header 1'),
            'Header 1',
            '/out/test/README.md',
            'README.md](../out/test/README.md#header-1)',
            'README.md # Header 1 (../out/test)',
        );

        checkItem(
            findItem(items!, CompletionItemKind.Folder, 'test'),
            'test',
            '/out/test',
            'test](../out/test)',
            'test (../out)',
        );
    }).timeout(5000);

    test("Suggest at (", async function () {
        await fsExtra.writeFile(path.resolve(__dirname, 'README.md'), '# Test\n\n## Header 1\n\n## Header 2\n');
        const filePath = path.resolve(__dirname, /* out/test */'../../demo/README.md');
        const textDocument = await workspace.openTextDocument(filePath);
        const textEditor = await window.showTextDocument(textDocument);
        const triggerCharacter = '(';
        let triggerPosition = textDocument.lineAt(textDocument.lineCount - 1).rangeIncludingLineBreak.end;
        await textEditor.edit((editBuilder) => {
            editBuilder.insert(triggerPosition, '\n[test]' + triggerCharacter);
        });

        triggerPosition = textDocument.lineAt(textDocument.lineCount - 1).range.start.translate(0, '[test]'.length + triggerCharacter.length);

        const items = await new LinkProvider().provideCompletionItems(textDocument, triggerPosition, token, {
            triggerKind: CompletionTriggerKind.TriggerCharacter,
            triggerCharacter,
        });

        checkItem(
            findItem(items!, CompletionItemKind.File, 'README.md'),
            'README.md',
            '/out/test/README.md',
            '../out/test/README.md)',
            'README.md (../out/test)',
        );

        checkItem(
            findItem(items!, CompletionItemKind.Reference, 'Test'),
            'Test',
            '/out/test/README.md',
            '../out/test/README.md#test)',
            'README.md # Test (../out/test)',
        );

        checkItem(
            findItem(items!, CompletionItemKind.Reference, 'Header 1'),
            'Header 1',
            '/out/test/README.md',
            '../out/test/README.md#header-1)',
            'README.md # Header 1 (../out/test)',
        );

        checkItem(
            findItem(items!, CompletionItemKind.Folder, 'test'),
            'test',
            '/out/test',
            '../out/test)',
            'test (../out)',
        );
    }).timeout(5000);
});

function findItem(items: CompletionItem[], kind: CompletionItemKind, detail: string) {
    return items.find(item => item.kind === kind && item.detail === detail)!;
}

function checkItem(item: CompletionItem, detail: string, documentationAndFilterAndSortEndsWith: string, insertText: string, label: string) {
    assert.equal(item.detail, detail);
    assert.equal((item.documentation! as string).replace(/\\/g, '/').endsWith(documentationAndFilterAndSortEndsWith), true);
    assert.equal(item.filterText!.split(',').length, 2);
    assert.equal(item.filterText!.split(',')[0].endsWith(documentationAndFilterAndSortEndsWith), true);
    assert.equal(item.filterText!.split(',')[1].endsWith(documentationAndFilterAndSortEndsWith.replace(/\//g, '\\')), true);
    assert.equal((item.insertText! as string).replace(/\\/g, '/'), insertText);
    assert.equal(item.label.replace(/\\/g, '/'), label);
    assert.equal(item.sortText!.replace(/\\/g, '/'), '..' + documentationAndFilterAndSortEndsWith);
}
