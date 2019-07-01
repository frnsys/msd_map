import json
import pandas as pd

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