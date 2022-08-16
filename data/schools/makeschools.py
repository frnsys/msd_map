import os
import json
import pandas as pd
from tqdm import tqdm
from collections import defaultdict

SCHOOL_FIELDS = [
    'MAPNAME',
    'INSTNM',
    'SECTOR',
    'ICLEVEL',
    'CONTROL',
    'UNDUPUG',
    'ENROLLED',

    'CINSON',
    'CINSOFF',
    'CINSFAM',

    'PSET4FLG',

    'NPIS412',
    'NPIS422',
    'NPIS432',
    'NPIS442',
    'NPIS452',

    'AVGNETPRICE',
]

# Keep only non-varying properties
# for school geojson
SCHOOL_GEOJSON_PROPS = [
    'id',
    'MAPNAME',
    'INSTNM', 'ZIP',

    # Needed for proper coloring of school points
    'ICLEVEL', 'CONTROL',
]


CATEGORIES = {
    'S': [
        'allschools',
        'public',
        'privnot4prof',
        'priv4prof',
        'bachelor',
        'associate',
        'belowassociate'
    ],
    'I': [
        '30min',
        '45min',
        '60min'
    ],
    'Y': [
        '2008',
        '2009',
        '2010',
        '2011',
        '2012',
        '2013',
        '2014',
        '2015',
        '2016',
        '2017',
    ]
}

schools_by_year = defaultdict(dict)
school_feats = {}
schools_geojson = {
    'type': 'FeatureCollection',
    'features': []
}


# School-level
all_years = pd.read_csv('src/master_05.01.2020.csv',
        encoding='ISO-8859-1',
        dtype={'YEAR': str, 'ZIP': str})

unitid_to_featid = {}
for i, unitid in enumerate(all_years['UNITID'].unique()):
    unitid_to_featid[unitid] = i

all_years = all_years.groupby('YEAR')
for y in CATEGORIES['Y']:
    # TODO these are overwriting each year atm
    df = all_years.get_group(y)
    df = df.where((pd.notnull(df)), None)
    for row in tqdm(df.itertuples(), total=len(df), desc='{} School List'.format(y)):
        row_data = dict(row._asdict())
        id = unitid_to_featid[row_data['UNITID']]

        # Get zipcode into proper format
        zipcode = row_data['ZIP']
        zipcode = zipcode.split('-')[0] # drop the -XXXX part of zip
        if len(zipcode) < 5:
            zipcode = str(int(zipcode)).zfill(5)

        schools_by_year[id][y] = {k: row_data[k] for k in SCHOOL_FIELDS}
        schools_by_year[id][y]['ZIP'] = zipcode
        schools_by_year[id][y]['id'] = id

        if id not in school_feats:
            props = {k: schools_by_year[id][y][k] for k in SCHOOL_GEOJSON_PROPS}
            props['years'] = []
            school_feats[id] = {
                'id': id,
                'type': 'Feature',
                'geometry': {
                    'type': 'Point',
                    'coordinates': (row_data['LONGITUD'], row_data['LATITUDE']),
                },
                'properties': props
            }
        school_feats[id]['properties']['years'].append(y)

for school in school_feats.values():
    school['properties']['years'] = ','.join(school['properties']['years'])
    schools_geojson['features'].append(school)

if not os.path.exists('gen/schools'):
    os.makedirs('gen/schools')
for id, school in schools_by_year.items():
    school['id'] = id
    with open('gen/schools/{}.json'.format(id), 'w') as f:
        json.dump(school, f)

with open('gen/schools.geojson', 'w') as f:
    json.dump(schools_geojson, f)
