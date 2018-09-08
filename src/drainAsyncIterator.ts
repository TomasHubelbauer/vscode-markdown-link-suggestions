// https://stackoverflow.com/q/50234481/2715716 when used with `AsyncIterableIterator<Diagnostic>`
// TODO: Await for VS Code using Node 10 and then use native
//const diagnostics = [...await this.provideDiagnostics(textDocument)];
export default async function drainAsyncIterator<T>(iterator: AsyncIterableIterator<T>): Promise<T[]> {
  const items: T[] = [];
  for await (const item of iterator) {
    items.push(item);
  }

  return items;
}
