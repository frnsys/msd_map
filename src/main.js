import Map from './map';
import util from './util';
import info from './info';
import Legend from './legend';
import config from './config';


const state = {
  props: config.INITIAL_PROPS,
  cat: config.INITIAL_CAT
};
const map = new Map(state.props, (features) => {
  // If features, render
  if (Object.keys(features).length > 0) {
    if (features[config.SOURCE]) {
      let feat = features[config.SOURCE];
      map.focusFeature(feat);
      legend.renderFeature(feat);
      if (features[config.SCHOOLS_SOURCE]) {
        console.log(feat);
        info.explainFeature(feat, state.cat, features[config.SCHOOLS_SOURCE]);
      } else {
        info.explainFeature(feat, state.cat);
      }
    }

  // Otherwise, hide
  } else {
    info.hide();
    legend.hideFeature();
  }
});
const legend = new Legend(map, state.props);

// Jump to zipcode
const zipcodeInput = document.querySelector('#control input[name=zipcode]');
zipcodeInput.addEventListener('input', (ev) => {
  map.goToZipcode(ev.target.value, (feat) => {
    map.focusFeature(feat);
    info.explainFeature(feat, state.cat);
    legend.renderFeature(feat);
  });
});

// Toggle displayed property
const propertyAInput = document.querySelector('#control select[name=propertyA]');
const propertyBInput = document.querySelector('#control select[name=propertyB]');
const categoryInput = document.querySelector('#control select[name=category]');
Object.keys(config.COLORS).forEach((property) => {
  let opt = document.createElement('option');
  opt.innerText = config.DESCS[property];
  opt.value = property;
  propertyAInput.appendChild(opt);
  if (property == state.props[0]) {
    opt.selected = true;
  }

  opt = opt.cloneNode(true);
  propertyBInput.appendChild(opt);
  if (property == state.props[1]) {
    opt.selected = true;
  }
});
Object.keys(config.CATS).forEach((cat) => {
  let opt = document.createElement('option');
  opt.innerText = config.CATS[cat];
  opt.value = cat;
  categoryInput.appendChild(opt);
  if (cat == state.cat) {
    opt.selected = true;
  }
});

// To set to univariate
let opt = document.createElement('option');
opt.innerText = 'None';
opt.value = '';
propertyBInput.appendChild(opt);

propertyAInput.addEventListener('change', (ev) => {
  state.props[0] = util.propForCat(ev.target.value, state.cat);
  map.set(state.props);
  legend.set(state.props);
});
propertyBInput.addEventListener('change', (ev) => {
  state.props[1] = util.propForCat(ev.target.value, state.cat);
  map.set(state.props);
  legend.set(state.props);
});
categoryInput.addEventListener('change', (ev) => {
  state.cat = ev.target.value;
  state.props = state.props.map((p) => util.propForCat(p, state.cat));
  map.set(state.props);
  legend.set(state.props);
});
