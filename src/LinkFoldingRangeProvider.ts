// https://github.com/Microsoft/vscode/issues/50839
// export default class LinkFoldingRangeProvider implements FoldingRangeProvider {
//     provideFoldingRanges(document: TextDocument, context: FoldingContext, token: CancellationToken): FoldingRange[] {
//         return [...getLinks(document)].map(({ uri, uriRange }) => {
//             // Fuck! This only allows folding across multiple lines!
//             // TODO: https://github.com/Microsoft/vscode/issues/50840
//             return new FoldingRange(textRange, Uri.file(resolvePath(document, uri)));
//         });
//     }
// }
