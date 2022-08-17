import Map from './map';
import color from './color';

class Legend {
  el: HTMLElement;
  map: Map;
  props: Prop[];
  source: MapSource;
  special: Colors;
  stats: string[];

  constructor(id: string, map: Map, source: MapSource, initProps: Prop[], special: Colors, stats: string[]) {
    this.el = document.getElementById(id);
    this.map = map;
    this.props = initProps;
    this.source = source;
    this.stats = stats;
    this.special = special;
    this.set(initProps);
  }

  set(props: Prop[]) {
    this.props = props.filter((p) => p);

    // Bivariate
    if (this.props.length > 1) {
      let [propA, propB] = this.props;
      this.bivariate(propA, propB);
    } else {
      let [prop] = this.props;
      this.range(prop);
    }
  }

  renderPoint(cls: string, vals: number[]) {
    // Focused feature indicator
    let pointEl = document.createElement('div');
    pointEl.classList.add(cls);
    this.el.querySelector('.legend--focus-point-host').appendChild(pointEl);

    let bivariate = this.props.length > 1;

    // Bivariate
    if (bivariate) {
      pointEl.classList.add('legend--bivariate-point');

      let [valA, valB] = vals;
      let [propA, propB] = this.props;
      let p_a = (valA-propA.range[0])/(propA.range[1] - propA.range[0]);
      let p_b = (valB-propB.range[0])/(propB.range[1] - propB.range[0]);
      p_a = Math.max(Math.min(p_a, 1), 0);
      p_b = Math.max(Math.min(p_b, 1), 0);

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
        p = Math.max(Math.min(p, 1), 0);

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
  renderFeatures(feats: MapFeature[]) {
    this.hideFeatures();

    feats.forEach((feat) => {
      let vals = this.props.map((p) => feat.properties[p.key]);
      this.renderPoint('focus-point', vals);
    });
  }

  renderFeature(feat: MapFeature) {
    this.renderFeatures([feat]);
  }

  hideFeatures() {
    Array.from(this.el.querySelectorAll('.focus-point')).forEach((el) => {
      el.remove();
    });
  }

  reset() {
    // Clear legend element
    while (this.el.hasChildNodes()) {
      this.el.removeChild(this.el.lastChild);
    }
    this.el.className = 'legend';
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
    let specs = [this.special].concat(this.props.map((p) => (p.legend || {}).special || {}));
    let special = specs.reduce((acc, s) => {
      Object.keys(s).forEach((k) => acc[k] = s[k]);
      return acc;
    }, {});
    if (Object.keys(special).length) {
      let container = document.createElement('div');
      container.classList.add('legend--special');
      Object.keys(special).forEach((key) => {
        let color = special[key];
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
      this.el.appendChild(container);
    }
  }

  bivariate(propA: Prop, propB: Prop) {
    this.reset();
    this.el.classList.add('legend--bivariate');

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

    let legend_a = propA.legend;
    let labelTexts_a = [
      legend_a.minClamped ? `≤${Math.floor(ranges.a[0])}` : Math.floor(ranges.a[0]),
      legend_a.maxClamped ? `≥${Math.ceil(ranges.a[1])}` : Math.ceil(ranges.a[1]),
    ];
    if (flipA) labelTexts_a.reverse();

    let upperLabel = document.createElement('div');
    upperLabel.innerText = labelTexts_a[1].toString();
    labels_a.appendChild(upperLabel);

    let lowerLabel = document.createElement('div');
    lowerLabel.innerText = labelTexts_a[0].toString();
    labels_a.appendChild(lowerLabel);
    container.appendChild(labels_a);

    // 5x5
    let n = 5;

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
          // j -> a
          let a_rng = ranges.a[1] - ranges.a[0];
          let a_l = ranges.a[0] + (a_rng * (n-J-1)/n);
          let a_u = ranges.a[0] + (a_rng * (n-J)/n);

          // i -> b
          let b_rng = ranges.b[1] - ranges.b[0];
          let b_l = ranges.b[0] + (b_rng * I/n);
          let b_u = ranges.b[0] + (b_rng * (I+1)/n);

          // Select features _outside_ of this range,
          // to mute them
          let filter: any[] = ['any'];

          // If it's the lowest, include anything below the upper range (i.e. <=u)
          // If it's the highest, include anything above the lower range (i.e. >=l)
          if (i == n-1) {
            filter.push(['>', propB.key, b_u]);
          } else if (i == 0) {
            filter.push(['<', propB.key, b_l]);
          } else {
            filter.push(['<', propB.key, b_l]);
            filter.push(['>', propB.key, b_u]);
          }

          if (j == n-1) {
            filter.push(['>', propA.key, a_u]);
          } else if (j == 0) {
            filter.push(['<', propA.key, a_l]);
          } else {
            filter.push(['<', propA.key, a_l]);
            filter.push(['>', propA.key, a_u]);
          }

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

    let legend_b = propB.legend;
    let labelTexts_b = [
      legend_b.minClamped ? `≤${Math.floor(ranges.b[0])}` : Math.floor(ranges.b[0]),
      legend_b.maxClamped ? `≥${Math.ceil(ranges.b[1])}` : Math.ceil(ranges.b[1]),
    ];

    if (flipB) labelTexts_b.reverse();

    upperLabel = document.createElement('div');
    upperLabel.innerText = labelTexts_b[1].toString();
    labels_b.appendChild(upperLabel);

    lowerLabel = document.createElement('div');
    lowerLabel.innerText = labelTexts_b[0].toString();
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
    this.el.appendChild(wrapper);

    this._stats();
    this._special();
  }

  range(prop: Prop) {
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

        // If it's the lowest, include anything below the upper range (i.e. <=u)
        if (i == n-1) {
          filter = ['any', ['>', prop.key, u]];

        // If it's the highest, include anything above the lower range (i.e. >=l)
        } else if (i == 0) {
          filter = ['any', ['<', prop.key, l]];
        }
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

    let legendSpec = prop.legend;
    let labelTexts = [
      legendSpec.minClamped ? `≤${Math.floor(range[0])}` : Math.floor(range[0]),
      legendSpec.maxClamped ? `≥${Math.ceil(range[1])}` : Math.ceil(range[1]),
    ];

    if (flip) labelTexts.reverse();

    let lowerLabel = document.createElement('div');
    lowerLabel.innerText = labelTexts[0].toString();

    let upperLabel = document.createElement('div');
    upperLabel.innerText = labelTexts[1].toString();

    labels.appendChild(upperLabel);
    labels.appendChild(lowerLabel);

    this.el.appendChild(title);

    let wrapper = document.createElement('div');
    wrapper.classList.add('legend--range');
    wrapper.appendChild(rangeBar);
    wrapper.appendChild(labels);
    this.el.appendChild(wrapper);

    this._stats();
    this._special();
  }
}

export default Legend;
