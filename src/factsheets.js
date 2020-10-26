import config from './config';
import FSMSDMap from './map/factsheetmap';
import dataset from '../data/gen/factsheets.json';

// Maps
mapboxgl.accessToken = config.MAPBOX_TOKEN;

const maps = {};
maps['a'] = FSMSDMap(config.CD, 'a', (state) => {
  tableState.a.state = state;
  renderTables(tableState.a);
});
maps['b'] = FSMSDMap(config.CD, 'b', (state) => {
  tableState.b.state = state;
  renderTables(tableState.b);
});

document.getElementById('a--map').addEventListener('mouseleave', () => {
  document.getElementById('a--map-tooltip').style.display = 'none';
});
document.getElementById('b--map').addEventListener('mouseleave', () => {
  document.getElementById('b--map-tooltip').style.display = 'none';
});

maps['a'].map.resize();
maps['b'].map.resize();

[...document.querySelectorAll('h1 a')].forEach((a) => {
  a.addEventListener('click', () => {
    document.querySelector('h1 a.selected').classList.remove('selected');
    a.classList.add('selected');
    tableState.a.groups.debt = a.dataset.value;
    tableState.b.groups.debt = a.dataset.value;
    renderTables(tableState.a);
    renderTables(tableState.b);
  });
});

// Tables
const tableState = {
  a: {
    id: 'a--info',
    state: 'National',
    groups: {
      debt: 'median',
      institutions: 'all'
    }
  },
  b: {
    id: 'b--info',
    state: 'National',
    groups: {
      debt: 'median',
      institutions: 'all'
    }
  }
}
function renderTables(tableState) {
  let data = dataset[tableState.state];
  let debtData = data['debt'][tableState.groups.debt];
  let instData = data['institutions'][tableState.groups.institutions];
  let parent = document.querySelector(`#${tableState.id} .info-tables`);
  while (parent.hasChildNodes()) {
    parent.removeChild(parent.lastChild);
  }
  let debtStat = tableState.groups.debt;
  debtStat = debtStat.charAt(0).toUpperCase() + debtStat.slice(1);

  renderTable(
    parent,
    `2019 ${debtStat} Student Debt`,
    ['', 'Value', 'Rank'],
    [
      [debtData['debt']['name'], debtData['debt']['label'], debtData['debt']['rank']],
      [debtData['debt_change']['name'], debtData['debt_change']['label'], debtData['debt_change']['rank']]
    ],
    []
  );

  const demos = ['asian', 'black', 'hispanic', 'white', 'minority'];
  renderTable(
    parent,
    `2018 ${debtStat} Student Debt by Census Tract Demographics`,
    ['Maj. Asian', 'Maj. Black', 'Maj. Hispanic', 'Maj. White', 'Maj. Minority'],
    [...Array(4).keys()].map((i) => {
      return demos.map((demo) => {
        let val = debtData['debt_demographics'][demo][i];
        if (i == 1) {
          return `<span class="in-title">Debt Rank:</span> ${val || 'N/A'}`;
        } else if (i == 2) {
          if (!val) {
            return 'N/A';
          } else if (parseFloat(val) > 0) {
            return `<span class="bad">${val}↑</span><br />since 2009`;
          } else {
            return `<span class="good">${val}↓</span><br />since 2009`;
          }
        } else if (i == 3) {
          return `<span class="in-title">% Change Rank:</span> ${val || 'N/A'}`;
        }
        return val;
      });
    }),
    []
  );

  renderTable(
    parent,
    `2018 ${debtStat} Census Tract Level Median Income of Borrowers`,
    ['', 'Value', 'Rank'],
    [
      [debtData['income']['name'], debtData['income']['label'], debtData['income']['rank']],
      [debtData['income_change']['name'], debtData['income_change']['label'], debtData['income']['rank']]
    ],
    []
  );

  renderTable(
    parent,
    `2018 ${debtStat} Income of Borrowers by Census Tract Demographics`,
    ['Maj. Asian', 'Maj. Black', 'Maj. Hispanic', 'Maj. White', 'Maj. Minority'],
    [...Array(4).keys()].map((i) => {
      return demos.map((demo) => {
        let val = debtData['income_demographics'][demo][i];
        if (i == 1) {
          return `<span class="in-title">Income Rank:</span> ${val || 'N/A'}`;
        } else if (i == 2) {
          if (!val) {
            return 'N/A';
          } else if (parseFloat(val) > 0) {
            return `<span class="good">${val}↑</span><br />since 2009`;
          } else {
            return `<span class="bad">${val}↓</span><br />since 2009`;
          }
        } else if (i == 3) {
          return `<span class="in-title">% Change Rank</span>: ${val || 'N/A'}`;
        }
        return val;
      });
    }),
    []
  );

  let h = document.createElement('h2');
  h.classList.add('inst-select');
  const instGroups = {
    'all': 'All',
    'public': 'Public',
    'private_for_profit': 'Private-for-Profit'
  };
  Object.keys(instGroups).forEach((value) => {
    let a = document.createElement('a');
    a.innerText = instGroups[value];
    if (value == tableState.groups.institutions) {
      a.classList.add('selected');
    }
    a.addEventListener('click', () => {
      document.querySelector(`#${tableState.id} .inst-select a.selected`).classList.remove('selected');
      a.classList.add('selected');
      tableState.groups.institutions = value;
      renderTables(tableState);
    });
    h.appendChild(a);
  });
  parent.appendChild(h);

  renderTable(
    parent,
    `2017-2018 ${instGroups[tableState.groups.institutions]} Institutions, Undergraduate Enrollment, and Prices`,
    ['', 'Value', 'Rank', '% Change*'],
    [
      [instData['count']['name'], instData['count']['label'], instData['count']['rank'], instData['count']['change']],
      [instData['students']['name'], instData['students']['label'], instData['students']['rank'], instData['students']['change']],
      [instData['tuition_fees']['name'], instData['tuition_fees']['label'], instData['tuition_fees']['rank'], instData['tuition_fees']['change']],
      [instData['sticker_price']['name'], instData['sticker_price']['label'], instData['sticker_price']['rank'], instData['sticker_price']['change']],
      [instData['real_cost']['name'], instData['real_cost']['label'], instData['real_cost']['rank'], instData['real_cost']['change']],
      [instData['sci']['name'], instData['sci']['label'], instData['sci']['rank'], instData['sci']['change']]
    ],
    [
      '*Since 2008-2009 AY',
      '**Sticker price = tuition, fees, ancillary costs, living expenses, and transportation',
      '***Real cost of college = sticker price minus scholarships/grants',
      '****SCI ranges from 0 (perfect competition) to 10,000 (complete monopoly). A SCI of 10,000 indicates one school accounts for all the enrollment for that geographic area.'
    ]
  );
}

function renderTable(parent, title, columns, rows, footnotes) {
  let c = document.createElement('div');

  let h = document.createElement('h3');
  h.innerText = title;

  let t = document.createElement('table');
  c.appendChild(h);
  c.appendChild(t);

  let tr = document.createElement('tr');
  columns.forEach((col) => {
    let th = document.createElement('th');
    th.innerText = col;
    tr.appendChild(th);
  });
  t.appendChild(tr);

  rows.forEach((row) => {
    let tr = document.createElement('tr');
    row.forEach((col) => {
      let td = document.createElement('td');
      td.innerHTML = col || 'N/A';
      tr.appendChild(td);
    });
    t.appendChild(tr);
  });

  if (footnotes.length > 0) {
    let fns = document.createElement('ul');
    fns.classList.add('footnotes');
    footnotes.forEach((note) => {
      let fn = document.createElement('li')
      fn.innerText = note;
      fns.appendChild(fn)
    });
    c.appendChild(fns);
  }
  parent.appendChild(c);
}

renderTables(tableState.a);
renderTables(tableState.b);
