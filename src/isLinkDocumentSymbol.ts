import { DocumentSymbol, SymbolKind } from "vscode";

export default function isLinkDocumentSymbol(symbol: DocumentSymbol) {
    // Filter down only link symbols - string symbol with exactly one other string symbol child
    return symbol.kind === SymbolKind.String && symbol.children.length === 1 && symbol.children[0].kind === SymbolKind.String && symbol.children[0].detail === symbol.name;
}
