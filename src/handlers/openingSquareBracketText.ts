import LinkContextRecognizer from '../LinkContextRecognizer.g';

export default class OpeningSquareBracketText {
  public handle(recognizer: LinkContextRecognizer): undefined | 'path' | 'pathTransition' | 'pathPriorHash' | 'pathPriorQuery' | 'pathPriorQueryTransition' | 'pathPriorSlash' | 'pathPriorSlashTransition' | 'text' | null {
    console.log(recognizer.nonTriggerCharacterText.charactersReverse);
    recognizer.text = recognizer.nonTriggerCharacterText.charactersReverse.reverse().join('');
    return null;
  }
}
