import json
import pandas as pd
from glob import glob
from tqdm import tqdm

data = {}
df = pd.read_csv('msd_map_3_data.csv')
df = df.where((pd.notnull(df)), None)
for row in df.itertuples():
    zipcode = str(row.zipcode).zfill(5)
    assert len(zipcode) == 5
    row_data = dict(row._asdict())
    for k in ['Index', 'zipcode_s', 'zipcode']:
        row_data.pop(k)
    data[zipcode] = row_data

with open('msd_map_3_data.json', 'w') as f:
    json.dump(data, f)

merged = {
    'type': 'FeatureCollection',
    'features': []
}

for f in tqdm(glob('zipcodes/*.json')):
    gj = json.load(open(f))
    for f in gj['features']:
        zipcode = f['properties']['ZCTA5CE10']
        f['properties'] = dict(**data[zipcode])
        f['properties']['zipcode'] = zipcode
    merged['features'] += gj['features']

with open('zipcodes.geojson', 'w') as f:
    json.dump(merged, f)