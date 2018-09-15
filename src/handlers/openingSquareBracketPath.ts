import LinkContextRecognizer from '../LinkContextRecognizer.g';
import { charactersReverse } from './nonTriggerCharacterText';

export default function (self: LinkContextRecognizer): undefined | 'path' | 'pathTransition' | 'pathPriorHash' | 'pathPriorQuery' | 'pathPriorQueryTransition' | 'pathPriorSlash' | 'pathPriorSlashTransition' | 'text' | null {
  self.cursor = 'text';
  self.text = charactersReverse.for(self).reverse().join('');
  return null;
}
