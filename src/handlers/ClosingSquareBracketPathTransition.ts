import LinkContextRecognizer from '../LinkContextRecognizer.g';

export default class ClosingSquareBracketPathTransition {
  public handle(_recognizer: LinkContextRecognizer): undefined | 'path' | 'pathTransition' | 'pathPriorHash' | 'pathPriorQuery' | 'pathPriorQueryTransition' | 'pathPriorSlash' | 'pathPriorSlashTransition' | 'text' | null {
    return 'text';
  }
}
