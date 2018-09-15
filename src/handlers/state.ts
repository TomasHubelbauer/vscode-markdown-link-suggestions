import LinkContextRecognizer from "../LinkContextRecognizer.g";

// Keeps state in a \`WeekMap\` keyed by \`LinkContextRecognizer\` because while \`LinkContextRecognizer\` is instantiated on demand, its \`import\`ed modules only once when bundled and first parsed
export default class State<T> extends WeakMap<LinkContextRecognizer, T | undefined> {
  private readonly initial: T | undefined;

  public constructor(initial?: T) {
    super();
    this.initial = initial;
  }

  public for(self: LinkContextRecognizer): T {
    if (!this.has(self)) {
      this.set(self, this.initial);
    }

    return this.get(self)!;
  }
}
