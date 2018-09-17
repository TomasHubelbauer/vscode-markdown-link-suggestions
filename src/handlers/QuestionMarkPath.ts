import LinkContextRecognizer from '../LinkContextRecognizer.g';

export default class QuestionMarkPath {
  public handle(recognizer: LinkContextRecognizer): undefined | 'path' | 'pathTransition' | 'pathPriorHash' | 'pathPriorQuery' | 'pathPriorQueryTransition' | 'pathPriorSlash' | 'pathPriorSlashTransition' | 'text' | null {
    recognizer.query = recognizer.nonTriggerCharacterPath.charactersReverse.reverse().join('');
    if (recognizer.path !== undefined) {
      recognizer.query += recognizer.path.join('');
      recognizer.path = undefined;
    }

    recognizer.nonTriggerCharacterPath.charactersReverse = [];
    recognizer.cursor = 'query';
    return 'path';
  }
}
