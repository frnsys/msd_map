"""Merges zipcode geojson data
and also merges in other zipcode data.

Note: occurences of "." in a column name
are replaced w/ "_"
"""

import json
import fiona
import numpy as np
import pandas as pd
from tqdm import tqdm
from itertools import product
from shapely.geometry import shape
from collections import defaultdict

SCHOOL_FIELDS = [
    'INSTNM',
    'SECTOR',
    'ICLEVEL',
    'CONTROL',
    'UNDUPUG',
    'ZIP'
]

# ISO A2
COUNTRIES = ['US', 'PR', 'AS', 'GU', 'MP', 'VI']
STATES = ['Alaska', 'Hawaii']

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
        '2016'
    ]
}
CSV_ZIPCODE_FIELD = 'ZCTA'
CSV_FIELDS = {
    'n': ['S', 'I', 'Y'],
    'SCI': ['S', 'I', 'Y'],
    'UNDUPUG': ['S', 'I', 'Y'],
    # 'singlezctapop': ['Y'],
    'medianincome': ['Y'],
    # 'n_zipsinzone': ['Y'],
    'zctazonepop': ['Y']
}
CSV_DEFAULTS = {
    'medianincome': None,
    'singlezctapop': 0,
    'zctazonepop': 0,
    'SCI': 0
}

def keysForCats(cats):
    tags = sorted(cats)
    return [
        '.'.join('{}:{}'.format(t, c) for t, c in zip(tags, p))
        for p in product(*[CATEGORIES[t] for t in tags])
    ]

def keyForCat(cat, k=None):
    tags = '.'.join(['{}:{}'.format(c, cat[c]) for c in sorted(cat.keys())])
    if k:
        return '{}.{}'.format(k, tags)
    else:
        return tags

for k, cats in CSV_FIELDS.items():
    for key in keysForCats(cats):
        CSV_DEFAULTS['{}.{}'.format(k, key)] = CSV_DEFAULTS.get(k, 0)


zctas = set()
data = defaultdict(dict)
field_data = defaultdict(lambda: defaultdict(list))
for y in CATEGORIES['Y']:
    df = pd.read_csv('src/{Y}.ZCTA.Stats.csv'.format(Y=y))
    df = df.where(pd.notnull(df), None)
    for row in tqdm(df.itertuples(), total=len(df), desc='{Y} ZCTA'.format(Y=y)):
        row_data = dict(row._asdict())
        if row_data[CSV_ZIPCODE_FIELD] is None: continue
        zipcode = str(int(row_data[CSV_ZIPCODE_FIELD])).zfill(5)
        assert len(zipcode) == 5
        zctas.add(zipcode)

        for k, cats in CSV_FIELDS.items():
            if cats != ['Y']: continue
            key = keyForCat({'Y': y}, k)
            val = row_data[k]
            data[zipcode][key] = val
            field_data[k][key].append(val)

    for i in CATEGORIES['I']:
        cat = {'Y': y, 'I': i}
        df = pd.read_csv('src/{Y}.{I}.ZCTAlevel.csv'.format(**cat))
        df = df.where(pd.notnull(df), None)
        for row in tqdm(df.itertuples(), total=len(df), desc='{Y}/{I} ZCTA'.format(**cat)):
            row_data = dict(row._asdict())
            if row_data[CSV_ZIPCODE_FIELD] is None: continue
            zipcode = str(int(row_data[CSV_ZIPCODE_FIELD])).zfill(5)
            assert len(zipcode) == 5
            zctas.add(zipcode)

            for k, cats in CSV_FIELDS.items():
                if 'I' not in cats: continue
                elif 'S' in cats:
                    for s in CATEGORIES['S']:
                        key = keyForCat({'Y': y, 'I': i, 'S': s}, k)
                        val = row_data['{}_{}'.format(k, s)]
                        data[zipcode][key] = val

                        # Using 0 as a null value, so ignore
                        if k == 'SCI':
                            if val == None:
                                data[zipcode][key] = 0
                            elif val > 0:
                                field_data[k][key].append(val)
                        else:
                            field_data[k][key].append(val)
                else:
                    key = keyForCat({t: cat[t] for t in cats}, k)
                    data[zipcode][key] = row_data[k]
                    field_data[k][key].append(val)

