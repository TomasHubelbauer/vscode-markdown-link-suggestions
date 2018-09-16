import LinkContextRecognizer from '../LinkContextRecognizer.g';

export default class OpeningSquareBracketPath {
  public handle(recognizer: LinkContextRecognizer): undefined | 'path' | 'pathTransition' | 'pathPriorHash' | 'pathPriorQuery' | 'pathPriorQueryTransition' | 'pathPriorSlash' | 'pathPriorSlashTransition' | 'text' | null {
    recognizer.cursor = 'text';
    recognizer.text = recognizer.nonTriggerCharacterText.charactersReverse.reverse().join('');
    return null;
  }
}
