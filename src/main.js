import config from './config';
import MSDMap from './map/msd';
import SimpleLightbox from 'simple-lightbox';

// Maps
mapboxgl.accessToken = config.MAPBOX_TOKEN;
const maps = {};
maps['zcta'] = MSDMap('zcta', {
  props: config.ZCTA.INITIAL_PROPS,
  cat: config.ZCTA.INITIAL_CAT
}, config.ZCTA);

[...document.querySelectorAll('.map-tab')].forEach((el) => {
  el.addEventListener('click', () => {
    document.querySelector('.map-tab.selected').classList.remove('selected');
    document.querySelector('.map-tab-pane.active').classList.remove('active');

    el.classList.add('selected');
    document.getElementById(`${el.dataset.tab}--map-tab`).classList.add('active');

    // Lazy loading of CD map
    if (el.dataset.tab == 'cd' && !('cd' in maps)) {
      maps['cd'] = MSDMap('cd', {
        props: config.CD.INITIAL_PROPS,
        cat: config.CD.INITIAL_CAT,
      }, config.CD);
    }
    maps[el.dataset.tab].map.resize();
  });
});

// Summary statistics table
const state = {
  summary: {
    tab: 'zips',
    type: 'public',
    sort: {
      column: 0,
      reverse: false
    }
  }
};
[...document.querySelectorAll('#summary-tabs--level > div')].forEach((tab) => {
  tab.addEventListener('click', (ev) => {
    ev.preventDefault();
    let val = tab.dataset.value;
    if (val !== state.summary.tab) {
      document.querySelector('#summary-tabs--level .selected').classList.remove('selected');
      state.summary.tab = val;
      tab.classList.add('selected');
      loadSummary(state);
    }
    return false;
  });
});
[...document.querySelectorAll('#summary-tabs--school-type > div')].forEach((tab) => {
  tab.addEventListener('click', (ev) => {
    ev.preventDefault();
    let val = tab.dataset.value;
    if (val !== state.summary.type) {
      document.querySelector('#summary-tabs--school-type .selected').classList.remove('selected');
      state.summary.type = val;
      tab.classList.add('selected');
      loadSummary(state);
    }
    return false;
  });
});

const summaryEl = document.getElementById('summary-table');
const summaryTitle = document.querySelector('#summary h2');
const summaryNotes = document.querySelector('#summary .summary-notes');
const rowHeads = {
  schools: [
    'Academic Year',
    'Total Campuses',
    'National Enrollment',
    'Avg Net Price',
    'Median Net Price',
    'Avg Tuition & Fees',
    'Median Tuition & Fees'
  ],
  zips: [
    'Academic Year',
    'Median Young Adult Student Debt',
    'Median Income',
    'Avg Net Price',
    'Avg Tuition & Fees',
    'Count of Education Deserts ZCTAs',
    'Median Local School Count',
    'Median All-School Concentration'
  ]
};
function loadRows(state, rows) {
  let {summary} = state;
  summaryEl.innerHTML = '';

  // Headers
  let tr = document.createElement('tr');
  let cols = rowHeads[summary.tab];
  cols.forEach((name, i) => {
    let td = document.createElement('th');
    td.innerHTML = name;
    tr.appendChild(td);

    // Sort on click
    td.addEventListener('click', (ev) => {
      ev.preventDefault();
      if (state.summary.sort.column == i) {
        state.summary.sort.reverse = !state.summary.sort.reverse;
      }
      state.summary.sort.column = i;
      loadRows(state, rows);
      return false;
    });
  });
  summaryEl.appendChild(tr);

  rows.sort((a, b) => (Object.values(a)[summary.sort.column] > Object.values(b)[summary.sort.column]) ? 1 : -1);
  if (summary.sort.reverse) {
    rows.reverse();
  }

  rows.forEach((row) => {
    let tr = document.createElement('tr');
    cols.forEach((key) => {
      let val = row[key];
      let td = document.createElement('td');
      td.innerText = val || 'N/A';
      tr.appendChild(td);
    });
    summaryEl.appendChild(tr);
  });
}

function loadSummary(state) {
  let url;
  let {summary, cat} = state;
  if (summary.tab === 'schools') {
    url = `assets/summary/${summary.tab}-${summary.type}.json`;
    summaryTitle.innerText = 'Year-to-year Analysis of On-Campus Higher Education Institutions in the US and US Territories';
    summaryNotes.innerText = 'Note: All dollar amounts are nominal.';
    document.getElementById('summary-tabs--school').style.display = 'block';
  } else {
    url = `assets/summary/${summary.tab}.json`;
    summaryTitle.innerText = 'Year-to-year Analysis of Zip-Level Data in the US and US Territories';
    summaryNotes.innerText = 'Note: All dollar amounts are inflation-adjusted to 2019. Student debt statistic is conditional on a zip having sampled 18 – 35 year-old individuals with positive student loan balances. School Prices, Concentration, and Count statistics are inclusive of all school types and available only for ZCTAs that are not education deserts.';
    document.getElementById('summary-tabs--school').style.display = 'none';
  }
  return fetch(url, {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    method: 'GET',
  })
    .then(res => res.json())
    .then((json) => {
      let rows = json;
      loadRows(state, rows);
    })
    .catch(err => { console.log(err) });
}


// Visualization lightbox
new SimpleLightbox({elements: '.viz-gallery a'});
