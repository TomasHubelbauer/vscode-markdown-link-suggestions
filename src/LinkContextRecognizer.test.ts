import LinkContextRecognizer from "./LinkContextRecognizer.g";
import { deepEqual } from "assert";

// TODO: Introduce combinatorically generated tests
// TODO: Add tests for scheme
// TODO: Add tests for fragment and query combinations
// TODO: Consider adding support for brackets by pair counting probably
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

  deepEqual(new LinkContextRecognizer('_ ('), {});
  deepEqual(new LinkContextRecognizer('_ ()'), {});
  deepEqual(new LinkContextRecognizer('_ ()['), { cursor: 'text', text: '' });
});
