import Map from '../lib/map';
import Legend from '../lib/legend';
import Painter from '../lib/paint';
import util from './util';
import styles from './styles';
import SchoolDB from './db';
import color from '../lib/color';
import fipsToState from '../../data/fipsToState.json';
import bboxes from '../../data/gen/fipsToBbox.json';
import regions from '../../data/gen/regions.json';
import districtCounts from '../../data/districtCounts.json';

const EMPTY_COLOR = '#E2E0E6';

const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const defaultStyle = {
  'fill-color': '#000000', // will be replaced on map initialization

  // Fade-out feature outlines at low zooms
  'fill-outline-color': [
    'interpolate', ['linear'], ['zoom'], 2, 'rgba(0, 0, 0, 0)', 8, 'rgba(0,0,0,0.5)'
  ],

  'fill-opacity': [
    'case',
      ['boolean', ['feature-state', 'mute'], false],
        0.2,
      1.0
  ]
};

// For district screenshots
function rangeFocus(prop, statefp) {
  return [
    'case',

    ['!=', ['get', 'STATEFP'], statefp],
      '#333333',

    // Hide bodies of water "districts" (with the district code ZZ)
    ['==', ['slice', ['get', 'loa_key'], 2], 'ZZ'],
      EMPTY_COLOR,

    ['interpolate', ['linear'], ['get', prop.key]].concat(gradientToStyle(prop.color, prop.range))
  ];
}

function focusStateFP(map, state, statefp) {
  let paint = rangeFocus(...state.props, statefp);
  map.map.setPaintProperty(
    'main',
    'fill-color',
    paint);
}

function rangeFocusDistrict(prop, statefp, loakey) {
  return [
    'case',

    ['!=', ['get', 'STATEFP'], statefp],
      '#333333',

    // Hide bodies of water "districts" (with the district code ZZ)
    ['==', ['slice', ['get', 'loa_key'], 2], 'ZZ'],
      EMPTY_COLOR,

    ['in', loakey, ['get', 'loa_key']],
      ['interpolate', ['linear'], ['get', prop.key]].concat(gradientToStyle(prop.color, prop.range)),

    ['interpolate', ['linear'], ['get', prop.key]].concat(gradientToStyle(prop.color, prop.range, 0.5))
  ];
}

function focusStateDistrictFP(map, state, statefp, loakey) {
  let paint = rangeFocusDistrict(...state.props, statefp, loakey);
  map.map.setPaintProperty(
    'main',
    'fill-color',
    paint);
}

