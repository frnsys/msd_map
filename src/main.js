import config from '../config';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import data from '../data/msd_meta.json';

mapboxgl.accessToken = config.MAPBOX_TOKEN;
const map = new mapboxgl.Map({
  container: 'main',
  style: 'mapbox://styles/frnsys/cjzk1fw9w5goc1cpd8pzx6wuu',
  zoom: 2,
  center: [-73.935242, 40.730610],
  maxZoom: 12,
  minZoom: 2
});

const COLOR_RANGES = {
  'SCI': [[255/255, 254/255, 245/255], [252/255, 159/255, 163/255]],
  'average_tuition': [[242/255, 242/255, 252/255], [159/255, 163/255, 252/255]],
  // 'SCI': ['#fffef5', '#fc9fa3'],
  // 'average_tuition': ['#f2f2fc', '#9fa3fc'],
  'n': ['#f5fff8', '#32a852'],
  'HD01_S001': ['#fff8d6', '#ffd721'],
  'EFTOTAL_overall': ['#ffedff', '#c65cff']
};
const PROP_DESCS = {
  'SCI': 'School Concentration Index',
  'average_tuition': 'Average Tuition',
  'n': 'Number of School Zones',
  'HD01_S001': 'Population Estimate',
  'EFTOTAL_overall': 'Enrollment Seats'
}

const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2
});

// Jump to zipcode
let zipcodeInput = document.querySelector('#control input[name=zipcode]');
zipcodeInput.addEventListener('input', (ev) => {
  goToZipcode(ev.target.value);
});

// Toggle displayed property
let propertyInput = document.querySelector('#control select[name=property]');
Object.keys(COLOR_RANGES).forEach((property) => {
  let opt = document.createElement('option');
  opt.innerText = PROP_DESCS[property];
  opt.value = property;
  propertyInput.appendChild(opt);
});
propertyInput.addEventListener('change', (ev) => {
  changePaint(ev.target.value);
});

// `querySourceFeatures` will only search
// features that have already been loaded.
// This waits for a feature matching
// the query to load, so if there isn't actually
// a feature that matches the query, the callback
// will never be called. So you should validate
// that a feature exists for this zipcode before calling this.
function featByZipcode(zipcode, cb) {
  let opts = {
    sourceLayer: 'msd',
    filter: ['all', ['==', 'zipcode', zipcode]]
  };
  let results = map.querySourceFeatures('msd', opts);
  if (results.length > 0) {
    cb(results[0]);
  } else {
    map.once('sourcedata', () => {
      featByZipcode(zipcode, cb);
    });
  }
}

function goToZipcode(zipcode) {
  let bbox = data.bboxes[zipcode];
  if (!bbox) return;
  map.fitBounds(bbox);
  let feat = featByZipcode(zipcode, (feat) => {
    // TODO deal with race conditions here
    focusFeature(feat);
    explainFeature(feat);
  });
}

let focused = null;
function focusFeature(feat) {
  if (focused) {
    map.setFeatureState({
      source: 'msd',
      sourceLayer: 'msd',
      id: focused.id
    },{
      focus: false,
    });
  }
  map.setFeatureState({
    source: 'msd',
    sourceLayer: 'msd',
    id: feat.id
  },{
    focus: true,
    fillColor: '#f9ca74'
  });
  focused = feat;
}

map.on('load', function () {
  console.log(defineBivariateColor('SCI', 'average_tuition'))
  map.addLayer({
    'id': 'msd',
    'type': 'fill',
    'source': {
      type: 'vector',
      url: 'mapbox://frnsys.avg7h3hg'
    },
    'source-layer': 'msd',
    'paint': {
      // 'fill-color': defineFillColor('SCI'),
      'fill-color': defineBivariateColor('SCI', 'average_tuition'),
      'fill-outline-color': [
        'interpolate', ['linear'], ['zoom'], 5, 'rgba(0, 0, 0, 0)', 10, 'rgba(0,0,0,1)'
      ]
    }
  }, 'admin');
});

function defineBivariateColor(propertyA, propertyB) {
  // where COLOR_RANGES[property] = [[r,g,b], [r,g,b]] and r,g,b are in [0,1]
  let ranges = {
    a: data.ranges[propertyA],
    b: data.ranges[propertyB],
  };
  let colors = {
    a: COLOR_RANGES[propertyA],
    b: COLOR_RANGES[propertyB],
  };
  return [
    'concat',
    'rgb(',

    // r
    ['*',
      ['interpolate', ['linear'], ['get', propertyA],
        ranges.a[0], colors.a[0][0], ranges.a[1], colors.a[1][0]],

      ['interpolate', ['linear'], ['get', propertyB],
        ranges.b[0], colors.b[0][0], ranges.b[1], colors.b[1][0]],

      255
    ],

    ',',

    // g
    ['*',
      ['interpolate', ['linear'], ['get', propertyA],
        ranges.a[0], colors.a[0][1], ranges.a[1], colors.a[1][1]],

      ['interpolate', ['linear'], ['get', propertyB],
        ranges.b[0], colors.b[0][1], ranges.b[1], colors.b[1][1]],

      255
    ],

    ',',

    // b
    ['*',
      ['interpolate', ['linear'], ['get', propertyA],
        ranges.a[0], colors.a[0][2], ranges.a[1], colors.a[1][2]],

      ['interpolate', ['linear'], ['get', propertyB],
        ranges.b[0], colors.b[0][2], ranges.b[1], colors.b[1][2]],

      255
    ],

    ')'
  ]
}

function defineFillColor(property) {
  return [
    'case',

    // If feature-state is set to focus
    ['boolean', ['feature-state', 'focus'], false],
      ['feature-state', 'fillColor'],

    // If the property value is 0
    ['==', ['get', property], 0],
      '#262626',

    // Otherwise, interpolate color
    ['interpolate', ['linear'], ['get', property],
      data.ranges[property][0], COLOR_RANGES[property][0], data.ranges[property][1], COLOR_RANGES[property][1]
    ]
  ];
}

function changePaint(property) {
  map.setPaintProperty('msd', 'fill-color', defineFillColor(property));
}

const infoEl = document.getElementById('info');
function explainFeature(feat) {
  let p = feat.properties;
  infoEl.innerHTML = `
    <h2>${p['zipcode']}</h2>
    School Concentration Index: ${p['SCI'] ? (p['SCI']/data.ranges['SCI'][1]).toFixed(2) : 'N/A'}<br/>
    Average Tuition: ${p['average_tuition'] ? formatter.format(p['average_tuition']) : 'N/A'}<br/>
    Number of School Zones: ${p['n']}<br/>
    Population Estimate: ${p['HD01_S001']}<br/>
    Enrollment Seats: ${p['EFTOTAL_overall']}<br/>
  `;
  infoEl.style.display = 'block';
}

map.on('mousemove', function(e) {
  let features = map.queryRenderedFeatures(e.point);
  features = features.reduce((acc, f) => {
    if (['msd'].includes(f.source)) {
      acc[f.source] = f;
    }
    return acc;
  }, {});
  if (Object.keys(features).length > 0) {
    if (features['msd']) {
      let feat = features['msd'];
      focusFeature(feat);
      explainFeature(feat);
    }
  }
});