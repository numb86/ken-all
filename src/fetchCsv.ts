const fetchCsv = (postCodeFront: string): Promise<Response> =>
  fetch(`https://ken-all.numb86.net/csv/${postCodeFront}.csv`);

export default fetchCsv;
