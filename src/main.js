import config from './config';
import MSDMap from './map/msd';

// Maps
mapboxgl.accessToken = config.MAPBOX_TOKEN;

const maps = {};
maps['zcta'] = MSDMap(config.ZCTA);

[...document.querySelectorAll('.map-tab')].forEach((el) => {
  el.addEventListener('click', () => {
    if (el.dataset.tab == 'comparisons') {
      window.open('./factsheets', '_blank');
    } else {
      document.querySelector('.map-tab.selected').classList.remove('selected');
      document.querySelector('.map-tab-pane.active').classList.remove('active');
      el.classList.add('selected');
      document.getElementById(`${el.dataset.tab}--map-tab`).classList.add('active');

      // Lazy loading of CD map
      if (el.dataset.tab == 'cd' && !('cd' in maps)) {
        maps['cd'] = MSDMap(config.CD);
      }
      maps[el.dataset.tab].map.resize();
    }
  });
});

window.hideUI = () => {
  ['.icon-legend', '.icon-legend-show',
    '.map-regions', '.info', '.mapboxgl-control-container',
    'header'].forEach((sel) => {
      [...document.querySelectorAll(sel)].forEach((el) => {
        el.parentNode.removeChild(el);
      });
    });
  [...document.querySelectorAll('.stage')].forEach((el) => el.style.height = '100vh');
  maps['cd'].map.resize();
  maps['zcta'].map.resize();
}

// Add a label to the map, e.g. for creating screenshots/gifs
window.labelMap = (label) => {
  let div = document.getElementById('map-label');
  if (!div) {
    div = document.createElement('div');
    div.id = 'map-label';
    div.style.position = 'fixed';
    div.style.bottom = '0em';
    div.style.right = '0.5em';
    div.style.fontSize = '4em';
    div.style.fontFamily = 'Founders Grotesk';
    div.style.fontWeight = '600';
    document.body.appendChild(div);
  }
  div.innerText = label;
}
