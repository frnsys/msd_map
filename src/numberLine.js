function createNumberLine(selector, slug, name, data, range, labels, fmtRange, linked) {
  let parent = document.querySelector(selector);
  let container = document.createElement('div');
  container.style.width = '100%';
  container.style.height = '70px';
  container.classList.add('number-line');
  parent.appendChild(container);

  let title = document.createElement('div');
  title.innerText = name;
  title.style.textAlign = 'center';
  title.style.margin = '1em 0';
  title.style.fontSize = '1.2em';
  container.appendChild(title);

  let thickness = 2;
  let line = document.createElement('div');
  line.style.height = `${thickness}px`;
  line.style.background = '#ddd';
  line.style.position = 'relative';
  container.appendChild(line);

  let legend = document.createElement('div');
  legend.style.display = 'flex';
  legend.style.justifyContent = 'space-between';
  let leftLabel = document.createElement('div');
  leftLabel.innerHTML = `${fmtRange(range[0])}<br />${labels[0]}`;
  legend.appendChild(leftLabel);
  let rightLabel = document.createElement('div');
  rightLabel.innerHTML = `${fmtRange(range[1])}<br />${labels[1]}`;
  rightLabel.style.textAlign = 'right';
  legend.appendChild(rightLabel);
  container.appendChild(legend);

  let tooltip = document.createElement('div');
  tooltip.style.display = 'none';
  tooltip.style.position = 'absolute';
  tooltip.style.zIndex = 10;
  tooltip.style.padding = '0.5em';
  tooltip.style.position = 'absolute';
  tooltip.style.background = '#333333';
  tooltip.style.minWidth = '100px';
  tooltip.style.color = '#fff';
  line.appendChild(tooltip);

  let radius = 12;
  let top = radius/2 - thickness/2;

  function showTooltip(key) {
    let p = lefts[key];
    tooltip.style.display = 'block';
    tooltip.style.left = `calc(${p*100}% + ${radius/2}px)`;
    tooltip.style.top = `${top}px`;
    tooltip.innerText = `${key}: ${data[key]['label']} (Rank: ${data[key]['rank']})`;
    [...document.querySelectorAll(`[data-key=${key}]`)].forEach((el) => {
      el.classList.add('number-line--hovered');
    });
  }
  function hideTooltip(key) {
    [...document.querySelectorAll(`[data-key=${key}]`)].forEach((el) => {
      el.classList.remove('number-line--hovered');
    });
    tooltip.style.display = 'none';
  }


  let lefts = {};
  Object.keys(data).forEach((key) => {
    let val = data[key]['val'];
    let p = (val-range[0])/(range[1] - range[0]);
    lefts[key] = p;
  });

  Object.keys(data).forEach((key) => {
    let p = lefts[key];
    let point = document.createElement('div');
    point.style.position = 'absolute';
    point.style.height = `${radius}px`;
    point.style.width = `${radius}px`;
    point.style.borderRadius = '100%';
    point.style.background = '#5D5DB6';
    point.style.border = '2px solid #000';
    point.style.left = `${p*100}%`;
    point.style.top = `-${top}px`;
    point.classList.add('number-line--point');
    point.id = `number-line--${slug}-${key}`;
    point.dataset.key = key;

    point.addEventListener('mouseenter', () => {
      point.classList.add('number-line--hovered');
      showTooltip(key);
      linked.forEach((l) => l.showTooltip(key));
    });
    point.addEventListener('mouseleave', () => {
      point.classList.remove('number-line--hovered');
      hideTooltip(key);
      linked.forEach((l) => l.hideTooltip(key));
    });

    line.appendChild(point);
  });

  return {
    showTooltip,
    hideTooltip
  };
}

export default createNumberLine;
