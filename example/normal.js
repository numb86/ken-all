const beforePromise = Promise;

const KenAll = require('ken-all').default;

const afterPromise = Promise;

if (beforePromise !== afterPromise) {
  throw new Error(
    'ken-all の読み込みによって組み込みの Promise が書き換わってしまっている'
  );
}

// [ [ '東京都', '千代田区', '永田町' ] ]
KenAll('1000014')
  .then((res) => {
    const prefecture = res[0][0];
    if (prefecture !== '東京都') {
      throw new Error('期待したデータが取得されていない');
    }
    console.log('ok!');
  })
  .catch((error) => {
    throw new Error(error);
  });
