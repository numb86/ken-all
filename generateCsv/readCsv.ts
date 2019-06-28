const {promisify} = require('util');
const fs = require('fs');
// eslint-disable-next-line import/no-extraneous-dependencies
const iconv = require('iconv-lite');

const readCsv = async (path: string): Promise<string> => {
  const buf: Buffer = await promisify(fs.readFile)(path);
  return iconv.decode(buf, 'shiftjis');
};
export default readCsv;
