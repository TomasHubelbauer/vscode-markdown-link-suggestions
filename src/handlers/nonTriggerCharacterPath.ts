import LinkContextRecognizer from '../LinkContextRecognizer.g';
import State from './state';

export const charactersReverse = new State<string[]>([]);

export default function (self: LinkContextRecognizer, character: string): undefined | 'path' | 'pathTransition' | 'pathPriorHash' | 'pathPriorQuery' | 'pathPriorQueryTransition' | 'pathPriorSlash' | 'pathPriorSlashTransition' | 'text' | null {
  charactersReverse.for(self).push(character);
  return;
}
