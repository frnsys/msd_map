import config from './config';

function propForCat(prop, cat) {
  let p = propNoCat(prop);
  return config.HAS_CATS.includes(p) ? `${p}.${cat}` : p;
}

function propNoCat(prop) {
  // Remove category, if any
  let [p, ..._] = prop.split('.');
  return p;
}

export default { propForCat, propNoCat };
