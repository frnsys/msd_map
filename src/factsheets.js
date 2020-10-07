import config from './config';
import FSMSDMap from './map/factsheetmap';

// Maps
mapboxgl.accessToken = config.MAPBOX_TOKEN;

const maps = {};
maps['a'] = FSMSDMap(config.CD, 'a');
maps['b'] = FSMSDMap(config.CD, 'b');
