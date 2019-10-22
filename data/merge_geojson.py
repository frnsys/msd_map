"""Merges zipcode geojson data
and also merges in other zipcode data.

Note: occurences of "." in a column name
are replaced w/ "_"
"""

import json
import pandas as pd
from glob import glob
from tqdm import tqdm
from shapely.geometry import shape

CATEGORIES = [
    'allschools',
    'public',
    'privnot4prof',
    'priv4prof',
    'bachelor',
    'associate',
    'belowassociate'
]
CSV_ZIPCODE_FIELD = 'zcta'
CSV_DEFAULTS = {
    'schools': 0,
    'SCI': 0,
    'avg_grosscost': None,
    'UNDUPUG': 0,
    'population_total': 0,
    'schools': []
}
CSV_UNCATEGORIZED_FIELDS = [
    'population_total'
]
CSV_CATEGORIZED_FIELDS = [
    'schools', 'SCI', 'avg_grosscost', 'UNDUPUG'
]
SCHOOL_FIELDS = [
    'INSTNM',
    'SECTOR',
    'ICLEVEL',
    'CONTROL',
]

data = {}
df = pd.read_csv('src/ZCTAlevel.csv')
df = df.where(pd.notnull(df), None)
for row in tqdm(df.itertuples(), total=len(df), desc='ZCTA csv'):
    row_data = dict(row._asdict())
    if row_data[CSV_ZIPCODE_FIELD] is None: continue
    zipcode = str(int(row_data[CSV_ZIPCODE_FIELD])).zfill(5)
    assert len(zipcode) == 5
    data[zipcode] = {}
    for k in CSV_UNCATEGORIZED_FIELDS:
        data[zipcode][k] = row_data[k]
    for k in CSV_CATEGORIZED_FIELDS:
        f = {}
        for cat in CATEGORIES:
            f[cat] = row_data['{}_{}'.format(k, cat)]
        data[zipcode][k] = f
    data[zipcode]['schools'] = []

# Compute ranges
meta = {}
meta['ranges'] = {}
for k in CSV_UNCATEGORIZED_FIELDS:
    meta['ranges'][k] = (
        float(df[k].min()),
        float(df[k].max())
    )
for k in CSV_CATEGORIZED_FIELDS:
    f = {}
    for cat in CATEGORIES:
        s = df['{}_{}'.format(k, cat)]
        f[cat] = (
            float(s.min()),
            float(s.max())
        )
    meta['ranges'][k] = f


# Load school data
schools = {}
schools_geojson = {
    'type': 'FeatureCollection',
    'features': []
}
df = pd.read_csv('src/Schoollevel.csv')
df = df.where((pd.notnull(df)), None)
for row in tqdm(df.itertuples(), total=len(df), desc='Schools csv'):
    row_data = dict(row._asdict())
    id = int(row_data['UNITID'])
    schools[id] = {k: row_data[k] for k in SCHOOL_FIELDS}
    schools_geojson['features'].append({
        'type': 'Feature',
        'geometry': {
            'type': 'Point',
            'coordinates': (row_data['LONGITUD'], row_data['LATITUDE']),
        },
        'properties': schools[id]
    })


# Associate schools with ZCTAs
df = pd.read_csv('src/2016schoolzones.csv')
df = df.where((pd.notnull(df)), None)
for row in tqdm(df.itertuples(), total=len(df), desc='School zones csv'):
    row_data = dict(row._asdict())
    if row_data[CSV_ZIPCODE_FIELD] is None: continue
    zipcode = str(int(row_data[CSV_ZIPCODE_FIELD])).zfill(5)
    assert len(zipcode) == 5

    unit_id = int(row_data['unitid'])
    data[zipcode]['schools'].append(unit_id)


# Compute bounding boxes for zipcodes
meta['bboxes'] = {}

geojson = {
    'type': 'FeatureCollection',
    'features': []
}

zipcode_files = glob('src/zipcodes/*.json')
for f in tqdm(zipcode_files, desc='Merging into geojson'):
    gj = json.load(open(f))
    for f in gj['features']:
        zipcode = f['properties']['ZCTA5CE10']
        try:
            f['properties'] = dict(**data[zipcode])
        except:
            f['properties'] = dict(**CSV_DEFAULTS)
        f['properties']['zipcode'] = zipcode
        f['properties']['n_schools'] = len(f['properties']['schools'])
        meta['bboxes'][zipcode] = shape(f['geometry']).bounds
    geojson['features'] += gj['features']


print('Saving files...')

with open('schools.geojson', 'w') as f:
    json.dump(schools_geojson, f)

with open('schools.json', 'w') as f:
    json.dump(schools, f)

with open('meta.json', 'w') as f:
    json.dump(meta, f)

with open('zctas.geojson', 'w') as f:
    json.dump(geojson, f)