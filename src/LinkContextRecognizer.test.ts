import LinkContextRecognizer from "./LinkContextRecognizer.g";
import { deepStrictEqual } from "assert";

test('LinkContextRecognizer', async () => {
  // TODO: Introduce combinatorically generated tests
  const tests: {
    line: string;
    cursor: 'text' | 'transition' /* TODO: `scheme`? */ | 'path' | 'query' | 'fragment' | null;
    text: string | null;
    // TODO: `scheme`?
    path: string | null;
    pathComponents: string[] | null;
    query: string | null;
    fragment: string | null;
  }[] =
    [
      { line: 'not link [link](path', cursor: 'path', text: 'link', path: 'path', pathComponents: ['path'], query: null, fragment: null },
      // Skip parsing link if cursor is placed after it
      { line: 'not link [link](path)', cursor: null, text: null, path: null, pathComponents: null, query: null, fragment: null },
      { line: 'hello [', cursor: 'text', text: '', path: null, pathComponents: null, query: null, fragment: null },
      // TODO: Maybe suggest `(…)` before?
      { line: 'nada [', cursor: 'text', text: '', path: null, pathComponents: null, query: null, fragment: null },
      { line: 'nada [link', cursor: 'text', text: 'link', path: null, pathComponents: null, query: null, fragment: null },
      // TODO: Maybe suggest prepending text?
      { line: 'INVALID (', cursor: 'path', text: null, path: null, pathComponents: null, query: null, fragment: null },
      // TODO: Maybe suggest prepending text?
      { line: 'INVALID ()', cursor: null, text: null, path: null, pathComponents: null, query: null, fragment: null },
      { line: 'INVALID ()[', cursor: 'text', text: '', path: null, pathComponents: null, query: null, fragment: null },
      { line: 'nada [link](test#a[b]', cursor: 'transition', text: 'b', path: null, pathComponents: null, query: null, fragment: null },
      { line: 'nada [link]', cursor: 'transition', text: 'link', path: null, pathComponents: null, query: null, fragment: null },
      { line: 'nada [link](', cursor: 'path', text: 'link', path: '', pathComponents: [], query: null, fragment: null },
      { line: 'nada [link]()', cursor: null, text: 'link', path: '', pathComponents: [], query: null, fragment: null },
      { line: 'nada [link](a', cursor: 'path', text: 'link', path: 'a', pathComponents: ['a'], query: null, fragment: null },
      { line: 'nada [link](a)', cursor: 'path', text: 'link', path: 'a', pathComponents: ['a'], query: null, fragment: null },
      { line: 'nada [link](#', cursor: 'fragment', text: 'link', path: '', pathComponents: [], query: null, fragment: '' },
      { line: 'nada [link](#header', cursor: 'fragment', text: 'link', path: '', pathComponents: [], query: null, fragment: 'header' },
      { line: 'nada [link](a#', cursor: 'fragment', text: 'link', path: 'a', pathComponents: ['a'], query: null, fragment: '' },
      { line: 'nada [link](a?', cursor: 'query', text: 'link', path: 'a', pathComponents: ['a'], query: '', fragment: null },
      { line: 'nada [link](a?#', cursor: 'fragment', text: 'link', path: 'a', pathComponents: ['a'], query: '', fragment: '' },
      {
        line: ' [link](README.md', cursor: 'path', text: 'link',
        path: 'README.md', pathComponents: ['README.md'], query: null, fragment: null,
      },
      {
        line: ' [link](README.md)', cursor: null, text: 'link',
        path: 'README.md', pathComponents: ['README.md'], query: null, fragment: null,
      },
      {
        line: ' [link](README.md#header)', cursor: 'fragment', text: 'link',
        path: 'README.md', pathComponents: ['README.md'], query: null, fragment: 'header',
      },
      {
        line: ' [link](nested/README.md)', cursor: null, text: 'link',
        path: 'nested/README.md', pathComponents: ['nested', 'README.md'], query: null, fragment: null,
      },
      {
        line: 'a [b (c) d [e]](./f/g(h)/i/j.k?test#l-m-(n)-o.p/q/r/s?tuvwxyz', cursor: 'fragment', text: 'b (c) d [e]',
        path: './f/g(h)/i/j.k', pathComponents: ['.', 'f', 'g(h)', 'i', 'j.k'],
        query: 'test', fragment: 'l-m-(n)-o.p/q/r/s?tuvwxyz',
      },
    ];

  for (const test of tests) {
    const { line, ...expected } = test;
    const { cursor, text, path, pathComponents, query, fragment } = new LinkContextRecognizer(line, line.length - 1);
    const actual = { cursor, text, path, pathComponents, query, fragment };
    deepStrictEqual(actual, expected);
  }
});
