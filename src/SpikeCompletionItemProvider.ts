import { CompletionItemProvider, TextDocument, Position, CancellationToken, CompletionContext, CompletionItem, CompletionItemKind, commands, SymbolInformation, SymbolKind, Uri } from "vscode";
import LinkContextRecognizer from "./LinkContextRecognizer.g";
import { dirname, extname, basename, relative, normalize, win32, posix } from "path";
import anchorize from "./anchorize";
import getNonExcludedFiles from "./getNonExcludedFiles";

export default class SpikeCompletionItemProvider implements CompletionItemProvider {
  // TODO: Revisit these
  public allowFullSuggestMode = false;
  public allowSuggestionsForHeaders = true;

  constructor(allowFullSuggestMode: boolean, allowSuggestionsForHeaders: boolean) {
    // TODO: Cache workspace files
    // TODO: Update cache when workspace file is saved (`workspace.onDidSaveTextDocument`)
    this.allowFullSuggestMode = allowFullSuggestMode;
    this.allowSuggestionsForHeaders = allowSuggestionsForHeaders;
  }

  public async provideCompletionItems(document: TextDocument, position: Position, _token: CancellationToken, _context: CompletionContext) {
    // Parse out the MarkDown link context we are in
    const { text, path, query, fragment } = new LinkContextRecognizer(document.lineAt(position.line).text, position.character);
    const items: CompletionItem[] = [];

    // Suggest headers
    if (fragment !== null) {
      console.log('Suggest headers', JSON.stringify(path));
      const uri = path === null ? document.uri : undefined as any; // TODO
      const symbols = await commands.executeCommand('vscode.executeWorkspaceSymbolProvider', '') as SymbolInformation[] | undefined;
      if (symbols !== undefined) {
        const headers = symbols.filter(symbol => symbol.location.uri === uri && symbol.kind === SymbolKind.String);
        console.log(headers);
      }

      return undefined as any as CompletionItem[]; // TODO
    }

    // Skip suggesting on query
    if (query !== null) {
      return;
    }

    // Suggest paths based on path components
    if (path !== null) {
      console.log('Suggest paths');
      // TODO: Check for scheme or better yet add it to the parser
      console.log(path);
      throw new Error();
    }

    // Suggest paths based on text
    if (text !== null) {
      console.log('Suggest links');
      throw new Error();
    }

    const documentDirectoryPath = dirname(document.uri.fsPath);

    const files = await getNonExcludedFiles();
    for (const file of files) {
      items.push(this.makeFileCompletionItem(file, documentDirectoryPath));
      if (extname(file).toUpperCase() === '.MD') {
        const symbols = await commands.executeCommand('vscode.executeWorkspaceSymbolProvider', '') as SymbolInformation[] | undefined;
        if (symbols !== undefined) {
          const headers = symbols.filter(symbol => symbol.location.uri === Uri.file(file) && symbol.kind === SymbolKind.String);
          for (const header of headers) {
            items.push(new CompletionItem(file + '#' + header.name, CompletionItemKind.File));
          }
        }
      }
    }

    const directories = files.reduce((directoryPaths, filePath) => {
      const directoryPath = dirname(filePath);
      if (!directoryPaths.includes(directoryPath)) {
        directoryPaths.push(directoryPath);
      }

      return directoryPaths;
    }, [] as string[]);

    for (const directory of directories) {
      items.push(this.makeDirectoryCompletionItem(directory, documentDirectoryPath));
    }

    return items;
  }

  /* TODO: URL encode insert paths minimally (to make VS Code work, like replacing + sign and other otherwise linkage breaking characters) */

  private makeDirectoryCompletionItem(itemDirectoryPath: string, documentDirectoryPath: string) {
    const relativePath = relative(documentDirectoryPath, itemDirectoryPath);
    const label = relativePath === '' ? basename(itemDirectoryPath) : `${basename(itemDirectoryPath)} (${relativePath})`;
    const item = new CompletionItem(label, CompletionItemKind.Folder);
    item.detail = basename(itemDirectoryPath);
    item.documentation = normalize(itemDirectoryPath);
    item.insertText = relativePath || '.';
    item.sortText = relativePath;
    item.filterText = [win32.normalize(itemDirectoryPath), posix.normalize(itemDirectoryPath)].join('\n');
    return item;
  }