# Compute ranges
meta = {}
meta['ranges'] = {}
for k in CSV_FIELDS.keys():
    vals = []
    # Get min/max across all categories
    for vs in field_data[k].values():
        vs = [v for v in vs if v is not None]
        vals.append(float(min(vs)))
        vals.append(float(max(vs)))
    meta['ranges'][k] = (min(vals), max(vals))


# Compute summary statistics (within categories)
for s in ['mean', 'median', 'min', 'max']:
    meta[s] = {}
    for k, cats in CSV_FIELDS.items():
        for key in keysForCats(cats):
            key = '{}.{}'.format(k, key)
            vals = [v for v in field_data[k][key] if v is not None]
            meta[s][key] = float(getattr(np, s)(vals))


# Associate schools with ZCTAs and load school data
# TODO how to do this with minimal redundancy
schools = {}
schools_geojson = {
    'type': 'FeatureCollection',
    'features': []
}
zip_schools = defaultdict(lambda: defaultdict(list))
for y in CATEGORIES['Y']:
    # TODO these are overwriting each year atm
    df = pd.read_csv('src/{}.School.List.csv'.format(y), encoding='ISO-8859-1')
    df = df.where((pd.notnull(df)), None)
    for row in tqdm(df.itertuples(), total=len(df), desc='{} School List'.format(y)):
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

    for i in CATEGORIES['I']:
        cat = {'Y': y, 'I': i}
        df = pd.read_csv('src/{Y}.{I}.Schoolzones.SCI.csv'.format(**cat), encoding='ISO-8859-1')
        df = df.where((pd.notnull(df)), None)
        for row in tqdm(df.itertuples(), total=len(df), desc='{Y}/{I} School Zones'.format(**cat)):
            row_data = dict(row._asdict())
            if row_data[CSV_ZIPCODE_FIELD] is None: continue
            zipcode = str(int(row_data[CSV_ZIPCODE_FIELD])).zfill(5)
            unit_id = int(row_data['UNITID'])
            key = keyForCat(cat)
            zip_schools[zipcode][key].append(unit_id)


# Build geojson
geojson = []
meta['bboxes'] = {}
zipcode_geojson = json.load(open('src/zipcodes.geojson'))
for f in tqdm(zipcode_geojson['features'], desc='Merging into geojson'):
    del f['id']
    zipcode = f['properties']['ZCTA5CE10']
    try:
        f['properties'] = dict(**data[zipcode])
    except:
        f['properties'] = dict(**CSV_DEFAULTS)
    f['properties']['zipcode'] = zipcode
    meta['bboxes'][zipcode] = shape(f['geometry']).bounds
    geojson.append(f)
    zctas.remove(zipcode)

# If leftover zctas, get from backup shapefile
if zctas:
    for f in tqdm(fiona.open('src/zctas/tl_2017_us_zcta510.shp'), desc='Filling missing ZCTAs'):
        zipcode = f['properties']['ZCTA5CE10']
        if zipcode not in zctas: continue
        try:
            f['properties'] = dict(**data[zipcode])
        except:
            f['properties'] = dict(**CSV_DEFAULTS)
        del f['id']
        f['properties']['zipcode'] = zipcode
        meta['bboxes'][zipcode] = shape(f['geometry']).bounds
        geojson.append(f)
        zctas.remove(zipcode)

assert len(zctas) == 0

# Region bounding boxes
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

# Data source is incorrect about Alaska and American Samoa, set it manually
region_bboxes['Alaska'] = [-207.4133546365765, 50.796925749084465, -104.93451956255066, 71.79270027924889]
region_bboxes['American Samoa'] = [-171.84922996050645, -14.93534547358692, -168.25721358668446, -13.663497668009555]


print('Saving files...')
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