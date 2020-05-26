import createNumberLine from './numberLine';
import states from '../data/gen/states.json';

createNumberLine('#sci-number-line', 'Median School Concentration', states['sci'], [0, 10000], ['Pure Competition', 'Pure Monopoly']);
createNumberLine('#enrollment-number-line', 'Total Enrollment', states['enrollment'], [0, Math.max(...Object.values(states['enrollment']))], ['', '']);

// State selector for the number line
let sciStateSelect = document.getElementById('sci-number-line-select');
let allStates = document.createElement('option');
allStates.innerText = 'All States';
allStates.value = 'all';
sciStateSelect.append(allStates);
Object.keys(states['sci']).sort((a, b) => a.localeCompare(b)).forEach((key) => {
  let opt = document.createElement('option');
  opt.innerText = key;
  opt.value = key;
  sciStateSelect.append(opt);
});
sciStateSelect.addEventListener('change', (ev) => {
  let val = ev.target.value;
  [...document.querySelectorAll('.number-line--focused')].forEach((el) => {
    el.classList.remove('number-line--focused');
  });
  if (val !== 'all') {
    document.getElementById(`number-line--median-school-concentration-${val}`).classList.add('number-line--focused');
    document.getElementById(`number-line--total-enrollment-${val}`).classList.add('number-line--focused');
  }
});
