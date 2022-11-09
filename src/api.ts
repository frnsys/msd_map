// API-like interface
class API {
  _cache: {[key:string]: any};

  constructor() {
    this._cache = {};
  }

  async get(url: string) {
    if (!(url in this._cache)) {
      this._cache[url] = await this._get(url);
    }
    return Promise.resolve(this._cache[url]);
  }

  async _get(url: string) {
    return fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        method: 'GET',
      })
      .then((res) => {
        if (res.ok) {
          return res.json()
        } else {
          // Return empty obj on errors
          return {};
        }
      })
  }
}

export class FeatureAPI extends API {
  loa: string;
  prefix: string;

  constructor(loa: string, prefix?: string) {
    super();
    this.loa = loa;
    this.prefix = prefix || '.';
  }

  async dataForKeyPlace(key: string, placeId: string) {
    let url = `${this.prefix}/assets/maps/${this.loa}/by_cat/${key}/${placeId}.json`;
    return this.get(url);
  }

  async schoolsForPlace(placeId: string) {
    let url = `${this.prefix}/assets/maps/${this.loa}/schools/${placeId}.json`;
    return this.get(url);
  }
}

export class SchoolAPI extends API {
  async dataForSchool(id: string) {
    let url = `assets/maps/schools/${id}.json`;
    return this.get(url);
  }
}
