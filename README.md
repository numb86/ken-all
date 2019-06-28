<div align="center">
<h1>Ken All</h1>
</div>

Ken All は、郵便番号で住所を検索できる npm パッケージです。

![npm](https://badge.fury.io/js/ken-all.svg)
[![CircleCI](https://circleci.com/gh/numb86/ken-all.svg?style=svg)](https://circleci.com/gh/numb86/ken-all)
[![MIT license](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

```js
import KenAll from 'ken-all';

// [['東京都', '千代田区', '大手町']];
KenAll('1000004').then(res => console.log(res));
```

# 導入方法

```
$ npm install ken-all
```

もしくは

```
$ yarn add ken-all
```

# 使い方

`import`した`KenAll`に、7桁半角数字の**文字列**を渡します。  

```js
import KenAll from 'ken-all';

// [['東京都', '千代田区', '大手町']];
KenAll('1000004').then(res => console.log(res));
```

返り値は、以下の値を持つ`promise`オブジェクトです。

```js
[
  ['都道府県', '市区町村', '町域'],
  ['都道府県', '市区町村', '町域'],
  // ...
]
```

```js
// [["愛知県", "弥富市", ""], ["三重県", "桑名郡木曽岬町", ""]]
KenAll('4980000').then(res => console.log(res));
```

該当する住所がない場合は、空の配列を返します。

```js
// []
KenAll('9009999').then(res => console.log(res));
```

型定義ファイルも同梱しているので、TypeScript アプリでも利用することが出来ます。

# サンプル

＊以下のサンプルは、シンプルにするために複数の住所が返ってきたケースを考慮していません

## React （バージョン`16.8.6`で確認）

```js
import React, {useState} from 'react';
import ReactDOM from 'react-dom';
import KenAll from 'ken-all';

const App = () => {
  const [postCode, setPostCode] = useState('');
  const [address, setAddress] = useState('');

  return (
    <>
      <input
        type="text"
        value={postCode}
        onChange={e => {
          const inputValue = e.currentTarget.value;
          setPostCode(inputValue);
          if (inputValue.length === 7) {
            KenAll(inputValue).then(res => {
              if (res.length === 0) {
                setAddress('該当する住所はありません');
              } else {
                setAddress(res[0].join(' '));
              }
            });
          }
        }}
        maxLength={7}
      />
      <p>{address}</p>
    </>
  );
};

ReactDOM.render(<App />, document.querySelector('#app'));
```

## Vue （バージョン`2.6.10`で確認）

エントリポイント。

```js
import Vue from 'vue';

import App from './components/App.vue';

document.addEventListener('DOMContentLoaded', () => {
  new Vue({
    render: h => h(App),
  }).$mount('#app');
});
```

コンポーネント。

```js
<template>
  <div>
    <input
      v-model="postCode"
      maxlength="7"
      @keyup="onChange"
    />
    <p>{{ this.address }}</p>
  </div>
</template>

<script>
import KenAll from 'ken-all';

export default {
  data() {
    return {
      postCode: '',
      address: '',
    };
  },
  methods: {
    onChange() {
      if (this.postCode.length === 7) {
        KenAll(this.postCode).then(res => {
          if (res.length === 0) {
            this.address = '該当する住所はありません';
          } else {
            this.address = res[0].join(' ');
          }
        });
      }
    },
  },
};
</script>
```

## Node.js （バージョン`8.16.0`で確認）

```js
const KenAll = require('ken-all').default;

// [ [ '東京都', '千代田区', '永田町' ] ]
KenAll('1000014').then(res => console.log(res));
```

# 元データ

株式会社アイビス様が提供している「郵便番号データ（加工済バージョン）」を再加工して利用しています。  
http://zipcloud.ibsnet.co.jp/
