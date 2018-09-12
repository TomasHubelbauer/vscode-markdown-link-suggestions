import LinkContextRecognizerBase from "./LinkContextRecognizerGenerator";

export default class LinkContextRecognizer extends LinkContextRecognizerBase {
  private character: string;

  // Updated in each step
  private textCharactersReverse: string[] = [];
  private pathCharactersReverse: string[] = [];
  private pathComponentsReverse: string[] = [];

  // Solidified in unambiguous points
  public cursor: 'text' | 'transition' | /* TODO: `scheme`? */ 'path' | 'query' | 'fragment' | null = null;
  public text: string | null = null;
  public path: string | null = null;
  public pathComponents: string[] | null = null;
  public query: string | null = null;
  public fragment: string | null = null;

  constructor(line: string, index: number, audit?: (message: object) => void) {
    super(audit);
    // Run the parsing now that both this base class and the derived class with handlers have been fully instantiated
    this.parse(line, index);
  }

  private parse(line: string, index: number) {
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

  protected finalize() {
    // `)`
    if (this.cursor === 'path' && this.pathCharactersReverse.length === 0) {

    }

    // `INVALID ()[`
    if (this.cursor === null && this.text !== null) {
      this.text = null;
    }
  }

  /* URL */

  protected nonTriggerUrl() {
    this.cursor = 'path';
    this.pathCharactersReverse.push(this.character);
  }

  protected leftBraceUrl() {
    if (this.textCharactersReverse.length === 0 && this.pathComponentsReverse.length === 0) {
      this.text = this.pathCharactersReverse.reverse().join('');
      this.cursor = 'text';
    }

    return null;
  }

  /**
   * Handle the right square bracket (`]`) in the `url` state.
   * This means the cursor is placed after the link, e.g.: `[link] |`
   */

  protected rightBraceUrl() {
    this.cursor = 'transition';
    this.state = LinkContextRecognizerBase.STATE_TEXT;
  }

  protected leftParenUrl() {
    if (this.cursor === null) {
      this.cursor = 'path';
    }

    this.state = LinkContextRecognizerBase.STATE_URL_TRANSITION;
  }

  protected forwardSlashUrl() {
    this.pathComponentsReverse.push(this.pathCharactersReverse.reverse().join(''));
    this.pathCharactersReverse = [];
  }

  protected backwardSlashUrl() {
    throw new Error();
  }

  protected spaceUrl() {
    return null;
  }

  protected queryUrl() {
    // 2 ways lead here - query in fragment & query in path, indistinguishable now, so we assume query and reset to fragment if needed
    this.query = this.pathCharactersReverse.reverse().join('');
    this.pathCharactersReverse = [];
    this.state = LinkContextRecognizerBase.STATE_URL_PRIOR_QUERY;
  }

  protected hashUrl() {
    // Recognized anchor
    this.fragment = this.pathCharactersReverse.reverse().join('');
    this.pathCharactersReverse = [];
    this.state = LinkContextRecognizerBase.STATE_URL_PRIOR_HASH;
  }

  /**
   * Handle the right round bracket (`)`).
   * This means the cursor is outside of the link, e.g.: `[link](path) |`
   */
  protected rightParenUrl() {
    this.cursor = null;
    return null;
  }

  /* URL_TRANSITION */

  protected nonTriggerUrlTransition() {
    // Revert what seemed it will be a transition but ended up not being
    this.state = LinkContextRecognizerBase.STATE_URL;
    this.pathCharactersReverse.push('(', this.character);
  }

  protected leftBraceUrlTransition() {
    throw new Error();
  }

  protected rightBraceUrlTransition() {
    if (this.pathCharactersReverse.length > 0) {
      this.pathComponentsReverse.push(this.pathCharactersReverse.reverse().join(''));
      this.pathCharactersReverse = [];
    }

    if (this.pathComponentsReverse.length > 0) {
      this.pathComponents = this.pathComponentsReverse.reverse();
      this.pathComponentsReverse = [];
      this.path = this.pathComponents.join('/');
    } else {
      // Indicate )[ was present by setting a non-empty path
      this.path = '';
    }

    this.state = LinkContextRecognizerBase.STATE_TEXT;
  }

  protected leftParenUrlTransition() {
    return null;
  }

  protected forwardSlashUrlTransition() {
    return null;
  }

  protected backwardSlashUrlTransition() {
    return null;
  }

  protected spaceUrlTransition() {
    return null;
  }

  protected queryUrlTransition() {
    return null;
  }

  protected hashUrlTransition() {
    return null;
  }

  protected rightParenUrlTransition() {
    return null;
  }

  /* URL_PRIOR_HASH */

  protected nonTriggerUrlPriorHash() {
    this.pathCharactersReverse.push(this.character);
  }

  protected leftBraceUrlPriorHash() {
    throw new Error();
  }

  protected rightBraceUrlPriorHash() {
    throw new Error();
  }

  protected leftParenUrlPriorHash() {
    this.state = LinkContextRecognizerBase.STATE_URL_PRIOR_SLASH_TRANSITION;
  }

  protected forwardSlashUrlPriorHash() {
    this.pathComponentsReverse.push(this.pathCharactersReverse.reverse().join(''));
    this.pathCharactersReverse = [];
    this.state = LinkContextRecognizerBase.STATE_URL_PRIOR_SLASH;
  }

  protected backwardSlashUrlPriorHash() {
    throw new Error();
  }

  protected spaceUrlPriorHash() {
    throw new Error();
  }

  protected queryUrlPriorHash() {
    this.query = this.pathCharactersReverse.reverse().join('');
    this.pathCharactersReverse = [];
    this.state = LinkContextRecognizerBase.STATE_URL_PRIOR_QUERY;
  }

  protected hashUrlPriorHash() {
    throw new Error();
  }

  protected rightParenUrlPriorHash() {
    throw new Error();
  }

  /* URL_PRIOR_QUERY */

  protected nonTriggerUrlPriorQuery() {
    this.pathCharactersReverse.push(this.character);
  }

  protected leftBraceUrlPriorQuery() {
    throw new Error();
  }

  protected rightBraceUrlPriorQuery() {
    throw new Error();
  }

  protected leftParenUrlPriorQuery() {
    this.state = LinkContextRecognizerBase.STATE_URL_PRIOR_QUERY_TRANSITION;
  }

  protected forwardSlashUrlPriorQuery() {
    this.pathComponentsReverse.push(this.pathCharactersReverse.reverse().join(''));
    this.pathCharactersReverse = [];
  }

  protected backwardSlashUrlPriorQuery() {
    throw new Error();
  }

  protected spaceUrlPriorQuery() {
    throw new Error();
  }

  protected queryUrlPriorQuery() {
    this.query = this.pathCharactersReverse.reverse().join('');
    this.pathCharactersReverse = [];
  }

  protected hashUrlPriorQuery() {
    this.fragment = '';

    // If we previously thought we were in a path but it turned out we were in a hash, reset that
    if (this.pathCharactersReverse.length > 0) {
      this.fragment += this.pathCharactersReverse.reverse().join('');
      this.pathCharactersReverse = [];
    }

    if (this.pathComponentsReverse.length > 0) {
      if (this.fragment.length > 0) {
        this.fragment += '/';
      }

      this.fragment += this.pathComponentsReverse.reverse().join('/');
      this.pathComponentsReverse = [];
    }

    // If we previously thought we were in a query but it turned out we were in a hash, reset that
    if (this.query !== null) {
      this.fragment += '?' + this.query;
      this.query = null;
    }
  }

  protected rightParenUrlPriorQuery() {
    this.pathCharactersReverse.push(this.character);
  }

  /* URL_PRIOR_QUERY_TRANSITION */

  protected nonTriggerUrlPriorQueryTransition() {
    this.state = LinkContextRecognizerBase.STATE_URL_PRIOR_QUERY;
    this.pathCharactersReverse.push('(', this.character);
  }

  protected leftBraceUrlPriorQueryTransition() {
    throw new Error();
  }

  protected rightBraceUrlPriorQueryTransition() {
    if (this.pathCharactersReverse.length > 0) {
      this.pathComponentsReverse.push(this.pathCharactersReverse.reverse().join(''));
      this.pathCharactersReverse = [];
    }

    if (this.pathComponentsReverse.length > 0) {
      this.pathComponents = this.pathComponentsReverse.reverse();
      this.pathComponentsReverse = [];
      this.path = this.pathComponents.join('/');
    }

    this.state = LinkContextRecognizerBase.STATE_TEXT;
  }

  protected leftParenUrlPriorQueryTransition() {
    throw new Error();
  }

  protected forwardSlashUrlPriorQueryTransition() {
    throw new Error();
  }

  protected backwardSlashUrlPriorQueryTransition() {
    throw new Error();
  }

  protected spaceUrlPriorQueryTransition() {
    throw new Error();
  }

  protected queryUrlPriorQueryTransition() {
    throw new Error();
  }

  protected hashUrlPriorQueryTransition() {
    throw new Error();
  }

  protected rightParenUrlPriorQueryTransition() {
    throw new Error();
  }

  /* URL_PRIOR_SLASH */

  protected nonTriggerUrlPriorSlash() {
    this.pathCharactersReverse.push(this.character);
  }

  protected leftBraceUrlPriorSlash() {
    throw new Error();
  }

  protected rightBraceUrlPriorSlash() {
    throw new Error();
  }

  protected leftParenUrlPriorSlash() {
    this.state = LinkContextRecognizerBase.STATE_URL_PRIOR_SLASH_TRANSITION;
  }

  protected forwardSlashUrlPriorSlash() {
    this.pathComponentsReverse.push(this.pathCharactersReverse.slice().reverse().join(''));
    this.pathCharactersReverse = [];
  }

  protected backwardSlashUrlPriorSlash() {
    throw new Error();
  }

  protected spaceUrlPriorSlash() {
    throw new Error();
  }

  protected queryUrlPriorSlash() {
    throw new Error();
  }

  protected hashUrlPriorSlash() {
    throw new Error();
  }

  protected rightParenUrlPriorSlash() {
    this.pathCharactersReverse.push(this.character);
  }

  /* URL_PRIOR_SLASH_TRANSITION */

  protected nonTriggerUrlPriorSlashTransition() {
    this.state = LinkContextRecognizerBase.STATE_URL_PRIOR_SLASH;
    this.pathCharactersReverse.push('(', this.character);
  }

  protected leftBraceUrlPriorSlashTransition() {
    throw new Error();
  }

  protected rightBraceUrlPriorSlashTransition() {
    if (this.pathCharactersReverse.length > 0) {
      this.pathComponentsReverse.push(this.pathCharactersReverse.reverse().join(''));
      this.pathCharactersReverse = [];
    }

    if (this.pathComponentsReverse.length > 0) {
      this.pathComponents = this.pathComponentsReverse.reverse();
      this.pathComponentsReverse = [];
      this.path = this.pathComponents.join('/');
    }

    this.state = LinkContextRecognizerBase.STATE_TEXT;
  }

  protected leftParenUrlPriorSlashTransition() {
    throw new Error();
  }

  protected forwardSlashUrlPriorSlashTransition() {
    throw new Error();
  }

  protected backwardSlashUrlPriorSlashTransition() {
    throw new Error();
  }

  protected spaceUrlPriorSlashTransition() {
    throw new Error();
  }

  protected queryUrlPriorSlashTransition() {
    throw new Error();
  }

  protected hashUrlPriorSlashTransition() {
    throw new Error();
  }

  protected rightParenUrlPriorSlashTransition() {
    throw new Error();
  }

  /* TEXT */

  protected nonTriggerText() {
    this.textCharactersReverse.push(this.character);
  }

  protected leftBraceText() {
    this.text = this.textCharactersReverse.slice().reverse().join('');
    this.textCharactersReverse = [];
    return null;
  }

  protected rightBraceText() {
    this.textCharactersReverse.push(this.character);
  }

  protected leftParenText() {
    this.textCharactersReverse.push(this.character);
  }

  protected forwardSlashText() {
    this.textCharactersReverse.push(this.character);
  }

  protected backwardSlashText() {
    this.textCharactersReverse.push(this.character);
  }

  protected spaceText() {
    this.textCharactersReverse.push(this.character);
  }

  protected queryText() {
    this.textCharactersReverse.push(this.character);
  }

  protected hashText() {
    this.textCharactersReverse.push(this.character);
  }

  protected rightParenText() {
    this.textCharactersReverse.push(this.character);
  }
}
