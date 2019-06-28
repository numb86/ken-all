export type Address = [string, string, string, string];
export type AddressDictionary = Map<string, Address[]>;

const getPostCodeFront = (csvLineArray: string[]): string => {
  const postCode = csvLineArray[2].replace(/"/g, '');
  return postCode.slice(0, 3);
};

const generateAddressFromCsvLine = (csvLineArray: string[]): Address => {
  const postCode = csvLineArray[2].replace(/"/g, '');
  const postCodeBack = postCode.slice(3);
  const prefecture = csvLineArray[6].replace(/"/g, '');
  const city = csvLineArray[7].replace(/"/g, '');
  const town = csvLineArray[8].replace(/"/g, '');
  return [postCodeBack, prefecture, city, town];
};

const generateAddressDictionary = (rawData: string): AddressDictionary => {
  const lines = rawData.split('\n');

  const dictionary = new Map<string, Address[]>([]);

  lines.forEach((line: string): void => {
    const lineArray = line.split(',');
    if (lineArray.length > 1) {
      const address = generateAddressFromCsvLine(lineArray);
      const postCodeFront = getPostCodeFront(lineArray);
      const currentDictionaryValue = dictionary.get(postCodeFront) || [];
      currentDictionaryValue.push(address);
      dictionary.set(postCodeFront, currentDictionaryValue);
    }
  });

  return dictionary;
};

export default generateAddressDictionary;
