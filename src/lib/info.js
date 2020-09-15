class Info {
  constructor(id) {
    this.el = document.getElementById(id);
  }

  explainFeature(html) {
    this.el.innerHTML = html;
    this.el.style.display = 'block';
  }

  hide() {
    this.el.style.display = 'none';
  }
}

export default Info;
