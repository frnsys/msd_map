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

export default {propForCat, keyForCat};
