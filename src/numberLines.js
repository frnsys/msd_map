// Used for the PW blogpost
import numberline from './map/numberline';
import dataset from '../data/gen/numberline.json';

const state = {
  state: 'all',
};

let formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

function createNumberLinesForKey(key) {
  let numberLines = [];
  let {data, meta} = dataset['median'][key];

  // Only show income for all groups
  if (key == 'all') {
    document.getElementById('income-number-line').style.display = 'block';
    let income = numberline.createNumberLine(
      '#income-number-line',
      'median-income',
      'Median Income (2018)',
      null,
      data['income'],
      meta['income']['range'],
      ['', ''],
      (val) => formatter.format(val),
      numberLines
    );
    numberLines.push(income);
  } else {
    document.getElementById('income-number-line').style.display = 'none';
  }
  let debt = numberline.createNumberLine(
    '#debt-number-line',
    'median-debt',
    'Median Student Loan Debt (2019)',
    null,
    data['debt'],
    meta['debt']['range'],
    ['', ''],
    (val) => formatter.format(val),
    numberLines
  );
  numberLines.push(debt);
  let change = numberline.createNumberLine(
    '#change-number-line',
    'percent-change',
    'Percent Change in Median Student Loan Since 2009',
    null,
    data['change'],
    meta['change']['range'],
    ['', ''],
    (val) => `${val}%`,
    numberLines
  );
  numberLines.push(change);

  numberline.highlightState(state.state);
}

createNumberLinesForKey('all');

// State selector for the number line
let states = Object.keys(dataset['median']['all']['data']['income']);
let stateSelect = document.getElementById('number-line-state-select');
let allStates = document.createElement('option');
allStates.innerText = 'All States';
allStates.value = 'all';
stateSelect.append(allStates);
states.sort((a, b) => a.localeCompare(b)).forEach((key) => {
  let opt = document.createElement('option');
  opt.innerText = key;
  opt.value = key;
  stateSelect.append(opt);
});
stateSelect.addEventListener('change', (ev) => {
  let val = ev.target.value;
  state.state = val;
  numberline.highlightState(val);
});

// Select dataset to show
[...document.querySelectorAll('#number-line-type-select button')].forEach((el) => {
  el.addEventListener('click', (ev) => {
    document.querySelector('#number-line-type-select button.selected').classList.remove('selected');
    el.classList.add('selected');
    let key = el.dataset.value;
    createNumberLinesForKey(key);
  });
});
