import config from './config';
import FSMSDMap from './map/factsheetmap';
import dataset from '../data/gen/factsheets.json';

// Maps
mapboxgl.accessToken = config.MAPBOX_TOKEN;
config.CD.INITIAL_CAT.Y = '2019';

const maps = {};
maps['a'] = FSMSDMap(config.CD, 'a', (stateName, meta) => {
  tableStates.a.meta = meta;
  tableStates.a.state = stateName;
  tableStates.a.district = stateName.includes(', District');
  if (!tableStates.a.district) {
    tableStates.a.rankVariable = 'nationalRank';
  }
  renderTables(tableStates.a);
});
maps['b'] = FSMSDMap(config.CD, 'b', (stateName, meta) => {
  tableStates.b.meta = meta;
  tableStates.b.state = stateName;
  tableStates.b.district = stateName.includes(', District');
  if (!tableStates.b.district) {
    tableStates.b.rankVariable = 'nationalRank';
  }
  renderTables(tableStates.b);
});

const sectionOpenStates = {};

document.getElementById('a--map').addEventListener('mouseleave', () => {
  document.getElementById('a--map-tooltip').style.display = 'none';
});
document.getElementById('b--map').addEventListener('mouseleave', () => {
  document.getElementById('b--map-tooltip').style.display = 'none';
});

maps['a'].map.resize();
maps['b'].map.resize();

// Tables
const tableStates = {
  a: {
    mapId: 'a',
    id: 'a--info',
    state: 'National',
    meta: '',
    district: false,
    rankVariable: 'nationalRank',
    groups: {
      debt: 'median',
      institutions: 'all'
    }
  },
  b: {
    mapId: 'b',
    id: 'b--info',
    state: 'National',
    meta: '',
    district: false,
    rankVariable: 'nationalRank',
    groups: {
      debt: 'median',
      institutions: 'all'
    }
  }
}

function renderCollapsibleSection(id, title, parent) {
  let sectionHeading = document.createElement('h3');
  let openIcon = sectionOpenStates[id] ? '–' : '+';
  sectionHeading.innerHTML = `<span>${title}</span><span class="toggle-open">${openIcon}</span>`;
  sectionHeading.dataset.sectionId = id;

  let section = document.createElement('section');
  section.dataset.sectionId = id;
  section.style.display = sectionOpenStates[id] ? 'block' : 'none';

  sectionHeading.addEventListener('click', () => {
    // Synchronize tables
    let tables = [...document.querySelectorAll(`section[data-section-id="${id}"]`)];
    let headings = [...document.querySelectorAll(`h3[data-section-id="${id}"]`)];
    if (tables[0].style.display == 'block') {
      sectionOpenStates[id] = false;
      tables.forEach((t) => t.style.display = 'none');
      headings.forEach((h) => h.querySelector('.toggle-open').innerText = '+');
    } else {
      sectionOpenStates[id] = true;
      tables.forEach((t) => t.style.display = 'block');
      headings.forEach((h) => h.querySelector('.toggle-open').innerText = '–');
    }
  });
  parent.appendChild(sectionHeading);
  parent.appendChild(section);
  return section;
}

