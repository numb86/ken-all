const Promise = require('es6-promise');
const {fetch} = require('fetch-ponyfill')(Promise);

global.Promise = Promise;

const fetchCsv = (postCodeFront: string): Promise<Response> =>
  fetch(`https://ken-all.numb86.net/csv/${postCodeFront}.csv`);

export default fetchCsv;