function FSMSDMap(config, mapId, showData) {
  const loa = config.LOA;
  const state = config.INITIAL_STATE;
  const tooltip = document.getElementById(`${mapId}--map-tooltip`);

  // If a state is focused
  state.focused = null;

  config.prefix = '..';
  const db = new SchoolDB(config);

  // Hack to "hide" parts of states
  // that encompass bodies of water
  Object.keys(config.PROPS).forEach((k) => {
    if (k.startsWith('STU_TOT_BAL')) {
      config.PROPS[k].nullColor = EMPTY_COLOR;
    }
  });

  const dataLayerName = 'data';
  const sources = {
    'main': {
      'type': 'vector',
      'url': `mapbox://${config.MAP_ID}`
    },
    'states': {
      'type': 'vector',
      'url': 'mapbox://mapbox.mapbox-streets-v8'
    }
  };
  const layers = [{
    'id': 'main',
    'type': 'fill',
    'source': 'main',
    'source-layer': dataLayerName,
    'paint': defaultStyle
  }, {
    'id': 'states',
    'type': 'line',
    'source': 'states',
    'source-layer': 'admin',
    'filter': ["all", ["==", "admin_level", 1], ["==", "iso_3166_1", "US"]],
    'paint': {
      'line-color': '#111111',
      'line-width': 0.5
    }
  }];

  // Jump to focus national button
  const nationalFocusButton = document.getElementById(`${mapId}--national`);
  nationalFocusButton.addEventListener('click', () => {
    focusFeatures({main: []});
  });

  function focusFeatures(features, ev) {
    let name = 'National';
    let meta = '&nbsp;';
    let bbox = regions['Mainland'];
    let fit = true;
    if (features['main'].length > 0) {
      let feature = features['main'][0];
      let statefp = feature.properties['STATEFP']
      let stateName = fipsToState[statefp];
      name = stateName;
      bbox = bboxes[statefp];
      let nDistricts = districtCounts[stateName];
      meta = `Congressional Districts: ${nDistricts}`;
      if (statefp == state.focused) {
        // Already focused on state, focus on district
        let loa_keys = feature.properties['loa_key'].split(',');
        let loa_key = loa_keys[0];
        let district_code = loa_key.slice(2);
        fit = false;
        if (district_code != 'ZZ') {
          name = `${name}, District ${district_code}`;
          focusStateDistrictFP(map, state, statefp, loa_key);
        } else {
          focusStateFP(map, state, statefp);
        }
      } else {
        focusStateFP(map, state, statefp);
      }
      showData(name, meta);
      state.focused = statefp;

      nationalFocusButton.style.display = 'block';
    } else {
      // Reset
      map.set('main', state.props);
      state.focused = null;
      showData(name, meta);
      nationalFocusButton.style.display = 'none';
    }

    if (fit) {
      map.fitBounds(bbox);
    }
  }

  const painter = new Painter(config.COLORS);
  const map = new Map({
    container: `${mapId}--map`,
    style: 'mapbox://styles/jfift/ckkfrwny700zc17pdajfucczo',
    zoom: 3.5,
    maxZoom: 12,
    minZoom: 2,
    preserveDrawingBuffer: true,
    center: [-98.5556199, 39.8097343]
  }, sources, layers, {'main': state.props}, painter, focusFeatures, (features, ev) => {
    // if (map.map.getZoom() <= 6) return;

    if (features['main'].length > 0) {
      // Default to first feature
      let feat = features['main'][0];
      let key = util.keyForCat({'Y': state.cat['Y'], 'I': state.cat['I']});
      let loa_keys = feat.properties['loa_key'].split(',');
      let loa_key = loa_keys[0];
      if (state.focused == null || feat.properties['STATEFP'] == state.focused) {
        db.dataForKeyPlace(key, loa_key).then((data) => {
          tooltip.style.left = `${ev.point.x+10}px`;
          tooltip.style.top = `${ev.point.y+10}px`;
          tooltip.style.display = 'block';

          let label = `${fipsToState[loa_key.slice(0,2)]}, District ${loa_key.slice(2)}`;
          tooltip.innerHTML = `
            <div class="tooltip-title"><b>${label}</b></div>
            <div><b>Population</b>: ${data['CDPOP'] || 'N/A'}</div>
            <div><b>Median Income</b>: ${formatter.format(data['MEDIANINCOME']) || 'N/A'}</div>
            <div><b>Median Student Debt</b>: ${formatter.format(data['STU_TOT_BAL']) || 'N/A'}</div>
            ${loa_keys.length > 1 ? `<div>${loa_keys.length - 1} other districts here (zoom in to see).</div>` : ''}
          `;
        });
      } else {
        tooltip.style.display = 'none';
      }
    } else {
      tooltip.style.display = 'none';
    }
  });
  map.map.on('dragstart', () => {
    tooltip.style.display = 'none';
  });
  map.map.on('load', () => {
    let bbox = regions['Mainland'];
    map.fitBounds(bbox);
  });

  const otherColors = {};
  otherColors[`No ${config.SHORT_NAME}`] = '#520004';
  const legend = new Legend(`${mapId}--legend`, map, {id: 'main', layer: 'data'}, state.props, otherColors, ['min']);

  // For getting bounds
  // window.getbbox = () => map.map.getBounds();
  return map;
}

// For district screnshots
function stopToValue(stop, range) {
  return range[0] + (range[1] - range[0]) * stop;
}

function gradientToStyle(gradient, range, opacity) {
  return Object.keys(gradient)
    .map((stop) => parseFloat(stop))
    .sort()
    .reduce((acc, stop) => {
      acc.push(stopToValue(stop, range));
      let rgb = color.hexToRGB(gradient[stop]).map((v) => v*255);
      acc.push(['rgba'].concat(...rgb.concat(opacity ? opacity : 1.0)));
      return acc;
    }, []);
}

export default FSMSDMap;
