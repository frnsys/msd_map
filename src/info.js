import config from './config';

const infoEl = document.getElementById('info');

function explainFeature(html) {
  infoEl.innerHTML = html;
  infoEl.style.display = 'block';
}

function hide() {
  infoEl.style.display = 'none';
}

export default {explainFeature, hide};
