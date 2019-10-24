import config from './config';

function propForCat(prop, cat) {
  let [p, ..._] = prop.split('.');
  return config.HAS_CATS.includes(p) ? `${p}.${cat}` : p;
}

export default {propForCat};
