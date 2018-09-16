import LinkContextRecognizer from '../LinkContextRecognizer.g';

export default class ClosingSquareBracketPath {
  public handle(recognizer: LinkContextRecognizer): undefined | 'path' | 'pathTransition' | 'pathPriorHash' | 'pathPriorQuery' | 'pathPriorQueryTransition' | 'pathPriorSlash' | 'pathPriorSlashTransition' | 'text' | null {
    recognizer.cursor = 'transition';
    return 'text';
  }
}
