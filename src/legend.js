import color from './color';
import config from './config';

const legend = document.getElementById('legend');

class Legend {
  constructor(initProps) {
    this.props = initProps;
    this.set(initProps);
  }

  set(props) {
    // Bivariate
    if (props.length > 1) {
      let [propA, propB] = props;
      bivariate(propA, propB);
    } else {
      let [prop] = props;
      range(prop);
    }
    this.props = props;
  }

  // Render a point of data (i.e. a feature)
  // on the legend
  renderFeature(feat) {
    let pointEl = document.getElementById('focus-point');

    // Bivariate
    if (this.props.length > 1) {
      let [propA, propB] = this.props;
      let p_a = (feat.properties[propA]-config.RANGES[propA][0])/(config.RANGES[propA][1] - config.RANGES[propA][0]);
      let p_b = (feat.properties[propB]-config.RANGES[propB][0])/(config.RANGES[propB][1] - config.RANGES[propB][0]);
      pointEl.style.left = `calc(${p_b*100}% - ${pointEl.clientWidth/2}px)`;
      pointEl.style.bottom = `calc(${p_a*100}% - ${pointEl.clientHeight/2}px)`;
      pointEl.style.display = 'block';

    // Univariate
    } else {
      let [prop] = this.props;
      if (feat.properties[prop]) {
        let p = (feat.properties[prop]-config.RANGES[prop][0])/(config.RANGES[prop][1] - config.RANGES[prop][0]);
        pointEl.style.display = 'block';
        pointEl.style.bottom = `calc(${p*100}% - ${pointEl.clientHeight/2}px)`;

      // Hide if no value
      } else {
        pointEl.style.display = 'none';
      }
    }
  }

  hideFeature() {
    let pointEl = document.getElementById('focus-point');
    pointEl.style.display = 'none';
  }
}

function reset() {
  // Clear legend element
  while (legend.hasChildNodes()) {
    legend.removeChild(legend.lastChild);
  }
  legend.classList = '';
}

function bivariate(propA, propB) {
  reset();

  legend.classList.add('legend--bivariate');

  let colors = {
    a: config.COLORS[propA],
    b: config.COLORS[propB],
  };
  let ranges = {
    a: config.RANGES[propA],
    b: config.RANGES[propB]
  };

  let container = document.createElement('div');
  container.classList.add('legend--bivariate-container');

  let labels_a = document.createElement('div');
  labels_a.classList.add('legend--labels');

  let upperLabel = document.createElement('div');
  upperLabel.innerText = ranges.a[1];
  labels_a.appendChild(upperLabel);

  let lowerLabel = document.createElement('div');
  lowerLabel.innerText = ranges.a[0];
  labels_a.appendChild(lowerLabel);
  container.appendChild(labels_a);

  // 3x3
  let n = 3;

  let gridContainer = document.createElement('div');
  gridContainer.classList.add('legend--grid-container');

  let grid = document.createElement('div');
  grid.classList.add('legend--grid');
  for (let i=0; i<n; i++) {
    let col = document.createElement('div');
    for (let j=0; j<n; j++) {
      let x = i/(n-1);
      let y = ((n-1)-j)/(n-1);

      let aColor = color.interpolate(colors.a, x);
      let bColor = color.interpolate(colors.b, y);
      let mix = color.multiply(aColor, bColor);
      let rgb = color.colorToRGB(mix);
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

  container.appendChild(gridContainer);

  // Focused feature indicator
  let pointEl = document.createElement('div');
  pointEl.id = 'focus-point';
  pointEl.classList.add('legend--bivariate-point');
  grid.appendChild(pointEl);

  let a_label = document.createElement('div');
  a_label.innerText = config.SHORT_NAMES[propA];
  a_label.classList.add('legend--bivariate-label');
  a_label.classList.add('legend--bivariate-label-a');
  gridContainer.appendChild(a_label);

  let b_label = document.createElement('div');
  b_label.innerText = config.SHORT_NAMES[propB];
  b_label.classList.add('legend--bivariate-label');
  gridContainer.appendChild(b_label);

  legend.appendChild(container);
}


function range(prop) {
  reset();

  let [startColor, endColor] = config.COLORS[prop];
  let range = config.RANGES[prop];
  let rangeBar = document.createElement('div');
  rangeBar.classList.add('legend--bar');
  rangeBar.style.background = `linear-gradient(0, ${color.colorToRGB(startColor)} 0%, ${color.colorToRGB(endColor)} 100%)`;

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


export default Legend;
