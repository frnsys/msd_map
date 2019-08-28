import config from '../config';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import data from '../data/msd_meta.json';

// Showing two variables
let bivariate = true;

mapboxgl.accessToken = config.MAPBOX_TOKEN;
const map = new mapboxgl.Map({
  container: 'main',
  style: 'mapbox://styles/frnsys/cjzk1fw9w5goc1cpd8pzx6wuu',
  zoom: 2,
  center: [-73.935242, 40.730610],
  maxZoom: 12,
  minZoom: 2
});

const colors = {
  // 'SCI': ['#fffef5', '#fc9fa3'],
  // 'average_tuition': ['#f2f2fc', '#9fa3fc'],
  'SCI': ['#fc949a', '#f7020e'],
  'average_tuition': ['#a9bdfc', '#023ff7'],
  'n': ['#f5fff8', '#32a852'],
  'HD01_S001': ['#fff8d6', '#ffd721'],
  'EFTOTAL_overall': ['#ffedff', '#c65cff']
};
const COLOR_RANGES = Object.keys(colors).reduce((acc, prop) => {
  acc[prop] = colors[prop].map((h) => hexToRGB(h));
  return acc;
}, {});
const PROP_DESCS = {
  'SCI': 'School Concentration Index',
  'average_tuition': 'Average Tuition',
  'n': 'Number of School Zones',
  'HD01_S001': 'Population Estimate',
  'EFTOTAL_overall': 'Enrollment Seats'
}

const legend = document.getElementById('legend');

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
  bivariate = false;
  changePaint(ev.target.value);
  rangeLegend(ev.target.value);
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

