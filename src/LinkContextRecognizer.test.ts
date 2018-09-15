import LinkContextRecognizer from "./LinkContextRecognizer.g";
import { deepStrictEqual } from "assert";

// TODO: Introduce combinatorically generated tests
test('LinkContextRecognizer', async () => {
  deepStrictEqual(new LinkContextRecognizer('not link [link](path'), { cursor: 'path', text: 'link', path: 'path', pathComponents: ['path'] });
  deepStrictEqual(new LinkContextRecognizer('not link [link](path)'), {});
  deepStrictEqual(new LinkContextRecognizer('hello ['), { cursor: 'text', text: '' });
  deepStrictEqual(new LinkContextRecognizer('nada ['), { cursor: 'text', text: '' });
  deepStrictEqual(new LinkContextRecognizer('nada [link'), { cursor: 'text', text: 'link' });
  deepStrictEqual(new LinkContextRecognizer('INVALID ('), { cursor: 'path' });
  deepStrictEqual(new LinkContextRecognizer('INVALID ()'), {});
  deepStrictEqual(new LinkContextRecognizer('INVALID ()['), { cursor: 'text', text: '' });
  deepStrictEqual(new LinkContextRecognizer('nada [link](test#a[b]'), { cursor: 'transition', text: 'b' });
  deepStrictEqual(new LinkContextRecognizer('nada [link]'), { cursor: 'transition', text: 'link' });
  deepStrictEqual(new LinkContextRecognizer('nada [link]('), { cursor: 'path', text: 'link', path: '', pathComponents: [] });
  deepStrictEqual(new LinkContextRecognizer('nada [link]()'), { text: 'link', path: '', pathComponents: [] });
  deepStrictEqual(new LinkContextRecognizer('nada [link](a'), { cursor: 'path', text: 'link', path: 'a', pathComponents: ['a'] });
  deepStrictEqual(new LinkContextRecognizer('nada [link](a)'), { cursor: 'path', text: 'link', path: 'a', pathComponents: ['a'] });
  deepStrictEqual(new LinkContextRecognizer('nada [link](#'), { cursor: 'fragment', text: 'link', path: '', pathComponents: [], fragment: '' });
  deepStrictEqual(new LinkContextRecognizer('nada [link](#header'), { cursor: 'fragment', text: 'link', path: '', pathComponents: [], fragment: 'header' });
  deepStrictEqual(new LinkContextRecognizer('nada [link](a#'), { cursor: 'fragment', text: 'link', path: 'a', pathComponents: ['a'], fragment: '' });
  deepStrictEqual(new LinkContextRecognizer('nada [link](a?'), { cursor: 'query', text: 'link', path: 'a', pathComponents: ['a'], query: '' });
  deepStrictEqual(new LinkContextRecognizer('nada [link](a?#'), { cursor: 'fragment', text: 'link', path: 'a', pathComponents: ['a'], query: '', fragment: '' });
  deepStrictEqual(new LinkContextRecognizer(' [link](README.md'), { cursor: 'path', text: 'link', path: 'README.md', pathComponents: ['README.md'] });
  deepStrictEqual(new LinkContextRecognizer(' [link](README.md)'), { text: 'link', path: 'README.md', pathComponents: ['README.md'] });
  deepStrictEqual(new LinkContextRecognizer(' [link](README.md#header)'), { cursor: 'fragment', text: 'link', path: 'README.md', pathComponents: ['README.md'], fragment: 'header' });
  deepStrictEqual(new LinkContextRecognizer(' [link](nested/README.md)'), { text: 'link', path: 'nested/README.md', pathComponents: ['nested', 'README.md'] });
  deepStrictEqual(new LinkContextRecognizer('a [b(c)(./i/j.k?t#o.p/q?t'), { cursor: 'fragment', text: 'b(c)', path: './i/j.k', pathComponents: ['.', 'i', 'j.k'], query: 't', fragment: 'o.p/q?t' });
});
