import LinkContextRecognizer from '../LinkContextRecognizer.g';

export default class NonTriggerCharacterText {
  public charactersReverse: string[] = [];

  public handle(_recognizer: LinkContextRecognizer, character: string): undefined | 'path' | 'pathTransition' | 'pathPriorHash' | 'pathPriorQuery' | 'pathPriorQueryTransition' | 'pathPriorSlash' | 'pathPriorSlashTransition' | 'text' | null {
    this.charactersReverse.push(character);
    return;
  }
}
