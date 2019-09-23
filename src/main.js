import Map from './map';
import info from './info';
import Legend from './legend';
import config from './config';

const state = {
  props: config.INITIAL_PROPS
};
const map = new Map(state.props, (features) => {
  // If features, render
  if (Object.keys(features).length > 0) {
    if (features[config.SOURCE]) {
      let feat = features[config.SOURCE];
      map.focusFeature(feat);
      info.explainFeature(feat);
      legend.renderFeature(feat);
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
    info.explainFeature(feat);
    legend.renderFeature(feat);
  });
});

// Toggle displayed property
const propertyAInput = document.querySelector('#control select[name=propertyA]');
const propertyBInput = document.querySelector('#control select[name=propertyB]');
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

// To set to univariate
let opt = document.createElement('option');
opt.innerText = 'None';
opt.value = '';
propertyBInput.appendChild(opt);

propertyAInput.addEventListener('change', (ev) => {
  state.props[0] = ev.target.value;
  map.set(state.props);
  legend.set(state.props);
});
propertyBInput.addEventListener('change', (ev) => {
  state.props[1] = ev.target.value;
  map.set(state.props);
  legend.set(state.props);
});
