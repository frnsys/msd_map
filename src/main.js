import Map from './map';
import info from './info';
import Legend from './legend';
import config from './config';

const legend = new Legend(config.INITIAL_PROPS);
const map = new Map(config.INITIAL_PROPS, (features) => {
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

// Jump to zipcode
let zipcodeInput = document.querySelector('#control input[name=zipcode]');
zipcodeInput.addEventListener('input', (ev) => {
  map.goToZipcode(ev.target.value, (feat) => {
    map.focusFeature(feat);
    info.explainFeature(feat);
    legend.renderFeature(feat);
  });
});

// Toggle displayed property
let propertyInput = document.querySelector('#control select[name=property]');
Object.keys(config.COLORS).forEach((property) => {
  let opt = document.createElement('option');
  opt.innerText = config.DESCS[property];
  opt.value = property;
  propertyInput.appendChild(opt);
});
propertyInput.addEventListener('change', (ev) => {
  let prop = ev.target.value;
  map.set([prop]);
  legend.set([prop]);
});
