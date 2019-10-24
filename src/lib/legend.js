import color from './color';

const legend = document.getElementById('legend');

class Legend {
  constructor(map, colors, ranges, labels, source, initProps) {
    this.map = map;
    this.props = initProps;
    this.colors = colors;
    this.ranges = ranges;
    this.labels = labels;
    this.source = source;
    this.set(initProps);
  }

  set(props) {
    props = props.filter((p) => p);

    // Bivariate
    if (props.length > 1) {
      let [propA, propB] = props;
      this.bivariate(propA, propB);
    } else {
      let [prop] = props;
      this.range(prop);
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
        let p_a = (feat.properties[propA]-this.ranges[propA][0])/(this.ranges[propA][1] - this.ranges[propA][0]);
        let p_b = (feat.properties[propB]-this.ranges[propB][0])/(this.ranges[propB][1] - this.ranges[propB][0]);
        pointEl.style.left = `calc(${p_b*100}% - ${pointEl.clientWidth/2}px)`;
        pointEl.style.bottom = `calc(${p_a*100}% - ${pointEl.clientHeight/2}px)`;
        pointEl.style.display = 'block';

      // Univariate
      } else {
        pointEl.classList.add('legend--point');

        let [prop] = this.props;
        if (feat.properties[prop]) {
          let p = (feat.properties[prop]-this.ranges[prop][0])/(this.ranges[prop][1] - this.ranges[prop][0]);
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

  reset() {
    // Clear legend element
    while (legend.hasChildNodes()) {
      legend.removeChild(legend.lastChild);
    }
    legend.classList = '';
  }

  bivariate(propA, propB) {
    this.reset();

    legend.classList.add('legend--bivariate');

    let colors = {
      a: this.colors[propA],
      b: this.colors[propB],
    };
    let ranges = {
      a: this.ranges[propA],
      b: this.ranges[propB]
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
          this.map.setFilter(this.source, filter, {mute: true}, {mute: false});
        });
        cell.addEventListener('mouseleave', () => {
          this.map.resetFilter(this.source, {mute: false});
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
    a_label.innerText = this.labels[propA];
    a_label.classList.add('legend--bivariate-label');
    a_label.classList.add('legend--bivariate-label-a');
    gridContainer.appendChild(a_label);

    let b_label = document.createElement('div');
    b_label.innerText = this.labels[propB];
    b_label.classList.add('legend--bivariate-label');
    gridContainer.appendChild(b_label);

    legend.appendChild(container);
  }

  range(prop) {
    this.reset();

    let [startColor, endColor] = this.colors[prop];
    let range = this.ranges[prop];
    let rangeBar = document.createElement('div');
    rangeBar.classList.add('legend--bar');
    rangeBar.classList.add('legend--focus-point-host');
    rangeBar.style.background = `linear-gradient(0, ${color.colorToRGB(startColor)} 0%, ${color.colorToRGB(endColor)} 100%)`;

    let n = 4;
    for (let i=0; i<n; i++) {
      let bin = document.createElement('div');
      bin.classList.add('legend--bar-bin');
      bin.style.top = `${i*30}px`;
      bin.addEventListener('mouseenter', () => {
        let u = (n - i)/n * range[1];
        let l = (n - (i+1))/n * range[1];
        let filter = ['any',
          ['<', prop, l],
          ['>', prop, u],
        ];
        this.map.setFilter(this.source, filter, {mute: true}, {mute: false});
      });
      rangeBar.appendChild(bin);
    }

    let title = document.createElement('div');
    title.classList.add('legend--title');
    title.innerText = this.labels[prop];

    let labels = document.createElement('div');
    labels.classList.add('legend--labels');

    let lowerLabel = document.createElement('div');
    lowerLabel.innerText = range[0];

    let upperLabel = document.createElement('div');
    upperLabel.innerText = range[1];

    labels.appendChild(upperLabel);
    labels.appendChild(lowerLabel);

    legend.appendChild(title);

    let wrapper = document.createElement('div');
    wrapper.classList.add('legend--range');
    wrapper.appendChild(rangeBar);
    wrapper.appendChild(labels);
    legend.appendChild(wrapper);
  }
}

export default Legend;
