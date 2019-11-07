import color from './color';

const legend = document.getElementById('legend');

class Legend {
  constructor(map, source, initProps, special, stats) {
    this.map = map;
    this.props = initProps;
    this.source = source;
    this.stats = stats;
    this.special = special;
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

  renderPoint(cls, vals) {
    // Focused feature indicator
    let pointEl = document.createElement('div');
    pointEl.classList.add(cls);
    document.querySelector('.legend--focus-point-host').appendChild(pointEl);

    let bivariate = this.props.length > 1;

    // Bivariate
    if (bivariate) {
      pointEl.classList.add('legend--bivariate-point');

      let [valA, valB] = vals;
      let [propA, propB] = this.props;
      let p_a = (valA-propA.range[0])/(propA.range[1] - propA.range[0]);
      let p_b = (valB-propB.range[0])/(propB.range[1] - propB.range[0]);

      let [flipA, flipB] = this.props.map((p) => p.legend && p.legend.flip);
      if (flipA) p_a = 1 - p_a;
      if (flipB) p_b = 1 - p_b;

      pointEl.style.left = `calc(${p_b*100}% - ${pointEl.clientWidth/2}px)`;
      pointEl.style.bottom = `calc(${p_a*100}% - ${pointEl.clientHeight/2}px)`;
      pointEl.style.display = 'block';

    // Univariate
    } else {
      pointEl.classList.add('legend--point');

      let [prop] = this.props;
      let [val] = vals;
      if (val) {
        let p = (val-prop.range[0])/(prop.range[1] - prop.range[0]);

        let flip = prop.legend && prop.legend.flip;
        if (flip) p = 1 - p;

        pointEl.style.display = 'block';
        pointEl.style.bottom = `calc(${p*100}% - ${pointEl.clientHeight/2}px)`;

      // Hide if no value
      } else {
        pointEl.style.display = 'none';
      }
    }
  }

  // Render points of data (i.e. features)
  // on the legend
  renderFeatures(feats) {
    this.hideFeatures();

    feats.forEach((feat) => {
      let vals = this.props.map((p) => feat.properties[p.key]);
      this.renderPoint('focus-point', vals);
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

  _stats() {
    // Summary statistics, if any
    if (this.stats) {
      this.stats.forEach((stat) => {
        let vals = this.props.map((p) => p.stats[stat]);
        this.renderPoint('stat-point', vals);
      });
    }
  }

  _special() {
    // Special keys, if any
    if (this.special) {
      let container = document.createElement('div');
      container.classList.add('legend--special');
      Object.keys(this.special).forEach((key) => {
        let color = this.special[key];
        let el = document.createElement('div');
        el.classList.add('legend--single');

        let box = document.createElement('div');
        box.classList.add('legend--single-color');
        box.style.background = color;

        let label = document.createElement('span');
        label.innerText = key;
        el.appendChild(box);
        el.appendChild(label);
        container.appendChild(el);
      });
      legend.appendChild(container);
    }
  }

  bivariate(propA, propB) {
    this.reset();
    legend.classList.add('legend--bivariate');

    let flipA = propA.legend && propA.legend.flip;
    let flipB = propB.legend && propB.legend.flip;

    let wrapper = document.createElement('div');
    wrapper.classList.add('legend--bivariate-wrapper');

    let colors = {
      a: propA.color,
      b: propB.color
    };
    let ranges = {
      a: propA.range,
      b: propB.range
    };

    let container = document.createElement('div');
    container.classList.add('legend--bivariate-container');

    let labels_a = document.createElement('div');
    labels_a.classList.add('legend--labels');

    let labelTexts_a = [Math.floor(ranges.a[0]), Math.ceil(ranges.a[1])];
    if (flipA) labelTexts_a.reverse();

    let upperLabel = document.createElement('div');
    upperLabel.innerText = labelTexts_a[1];
    labels_a.appendChild(upperLabel);

    let lowerLabel = document.createElement('div');
    lowerLabel.innerText = labelTexts_a[0];
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
        let I = flipA ? n - i - 1 : i;
        let J = flipB ? n - j - 1 : j;
        let x = I/(n-1);
        let y = ((n-1)-J)/(n-1);

        let aColor = color.interpolate(colors.a, y);
        let bColor = color.interpolate(colors.b, x);
        let mix = color.multiply(aColor, bColor);
        let rgb = color.RGBToCSS(mix);
        let cell = document.createElement('div');
        cell.classList.add('legend--cell')
        cell.style.background = rgb;
        cell.addEventListener('mouseenter', () => {
          let a_rng = ranges.a[1] - ranges.a[0];
          let a_l = ranges.a[0] + (a_rng * (n-J-1)/n);
          let a_u = ranges.a[0] + (a_rng * (n-J)/n);

          let b_rng = ranges.b[1] - ranges.b[0];
          let b_l = ranges.b[0] + (b_rng * I/n);
          let b_u = ranges.b[0] + (b_rng * (I+1)/n);

          // Select features _outside_ of this range,
          // to mute them
          let filter = ['any',
            ['<', propA.key, a_l],
            ['>', propA.key, a_u],
            ['<', propB.key, b_l],
            ['>', propB.key, b_u],
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

    let labelTexts_b = [Math.floor(ranges.b[0]), Math.ceil(ranges.b[1])];
    if (flipB) labelTexts_b.reverse();

    upperLabel = document.createElement('div');
    upperLabel.innerText = labelTexts_b[1];
    labels_b.appendChild(upperLabel);

    lowerLabel = document.createElement('div');
    lowerLabel.innerText = labelTexts_b[0];
    labels_b.appendChild(lowerLabel);

    gridContainer.appendChild(labels_b);

    container.appendChild(gridContainer);

    let a_label = document.createElement('div');
    a_label.innerText = propA.nick;
    a_label.classList.add('legend--bivariate-label');
    a_label.classList.add('legend--bivariate-label-a');
    gridContainer.appendChild(a_label);

    let b_label = document.createElement('div');
    b_label.innerText = propB.nick;
    b_label.classList.add('legend--bivariate-label');
    gridContainer.appendChild(b_label);

    wrapper.appendChild(container);
    legend.appendChild(wrapper);

    this._stats();
    this._special();
  }

  range(prop) {
    this.reset();

    let flip = prop.legend && prop.legend.flip;
    let gradient = prop.color;
    let range = prop.range;
    let rangeBar = document.createElement('div');
    rangeBar.classList.add('legend--bar');
    rangeBar.classList.add('legend--focus-point-host');
    let stops = Object.keys(gradient).map((stop) => parseFloat(stop)).sort();
    if (flip) stops.reverse();
    let gradientCss = stops.map((stop) => {
      return `${gradient[stop]} ${(flip ? 1-stop : stop)*100}%`;
    })
    rangeBar.style.background = `linear-gradient(0, ${gradientCss.join(', ')})`;

    let n = 4;
    for (let i=0; i<n; i++) {
      let bin = document.createElement('div');
      bin.classList.add('legend--bar-bin');
      bin.style.top = `${(flip ? n - i - 1 : i)*30}px`;
      bin.addEventListener('mouseenter', () => {
        let u = (n - i)/n * range[1];
        let l = (n - (i+1))/n * range[1];
        let filter = ['any',
          ['<', prop.key, l],
          ['>', prop.key, u],
        ];
        this.map.setFilter(this.source, filter, {mute: true}, {mute: false});
      });
      bin.addEventListener('mouseleave', () => {
        this.map.resetFilter(this.source, {mute: false});
      });
      rangeBar.appendChild(bin);
    }

    let title = document.createElement('div');
    title.classList.add('legend--title');
    title.innerText = prop.nick;

    let labels = document.createElement('div');
    labels.classList.add('legend--labels');

    let labelTexts = [Math.floor(range[0]), Math.ceil(range[1])];
    if (flip) labelTexts.reverse();

    let lowerLabel = document.createElement('div');
    lowerLabel.innerText = labelTexts[0];

    let upperLabel = document.createElement('div');
    upperLabel.innerText = labelTexts[1];

    labels.appendChild(upperLabel);
    labels.appendChild(lowerLabel);

    legend.appendChild(title);

    let wrapper = document.createElement('div');
    wrapper.classList.add('legend--range');
    wrapper.appendChild(rangeBar);
    wrapper.appendChild(labels);
    legend.appendChild(wrapper);

    this._stats();
    this._special();
  }
}

export default Legend;
