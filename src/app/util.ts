import CATS_FOR_PROPS from 'data/gen/prop_cats.json';

function keyParts(propWithCat: string) {
  let [p, ...catKey] = propWithCat.split('.');
  return [p, catKey.join('.')];
}

function propForCat(prop: string, cat: Category) {
  let [p, ..._] = prop.split('.');
  if (!(p in CATS_FOR_PROPS)) {
    return p;
  } else {
    cat = (CATS_FOR_PROPS as PropCategories)[p]
      .reduce((acc, k) => {
        if (Object.keys(cat).includes(k)) {
          acc[k] = cat[k];
        }
        return acc;
      }, {} as Category);
    let key = keyForCat(cat);
    return `${p}.${key}`;
  }
}

function keyForCat(cat: Category) {
  return Object.keys(cat)
    .sort((a, b) => a.localeCompare(b))
    .map((k) => `${k}:${cat[k]}`)
    .join('.');
}

// Generate all category combinations
function allCategories(cats: {[catKey:string]: {[catVal:string]: string}}) {
  let combos: Category[] = [];
  Object.keys(cats).forEach((k) => {
    let vals = Object.keys(cats[k]);
    if (combos.length > 0) {
      combos = combos.flatMap((c: Category) => {
        return vals.map((val) => ({...c, [k]: val}));
      });
    } else {
      combos = vals.map((val) => ({[k]: val}));
    }
  });
  return combos;
}

async function bboxForPlace(loa: string, placeId: string) {
  let url = `assets/maps/${loa}/bboxes/${placeId}.json`;
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

export default {propForCat, keyForCat, keyParts, allCategories, bboxForPlace};
