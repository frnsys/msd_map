import config from './config';
import FSMSDMap from './map/factsheetmap';

// Maps
mapboxgl.accessToken = config.MAPBOX_TOKEN;

const maps = {};
maps['a'] = FSMSDMap(config.CD, 'a');
maps['b'] = FSMSDMap(config.CD, 'b');

document.getElementById('a--map').addEventListener('mouseleave', () => {
  document.getElementById('a--map-tooltip').style.display = 'none';
});
document.getElementById('b--map').addEventListener('mouseleave', () => {
  document.getElementById('b--map-tooltip').style.display = 'none';
});


maps['a'].map.resize();
maps['b'].map.resize();
