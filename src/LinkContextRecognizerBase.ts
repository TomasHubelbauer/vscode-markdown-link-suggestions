abstract class LinkContextRecognizerBase {
  protected static readonly STATE_URL = 'url';
  protected static readonly STATE_URL_TRANSITION = 'urlTransition';
  protected static readonly STATE_URL_PRIOR_HASH = 'urlPriorHash';
  protected static readonly STATE_URL_PRIOR_SLASH = 'urlPriorSlash';
  protected static readonly STATE_URL_PRIOR_SLASH_TRANSITION = 'urlPriorSlashTransition';

  private static readonly STATES = {
    [LinkContextRecognizerBase.STATE_URL]: undefined,
    [LinkContextRecognizerBase.STATE_URL_TRANSITION]: undefined,
    [LinkContextRecognizerBase.STATE_URL_PRIOR_HASH]: undefined,
    [LinkContextRecognizerBase.STATE_URL_PRIOR_SLASH]: undefined,
    [LinkContextRecognizerBase.STATE_URL_PRIOR_SLASH_TRANSITION]: undefined,
  };

  private static readonly NON_TRIGGER = 'nonTrigger';

  private static readonly TRIGGER_CHARACTERS = {
    hash: '#',
    leftParen: '(',
    rightParen: ')',
    leftBrace: '[',
    rightBrace: ']',
    slash: '/',
    space: ' ',
  };

  public static getTriggerCharacters() {
    const triggerCharacters: { [name: string]: string; } = LinkContextRecognizerBase.TRIGGER_CHARACTERS;
    return Object.keys(triggerCharacters).map(key => triggerCharacters[key]);
  }

  protected state: keyof typeof LinkContextRecognizerBase.STATES = LinkContextRecognizerBase.STATE_URL;
  protected character: string = '';

  protected constructor(line: string, index: number) {
    this.validate();
    this.parse(line, index);
  }

  private static capitalize(value: string) {
    return value[0].toUpperCase() + value.slice(1);
  }

  private validate() {
    const handlers =
      Object
        .keys(LinkContextRecognizerBase.STATES)
        .reduce((combinations, state) => {
          return [
            ...combinations,
            ...Object
              .keys(LinkContextRecognizerBase.TRIGGER_CHARACTERS)
              .map(triggerCharacter => `${triggerCharacter}${LinkContextRecognizerBase.capitalize(state)}`),
            `${LinkContextRecognizerBase.NON_TRIGGER}${LinkContextRecognizerBase.capitalize(state)}`
          ];
        }, [] as string[]);
    const missingHandlers: string[] = [];
    for (const handler of handlers) {
      if (typeof (this as any as { [name: string]: () => void; })[handler] !== 'function') {
        missingHandlers.push(handler);
      }
    }

    if (missingHandlers.length > 0) {
      debugger;
      throw new Error(`${(this as any).name} is missing the following handlers!:\n${missingHandlers.join('\n')}`);
    }
  }

  private parse(line: string, index: number) {
    for (index; index > 0; index--) {
      const triggerCharacters: { [name: string]: string; } = LinkContextRecognizerBase.TRIGGER_CHARACTERS;
      this.character = line[index];
      const isTriggerCharacter = LinkContextRecognizerBase.getTriggerCharacters().includes(this.character);
      let handler: string | undefined;
      if (isTriggerCharacter) {
        const triggerCharacter = Object.keys(triggerCharacters).find(key => triggerCharacters[key] === this.character);
        handler = triggerCharacter + LinkContextRecognizerBase.capitalize(this.state);
      } else {
        handler += LinkContextRecognizerBase.NON_TRIGGER + LinkContextRecognizerBase.capitalize(this.state);
      }

      (this as any as { [name: string]: () => void; })[handler!]();
    }
  }
}
