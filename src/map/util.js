import config from '../config';

function propForCat(prop, cat) {
  let [p, ..._] = prop.split('.');
  if (!config.HAS_CATS.includes(p)) {
    return p;
  } else {
    cat = config.CATS_FOR_PROPS[p].reduce((acc, k) => {
      if (Object.keys(cat).includes(k)) {
        acc[k] = cat[k];
      }
      return acc;
    }, {});
    let key = keyForCat(cat);
    return `${p}.${key}`;
  }
}

function keyForCat(cat) {
  return Object.keys(cat)
    .sort((a, b) => a.localeCompare(b))
    .map((k) => `${k}:${cat[k]}`)
    .join('.');
}

function bboxForPlace(loa, place) {
  let url = `assets/maps/${loa}/bboxes/${place}.json`;
  return fetch(url, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    method: 'GET',
  })
    .then(res => res.json())
    .catch(err => { console.log(err) });
}

export default {propForCat, keyForCat, bboxForPlace};
