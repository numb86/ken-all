import generateAddressDictionary, {
  Address,
  AddressDictionary,
} from './addressDictionary';
import readCsv from './readCsv';

const fs = require('fs').promises;

const CSV_OUTPUT_PATH = './docs/csv/';

const createCsvContent = (addressList: Address[]): string => {
  let result = '';

  addressList.forEach((address: Address): void => {
    const line = `${address
      .map((item: string): string => `"${item}"`)
      .join(',')}\n`;
    result += line;
  });

  return result;
};

const writeCsv = (dictionary: AddressDictionary): void => {
  const promiseList: Promise<void>[] = [];

  dictionary.forEach((value: Address[], key: string): void => {
    const content = createCsvContent(value);
    promiseList.push(fs.writeFile(`${CSV_OUTPUT_PATH}${key}.csv`, content));
  });

  /* eslint-disable no-console */
  Promise.all(promiseList)
    .then((): void => console.log('generated.'))
    .catch((err: Error): void => console.log(err));
  /* eslint-enable no-console */
};

const main = async (): Promise<void> => {
  const encodedRawData = await readCsv('./generateCsv/master-data.csv');
  const dictionary = generateAddressDictionary(encodedRawData);
  writeCsv(dictionary);
};

main();
