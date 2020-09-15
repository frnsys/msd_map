// DB-like interface
class SchoolDB {
  constructor(loa, config) {
    this.loa = loa;
    this.config = config;
    this._schools = {};
    this._schoolsByKeyPlace = {};
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

  async dataForKeyPlace(key, place) {
    let k = `${key}_${place}`;
    if (!(k in this._schoolsByKeyPlace)) {
      this._schoolsByKeyPlace[k] = await this._getDataForKeyPlace(key, place);
    }
    return Promise.resolve(this._schoolsByKeyPlace[k]);
  }

  _getSchool(id) {
    let url = `assets/schools/${id}.json`;
    return this._get(url);
  }

  _getDataForKeyPlace(key, place) {
    let url = `assets/maps/${this.loa}/by_cat/${key}/${place}.json`;
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

export default SchoolDB;
