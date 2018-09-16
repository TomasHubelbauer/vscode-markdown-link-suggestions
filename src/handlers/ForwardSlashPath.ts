import LinkContextRecognizer from '../LinkContextRecognizer.g';

export default class ForwardSlashPath {
  public handle(recognizer: LinkContextRecognizer): undefined | 'path' | 'pathTransition' | 'pathPriorHash' | 'pathPriorQuery' | 'pathPriorQueryTransition' | 'pathPriorSlash' | 'pathPriorSlashTransition' | 'text' | null {
    const path = recognizer.nonTriggerCharacterPath.charactersReverse.reverse().join('');
    recognizer.nonTriggerCharacterPath.charactersReverse = [];

    if (recognizer.path === undefined) {
      recognizer.path = [];
    }

    recognizer.path.unshift(path);
    return;
  }
}
