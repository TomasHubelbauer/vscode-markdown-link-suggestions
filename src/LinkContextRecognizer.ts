// TODO: Test cases like: a [b (c) d [e]](./f/g(h)/i/j.k#l-m-(n)-o.p/q/r/s?tuvwxyz
export default class LinkContextRecognizer extends LinkContextRecognizerBase {
  private urlCharactersReverse: string[] = [];
  private pathComponentsReverse: string[] = [];

  public anchor: string = '';

  constructor(line: string, index: number) {
    super(line, index);
    // TODO: Last step turning draft fields (private) to real fields (public) after parsing
  }

  private hashUrl() {
    // Recognized anchor
    this.anchor = this.urlCharactersReverse.reverse().join('');
    this.urlCharactersReverse = [];
    this.state = LinkContextRecognizerBase.STATE_URL_PRIOR_HASH;
  }

  private leftParenUrl() {
    this.state = LinkContextRecognizerBase.STATE_URL_TRANSITION;
  }

  private rightParenUrl() {
    this.urlCharactersReverse.push(this.character);
  }

  private leftBraceUrl() {
    debugger;
  }

  private rightBraceUrl() {
    debugger;
  }

  private slashUrl() {
    debugger;
  }

  private spaceUrl() {
    debugger;
  }

  private nonTriggerUrl() {
    this.urlCharactersReverse.push(this.character);
  }

  private hashUrlTransition() {
    debugger;
  }

  private leftParenUrlTransition() {
    debugger;
  }

  private rightParenUrlTransition() {
    debugger;
  }

  private leftBraceUrlTransition() {
    debugger;
  }

  private rightBraceUrlTransition() {
    debugger;
  }

  private slashUrlTransition() {
    debugger;
  }

  private spaceUrlTransition() {
    debugger;
  }

  private nonTriggerUrlTransition() {
    // Revert what seemed it will be a transition but ended up not being
    this.state = LinkContextRecognizerBase.STATE_URL;
    this.urlCharactersReverse.push('(', this.character);
  }

  private hashUrlPriorHash() {
    debugger;
  }

  private leftParenUrlPriorHash() {
    debugger;
  }

  private rightParenUrlPriorHash() {
    debugger;
  }

  private leftBraceUrlPriorHash() {
    debugger;
  }

  private rightBraceUrlPriorHash() {
    debugger;
  }

  private slashUrlPriorHash() {
    this.pathComponentsReverse.push(this.urlCharactersReverse.reverse().join(''));
    this.urlCharactersReverse = [];
    this.state = LinkContextRecognizerBase.STATE_URL_PRIOR_SLASH;
  }

  private spaceUrlPriorHash() {
    debugger;
  }

  private nonTriggerUrlPriorHash() {
    this.urlCharactersReverse.push(this.character);
  }

  private hashUrlPriorSlash() {
    debugger;
  }

  private leftParenUrlPriorSlash() {
    this.state = LinkContextRecognizerBase.STATE_URL_PRIOR_SLASH_TRANSITION;
  }

  private rightParenUrlPriorSlash() {
    this.urlCharactersReverse.push(this.character);
  }

  private leftBraceUrlPriorSlash() {
    debugger;
  }

  private rightBraceUrlPriorSlash() {
    debugger;
  }

  private slashUrlPriorSlash() {
    this.pathComponentsReverse.push(this.urlCharactersReverse.reverse().join(''));
    this.urlCharactersReverse = [];
  }

  private spaceUrlPriorSlash() {
    debugger;
  }

  private nonTriggerUrlPriorSlash() {
    this.urlCharactersReverse.push(this.character);
  }

  private hashUrlPriorSlashTransition() {
    debugger;
  }

  private leftParenUrlPriorSlashTransition() {
    debugger;
  }

  private rightParenUrlPriorSlashTransition() {
    debugger;
  }

  private leftBraceUrlPriorSlashTransition() {
    debugger;
  }

  private rightBraceUrlPriorSlashTransition() {
    debugger;
  }

  private slashUrlPriorSlashTransition() {
    debugger;
  }

  private spaceUrlPriorSlashTransition() {
    debugger;
  }

  private nonTriggerUrlPriorSlashTransition() {
    this.state = LinkContextRecognizerBase.STATE_URL_PRIOR_SLASH;
    this.urlCharactersReverse.push('(', this.character);
  }
}
