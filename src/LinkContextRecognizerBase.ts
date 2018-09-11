export default abstract class LinkContextRecognizerBase {
  // TODO: Rename URL to PATH everywhere
  protected static readonly STATE_URL = 'url';
  protected static readonly STATE_URL_TRANSITION = 'urlTransition';
  protected static readonly STATE_URL_PRIOR_HASH = 'urlPriorHash';
  protected static readonly STATE_URL_PRIOR_QUERY = 'urlPriorQuery';
  protected static readonly STATE_URL_PRIOR_QUERY_TRANSITION = 'urlPriorQueryTransition';
  protected static readonly STATE_URL_PRIOR_SLASH = 'urlPriorSlash';
  protected static readonly STATE_URL_PRIOR_SLASH_TRANSITION = 'urlPriorSlashTransition';
  protected static readonly STATE_TEXT = 'text';

  private static readonly STATES = {
    [LinkContextRecognizerBase.STATE_URL]: undefined,
    [LinkContextRecognizerBase.STATE_URL_TRANSITION]: undefined,
    [LinkContextRecognizerBase.STATE_URL_PRIOR_HASH]: undefined,
    [LinkContextRecognizerBase.STATE_URL_PRIOR_QUERY]: undefined,
    [LinkContextRecognizerBase.STATE_URL_PRIOR_QUERY_TRANSITION]: undefined,
    [LinkContextRecognizerBase.STATE_URL_PRIOR_SLASH]: undefined,
    [LinkContextRecognizerBase.STATE_URL_PRIOR_SLASH_TRANSITION]: undefined,
    [LinkContextRecognizerBase.STATE_TEXT]: undefined,
  };

  private static readonly NON_TRIGGER = 'nonTrigger';

  private static readonly TRIGGER_CHARACTERS = {
    leftBrace: '[',
    rightBrace: ']',
    leftParen: '(',
    forwardSlash: '/',
    backwardSlash: '\\',
    space: ' ',
    // TODO: Consider dot: '.',
    query: '?',
    hash: '#',
    rightParen: ')',
  };

  public static getTriggerCharacters() {
    const triggerCharacters: { [name: string]: string; } = LinkContextRecognizerBase.TRIGGER_CHARACTERS;
    return Object.keys(triggerCharacters).map(key => triggerCharacters[key]);
  }

  protected state: keyof typeof LinkContextRecognizerBase.STATES = LinkContextRecognizerBase.STATE_URL;
  protected character: string = '';

  private audit: ((message: object) => void) | undefined;
  protected constructor(audit?: (message: object) => void) {
    this.audit = audit;
    this.validate();
  }

  /**
   * Validate that handlers are in the right order and there are no missing or extra handlers
   */
  private validate() {
    let handlers = Reflect.ownKeys(Reflect.getPrototypeOf(this)).filter(h => typeof h === 'string') as string[];

    // Remove mandatory `constructor` implementation
    handlers.splice(handlers.indexOf('constructor'), 1);

    // Remove voluntary `finalize` implementation
    const finalizeHandlerIndex = handlers.indexOf('finalize');
    if (finalizeHandlerIndex !== -1) {
      handlers.splice(finalizeHandlerIndex, 1);
    }

    const requiredHandlers =
      Object
        .keys(LinkContextRecognizerBase.STATES)
        .reduce((combinations, state) => {
          return [
            ...combinations,
            `${LinkContextRecognizerBase.NON_TRIGGER}${state[0].toUpperCase() + state.slice(1)}`,
            ...Object
              .keys(LinkContextRecognizerBase.TRIGGER_CHARACTERS)
              .map(triggerCharacter => `${triggerCharacter}${state[0].toUpperCase() + state.slice(1)}`),
          ];
        }, [] as string[]);

    const missingHandlers = requiredHandlers.filter(h => !handlers.includes(h));
    const extraHandlers = handlers.filter(h => !requiredHandlers.includes(h));
    const unorderedHandlers = handlers.filter(h => requiredHandlers.indexOf(h) !== handlers.indexOf(h));
    let error = '\n';

    if (missingHandlers.length > 0) {
      error += `${missingHandlers.length} handlers are missing:\n\n`;
      for (const handler of missingHandlers) {
        const expectedIndex = requiredHandlers.indexOf(handler);
        const anchor = expectedIndex === 0 ? 'first' : `after '${requiredHandlers[expectedIndex - 1]}'`;
        error += `'${handler}' (should be at #${expectedIndex}, ${anchor})\n`;
      }
    }

    if (extraHandlers.length > 0) {
      if (missingHandlers.length > 0) {
        error += '\n\n';
      }

      error += `${extraHandlers.length} handlers are extra:\n\n`;
      for (const handler of missingHandlers) {
        const actualIndex = handlers.indexOf(handler);
        const anchor = actualIndex === 0 ? 'first' : `after '${handlers[actualIndex - 1]}'`;
        error += `'${handler}' (should be at #${actualIndex}, ${anchor})\n`;
      }
    }

    if (unorderedHandlers.length > 0) {
      if (missingHandlers.length > 0 || extraHandlers.length > 0) {
        error += '\n\n';
      }

      error += `${unorderedHandlers.length} handlers are unordered:\n\n`;
      for (const handler of unorderedHandlers) {
        const expectedIndex = requiredHandlers.indexOf(handler);
        const actualIndex = handlers.indexOf(handler);
        const difference = expectedIndex - actualIndex;
        const direction = actualIndex > expectedIndex ? 'down' : 'up'; // Never 0
        const anchor = expectedIndex === 0 ? '(first)' : `after '${requiredHandlers[expectedIndex - 1]}'`;
        error += `'${handler}' should be #${expectedIndex} ${anchor} but is #${actualIndex} (${difference} ${direction}).\n`;
      }
    }

    if (error !== '\n') {
      throw new Error(error);
    }
  }

  protected parse(line: string, index: number) {
    const handlers = this as any as { [name: string]: () => void | null; };

    for (index; index >= 0; index--) {
      const triggerCharacters: { [name: string]: string; } = LinkContextRecognizerBase.TRIGGER_CHARACTERS;
      this.character = line[index];
      if (LinkContextRecognizerBase.getTriggerCharacters().includes(this.character)) {
        const triggerCharacter = Object.keys(triggerCharacters).find(key => triggerCharacters[key] === this.character);
        const handler = triggerCharacter + this.state[0].toUpperCase() + this.state.slice(1);

        if (this.audit !== undefined) {
          const { audit, ...self } = this as any;
          this.audit({ line, index, handler, stage: 'enter', ...JSON.parse(JSON.stringify(self)) });
        }

        const result = handlers[handler]();

        if (this.audit !== undefined) {
          const { audit, ...self } = this as any;
          this.audit({ line, index, handler, stage: 'exit', ...JSON.parse(JSON.stringify(self)) });
        }

        if (result === null) {
          break;
        }
      } else {
        const handler = LinkContextRecognizerBase.NON_TRIGGER + this.state[0].toUpperCase() + this.state.slice(1);

        if (this.audit !== undefined) {
          const { audit, ...self } = this as any;
          this.audit({ line, index, handler, stage: 'enter', ...JSON.parse(JSON.stringify(self)) });
        }

        const result = handlers[handler]();

        if (this.audit !== undefined) {
          const { audit, ...self } = this as any;
          this.audit({ line, index, handler, stage: 'exit', ...JSON.parse(JSON.stringify(self)) });
        }

        if (result === null) {
          break;
        }
      }
    }

    if (this.audit !== undefined) {
      const { audit, ...self } = this as any;
      this.audit({ line, index, handler: 'finalize', stage: 'enter', ...JSON.parse(JSON.stringify(self)) });
    }

    handlers['finalize']();

    if (this.audit !== undefined) {
      const { audit, ...self } = this as any;
      this.audit({ line, index, handler: 'finalize', stage: 'exit', ...JSON.parse(JSON.stringify(self)) });
    }
  }
}