function defineBivariateColor(propA, propB) {
  // where COLOR_RANGES[property] = [[r,g,b], [r,g,b]] and r,g,b are in [0,1]
  let ranges = {
    a: data.ranges[propA],
    b: data.ranges[propB],
  };
  let colors = {
    a: COLOR_RANGES[propA],
    b: COLOR_RANGES[propB],
  };
  return [
    'case',

      // If feature-state is set to focus
      ['boolean', ['feature-state', 'focus'], false],
        ['feature-state', 'fillColor'],

      ['concat',
        'rgb(',

        // r
        ['*',
          ['interpolate', ['linear'], ['get', propA],
            ranges.a[0], colors.a[0][0], ranges.a[1], colors.a[1][0]],

          ['interpolate', ['linear'], ['get', propB],
            ranges.b[0], colors.b[0][0], ranges.b[1], colors.b[1][0]],

          255
        ],

        ',',

        // g
        ['*',
          ['interpolate', ['linear'], ['get', propA],
            ranges.a[0], colors.a[0][1], ranges.a[1], colors.a[1][1]],

          ['interpolate', ['linear'], ['get', propB],
            ranges.b[0], colors.b[0][1], ranges.b[1], colors.b[1][1]],

          255
        ],

        ',',

        // b
        ['*',
          ['interpolate', ['linear'], ['get', propA],
            ranges.a[0], colors.a[0][2], ranges.a[1], colors.a[1][2]],

          ['interpolate', ['linear'], ['get', propB],
            ranges.b[0], colors.b[0][2], ranges.b[1], colors.b[1][2]],

          255
        ],

        ')'
    ]
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
      data.ranges[property][0], colorToRGB(COLOR_RANGES[property][0]), data.ranges[property][1], colorToRGB(COLOR_RANGES[property][1])
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
    Average Tuition: ${p['average_tuition'] ? formatter.format(p['average_tuition']/data.ranges['average_tuition'][1]) : 'N/A'}<br/>
    Number of School Zones: ${p['n']}<br/>
    Population Estimate: ${p['HD01_S001']}<br/>
    Enrollment Seats: ${p['EFTOTAL_overall']}<br/>
  `;
  infoEl.style.display = 'block';
}

map.on('mousemove', function(e) {
  let features = map.queryRenderedFeatures(e.point);
  let pointEl = document.getElementById('focus-point');
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

      if (bivariate) {
        // TODO temporary
        let propA = 'SCI';
        let propB = 'average_tuition';
        let p_a = (feat.properties[propA]-data.ranges[propA][0])/(data.ranges[propA][1] - data.ranges[propA][0]);
        let p_b = (feat.properties[propB]-data.ranges[propB][0])/(data.ranges[propB][1] - data.ranges[propB][0]);
        pointEl.style.left = `calc(${p_b*100}% - ${pointEl.clientWidth/2}px)`;
        pointEl.style.bottom = `calc(${p_a*100}% - ${pointEl.clientHeight/2}px)`;
        pointEl.style.display = 'block';
      } else {
        // TODO temporary
        let prop = 'average_tuition';
        if (feat.properties[prop]) {
          let p = (feat.properties[prop]-data.ranges[prop][0])/(data.ranges[prop][1] - data.ranges[prop][0]);
          pointEl.style.display = 'block';
          pointEl.style.bottom = `calc(${p*100}% - ${pointEl.clientHeight/2}px)`;
        } else {
          pointEl.style.display = 'none';
        }
      }
    }
  } else {
    infoEl.style.display = 'none';
    pointEl.style.display = 'none';
  }
});

function interpolateRange(u, l, p) {
  return l + (u - l) * p;
}

function interpolateColor(range, p) {
  let [l_r, l_g, l_b] = range[0];
  let [u_r, u_g, u_b] = range[1];
  let r = interpolateRange(l_r, u_r, p);
  let g = interpolateRange(l_g, u_g, p);
  let b = interpolateRange(l_b, u_b, p);
  return [r, g, b];
}

function bivariateLegend(propA, propB) {
  // Clear legend element
  while (legend.hasChildNodes()) {
    legend.removeChild(legend.lastChild);
  }
  legend.classList.add('legend--bivariate');

  let colors = {
    a: COLOR_RANGES[propA],
    b: COLOR_RANGES[propB],
  };
  let ranges = {
    a: data.ranges[propA],
    b: data.ranges[propB]
  };

  let a_label = document.createElement('div');
  a_label.innerText = propA;
  legend.appendChild(a_label);

  let labels_a = document.createElement('div');
  labels_a.classList.add('legend--labels');

  let upperLabel = document.createElement('div');
  upperLabel.innerText = ranges.a[1];
  labels_a.appendChild(upperLabel);

  let lowerLabel = document.createElement('div');
  lowerLabel.innerText = ranges.a[0];
  labels_a.appendChild(lowerLabel);
  legend.appendChild(labels_a);

  // 3x3
  let n = 3;

  let gridContainer = document.createElement('div');
  let grid = document.createElement('div');
  grid.classList.add('legend--grid');
  for (let i=0; i<n; i++) {
    let col = document.createElement('div');
    for (let j=0; j<n; j++) {
      let x = i/(n-1);
      let y = ((n-1)-j)/(n-1);

      let aColor = interpolateColor(colors.a, x);
      let bColor = interpolateColor(colors.b, y);
      let mix = [aColor[0]*bColor[0], aColor[1]*bColor[1], aColor[2]*bColor[2]];
      let rgb = colorToRGB(mix);
      let cell = document.createElement('div');
      cell.classList.add('legend--cell')
      cell.style.background = rgb;
      col.appendChild(cell);
    }
    grid.appendChild(col);
  }
  gridContainer.appendChild(grid);

  let labels_b = document.createElement('div');
  labels_b.classList.add('legend--labels');
  labels_b.classList.add('legend--labels_x');

  upperLabel = document.createElement('div');
  upperLabel.innerText = ranges.b[1];
  labels_b.appendChild(upperLabel);

  lowerLabel = document.createElement('div');
  lowerLabel.innerText = ranges.b[0];
  labels_b.appendChild(lowerLabel);

  gridContainer.appendChild(labels_b);

  legend.appendChild(gridContainer);
  let pointEl = document.createElement('div');
  pointEl.id = 'focus-point';
  pointEl.classList.add('legend--bivariate-point');
  grid.appendChild(pointEl);
}

function colorToRGB(color) {
  return `rgb(${color[0]*255}, ${color[1]*255}, ${color[2]*255})`;
}

function hexToRGB(hex) {
  let h = parseInt(hex.substr(1), 16);
  return [
    ((h >> 16) & 255)/255,
    ((h >> 8) & 255)/255,
    (h & 255)/255
  ];
}

function colorToHex(color) {
  let [r,g,b] = color;
  return b*255 | ((g*255) << 8) | ((r*255) << 16);
}

function rangeLegend(prop) {
  // Clear legend element
  while (legend.hasChildNodes()) {
    legend.removeChild(legend.lastChild);
  }
  legend.classList.remove('legend--bivariate');

  let color = COLOR_RANGES[prop];
  let range = data.ranges[prop];
  let rangeBar = document.createElement('div');
  rangeBar.classList.add('legend--bar');
  rangeBar.style.background = `linear-gradient(0, ${colorToRGB(color[0])} 0%, ${colorToRGB(color[1])} 100%)`;

  let pointEl = document.createElement('div');
  pointEl.id = 'focus-point';
  pointEl.classList.add('legend--point');
  rangeBar.appendChild(pointEl);

  let labels = document.createElement('div');
  labels.classList.add('legend--labels');

  let lowerLabel = document.createElement('div');
  lowerLabel.innerText = range[0];

  let upperLabel = document.createElement('div');
  upperLabel.innerText = range[1];

  labels.appendChild(upperLabel);
  labels.appendChild(lowerLabel);

  legend.appendChild(labels);
  legend.appendChild(rangeBar);
}

bivariateLegend('SCI', 'average_tuition');
