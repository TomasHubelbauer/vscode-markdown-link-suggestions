import { CompletionItemProvider, TextDocument, Position, CancellationToken, CompletionContext, Range, CompletionItem, commands, SymbolInformation, SymbolKind, CompletionItemKind, TextEdit, Uri } from "vscode";
import { dirname, extname, basename, relative, normalize, posix, win32 } from "path";
import anchorize from "./anchorize";
import getNonExcludedFiles from "./getNonExcludedFiles";
import applicationInsights from './telemetry';

export default class MarkDownLinkCompletionItemProvider implements CompletionItemProvider {
  public allowFullSuggestMode = false;
  public allowSuggestionsForHeaders = true;

  constructor(allowFullSuggestMode: boolean, allowSuggestionsForHeaders: boolean) {
    // TODO: Cache workspace files
    // TODO: Update cache when workspace file is saved (`workspace.onDidSaveTextDocument`)
    this.allowFullSuggestMode = allowFullSuggestMode;
    this.allowSuggestionsForHeaders = allowSuggestionsForHeaders;
  }

  public async provideCompletionItems(document: TextDocument, position: Position, _token: CancellationToken, context: CompletionContext) {
    try {
      try {
        applicationInsights.sendTelemetryEvent('suggest');
      } catch {
        // Defend against AI not working for the first AI release
      }

      const character = context.triggerCharacter || /* Ctrl + Space */ document.getText(new Range(position.translate(0, -1), position));

      // TODO: Extend to be able to handle suggestions after backspacing (see if this fires but we already have some text)
      const fullSuggestMode = character === '[';
      if (fullSuggestMode && !this.allowFullSuggestMode) {
        return;
      }

      const documentDirectoryPath = dirname(document.uri.fsPath);
      const items: CompletionItem[] = [];

      let fullSuggestModeBraceCompleted = false;
      let partialSuggestModeBraceCompleted = false;
      const braceCompletionRange = new Range(position, position.translate(0, 1));
      if (fullSuggestMode) {
        fullSuggestModeBraceCompleted = document.getText(braceCompletionRange) === ']';
      } else {
        // TODO: Handle a case where there is only '(' on the line
        const linkConfirmationRange = new Range(position.translate(0, -2), position);
        if (character === '(') {
          if (document.getText(linkConfirmationRange) === '](') {
            partialSuggestModeBraceCompleted = document.getText(braceCompletionRange) === ')';
            // TODO: Read the link text to be able to rank items matching it higher
          } else {
            // Bail if this is just a regular parentheses, not MarkDown link
            return;
          }
        } else {
          const headerLinkConfirmationRange = new Range(position.translate(0, -3), position);
          // TODO: Integrate this in a bit nicer if possible
          if (character === '#' && document.getText(headerLinkConfirmationRange) === '](#') {
            partialSuggestModeBraceCompleted = document.getText(braceCompletionRange) === ')';
            // Only suggest local file headers
            const symbols = (await commands.executeCommand('vscode.executeDocumentSymbolProvider', document.uri)) as SymbolInformation[] | undefined;
            if (symbols !== undefined) {
              const headers = symbols.filter(symbol => symbol.kind === SymbolKind.String); // VS Code API detected headers
              for (const header of headers) {
                const item = this.item(CompletionItemKind.Reference, document.uri.fsPath, header, documentDirectoryPath, fullSuggestMode, fullSuggestModeBraceCompleted, partialSuggestModeBraceCompleted, braceCompletionRange, true);
                item.filterText = item.insertText + ';' + item.filterText;
                items.push(item);
              }
            }

            try {
              applicationInsights.sendTelemetryEvent('suggest-headers');
            } catch {
              // Defend against AI not working for the first AI release
            }

            return items;
          } else {
            // Bail if we are in neither full suggest mode nor partial (link target) suggest mode nor header mode
            try {
              applicationInsights.sendTelemetryEvent('suggest-invalid');
            } catch {
              // Defend against AI not working for the first AI release
            }

            return;
          }
        }
      }

      const files = await getNonExcludedFiles();
      for (const file of files) {
        items.push(this.item(CompletionItemKind.File, file, null, documentDirectoryPath, fullSuggestMode, fullSuggestModeBraceCompleted, partialSuggestModeBraceCompleted, braceCompletionRange));
        if (extname(file).toUpperCase() === '.MD' && this.allowSuggestionsForHeaders) {
          try {
            const symbols = (await commands.executeCommand('vscode.executeDocumentSymbolProvider', Uri.file(file))) as SymbolInformation[] | undefined;
            if (symbols !== undefined) {
              const headers = symbols.filter(symbol => symbol.kind === SymbolKind.String); // VS Code API detected headers
              for (const header of headers) {
                items.push(this.item(CompletionItemKind.Reference, file, header, documentDirectoryPath, fullSuggestMode, fullSuggestModeBraceCompleted, partialSuggestModeBraceCompleted, braceCompletionRange));
              }
            }
          } catch (error) {
            // TODO: Figure out what causes the *Error: Illegal argument: resource* error
            try {
              applicationInsights.sendTelemetryEvent('suggest-resource', { error: error.toString() });
            } catch {
              // Defend against AI not working for the first AI release
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
        items.push(this.item(CompletionItemKind.Folder, directory, null, documentDirectoryPath, fullSuggestMode, fullSuggestModeBraceCompleted, partialSuggestModeBraceCompleted, braceCompletionRange));
      }

      try {
        applicationInsights.sendTelemetryEvent('suggest-full-partial');
      } catch {
        // Defend against AI not working for the first AI release
      }
      return items;
    } catch (error) {
      try {
        applicationInsights.sendTelemetryEvent('suggest-failure', { error: error.toString() });
      } catch {
        // Defend against AI not working for the first AI release
      }
    }

    return [];
  }

  private item(kind: CompletionItemKind, absoluteFilePath: string, header: SymbolInformation | null, absoluteDocumentDirectoryPath: string, fullSuggestMode: boolean, fullSuggestModeBraceCompleted: boolean, partialSuggestModeBraceCompleted: boolean, braceCompletionRange: Range, hack?: boolean) {
    // Extract and join the file name with header (if any) for displaying in the label
    const fileName = basename(absoluteFilePath);
    let fileNameWithHeader = fileName;
    if (header !== null) {
      fileNameWithHeader = hack ? header.name : (fileNameWithHeader + ' ' + header.name);
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
    item.detail = header ? header.name : fileName;
    // Display expanded and normalized absolute path for inspection
    item.documentation = normalize(absoluteFilePath);
    // Derive anchorized version of the header to ensure working linkage
    const anchor = header === null ? '' : anchorize(header.name);
    // Compute suggested file path relative to the currently edited file's directory path
    let relativeFilePath = relative(absoluteDocumentDirectoryPath, absoluteFilePath) || '.';
    // TODO: URL encode path minimally (to make VS Code work, like replacing + sign and other otherwise linkage breaking characters)
    relativeFilePath = relativeFilePath; // TODO
    // Insert either relative file path with anchor only or file name without anchor in the MarkDown link syntax if in full suggest mode
    if (fullSuggestMode) {
      item.insertText = `${fileName}](${relativeFilePath}${anchor ? '#' + anchor : ''})`;
    } else {
      item.insertText = hack ? anchor : (anchor ? relativeFilePath + '#' + anchor : relativeFilePath);

      if (!partialSuggestModeBraceCompleted) {
        item.insertText += ')';
      }
    }

    // Sort by the relative path name to the document the link being suggested for is in
    item.sortText = relativeFilePath;
    if (header !== null) {
      // Sort headers in the document order
      item.sortText += `:${header.location.range.start.line.toString().padStart(5, '0')}`;
    }

    // Offer both forwards slash and backwards slash filter paths so that the user can type regardless of the platform
    item.filterText = [posix.normalize(absoluteFilePath), win32.normalize(absoluteFilePath)].join();
    // Remove brace-completed closing square bracket if any (may be turned off) when in full suggest mode because we insert our own and then some
    if (fullSuggestMode && fullSuggestModeBraceCompleted) {
      item.additionalTextEdits = [TextEdit.delete(braceCompletionRange)];
    }

    return item;
  }
}
