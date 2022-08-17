// API-like interface
class API {
  loa: string;
  prefix: string;
  _cache: {[key:string]: any};

  constructor(loa: string, prefix?: string) {
    this.loa = loa;
    this.prefix = prefix || '.';
    this._cache = {};
  }

  async dataForKeyPlace(key: string, placeId: string) {
    let k = `${key}_${placeId}`;
    if (!(k in this._cache)) {
      this._cache[k] = await this._getDataForKeyPlace(key, placeId);
    }
    return Promise.resolve(this._cache[k]);
  }

  async _getDataForKeyPlace(key: string, placeId: string) {
    let url = `${this.prefix}/assets/maps/${this.loa}/by_cat/${key}/${placeId}.json`;
    return this._get(url);
  }

  async _get(url: string) {
    return fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        method: 'GET',
      })
      .then(res => res.json())
      .catch(err => { console.log(err) });
  }
}

export default API;
