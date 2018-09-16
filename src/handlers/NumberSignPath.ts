import LinkContextRecognizer from '../LinkContextRecognizer.g';

export default class NumberSignPath {
  public handle(recognizer: LinkContextRecognizer): undefined | 'path' | 'pathTransition' | 'pathPriorHash' | 'pathPriorQuery' | 'pathPriorQueryTransition' | 'pathPriorSlash' | 'pathPriorSlashTransition' | 'text' | null {
    recognizer.fragment = recognizer.nonTriggerCharacterPath.charactersReverse.reverse().join('');
    if (recognizer.path !== undefined) {
      recognizer.fragment += '/' + recognizer.path.join('/');
      recognizer.path = undefined;
    }

    recognizer.nonTriggerCharacterPath.charactersReverse = [];
    recognizer.cursor = 'fragment';
    return 'path';
  }
}
