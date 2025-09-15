import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import KenAll from '../../esm/index.js';

describe('Ken All スモークテスト（本番環境）', () => {
  describe('主要都市の郵便番号', () => {
    const testCases = [
      {
        code: '1000004',
        description: '東京・大手町',
        expected: { prefecture: '東京都', city: '千代田区', town: '大手町' }
      },
      {
        code: '5300001',
        description: '大阪・梅田',
        expected: { prefecture: '大阪府', city: '大阪市北区', town: '梅田' }
      },
      {
        code: '4600008',
        description: '名古屋・栄',
        expected: { prefecture: '愛知県', city: '名古屋市中区', town: '栄' }
      },
      {
        code: '0600000',
        description: '札幌市中央区',
        expected: { prefecture: '北海道', city: '札幌市中央区', town: '' }
      },
      {
        code: '8100001',
        description: '福岡・天神',
        expected: { prefecture: '福岡県', city: '福岡市中央区', town: '天神' }
      }
    ];

    testCases.forEach(({ code, description, expected }) => {
      test(`${description}（${code}）を正しく取得できる`, async () => {
        const result = await KenAll(code);

        assert.ok(result.length > 0, `郵便番号 ${code} の結果が空`);

        const [prefecture, city, town] = result[0];
        assert.equal(prefecture, expected.prefecture);
        assert.equal(city, expected.city);
        assert.equal(town, expected.town);
      });
    });
  });

  describe('エッジケース', () => {
    test('存在しない郵便番号は空配列を返す', async () => {
      const result = await KenAll('9999999');
      assert.deepEqual(result, []);
    });

    test('複数の住所が紐づく郵便番号を処理できる', async () => {
      // 4980000は愛知県弥富市と三重県桑名郡木曽岬町にまたがる
      const result = await KenAll('4980000');
      assert.equal(result.length, 2, '2つの住所が返されるべき');

      const prefectures = result.map(addr => addr[0]);
      assert.ok(prefectures.includes('愛知県'));
      assert.ok(prefectures.includes('三重県'));
    });
  });

  describe('エラーハンドリング', () => {
    test('文字を含む郵便番号はエラーをthrowする', async () => {
      await assert.rejects(
        () => KenAll('abc1234'),
        {
          name: 'Error',
          message: 'The post code is always seven digits half-width numbers.'
        }
      );
    });

    test('桁数不足の郵便番号はエラーをthrowする', async () => {
      await assert.rejects(
        () => KenAll('123'),
        {
          name: 'Error',
          message: 'The post code is always seven digits half-width numbers.'
        }
      );
    });

    test('桁数超過の郵便番号はエラーをthrowする', async () => {
      await assert.rejects(
        () => KenAll('12345678'),
        {
          name: 'Error',
          message: 'The post code is always seven digits half-width numbers.'
        }
      );
    });

    test('全角数字の郵便番号はエラーをthrowする', async () => {
      await assert.rejects(
        () => KenAll('１２３４５６７'),
        {
          name: 'Error',
          message: 'The post code is always seven digits half-width numbers.'
        }
      );
    });

    test('存在しないCSVファイル（999で始まる）は空配列を返す', async () => {
      const result = await KenAll('9990000');
      assert.deepEqual(result, []);
    });
  });

  describe('ネットワークとCDN', () => {
    test('CDNから高速にレスポンスが返る（1秒以内）', async () => {
      const start = Date.now();
      await KenAll('1000004');
      const elapsed = Date.now() - start;

      assert.ok(elapsed < 1000, `レスポンスが遅い: ${elapsed}ms`);
    });

    test('連続リクエストでも安定して動作する', async () => {
      const codes = ['1000004', '5300001', '4600008'];
      const results = await Promise.all(codes.map(code => KenAll(code)));

      results.forEach((result, index) => {
        assert.ok(result.length > 0, `${codes[index]} の結果が取得できない`);
      });
    });
  });
});
