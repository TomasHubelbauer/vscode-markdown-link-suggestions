import LinkContextRecognizer from '../LinkContextRecognizer.g';
import { charactersReverse } from './nonTriggerCharacterPath';

export default function (self: LinkContextRecognizer): undefined | 'path' | 'pathTransition' | 'pathPriorHash' | 'pathPriorQuery' | 'pathPriorQueryTransition' | 'pathPriorSlash' | 'pathPriorSlashTransition' | 'text' | null {
  self.path = charactersReverse.for(self).reverse().join('');
  self.pathComponents = [self.path];
  self.cursor = 'path';
  return 'pathTransition';
}
