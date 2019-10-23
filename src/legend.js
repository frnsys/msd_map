import color from './color';
import config from './config';

const legend = document.getElementById('legend');

class Legend {
  constructor(map, initProps) {
    this.map = map;
    this.props = initProps;
    this.set(initProps);
  }

  set(props) {
    props = props.filter((p) => p);

    // Bivariate
    if (props.length > 1) {
      let [propA, propB] = props;
      bivariate(this.map, propA, propB);
    } else {
      let [prop] = props;
      range(prop);
    }
    this.props = props;
  }

  // Render points of data (i.e. features)
  // on the legend
  renderFeatures(feats) {
    this.hideFeatures();

    let bivariate = this.props.length > 1;
    feats.forEach((feat) => {
      // Focused feature indicator
      let pointEl = document.createElement('div');
      pointEl.classList.add('focus-point');
      document.querySelector('.legend--focus-point-host').appendChild(pointEl);

      // Bivariate
      if (bivariate) {
        pointEl.classList.add('legend--bivariate-point');

        let [propA, propB] = this.props;
        let p_a = (feat.properties[propA]-config.RANGES[propA][0])/(config.RANGES[propA][1] - config.RANGES[propA][0]);
        let p_b = (feat.properties[propB]-config.RANGES[propB][0])/(config.RANGES[propB][1] - config.RANGES[propB][0]);
        pointEl.style.left = `calc(${p_b*100}% - ${pointEl.clientWidth/2}px)`;
        pointEl.style.bottom = `calc(${p_a*100}% - ${pointEl.clientHeight/2}px)`;
        pointEl.style.display = 'block';

      // Univariate
      } else {
        pointEl.classList.add('legend--point');

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
    });
  }

  renderFeature(feat) {
    this.renderFeatures([feat]);
  }

  hideFeatures() {
    [...document.querySelectorAll('.focus-point')].forEach((el) => {
      el.remove();
    });
  }
}

function reset() {
  // Clear legend element
  while (legend.hasChildNodes()) {
    legend.removeChild(legend.lastChild);
  }
  legend.classList = '';
}

function bivariate(map, propA, propB) {
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
  grid.classList.add('legend--focus-point-host');
  for (let i=0; i<n; i++) {
    let col = document.createElement('div');
    for (let j=0; j<n; j++) {
      let x = i/(n-1);
      let y = ((n-1)-j)/(n-1);

      let aColor = color.interpolate(colors.a, y);
      let bColor = color.interpolate(colors.b, x);
      let mix = color.multiply(aColor, bColor);
      let rgb = color.colorToRGB(mix);
      let cell = document.createElement('div');
      cell.classList.add('legend--cell')
      cell.style.background = rgb;
      cell.addEventListener('mouseenter', () => {
        let a_rng = ranges.a[1] - ranges.a[0];
        let a_l = ranges.a[0] + (a_rng * (n-j-1)/n);
        let a_u = ranges.a[0] + (a_rng * (n-j)/n);

        let b_rng = ranges.b[1] - ranges.b[0];
        let b_l = ranges.b[0] + (b_rng * i/n);
        let b_u = ranges.b[0] + (b_rng * (i+1)/n);

        // Select features _outside_ of this range,
        // to mute them
        let filter = ['any',
          ['<', propA, a_l],
          ['>', propA, a_u],
          ['<', propB, b_l],
          ['>', propB, b_u],
        ];
        map.setFilter(filter, {mute: true}, {mute: false});
      });
      cell.addEventListener('mouseleave', () => {
        map.resetFilter({mute: false});
      });
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
  rangeBar.classList.add('legend--focus-point-host');
  rangeBar.style.background = `linear-gradient(0, ${color.colorToRGB(startColor)} 0%, ${color.colorToRGB(endColor)} 100%)`;

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
