import config from './config';
import MSDMap from './app/map';

// Maps
mapboxgl.accessToken = config.MAPBOX_TOKEN;

const maps = {};
maps['zcta'] = MSDMap(config.zcta);

[...document.querySelectorAll('.map-tab')].forEach((el) => {
  el.addEventListener('click', () => {
    document.querySelector('.map-tab.selected').classList.remove('selected');
    document.querySelector('.map-tab-pane.active').classList.remove('active');
    el.classList.add('selected');
    document.getElementById(`${el.dataset.loa}--map-tab`).classList.add('active');

    // Lazy loading of other maps
    let loa = el.dataset.loa;
    if (!(loa in maps)) {
      maps[loa] = MSDMap(config[loa]);
    }
    maps[loa].map.resize();
  });
});

// Hide UI, for screenshots and whatnot
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
