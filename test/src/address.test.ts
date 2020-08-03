import assert from 'power-assert';

import {
  generateAddressListFromText,
  extractTargetAddress,
  normalizeAddressList,
} from '../../src/address';

type Address = [string, string, string, string];

const RAW_DATE = `"0000","愛知県","弥富市",""
"0060","愛知県","弥富市","曙"
"0053","愛知県","弥富市","稲狐町"
`;

describe('address', (): void => {
  let addressList: Address[];
  beforeEach((): void => {
    const firstAddress: Address = ['0004', '東京都', '千代田区', '大手町'];
    const secondAddress: Address = ['0014', '東京都', '千代田区', '永田町'];
    const thirdAddress: Address = ['0000', '愛知県', '弥富市', ''];
    const fourthAddress: Address = ['0000', '三重県', '桑名郡木曽岬町', ''];
    addressList = [firstAddress, secondAddress, thirdAddress, fourthAddress];
  });

  describe('generateAddressListFromText', (): void => {
    it('複数行のテキストデータから Address のリストを作成する', (): void => {
      const result = generateAddressListFromText(RAW_DATE);

      assert.deepStrictEqual(result.length, 3);
      assert.deepStrictEqual(result[0][0], '0000');
      assert.deepStrictEqual(result[0][1], '愛知県');
      assert.deepStrictEqual(result[0][2], '弥富市');
      assert.deepStrictEqual(result[0][3], '');

      assert.deepStrictEqual(result[1][0], '0060');
      assert.deepStrictEqual(result[1][1], '愛知県');
      assert.deepStrictEqual(result[1][2], '弥富市');
      assert.deepStrictEqual(result[1][3], '曙');

      assert.deepStrictEqual(result[2][0], '0053');
      assert.deepStrictEqual(result[2][1], '愛知県');
      assert.deepStrictEqual(result[2][2], '弥富市');
      assert.deepStrictEqual(result[2][3], '稲狐町');
    });
  });

  describe('extractTargetAddress', (): void => {
    it('Address の先頭の要素をキーにして、Address のリストから該当するものを返す', (): void => {
      let result = extractTargetAddress('0004', addressList);
      assert.deepStrictEqual(result.length, 1);
      assert.deepStrictEqual(result[0][3], '大手町');

      result = extractTargetAddress('0014', addressList);
      assert.deepStrictEqual(result.length, 1);
      assert.deepStrictEqual(result[0][3], '永田町');

      result = extractTargetAddress('0000', addressList);
      assert.deepStrictEqual(result.length, 2);
      assert.deepStrictEqual(result[0][1], '愛知県');
      assert.deepStrictEqual(result[1][1], '三重県');
    });

    it('該当する Address がない場合は空の配列を返す', (): void => {
      const result = extractTargetAddress('0099', addressList);
      assert.deepStrictEqual(result.length, 0);
    });
  });

  describe('normalizeAddressList', (): void => {
    it('渡された配列に入っている Address から、先頭の要素を削除する', (): void => {
      const result = normalizeAddressList(addressList);

      result.forEach((address: string[]): void => {
        assert.deepStrictEqual(address.length, 3);
      });
      assert.deepStrictEqual(result[0][0], '東京都');
      assert.deepStrictEqual(result[0][1], '千代田区');
      assert.deepStrictEqual(result[0][2], '大手町');
    });
  });
});
