import config from './config';

function propForCat(prop, cat) {
  let [p, ..._] = prop.split('.');
  let key = keyForCat(cat);
  return config.HAS_CATS.includes(p) ? `${p}.${key}` : p;
}

function keyForCat(cat) {
  return Object.keys(cat)
    .sort((a, b) => a.localeCompare(b))
    .map((k) => `${k}:${cat[k]}`)
    .join('.');
}

function schoolsForZip(zip) {
  let url = `assets/zip_schools/${zip}.json`;
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

function bboxForZip(zip) {
  let url = `assets/bboxes/${zip}.json`;
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

export default {propForCat, keyForCat, schoolsForZip, bboxForZip};
