import LinkContextRecognizer from "./LinkContextRecognizer.g";
import { deepEqual } from "assert";

// TODO: Introduce combinatorically generated tests
// TODO: Add tests for scheme
test('LinkContextRecognizer', async () => {
  deepEqual(new LinkContextRecognizer('_ ['), { cursor: 'text', text: '' });
  deepEqual(new LinkContextRecognizer('_ [text'), { cursor: 'text', text: 'text' });
  deepEqual(new LinkContextRecognizer('_ [text]'), { cursor: 'transition', text: 'text' });
  deepEqual(new LinkContextRecognizer('_ [text]('), { cursor: 'path', text: 'text', path: [''] });
  deepEqual(new LinkContextRecognizer('_ [text]()'), {});
  deepEqual(new LinkContextRecognizer('_ [text](path'), { cursor: 'path', text: 'text', path: ['path'] });
  deepEqual(new LinkContextRecognizer('_ [text](path)'), {});
  deepEqual(new LinkContextRecognizer('_ [text](path1/path2'), { cursor: 'path', text: 'text', path: ['path1', '/path2'] });
  deepEqual(new LinkContextRecognizer('_ [text](path1/path2)'), {});
  deepEqual(new LinkContextRecognizer('_ [text](path1\\path2'), { cursor: 'path', text: 'text', path: ['path1', '\\path2'] });
  deepEqual(new LinkContextRecognizer('_ [text](#'), { cursor: 'fragment', text: 'text', path: [''], fragment: '' });
  deepEqual(new LinkContextRecognizer('_ [text](#frag'), { cursor: 'fragment', text: 'text', path: [''], fragment: 'frag' });
  deepEqual(new LinkContextRecognizer('_ [text](path#frag'), { cursor: 'fragment', text: 'text', path: ['path'], fragment: 'frag' });
  deepEqual(new LinkContextRecognizer('_ [text](path1/path2#frag'), { cursor: 'fragment', text: 'text', path: ['path1', '/path2'], fragment: 'frag' });
  deepEqual(new LinkContextRecognizer('_ [text](#f/r/a/g'), { cursor: 'fragment', text: 'text', path: [''], fragment: 'f/r/a/g' });
  deepEqual(new LinkContextRecognizer('_ [text](#f\\r\\a\\g'), { cursor: 'fragment', text: 'text', path: [''], fragment: 'f\\r\\a\\g' });
  deepEqual(new LinkContextRecognizer('_ [text](path1/path2#f/r/a/g'), { cursor: 'fragment', text: 'text', path: ['path1', '/path2'], fragment: 'f/r/a/g' });
  deepEqual(new LinkContextRecognizer('_ [text](path1\\path2#f\\r\\a\\g'), { cursor: 'fragment', text: 'text', path: ['path1', '\\path2'], fragment: 'f\\r\\a\\g' });
  deepEqual(new LinkContextRecognizer('_ [text](?'), { cursor: 'query', text: 'text', path: [''], query: '' });
  deepEqual(new LinkContextRecognizer('_ [text](?query'), { cursor: 'query', text: 'text', path: [''], query: 'query' });
  deepEqual(new LinkContextRecognizer('_ [text](path?query'), { cursor: 'query', text: 'text', path: ['path'], query: 'query' });
  deepEqual(new LinkContextRecognizer('_ [text](path1/path2?query'), { cursor: 'query', text: 'text', path: ['path1', '/path2'], query: 'query' });
  deepEqual(new LinkContextRecognizer('_ [text](?f/r/a/g'), { cursor: 'query', text: 'text', path: [''], query: 'f/r/a/g' });
  deepEqual(new LinkContextRecognizer('_ [text](?f\\r\\a\\g'), { cursor: 'query', text: 'text', path: [''], query: 'f\\r\\a\\g' });
  deepEqual(new LinkContextRecognizer('_ [text](path1/path2?f/r/a/g'), { cursor: 'query', text: 'text', path: ['path1', '/path2'], query: 'f/r/a/g' });
  deepEqual(new LinkContextRecognizer('_ [text](path1\\path2?f\\r\\a\\g'), { cursor: 'query', text: 'text', path: ['path1', '\\path2'], query: 'f\\r\\a\\g' });

  // deepEqual(new LinkContextRecognizer('nada [link](test#a[b]'), { cursor: 'transition', text: 'b' });
  // deepEqual(new LinkContextRecognizer('nada [link](a?'), { cursor: 'query', text: 'link', path: 'a', pathComponents: ['a'], query: '' });
  // deepEqual(new LinkContextRecognizer('nada [link](a?#'), { cursor: 'fragment', text: 'link', path: 'a', pathComponents: ['a'], query: '', fragment: '' });
  // deepEqual(new LinkContextRecognizer('a [b(c)(./i/j.k?t#o.p/q?t'), { cursor: 'fragment', text: 'b(c)', path: './i/j.k', pathComponents: ['.', 'i', 'j.k'], query: 't', fragment: 'o.p/q?t' });

  deepEqual(new LinkContextRecognizer('_ ('), {});
  deepEqual(new LinkContextRecognizer('_ ()'), {});
  deepEqual(new LinkContextRecognizer('_ ()['), { cursor: 'text', text: '' });
});
