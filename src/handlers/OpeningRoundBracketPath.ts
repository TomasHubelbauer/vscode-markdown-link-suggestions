import LinkContextRecognizer from '../LinkContextRecognizer.g';

export default class OpeningRoundBracket {
  public handle(recognizer: LinkContextRecognizer): undefined | 'path' | 'pathTransition' | 'pathPriorHash' | 'pathPriorQuery' | 'pathPriorQueryTransition' | 'pathPriorSlash' | 'pathPriorSlashTransition' | 'text' | null {
    if (recognizer.path === undefined) { 
      const path = recognizer.nonTriggerCharacterPath.charactersReverse.reverse().join('');
      recognizer.path = [path];
    } else {
      const path = recognizer.nonTriggerCharacterPath.charactersReverse.reverse().join('');
      recognizer.path.unshift(path);
    }

    recognizer.cursor = recognizer.cursor || 'path';
    return 'pathTransition';
  }
}