function renderTables(tableState) {
  let infoEl = document.getElementById(`${tableState.mapId}--info`);
  if (tableState.state == 'National') {
    infoEl.classList.add('info-national');
  } else {
    infoEl.classList.remove('info-national');
  }
  let title = infoEl.querySelector('h2');
  title.innerText = tableState.state;

  let metaEl = infoEl.querySelector('.info-meta');
  if (tableState.district) {
    metaEl.innerHTML = `${tableState.meta} <span class="rank-selector">
      Show:
      <a class="${tableState.rankVariable == 'nationalRank' ? 'selected' : ''}" data-value="nationalRank">National Ranks</a>
      <a class="${tableState.rankVariable == 'stateRank' ? 'selected' : ''}" data-value="stateRank">In-State Ranks</a>
    </span>`;
    [...metaEl.querySelectorAll('a')].forEach((el) => {
      el.addEventListener('click', (ev) => {
        tableState.rankVariable = el.dataset.value;
        renderTables(tableState);
        return false;
      });
    });
  } else {
    metaEl.innerHTML = tableState.meta;
  }

  let rankVariable = tableState.rankVariable;
  let demoCols = rankVariable == 'nationalRank' ? [0,1,3,4] : [0,2,3,5];

  let data = dataset[tableState.state];
  let debtData = data['debt'][tableState.groups.debt];
  let medianDebtData = data['debt']['median']; // some data only has median now
  let instData = data['institutions'][tableState.groups.institutions];
  let parent = document.querySelector(`#${tableState.id} .info-tables`);
  while (parent.hasChildNodes()) {
    parent.removeChild(parent.lastChild);
  }
  let debtStat = tableState.groups.debt;
  debtStat = debtStat.charAt(0).toUpperCase() + debtStat.slice(1);
  const demos = ['asian', 'black', 'hispanic', 'white', 'minority'];

  let section = renderCollapsibleSection('student_debt', '2019 Student Debt', parent);
  renderTable(
    'avg_student_debt',
    section,
    `<a data-value="median" class="${debtStat == 'Median' ? 'selected' : ''}">Median</a> <a data-value="average" class="${debtStat == 'Average' ? 'selected' : ''}">Average</a> Student Debt`,
    ['', 'Value', 'Rank'],
    [
      [debtData['debt']['name'], debtData['debt']['label'], debtData['debt'][rankVariable]],
      [debtData['debt_change']['name'], debtData['debt_change']['label'], debtData['debt_change'][rankVariable]]
    ],
    []
  );
  [...document.querySelectorAll('h4 a')].forEach((a) => {
    a.addEventListener('click', (ev) => {
      document.querySelector('h4 a.selected').classList.remove('selected');
      a.classList.add('selected');
      tableStates.a.groups.debt = a.dataset.value;
      tableStates.b.groups.debt = a.dataset.value;
      renderTables(tableStates.a);
      renderTables(tableStates.b);
      ev.stopPropagation();
    });
  });

  let rows = [`${debtStat} Student Debt`, 'National Rank', 'In-State Rank', '% Change since 2009', 'National Rank: % Change', 'In-State Rank: % Change'];
  renderTable(
    'avg_student_debt_by_tract_demo',
    section,
    `${debtStat} Student Debt by Census Tract Demographics`,
    ['', 'Maj.\nAsian', 'Maj.\nBlack', 'Maj.\nHispanic', 'Maj.\nWhite', 'Maj.\nMinority'],
    demoCols.map((i) => {
      return [rows[i]].concat(demos.map((demo) => {
        let val = debtData['debt_demographics'][demo][i];
        if (i == 1 || i == 2 || i == 4 || i == 5) {
          return `${val || '<span class="na">N/A</span>'}`;
        } else if (i == 3) {
          return renderPercent(val, true);
        }
        return val;
      }));
    }),
    []
  );

  section = renderCollapsibleSection('income', '2019 Median Income', parent);
  renderTable(
    'avg_income_by_tract',
    section,
    // `${debtStat} Census Tract Level Median Income of Borrowers`,
    `US Median Income across Census Tracts`,
    ['', 'Value', 'Rank'],
    [
      // [debtData['income']['name'], debtData['income']['label'], debtData['income']['rank']],
      // [debtData['income_change']['name'], debtData['income_change']['label'], debtData['income']['rank']]
      [medianDebtData['income']['name'], medianDebtData['income']['label'], medianDebtData['income'][rankVariable]],
      [medianDebtData['income_change']['name'], medianDebtData['income_change']['label'], medianDebtData['income'][rankVariable]]
    ],
    []
  );
  rows = [`Median Income`, 'National Rank', 'In-State Rank', '% Change since 2009', 'National Rank: % Change', 'In-State Rank: % Change'];
  renderTable(
    'avg_income_by_tract_demo',
    section,
    // `${debtStat} Income of Borrowers by Census Tract Demographics`,
    `Median Income by Census Tract Demographics`,
    ['', 'Maj.\nAsian', 'Maj.\nBlack', 'Maj.\nHispanic', 'Maj.\nWhite', 'Maj.\nMinority'],
    demoCols.map((i) => {
      return [rows[i]].concat(demos.map((demo) => {
        // let val = debtData['income_demographics'][demo][i];
        let val = medianDebtData['income_demographics'][demo][i];
        if (i == 1 || i == 2 || i == 4 || i == 5) {
          return `${val || '<span class="na">N/A</span>'}`;
        } else if (i == 3) {
          return renderPercent(val, false);
        }
        return val;
      }));
    }),
    []
  );

  section = renderCollapsibleSection('debt_income', '2019 Debt-to-Income Ratio', parent);
  renderTable(
    'avg_debt_income_ratio',
    section,
    // `${debtStat} Student Debt-to-Income Ratios`,
    `Median Student Debt-to-Income Ratios`,
    ['', 'Value', 'Rank'],
    [
      // [debtData['debtincome']['name'], debtData['debtincome']['label'], debtData['debtincome']['rank']],
      // [debtData['debtincome_change']['name'], debtData['debtincome_change']['label'], debtData['debtincome_change']['rank']]
      [medianDebtData['debtincome']['name'], medianDebtData['debtincome']['label'], medianDebtData['debtincome'][rankVariable]],
      [medianDebtData['debtincome_change']['name'], medianDebtData['debtincome_change']['label'], medianDebtData['debtincome_change'][rankVariable]]
    ],
    []
  );
  rows = [`Median Student<br />Debt-to-Income`, 'National Rank', 'In-State Rank', '% Change since 2009', 'National Rank: % Change', 'In-State Rank: % Change'];
  renderTable(
    'avg_debt_income_ratio_by_tract_demo',
    section,
    // `${debtStat} Student Debt-to-Income by Census Tract Demographics`,
    `Median Student Debt-to-Income by Census Tract Demographics`,
    ['', 'Maj.\nAsian', 'Maj.\nBlack', 'Maj.\nHispanic', 'Maj.\nWhite', 'Maj.\nMinority'],
    demoCols.map((i) => {
      return [rows[i]].concat(demos.map((demo) => {
        // let val = debtData['debtincome_demographics'][demo][i];
        let val = medianDebtData['debtincome_demographics'][demo][i];
        if (i == 1 || i == 2 || i == 4 || i == 5) {
          return `${val || '<span class="na">N/A</span>'}`;
        } else if (i == 3) {
          return renderPercent(val, true);
        }
        return val;
      }));
    }),
    []
  );

  section = renderCollapsibleSection('institutions', '2017-2018 Higher Education Market', parent);
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
  section.appendChild(h);

  renderTable(
    'inst_stats',
    section,
    `${instGroups[tableState.groups.institutions]} Institutions`,
    ['', 'Value', 'Rank', '% Change*'],
    [
      [
        instData['count']['name'],
        instData['count']['label'],
        instData['count']['rank'],
        renderPercent(instData['count']['change'] , false)
      ],
      [
        instData['students']['name'],
        instData['students']['label'],
        instData['students']['rank'],
        renderPercent(instData['students']['change'] , false)
      ],
      [
        instData['tuition_fees']['name'],
        instData['tuition_fees']['label'],
        instData['tuition_fees']['rank'],
        renderPercent(instData['tuition_fees']['change'] , true)
      ],
      [
        instData['sticker_price']['name'],
        instData['sticker_price']['label'],
        instData['sticker_price']['rank'],
        renderPercent(instData['sticker_price']['change'] , true)
      ],
      [
        instData['real_cost']['name'],
        instData['real_cost']['label'],
        instData['real_cost']['rank'],
        renderPercent(instData['real_cost']['change'] , true)
      ],
      [
        instData['sci']['name'],
        instData['sci']['label'],
        instData['sci']['rank'],
        renderPercent(instData['sci']['change'] , true)
      ]
    ],
    [
      '*Since 2008-2009 AY',
      '**Sticker price = tuition, fees, ancillary costs, living expenses, and transportation',
      '***Real cost of college = sticker price minus scholarships/grants',
      '****SCI ranges from 0 (perfect competition) to 10,000 (complete monopoly). A SCI of 10,000 indicates one school accounts for all the enrollment for that geographic area.'
    ]
  );
}

