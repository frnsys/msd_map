import createNumberLine from './numberLine';
import {data,meta} from '../data/gen/numberline.json';

console.log(data);

createNumberLine(
  '#income-number-line',
  'median-income',
  'Median Income (2018)',
  data['median_income'],
  meta['median_income']['range'],
  ['', '']
);
createNumberLine(
  '#debt-number-line',
  'median-debt',
  'Median Student Loan Debt (2019)',
  data['median_debt'],
  meta['median_debt']['range'],
  ['', '']
);
createNumberLine(
  '#change-number-line',
  'percent-change',
  'Percent Change in Median Student Loan Since 2009',
  data['2009_change'],
  meta['2009_change']['range'],
  ['', '']
);

// State selector for the number line
let states = Object.keys(data['median_income']);
let stateSelect = document.getElementById('number-line-select');
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
  [...document.querySelectorAll('.number-line--focused')].forEach((el) => {
    el.classList.remove('number-line--focused');
  });
  if (val !== 'all') {
    document.getElementById(`number-line--median-income-${val}`).classList.add('number-line--focused');
    document.getElementById(`number-line--median-debt-${val}`).classList.add('number-line--focused');
    document.getElementById(`number-line--percent-change-${val}`).classList.add('number-line--focused');
  }
});
