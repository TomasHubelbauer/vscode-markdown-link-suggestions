
// This is a generated file, to make it yours, remove it from the .gitignore of this repository
import LinkContextRecognizer from '../LinkContextRecognizer.g';
import { charactersReverse } from './nonTriggerCharacterPath';
export default function (self: LinkContextRecognizer): undefined | 'path' | 'pathTransition' | 'pathPriorHash' | 'pathPriorQuery' | 'pathPriorQueryTransition' | 'pathPriorSlash' | 'pathPriorSlashTransition' | 'text' | null {
  self.path = charactersReverse.reverse().join('');
  self.pathComponents = [self.path];
  self.cursor = 'path';
  return 'pathTransition';
}