  private makeFileCompletionItem(itemFilePath: string, documentDirectoryPath: string) {
    const relativePath = relative(documentDirectoryPath, itemFilePath);
    const label = relativePath === '' ? basename(itemFilePath) : `${basename(itemFilePath)} (${relativePath})`;
    const item = new CompletionItem(label, CompletionItemKind.File);
    item.detail = basename(itemFilePath);
    item.documentation = normalize(itemFilePath);
    item.insertText = relativePath || '.';
    item.sortText = relativePath;
    item.filterText = [win32.normalize(itemFilePath), posix.normalize(itemFilePath)].join('\n');
    return item;
  }

  // @ts-ignore
  private item(kind: CompletionItemKind, absoluteFilePath: string, headerSymbol: SymbolInformation | null, absoluteDocumentDirectoryPath: string, hack?: boolean) {
    // Extract and join the file name with header (if any) for displaying in the label
    const fileName = basename(absoluteFilePath);
    let fileNameWithHeader = fileName;
    if (headerSymbol !== null) {
      fileNameWithHeader = hack ? headerSymbol.name : (fileNameWithHeader + ' # ' + headerSymbol.name);
    }

    // Put together a label in a `name#header (directory if not current)` format
    let label = fileNameWithHeader;
    const relativeDirectoryPath = relative(absoluteDocumentDirectoryPath, dirname(absoluteFilePath));
    if (relativeDirectoryPath !== '') {
      label += ` (${relativeDirectoryPath})`;
    }

    // Construct the completion item based on the label and the provided kind
    const item = new CompletionItem(label, kind);
    // Display standalone header, otherwise fall back to displaying the name we then know doesn't have fragment (header)
    item.detail = headerSymbol !== null ? headerSymbol.name : fileName;
    // Display expanded and normalized absolute path for inspection
    item.documentation = normalize(absoluteFilePath);
    // Derive anchorized version of the header to ensure working linkage
    const anchor = headerSymbol === null ? '' : anchorize(headerSymbol.name);
    // Compute suggested file path relative to the currently edited file's directory path
    let relativeFilePath = relative(absoluteDocumentDirectoryPath, absoluteFilePath) || '.';
    // TODO: URL encode path minimally (to make VS Code work, like replacing + sign and other otherwise linkage breaking characters)
    relativeFilePath = relativeFilePath; // TODO
    // Insert either relative file path with anchor only or file name without anchor in the MarkDown link syntax if in full suggest mode
    if ('fullSuggestMode') {
      item.insertText = `${fileName}](${relativeFilePath}${anchor ? '#' + anchor : ''})`;
    } else {
      item.insertText = hack ? anchor : (anchor ? relativeFilePath + '#' + anchor : relativeFilePath);

      if (!'partialSuggestModeBraceCompleted') {
        item.insertText += ')';
      }
    }

    // Sort by the relative path name for now (predictable but not amazingly helpful)
    // TODO: Contribute a setting for sorting by timestamp then by this
    item.sortText = relativeFilePath; // TODO
    if (headerSymbol !== null) {
      // Sort headers in the document order
      const linePadded = headerSymbol.location.range.start.line.toString().padStart(5, '0');
      const characterPadded = headerSymbol.location.range.start.character.toString().padStart(5, '0');
      item.sortText += ` ${linePadded}${characterPadded} # ${headerSymbol.name}`;
    }

    // Offer both forwards slash and backwards slash filter paths so that the user can type regardless of the platform
    item.filterText = [absoluteFilePath.replace(/\\/g, '/'), absoluteFilePath.replace(/\//g, '\\')].join();
    // Remove brace-completed closing square bracket if any (may be turned off) when in full suggest mode because we insert our own and then some
    if ('fullSuggestMode' && 'fullSuggestModeBraceCompleted') {
      //item.additionalTextEdits = [TextEdit.delete(braceCompletionRange)];
    }

    return item;
  }
}
