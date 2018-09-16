import LinkContextRecognizer from '../LinkContextRecognizer.g';

export default class OpeningRoundBracket {
  public handle(recognizer: LinkContextRecognizer): undefined | 'path' | 'pathTransition' | 'pathPriorHash' | 'pathPriorQuery' | 'pathPriorQueryTransition' | 'pathPriorSlash' | 'pathPriorSlashTransition' | 'text' | null {
    const path = recognizer.nonTriggerCharacterPath.charactersReverse.reverse().join('');
    recognizer.path = path;
    recognizer.pathComponents = [path];
    recognizer.cursor = 'path';
    return 'pathTransition';
  }
}
