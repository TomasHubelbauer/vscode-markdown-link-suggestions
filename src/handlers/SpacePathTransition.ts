import LinkContextRecognizer from '../LinkContextRecognizer.g';

export default class SpacePathTransition {
  public handle(recognizer: LinkContextRecognizer): undefined | 'path' | 'pathTransition' | 'pathPriorHash' | 'pathPriorQuery' | 'pathPriorQueryTransition' | 'pathPriorSlash' | 'pathPriorSlashTransition' | 'text' | null {
    // `)` not followed by `[` -> not a link
    recognizer.cursor = undefined;
    recognizer.path = undefined;
    return null;
  }
}
