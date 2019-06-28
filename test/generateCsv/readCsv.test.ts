import readCsv from '../../generateCsv/readCsv';

import assert = require('assert');

describe('readCsv', (): void => {
  it('Shift-JIS 形式の CSV ファイルを読み込み、UTF-8 形式の文字列として返す', async (): Promise<
    void
  > => {
    const result = await readCsv(`${__dirname}/test-data.csv`);
    const lines = result.split('\n');
    assert.deepStrictEqual(lines[0].split(',')[6], `"北海道"`);
    assert.deepStrictEqual(lines[1].split(',')[8], `"旭ケ丘"`);
    assert.deepStrictEqual(lines[2].split(',')[8], `"大通東"`);
  });
});
