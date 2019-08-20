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

CSV_FILE = '2016schoolzones.csv'
CSV_ZIPCODE_FIELD = 'ZCTA5CE10'
CSV_FIELDS = ['SCI', 'n', 'average_tuition', 'EFTOTAL_overall', 'HD01_S001']
CSV_DEFAULTS = {
    'SCI': 0,
    'n': 0,
    'average_tuition': None,
    'EFTOTAL_overall': 0,
    'HD01_S001': 0
}

data = {}
df = pd.read_csv(CSV_FILE)
df_len = len(df)
df.columns = df.columns.str.replace('.', '_')
df = df.where((pd.notnull(df)), None)
print('Dropped {} rows w/ nan'.format(df_len - len(df)))
for row in tqdm(df.itertuples(), total=len(df), desc='Processing CSV'):
    row_data = dict(row._asdict())
    zipcode = str(row_data[CSV_ZIPCODE_FIELD]).zfill(5)
    assert len(zipcode) == 5
    data[zipcode] = {k: row_data[k] for k in CSV_FIELDS}

meta = {}
meta['ranges'] = {k: [
    float(df[k].min()),
    float(df[k].max())
] for k in CSV_FIELDS}
meta['bboxes'] = {}

merged = {
    'type': 'FeatureCollection',
    'features': []
}

zipcode_files = glob('zipcodes/*.json')
for f in tqdm(zipcode_files, desc='Merging into geojson'):
    gj = json.load(open(f))
    for f in gj['features']:
        zipcode = f['properties']['ZCTA5CE10']
        try:
            f['properties'] = dict(**data[zipcode])
        except:
            f['properties'] = dict(**CSV_DEFAULTS)
        f['properties']['zipcode'] = zipcode
        meta['bboxes'][zipcode] = shape(f['geometry']).bounds
    merged['features'] += gj['features']

with open('msd_meta.json', 'w') as f:
    json.dump(meta, f)

with open('msd.geojson', 'w') as f:
    json.dump(merged, f)