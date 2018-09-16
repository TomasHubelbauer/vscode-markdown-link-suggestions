import LinkContextRecognizer from "./LinkContextRecognizer.g";
import { deepEqual } from "assert";

// TODO: Introduce combinatorically generated tests
test('LinkContextRecognizer', async () => {
  deepEqual(new LinkContextRecognizer('_ ['), { cursor: 'text', text: '' });
  deepEqual(new LinkContextRecognizer('_ [text'), { cursor: 'text', text: 'text' });
  deepEqual(new LinkContextRecognizer('_ [text]'), { cursor: 'transition', text: 'text' });
  deepEqual(new LinkContextRecognizer('_ [text]('), { cursor: 'path', text: 'text', path: '', pathComponents: [''] });
  deepEqual(new LinkContextRecognizer('_ [text]()'), {});
  deepEqual(new LinkContextRecognizer('_ [text](path'), { cursor: 'path', text: 'text', path: 'path', pathComponents: ['path'] });
  deepEqual(new LinkContextRecognizer('_ [text](path)'), {});
  // TODO: Decide if this should be cursor path and we will suggest [] in front of it or if it should be cursor undefined
  // deepEqual(new LinkContextRecognizer('INVALID ('), { cursor: 'path' });
  // deepEqual(new LinkContextRecognizer('nada [link](test#a[b]'), { cursor: 'transition', text: 'b' });
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

  deepEqual(new LinkContextRecognizer('_ ()'), {});
  deepEqual(new LinkContextRecognizer('_ ()['), { cursor: 'text', text: '' });
});
