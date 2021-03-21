// eslint-disable-next-line no-global-assign
Promise = undefined;

const KenAll = require('ken-all').default;

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
