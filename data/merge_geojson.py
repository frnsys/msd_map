"""Merges zipcode geojson data
and also merges in other zipcode data.

Note: occurences of "." in a column name
are replaced w/ "_"
"""

import json
import fiona
import pandas as pd
from tqdm import tqdm
from shapely.geometry import shape
from collections import defaultdict

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
CSV_UNCATEGORIZED_FIELDS = [
    'population_total'
]
CSV_CATEGORIZED_FIELDS = [
    'schools', 'SCI', 'avg_grosscost', 'UNDUPUG'
]
CSV_DEFAULTS = {
    'population_total': 0,
    'SCI': 0
}
for k in CSV_CATEGORIZED_FIELDS:
    for cat in CATEGORIES:
        CSV_DEFAULTS['{}.{}'.format(k, cat)] = CSV_DEFAULTS.get(k, 0)

SCHOOL_FIELDS = [
    'INSTNM',
    'SECTOR',
    'ICLEVEL',
    'CONTROL',
    'UNDUPUG',
    'ZIP'
]

# ISO A2
COUNTRIES = [
    'US',
    'PR',
    'AS',
    'GU',
    'MP',
    'VI'
]
STATES = [
    'Alaska',
    'Hawaii'
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

    # Would rather these properly nested,
    # but need to stay flat b/c geojson
    # can't handle nesting
    for k in CSV_CATEGORIZED_FIELDS:
        for cat in CATEGORIES:
            ck = '{}.{}'.format(k, cat)
            val = row_data['{}_{}'.format(k, cat)]
            data[zipcode][ck] = val

            if k == 'SCI' and val == None:
                if val == None:
                    data[zipcode][ck] = 0

# Compute ranges
meta = {}
meta['ranges'] = {}
for k in CSV_UNCATEGORIZED_FIELDS:
    meta['ranges'][k] = (
        float(df[k].min()),
        float(df[k].max())
    )
for k in CSV_CATEGORIZED_FIELDS:
    vals = []
    # Get min/max across all categories
    for cat in CATEGORIES:
        s = df['{}_{}'.format(k, cat)]
        vals.append(float(s.min()))
        vals.append(float(s.max()))

    if k == 'SCI':
        # Using 0 as a null value, so ignore
        min_vals = [v for v in vals if v > 0]
        meta['ranges'][k] = (min(min_vals), max(vals))
    else:
        meta['ranges'][k] = (min(vals), max(vals))

# Compute summary statistics
for s in ['mean', 'median', 'min', 'max']:
    meta[s] = {}
    for k in CSV_UNCATEGORIZED_FIELDS:
        meta[s][k] = float(getattr(df[k], s)())
    for k in CSV_CATEGORIZED_FIELDS:
        for cat in CATEGORIES:
            key = '{}_{}'.format(k, cat)
            if k == 'SCI':
                # Using 0 as a null value, so ignore
                d = df[key][df[key] > 0]
            else:
                d = df[key]
            meta[s][key.replace('_', '.')] = float(getattr(d, s)())

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
    if 'ZIP' in schools[id]:
        schools[id]['ZIP'] = str(int(schools[id]['ZIP'])).zfill(5)
    schools_geojson['features'].append({
        'id': id,
        'type': 'Feature',
        'geometry': {
            'type': 'Point',
            'coordinates': (row_data['LONGITUD'], row_data['LATITUDE']),
        },
        'properties': schools[id]
    })


# Associate schools with ZCTAs
zip_schools = defaultdict(list)
df = pd.read_csv('src/2016schoolzones.csv')
df = df.where((pd.notnull(df)), None)
for row in tqdm(df.itertuples(), total=len(df), desc='School zones csv'):
    row_data = dict(row._asdict())
    if row_data[CSV_ZIPCODE_FIELD] is None: continue
    zipcode = str(int(row_data[CSV_ZIPCODE_FIELD])).zfill(5)
    assert len(zipcode) == 5

    unit_id = int(row_data['unitid'])
    zip_schools[zipcode].append(unit_id)


# Compute bounding boxes for zipcodes
meta['bboxes'] = {}

geojson = []
zipcode_geojson = json.load(open('src/zipcodes.geojson'))
for f in tqdm(zipcode_geojson['features'], desc='Merging into geojson'):
    del f['id']
    zipcode = f['properties']['ZCTA5CE10']
    try:
        f['properties'] = dict(**data[zipcode])
    except:
        f['properties'] = dict(**CSV_DEFAULTS)
    f['properties']['zipcode'] = zipcode
    f['properties']['n_schools'] = len(zip_schools[zipcode])
    meta['bboxes'][zipcode] = shape(f['geometry']).bounds
    geojson.append(f)

countries = fiona.open('src/countries/ne_10m_admin_0_countries.shp')
region_bboxes = {}
for country in countries:
    props = country['properties']
    iso = props['ISO_A2']
    if iso not in COUNTRIES:
        continue
    if iso == 'US':
        shp = max(shape(country['geometry']), key=lambda s: s.area)
        region_bboxes['Mainland'] = shp.bounds
    else:
        bbox = shape(country['geometry']).bounds
        region_bboxes[props['NAME']] = bbox

for state in STATES:
    feat = json.load(open('src/states/{}.geojson'.format(state.lower())))
    bbox = shape(feat['geometry']).bounds
    region_bboxes[state] = bbox

# Data source is incorrect about Alaska, set it manually
region_bboxes['Alaska'] = [-207.4133546365765, 50.796925749084465, -104.93451956255066, 71.79270027924889]

# 30/45/60 isochrone comparison data
df = pd.read_csv('src/SCI.30.45.60_comparisons.csv')
zip_states = pd.read_csv('src/zip_to_zcta_2018.csv')
states = ['OH', 'GA', 'NJ', 'SD']
dists = ['30', '45', '60']
valid_zips = set()
for row in zip_states.itertuples():
    if row.STATE in states:
        zipcode = str(int(row.ZCTA)).zfill(5)
        valid_zips.add(zipcode)


comparisons = {}
for row in tqdm(df.itertuples(), total=len(df), desc='Comparison data'):
    row_data = dict(row._asdict())

    zipcode = str(int(row_data['zcta'])).zfill(5)
    if zipcode not in valid_zips:
        continue

    comparisons[zipcode] = {}
    for d in dists:
        comparisons[zipcode][d] = {}
        for k in ['schools', 'SCI_public', 'UNDUPUG_public']:
            comparisons[zipcode][d][k.replace('_', '.')] = row_data['{}{}'.format(k, d)]

import copy
comparison_geojsons = {d: [] for d in dists}
zipcode_geojson = json.load(open('src/zipcodes.geojson'))
for f in tqdm(zipcode_geojson['features'], desc='Preparing comparison geojsons'):
    del f['id']
    zipcode = f['properties']['ZCTA5CE10']
    if zipcode not in comparisons: continue
    for d in dists:
        feat = copy.deepcopy(f)
        feat['properties'] = dict(**comparisons[zipcode][d])
        feat['properties']['zipcode'] = zipcode
        feat['properties']['n_schools'] = comparisons[zipcode][d]['schools']
        comparison_geojsons[d].append(feat)

print('Saving files...')

for d in dists:
    with open('comparison_{}.geojson'.format(d), 'w') as f:
        f.write('\n'.join(json.dumps(feat) for feat in comparison_geojsons[d]))

with open('regions.json', 'w') as f:
    json.dump(region_bboxes, f)

with open('schools.geojson', 'w') as f:
    json.dump(schools_geojson, f)

with open('schools.json', 'w') as f:
    json.dump(schools, f)

with open('meta.json', 'w') as f:
    json.dump(meta, f)

with open('zip_schools.json', 'w') as f:
    json.dump(zip_schools, f)

with open('zctas.geojson', 'w') as f:
    # Write one feature per line, so tippecanoe can process in parallel
    f.write('\n'.join(json.dumps(feat) for feat in geojson))

with open('zctas.json', 'w') as f:
    json.dump(data, f)

print('Done')