import LinkContextRecognizer from '../LinkContextRecognizer.g';

export default class OpeningSquareBracketPath {
  public handle(recognizer: LinkContextRecognizer): undefined | 'path' | 'pathTransition' | 'pathPriorHash' | 'pathPriorQuery' | 'pathPriorQueryTransition' | 'pathPriorSlash' | 'pathPriorSlashTransition' | 'text' | null {
    // `[hello`
    if (recognizer.cursor === undefined) {
      recognizer.cursor = 'text';
      recognizer.text = recognizer.nonTriggerCharacterPath.charactersReverse.reverse().join('');
      return null;
    }

    throw new Error(recognizer.cursor);
  }
}