function renderTable(id, parent, title, columns, rows, footnotes) {
  let c = document.createElement('div');
  let h = document.createElement('h4');
  h.innerHTML = title;

  let t = document.createElement('table');
  c.appendChild(h);
  c.appendChild(t);

  let tr = document.createElement('tr');
  columns.forEach((col) => {
    let th = document.createElement('th');
    let slug = col.toLowerCase()
      .replace('\n', '_')
      .replace(/[^\w\-]+/g, '');
    th.classList.add(`column-${slug}`);
    th.innerText = col;
    tr.appendChild(th);
  });
  t.appendChild(tr);

  rows.forEach((row) => {
    let tr = document.createElement('tr');
    row.forEach((col) => {
      let td = document.createElement('td');
      td.innerHTML = col || '<span class="na">N/A</span>';

      // hacky but ok
      if (typeof col == 'string' && col.includes('Rank')) {
        td.classList.add('column-rank');
      }

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

function renderPercent(val, flip) {
  if (!val) {
    return '<span class="na">N/A</span>';
  } else if (parseFloat(val) > 0) {
    return `<span class="${flip ? 'bad' : 'good'}">${val}↑</span>`;
  } else {
    return `<span class="${flip ? 'good' : 'bad'}">${val}↓</span>`;
  }
}

renderTables(tableStates.a);
renderTables(tableStates.b);
