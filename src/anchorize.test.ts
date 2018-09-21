import anchorize from "./anchorize";
import { equal } from 'assert';

test('anchorize', function () {
  equal(anchorize('Hello, World!'), 'hello-world');
  equal(anchorize('Hello, `world`!'), 'hello-world');
});
