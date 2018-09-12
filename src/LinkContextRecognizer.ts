import LinkContextRecognizerBase from "./LinkContextRecognizerBase";

export default class LinkContextRecognizer extends LinkContextRecognizerBase {
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

  // @ts-ignore
  private nonTriggerUrl() {
    this.cursor = 'path';
    this.pathCharactersReverse.push(this.character);
  }

  // @ts-ignore
  private leftBraceUrl() {
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
  // @ts-ignore
  private rightBraceUrl() {
    this.cursor = 'transition';
    this.state = LinkContextRecognizerBase.STATE_TEXT;
  }

  // @ts-ignore
  private leftParenUrl() {
    if (this.cursor === null) {
      this.cursor = 'path';
    }

    this.state = LinkContextRecognizerBase.STATE_URL_TRANSITION;
  }

  // @ts-ignore
  private forwardSlashUrl() {
    this.pathComponentsReverse.push(this.pathCharactersReverse.reverse().join(''));
    this.pathCharactersReverse = [];
  }

  // @ts-ignore
  private backwardSlashUrl() {
    throw new Error();
  }

  // @ts-ignore
  private spaceUrl() {
    return null;
  }

  // @ts-ignore
  private queryUrl() {
    // 2 ways lead here - query in fragment & query in path, indistinguishable now, so we assume query and reset to fragment if needed
    this.query = this.pathCharactersReverse.reverse().join('');
    this.pathCharactersReverse = [];
    this.state = LinkContextRecognizerBase.STATE_URL_PRIOR_QUERY;
  }

  // @ts-ignore
  private hashUrl() {
    // Recognized anchor
    this.fragment = this.pathCharactersReverse.reverse().join('');
    this.pathCharactersReverse = [];
    this.state = LinkContextRecognizerBase.STATE_URL_PRIOR_HASH;
  }

  /**
   * Handle the right round bracket (`)`).
   * This means the cursor is outside of the link, e.g.: `[link](path) |`
   */
  // @ts-ignore
  private rightParenUrl() {
    this.cursor = null;
    return null;
  }

  /* URL_TRANSITION */

  // @ts-ignore
  private nonTriggerUrlTransition() {
    // Revert what seemed it will be a transition but ended up not being
    this.state = LinkContextRecognizerBase.STATE_URL;
    this.pathCharactersReverse.push('(', this.character);
  }

  // @ts-ignore
  private leftBraceUrlTransition() {
    throw new Error();
  }

  // @ts-ignore
  private rightBraceUrlTransition() {
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

  // @ts-ignore
  private leftParenUrlTransition() {
    return null;
  }

  // @ts-ignore
  private forwardSlashUrlTransition() {
    return null;
  }

  // @ts-ignore
  private backwardSlashUrlTransition() {
    return null;
  }

  // @ts-ignore
  private spaceUrlTransition() {
    return null;
  }

  // @ts-ignore
  private queryUrlTransition() {
    return null;
  }

  // @ts-ignore
  private hashUrlTransition() {
    return null;
  }

  // @ts-ignore
  private rightParenUrlTransition() {
    return null;
  }

  /* URL_PRIOR_HASH */

  // @ts-ignore
  private nonTriggerUrlPriorHash() {
    this.pathCharactersReverse.push(this.character);
  }

  // @ts-ignore
  private leftBraceUrlPriorHash() {
    throw new Error();
  }

  // @ts-ignore
  private rightBraceUrlPriorHash() {
    throw new Error();
  }

  // @ts-ignore
  private leftParenUrlPriorHash() {
    this.state = LinkContextRecognizerBase.STATE_URL_PRIOR_SLASH_TRANSITION;
  }

  // @ts-ignore
  private forwardSlashUrlPriorHash() {
    this.pathComponentsReverse.push(this.pathCharactersReverse.reverse().join(''));
    this.pathCharactersReverse = [];
    this.state = LinkContextRecognizerBase.STATE_URL_PRIOR_SLASH;
  }

  // @ts-ignore
  private backwardSlashUrlPriorHash() {
    throw new Error();
  }

  // @ts-ignore
  private spaceUrlPriorHash() {
    throw new Error();
  }

  // @ts-ignore
  private queryUrlPriorHash() {
    this.query = this.pathCharactersReverse.reverse().join('');
    this.pathCharactersReverse = [];
    this.state = LinkContextRecognizerBase.STATE_URL_PRIOR_QUERY;
  }

  // @ts-ignore
  private hashUrlPriorHash() {
    throw new Error();
  }

  // @ts-ignore
  private rightParenUrlPriorHash() {
    throw new Error();
  }

  /* URL_PRIOR_QUERY */

  // @ts-ignore
  private nonTriggerUrlPriorQuery() {
    this.pathCharactersReverse.push(this.character);
  }

  // @ts-ignore
  private leftBraceUrlPriorQuery() {
    throw new Error();
  }

  // @ts-ignore
  private rightBraceUrlPriorQuery() {
    throw new Error();
  }

  // @ts-ignore
  private leftParenUrlPriorQuery() {
    this.state = LinkContextRecognizerBase.STATE_URL_PRIOR_QUERY_TRANSITION;
  }

  // @ts-ignore
  private forwardSlashUrlPriorQuery() {
    this.pathComponentsReverse.push(this.pathCharactersReverse.reverse().join(''));
    this.pathCharactersReverse = [];
  }

  // @ts-ignore
  private backwardSlashUrlPriorQuery() {
    throw new Error();
  }

  // @ts-ignore
  private spaceUrlPriorQuery() {
    throw new Error();
  }

  // @ts-ignore
  private queryUrlPriorQuery() {
    this.query = this.pathCharactersReverse.reverse().join('');
    this.pathCharactersReverse = [];
  }

  // @ts-ignore
  private hashUrlPriorQuery() {
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

  // @ts-ignore
  private rightParenUrlPriorQuery() {
    this.pathCharactersReverse.push(this.character);
  }

  /* URL_PRIOR_QUERY_TRANSITION */

  // @ts-ignore
  private nonTriggerUrlPriorQueryTransition() {
    this.state = LinkContextRecognizerBase.STATE_URL_PRIOR_QUERY;
    this.pathCharactersReverse.push('(', this.character);
  }

  // @ts-ignore
  private leftBraceUrlPriorQueryTransition() {
    throw new Error();
  }

  // @ts-ignore
  private rightBraceUrlPriorQueryTransition() {
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

  // @ts-ignore
  private leftParenUrlPriorQueryTransition() {
    throw new Error();
  }

  // @ts-ignore
  private forwardSlashUrlPriorQueryTransition() {
    throw new Error();
  }

  // @ts-ignore
  private backwardSlashUrlPriorQueryTransition() {
    throw new Error();
  }

  // @ts-ignore
  private spaceUrlPriorQueryTransition() {
    throw new Error();
  }

  // @ts-ignore
  private queryUrlPriorQueryTransition() {
    throw new Error();
  }

  // @ts-ignore
  private hashUrlPriorQueryTransition() {
    throw new Error();
  }

  // @ts-ignore
  private rightParenUrlPriorQueryTransition() {
    throw new Error();
  }

  /* URL_PRIOR_SLASH */

  // @ts-ignore
  private nonTriggerUrlPriorSlash() {
    this.pathCharactersReverse.push(this.character);
  }

  // @ts-ignore
  private leftBraceUrlPriorSlash() {
    throw new Error();
  }

  // @ts-ignore
  private rightBraceUrlPriorSlash() {
    throw new Error();
  }

  // @ts-ignore
  private leftParenUrlPriorSlash() {
    this.state = LinkContextRecognizerBase.STATE_URL_PRIOR_SLASH_TRANSITION;
  }

  // @ts-ignore
  private forwardSlashUrlPriorSlash() {
    this.pathComponentsReverse.push(this.pathCharactersReverse.slice().reverse().join(''));
    this.pathCharactersReverse = [];
  }

  // @ts-ignore
  private backwardSlashUrlPriorSlash() {
    throw new Error();
  }

  // @ts-ignore
  private spaceUrlPriorSlash() {
    throw new Error();
  }

  // @ts-ignore
  private queryUrlPriorSlash() {
    throw new Error();
  }

  // @ts-ignore
  private hashUrlPriorSlash() {
    throw new Error();
  }

  // @ts-ignore
  private rightParenUrlPriorSlash() {
    this.pathCharactersReverse.push(this.character);
  }


  /* URL_PRIOR_SLASH_TRANSITION */

  // @ts-ignore
  private nonTriggerUrlPriorSlashTransition() {
    this.state = LinkContextRecognizerBase.STATE_URL_PRIOR_SLASH;
    this.pathCharactersReverse.push('(', this.character);
  }

  // @ts-ignore
  private leftBraceUrlPriorSlashTransition() {
    throw new Error();
  }

  // @ts-ignore
  private rightBraceUrlPriorSlashTransition() {
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

  // @ts-ignore
  private leftParenUrlPriorSlashTransition() {
    throw new Error();
  }

  // @ts-ignore
  private forwardSlashUrlPriorSlashTransition() {
    throw new Error();
  }

  // @ts-ignore
  private backwardSlashUrlPriorSlashTransition() {
    throw new Error();
  }

  // @ts-ignore
  private spaceUrlPriorSlashTransition() {
    throw new Error();
  }

  // @ts-ignore
  private queryUrlPriorSlashTransition() {
    throw new Error();
  }

  // @ts-ignore
  private hashUrlPriorSlashTransition() {
    throw new Error();
  }


  // @ts-ignore
  private rightParenUrlPriorSlashTransition() {
    throw new Error();
  }

  /* TEXT */

  // @ts-ignore
  private nonTriggerText() {
    this.textCharactersReverse.push(this.character);
  }

  // @ts-ignore
  private leftBraceText() {
    this.text = this.textCharactersReverse.slice().reverse().join('');
    this.textCharactersReverse = [];
    return null;
  }

  // @ts-ignore
  private rightBraceText() {
    this.textCharactersReverse.push(this.character);
  }

  // @ts-ignore
  private leftParenText() {
    this.textCharactersReverse.push(this.character);
  }

  // @ts-ignore
  private forwardSlashText() {
    this.textCharactersReverse.push(this.character);
  }

  // @ts-ignore
  private backwardSlashText() {
    this.textCharactersReverse.push(this.character);
  }

  // @ts-ignore
  private spaceText() {
    this.textCharactersReverse.push(this.character);
  }

  // @ts-ignore
  private queryText() {
    this.textCharactersReverse.push(this.character);
  }

  // @ts-ignore
  private hashText() {
    this.textCharactersReverse.push(this.character);
  }

  // @ts-ignore
  private rightParenText() {
    this.textCharactersReverse.push(this.character);
  }
}
