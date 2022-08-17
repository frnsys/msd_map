class Info {
  el: HTMLElement

  constructor(id: string) {
    this.el = document.getElementById(id);
  }

  explainFeature(html: string) {
    this.el.innerHTML = html;
    this.el.style.display = 'block';
  }

  hide() {
    this.el.style.display = 'none';
  }
}

export default Info;
