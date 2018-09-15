import LinkContextRecognizer from "./LinkContextRecognizer.g";
import { deepEqual } from "assert";

// TODO: Introduce combinatorically generated tests
test('LinkContextRecognizer', async () => {
  deepEqual(new LinkContextRecognizer('not link [link](path'), { cursor: 'path', text: 'link', path: 'path', pathComponents: ['path'] });
  // TODO:
  // deepEqual(new LinkContextRecognizer('not link [link](path)'), {});
  // deepEqual(new LinkContextRecognizer('hello ['), { cursor: 'text', text: '' });
  // deepEqual(new LinkContextRecognizer('nada ['), { cursor: 'text', text: '' });
  // deepEqual(new LinkContextRecognizer('nada [link'), { cursor: 'text', text: 'link' });
  // deepEqual(new LinkContextRecognizer('INVALID ('), { cursor: 'path' });
  // deepEqual(new LinkContextRecognizer('INVALID ()'), {});
  // deepEqual(new LinkContextRecognizer('INVALID ()['), { cursor: 'text', text: '' });
  // deepEqual(new LinkContextRecognizer('nada [link](test#a[b]'), { cursor: 'transition', text: 'b' });
  // deepEqual(new LinkContextRecognizer('nada [link]'), { cursor: 'transition', text: 'link' });
  // deepEqual(new LinkContextRecognizer('nada [link]('), { cursor: 'path', text: 'link', path: '', pathComponents: [] });
  // deepEqual(new LinkContextRecognizer('nada [link]()'), { text: 'link', path: '', pathComponents: [] });
  // deepEqual(new LinkContextRecognizer('nada [link](a'), { cursor: 'path', text: 'link', path: 'a', pathComponents: ['a'] });
  // deepEqual(new LinkContextRecognizer('nada [link](a)'), { cursor: 'path', text: 'link', path: 'a', pathComponents: ['a'] });
  // deepEqual(new LinkContextRecognizer('nada [link](#'), { cursor: 'fragment', text: 'link', path: '', pathComponents: [], fragment: '' });
  // deepEqual(new LinkContextRecognizer('nada [link](#header'), { cursor: 'fragment', text: 'link', path: '', pathComponents: [], fragment: 'header' });
  // deepEqual(new LinkContextRecognizer('nada [link](a#'), { cursor: 'fragment', text: 'link', path: 'a', pathComponents: ['a'], fragment: '' });
  // deepEqual(new LinkContextRecognizer('nada [link](a?'), { cursor: 'query', text: 'link', path: 'a', pathComponents: ['a'], query: '' });
  // deepEqual(new LinkContextRecognizer('nada [link](a?#'), { cursor: 'fragment', text: 'link', path: 'a', pathComponents: ['a'], query: '', fragment: '' });
  // deepEqual(new LinkContextRecognizer(' [link](README.md'), { cursor: 'path', text: 'link', path: 'README.md', pathComponents: ['README.md'] });
  // deepEqual(new LinkContextRecognizer(' [link](README.md)'), { text: 'link', path: 'README.md', pathComponents: ['README.md'] });
  // deepEqual(new LinkContextRecognizer(' [link](README.md#header)'), { cursor: 'fragment', text: 'link', path: 'README.md', pathComponents: ['README.md'], fragment: 'header' });
  // deepEqual(new LinkContextRecognizer(' [link](nested/README.md)'), { text: 'link', path: 'nested/README.md', pathComponents: ['nested', 'README.md'] });
  // deepEqual(new LinkContextRecognizer('a [b(c)(./i/j.k?t#o.p/q?t'), { cursor: 'fragment', text: 'b(c)', path: './i/j.k', pathComponents: ['.', 'i', 'j.k'], query: 't', fragment: 'o.p/q?t' });
});
