import os
import json
import simplejson
import pandas as pd
from tqdm import tqdm
from hashlib import md5
from collections import defaultdict

LOAS = {
    'county': {
        'file': 'src/schools/map_data_countyschoolzones_2022_45min.csv',
        'feat_id_fields': ['STATEFP', 'County']
    },
    'state': {
        'file': 'src/schools/map_data_stateschoolzones_2022_45min.csv',
        'feat_id_fields': ['STATEFP']
    },
    'zcta': {
        'file': 'src/schools/map_data_zctaschoolzones_2022_45min.csv',
        'feat_id_fields': ['ZCTA']
    }
}

# Keep only non-varying properties
# for school geojson
SCHOOL_GEOJSON_PROPS = [
    # Needed for proper coloring of school points
    'ICLEVEL', 'CONTROL',
]
QUERY_FIELDS = [
    'MAPNAME',
    'Degree-seeking Undergraduates',
    'Graduate Students',
    'Tuition & Fees',
]

# Fields from which to generate an ID
ID_FIELDS = [
    'MAPNAME',
    'LATITUDE',
    'LONGITUD',
]

df = pd.read_csv('src/schools/map_data_schools_2022.csv')

query_data = {}
geojson = {
    'type': 'FeatureCollection',
    'features': []
}

def gen_id(data):
    inp = '-'.join(str(data[f]) for f in ID_FIELDS).encode('utf8')
    return md5(inp).hexdigest()[:8]

for i, row in tqdm(df.iterrows(), total=len(df), desc='School List'):
    # Create an id
    id = gen_id(row)

    props = {k: row[k] for k in SCHOOL_GEOJSON_PROPS}
    props['id'] = id # See note below
    geojson['features'].append({
        'id': id, # These ids are converted to undefined when loaded by mapbox?
        'type': 'Feature',
        'geometry': {
            'type': 'Point',
            'coordinates': (row['LONGITUD'], row['LATITUDE']),
        },
        'properties': props
    })

    data = {k: row[k] for k in QUERY_FIELDS}
    query_data[id] = data

# Query data
os.makedirs('gen/schools', exist_ok=True)
for id, school in query_data.items():
    with open('gen/schools/{}.json'.format(id), 'w') as f:
        simplejson.dump(school, f, ignore_nan=True)

# Geojson
with open('gen/schools.geojson', 'w') as f:
    json.dump(geojson, f)

# Schools for each feature
for loa, spec in LOAS.items():
    schools_for_feats = defaultdict(list)

    dtype = {k: object for k in spec['feat_id_fields']}
    df = pd.read_csv(spec['file'], dtype=dtype)
    for i, row in tqdm(df.iterrows(), total=len(df), desc=f'Schools for "{loa}"'):
        id = gen_id(row)

        feat_id = row[spec['feat_id_fields']].str.cat()
        schools_for_feats[feat_id].append(id)

    os.makedirs(f'gen/{loa}/schools', exist_ok=True)
    for feat_id, schools in schools_for_feats.items():
        with open(f'gen/{loa}/schools/{feat_id}.json', 'w') as f:
            json.dump(schools, f)
