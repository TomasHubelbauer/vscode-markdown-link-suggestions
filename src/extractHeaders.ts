import { DocumentSymbol, SymbolKind } from "vscode";
import isLinkDocumentSymbol from "./isLinkDocumentSymbol";

// Note that this function can provide false positives, we do not have much to go on except the symbol kind being string
// Note that we do not want to check that the text starts with "#" because those are only ATX headers, Setext headers are underlined
export default function extractHeaders(symbols: DocumentSymbol[], results: DocumentSymbol[] = []) {
    for (let symbol of symbols) {
      // Ignore link symbols so that we don't get false positives where "# header" and "[#link path]" would look the same (string with "# content")
      if (isLinkDocumentSymbol(symbol) || symbol.kind !== SymbolKind.String) {
        continue;
      }
  
      results.push(symbol);
      extractHeaders(symbol.children, results);
    }
  
    return results;
  }
  