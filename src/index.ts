export class HashgraphNames {
  text: string;
  constructor(text: string) {
    this.text = text;
  }

  printMsg() {
    // eslint-disable-next-line no-console
    console.log(this.text);
  }
}

export const otherPrintFunc = () => {
  // eslint-disable-next-line no-console
  console.log('ASDF');
};