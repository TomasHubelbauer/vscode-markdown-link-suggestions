import LinkContextRecognizer from "../LinkContextRecognizer";

export default function ({ textCharactersReverse }: LinkContextRecognizer, character: string) {
  textCharactersReverse.push(character);
}
