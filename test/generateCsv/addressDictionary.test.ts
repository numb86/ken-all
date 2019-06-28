/* eslint-disable @typescript-eslint/no-non-null-assertion */
import generateAddressDictionary from '../../generateCsv/addressDictionary';

import assert = require('assert');

// eslint-disable-next-line no-useless-escape
const RAW_DATA = `"01101,\"060  \",\"0600000\",\"ﾎｯｶｲﾄﾞｳ\",\"ｻｯﾎﾟﾛｼﾁｭｳｵｳｸ\",\"\",\"北海道\",\"札幌市中央区\",\"\",0,0,0,0,0,0\r\n01101,\"064  \",\"0640941\",\"ﾎｯｶｲﾄﾞｳ\",\"ｻｯﾎﾟﾛｼﾁｭｳｵｳｸ\",\"ｱｻﾋｶﾞｵｶ\",\"北海道\",\"札幌市中央区\",\"旭ケ丘\",0,0,1,0,0,0\r\n01101,\"060  \",\"0600041\",\"ﾎｯｶｲﾄﾞｳ\",\"ｻｯﾎﾟﾛｼﾁｭｳｵｳｸ\",\"ｵｵﾄﾞｵﾘﾋｶﾞｼ\",\"北海道\",\"札幌市中央区\",\"大通東\",0,0,1,0,0,0\r\n"`;

describe('addressDictionary', (): void => {
  describe('generateAddressDictionary', (): void => {
    it('複数行のテキストデータをもとに AddressDictionary を作る', (): void => {
      const result = generateAddressDictionary(RAW_DATA);

      assert.deepStrictEqual(result instanceof Map, true);

      assert.deepStrictEqual(result.get('060')!.length, 2);
      assert.deepStrictEqual(result.get('064')!.length, 1);

      assert.deepStrictEqual(result.get('060')![0][1], '北海道');
      assert.deepStrictEqual(result.get('060')![1][3], '大通東');
      assert.deepStrictEqual(result.get('064')![0][0], '0941');
      assert.deepStrictEqual(result.get('064')![0][3], '旭ケ丘');
    });
  });
});
