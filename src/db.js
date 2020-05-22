// DB-like interface
class SchoolDB {
  constructor() {
    this._schoolsByYear = {};
    this._schoolsByKeyZip = {};
  }

  async schoolsForYear(year) {
    if (!(year in this._schoolsByYear)) {
      this._schoolsByYear[year] = await this._getSchoolsForYear(year);
    }
    return Promise.resolve(this._schoolsByYear[year]);
  }

  async dataForKeyZip(key, zip) {
    let k = `${key}_${zip}`;
    if (!(k in this._schoolsByKeyZip)) {
      this._schoolsByKeyZip[k] = await this._getDataForKeyZip(key, zip);
    }
    return Promise.resolve(this._schoolsByKeyZip[k]);
  }

  _getSchoolsForYear(year) {
    let url = `assets/schools/${year}.json`;
    return this._get(url);
  }

  _getDataForKeyZip(key, zip) {
    let url = `assets/zips/${key}/${zip}.json`;
    return this._get(url);
  }

  _get(url) {
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

const db = new SchoolDB();

export default db;
