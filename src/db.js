// DB-like interface
class SchoolDB {
  constructor() {
    this._schools = {};
    this._schoolsByKeyZip = {};
  }

  async school(id) {
    if (!(id in this._schools)) {
      this._schools[id] = await this._getSchool(id);
    }

    return Promise.resolve(this._schools[id]);
  }

  async schools(ids) {
    return Promise.all(ids.map((id) => this.school(id)))
      .then((schools) => schools.reduce((acc, school) => {
        acc[school.id] = school;
        return acc;
      }, {}));
  }

  async dataForKeyZip(key, zip) {
    let k = `${key}_${zip}`;
    if (!(k in this._schoolsByKeyZip)) {
      this._schoolsByKeyZip[k] = await this._getDataForKeyZip(key, zip);
    }
    return Promise.resolve(this._schoolsByKeyZip[k]);
  }

  _getSchool(id) {
    let url = `assets/schools/${id}.json`;
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
