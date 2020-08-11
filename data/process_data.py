"""Merges zipcode geojson data
and also merges in other zipcode data.

Note: occurences of "." in a column name
are replaced w/ "_"
"""

import os
import json
import fiona
import numpy as np
import pandas as pd
from tqdm import tqdm
from itertools import product
from shapely.geometry import shape
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

# ISO A2
COUNTRIES = ['US', 'PR', 'AS', 'GU', 'MP', 'VI']
STATES = ['Alaska', 'Hawaii']

# New zip-level data has different
# field names. Correct them here
KEY_FIXES = {
    'con_1': 'public',
    'con_2': 'privnot4prof',
    'con_3': 'priv4prof',
    'lev_1': 'bachelor',
    'lev_2': 'associate',
    'lev_3': 'belowassociate',
}
KEY_FIXES_MAP = {v: k for k, v in KEY_FIXES.items()}

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
CSV_ZIPCODE_FIELD = 'ZCTA'

# Make separate maps on these keys
# MAPS_BY = ['I']

# False is a special value to create just one map for everything
# Sometimes this is better if the bulk of the filesize is due to the geometry and not the properties
MAPS_BY = False

# What gets included in the geojson features,
# try to include only that will be used to color tiles
FEAT_FIELDS = {
    'SCI': ['S', 'I', 'Y'],

    # average net price across all income brackets for schools in zone
    'AVGNP': ['S', 'I', 'Y'],
}

# These are queried separately when a feature is focused on,
# instead of being part of the feature itself
QUERY_FIELDS = {
    'ENROLLED': ['S', 'I', 'Y'],

    'n': ['S', 'I', 'Y'],

    # average published tuition + fees for schools in zone
    'AVGSP': ['S', 'I', 'Y'],

    # average total price for students living on campus for schools in zone
    # 'AVGCINSON': ['S', 'I', 'Y'],

    # average total price for students living off campus (not with family) for schools in zone
    # 'AVGCINSOFF': ['S', 'I', 'Y'],

    # average total price for students living off campus with family for schools in zone
    # 'AVGCINSFAM': ['S', 'I', 'Y'],

    # average net price for low income students (fam income < 30k) for schools in zone
    # 'AVGNPI30': ['S', 'I', 'Y'],

    'SINGLEZCTAPOP': ['Y'],
    'MEDIANINCOME': ['Y'],
    'ZCTAZONEPOP': ['Y']
}

# Use these instead of the actual data max
RANGE_MINS = {
    'AVGNP': 5000
}
RANGE_MAXS = {
    'AVGNP': 25000
}

# Keep only non-varying properties
# for school geojson
SCHOOL_GEOJSON_PROPS = [
    'id',
    'MAPNAME',
    'INSTNM', 'ZIP',

    # Needed for proper coloring of school points
    'ICLEVEL', 'CONTROL',
]

def keysForCats(cats, fixed=None, k=None):
    fixed = fixed or {}
    tags = sorted(cats)
    opts = [[fixed[t]] if t in fixed else CATEGORIES[t] for t in tags]
    keys = [
        '.'.join('{}:{}'.format(t, c) for t, c in zip(tags, p))
        for p in product(*opts)
    ]
    if k:
        return ['{}.{}'.format(k, key) for key in keys]
    else:
        return keys

def keyForCat(cat, k=None):
    tags = '.'.join(['{}:{}'.format(c, cat[c]) for c in sorted(cat.keys())])
    if k:
        if tags:
            return '{}.{}'.format(k, tags)
        else:
            return k
    else:
        return tags

def catsForKey(key):
    parts = key.split('.')
    if ':' not in parts[0]:
        k = parts.pop(0)
    else:
        k = None
    parts = [p.split(':') for p in parts]
    return {p[0]: p[1] for p in parts}, k

def subKey(key, drop):
    cats, k = catsForKey(key)
    keep = {k: v for k, v in cats.items() if k not in drop}
    return keyForCat(keep, k=k)


zctas = set()
data = defaultdict(dict)
query_data = defaultdict(dict)
field_data = defaultdict(lambda: defaultdict(list))
for i in CATEGORIES['I']:
    df_all = pd.read_csv('src/zips/ZipLevel.{I}.csv'.format(I=i))
    groups = df_all.groupby('YEAR')
    for y in CATEGORIES['Y']:
        cat = {'Y': y, 'I': i}
        df = groups.get_group(int(y))
        df = df.where(pd.notnull(df), None)
        for row in tqdm(df.itertuples(), total=len(df), desc='{Y}/{I} ZCTA'.format(**cat)):
            row_data = dict(row._asdict())
            if row_data[CSV_ZIPCODE_FIELD] is None: continue
            zipcode = str(int(row_data[CSV_ZIPCODE_FIELD])).zfill(5)
            assert len(zipcode) == 5
            zctas.add(zipcode)

            for datadict, fields in [(data, FEAT_FIELDS), (query_data, QUERY_FIELDS)]:
                for k, cats in fields.items():
                    # ZCTA year-level stats
                    if cats == ['Y']:
                        key = keyForCat({'Y': y}, k)
                        val = row_data[k]
                        datadict[zipcode][key] = val
                        field_data[k][key].append(val)

                    elif 'I' not in cats: continue
                    elif 'S' in cats:
                        for s in CATEGORIES['S']:
                            s_ = KEY_FIXES_MAP.get(s, s)
                            key = keyForCat({'Y': y, 'I': i, 'S': s}, k)
                            val = row_data['{}_{}'.format(k, s_)]
                            datadict[zipcode][key] = val
                            field_data[k][key].append(val)

                            # if k == 'AVGNP' and val is not None and val > 75000:
                            #     print(f'{zipcode} y={y},i={i},s={s} -> {val}')
                    else:
                        key = keyForCat({t: cat[t] for t in cats}, k)
                        datadict[zipcode][key] = row_data[k]
                        field_data[k][key].append(val)

# Compute ranges
meta = {}
meta['ranges'] = {}
for k in FEAT_FIELDS.keys():
    vals = []
    # Get min/max across all categories
    for vs in field_data[k].values():
        vs = [v for v in vs if v is not None]
        vals.append(float(min(vs)))
        vals.append(float(max(vs)))

    mn = RANGE_MINS.get(k, min(vals))
    mx = RANGE_MAXS.get(k, max(vals))
    meta['ranges'][k] = (mn, mx)

# import ipdb; ipdb.set_trace()

# Compute summary statistics (within categories)
# To keep file size smaller, just using min
# for s in ['mean', 'median', 'min', 'max']:
for s in ['min']:
    meta[s] = {}
    for k, cats in FEAT_FIELDS.items():
        for key in keysForCats(cats):
            key = '{}.{}'.format(k, key)
            vals = [v for v in field_data[k][key] if v is not None]
            try:
                meta[s][key] = float(getattr(np, s)(vals))
            except ValueError:
                # Probably missing that year's data
                meta[s][key] = None


# School-level data
# Associate schools with ZCTAs and load school data
# TODO how to do this with minimal redundancy
schools_by_year = defaultdict(dict)
schools_geojson = {
    'type': 'FeatureCollection',
    'features': []
}
data_by_key_zip = defaultdict(lambda: defaultdict(lambda: {'schools': []}))

# School-level
school_feats = {}
all_years = pd.read_csv('gen/master_05.01.2020.reverse_geocoded.csv',
        encoding='ISO-8859-1',
        dtype={'YEAR': str, 'ZIP': str})

# Mapbox does not allow string feature ids,
# so we have to convert these to uints
# <https://github.com/mapbox/mapbox-gl-js/issues/2716>
schoolidx_to_featid = {}
for i, key in enumerate(all_years.groupby(['UNITID', 'ADDR', 'MAPNAME']).groups.keys()):
    key = '__'.join(str(k) for k in key)
    schoolidx_to_featid[key] = i

all_years = all_years.groupby('YEAR')
reverse_geocode_lookup = json.load(open('gen/reverse_geocode_lookup.json'))
for y in CATEGORIES['Y']:
    # TODO these are overwriting each year atm
    df = all_years.get_group(y)
    df = df.where((pd.notnull(df)), None)
    for row in tqdm(df.itertuples(), total=len(df), desc='{} School List'.format(y)):
        row_data = dict(row._asdict())
        key = '__'.join(str(v) if v is not None else 'nan' for v in [row_data[k] for k in ['UNITID', 'ADDR', 'MAPNAME']])
        id = schoolidx_to_featid[key]

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

    for i in CATEGORIES['I']:
        cat = {'Y': y, 'I': i}
        key = keyForCat(cat)
        fname = 'src/school_zones/{Y}.{I}.Schoolzones.SCI.csv'.format(**cat)
        try:
            df = pd.read_csv(fname, encoding='ISO-8859-1')
        except FileNotFoundError:
            print('Missing {}'.format(fname))
            continue
        zipcodes = set()
        for row in tqdm(df.itertuples(), total=len(df), desc='{Y}/{I} School Zones'.format(**cat)):
            row_data = dict(row._asdict())
            if row_data['ZCTA5CE10'] is None: continue
            zipcode = str(int(row_data['ZCTA5CE10'])).zfill(5)
            if not isinstance(row_data['ADDR'], str):
                lat, lng = row_data['LATITUDE'], row_data['LONGITUD']
                row_data['ADDR'] = reverse_geocode_lookup['{},{}'.format(lat, lng)]
            key = '__'.join(str(v) if v is not None else 'nan' for v in [row_data[k] for k in ['UNITID', 'ADDR', 'MAPNAME']])
            id = schoolidx_to_featid[key]
            data_by_key_zip[key][zipcode]['schools'].append(id)

        # Zip level data
        key_map = {}
        for k, cats in QUERY_FIELDS.items():
            for fullkey in keysForCats(cats, fixed=cat, k=k):
                subkey = subKey(fullkey, drop=cat)
                key_map[fullkey] = subkey
        for zipcode in tqdm(zctas, desc='{Y}/{I} Zip Data'.format(**cat)):
            for fullkey, subkey in key_map.items():
                data_by_key_zip[key][zipcode][subkey] = query_data[zipcode][fullkey]

for school in school_feats.values():
    school['properties']['years'] = ','.join(school['properties']['years'])
    schools_geojson['features'].append(school)

# Get missing zctas to fill in
zipcode_geojson = json.load(open('src/zipcodes.geojson'))
for f in zipcode_geojson['features']:
    zipcode = f['properties']['ZCTA5CE10']
    zctas.remove(zipcode)

# Build geojson
bboxes = {}
if MAPS_BY:
    map_keys = keysForCats(MAPS_BY)
else:
    map_keys = ['ALL']
for key in map_keys:
    # Figure out what data keys we use for this map
    if key != 'ALL':
        keys = []
        cat, _ = catsForKey(key)
        for k, cats in FEAT_FIELDS.items():
            keys += keysForCats(cats, fixed=cat, k=k)
    else:
        keys = None

    geojson = []
    for f in tqdm(zipcode_geojson['features'], desc='Geojson for {}'.format(key)):
        f = {**f}
        del f['id']
        zipcode = f['properties']['ZCTA5CE10']

        # Only keep non-null values
        f['properties'] = {k: v for k, v in data[zipcode].items() if v is not None}

        # Drop extraneous properties
        if keys is not None:
            f['properties'] = {subKey(k, drop=cat): f['properties'][k] for k in keys}

        f['properties']['zipcode'] = zipcode
        bboxes[zipcode] = shape(f['geometry']).bounds
        geojson.append(f)

    # Fill in leftover zctas
    if zctas:
        for f in tqdm(fiona.open('src/zctas/tl_2017_us_zcta510.shp'), desc='Filling missing ZCTAs'):
            zipcode = f['properties']['ZCTA5CE10']
            if zipcode not in zctas: continue

            # Only keep non-null values
            f['properties'] = {k: v for k, v in data[zipcode].items() if v is not None}

            del f['id']
            f['properties']['zipcode'] = zipcode
            bboxes[zipcode] = shape(f['geometry']).bounds
            geojson.append(f)

    if not os.path.exists('gen/zctas'):
        os.makedirs('gen/zctas')
    with open('gen/zctas/{}.geojson'.format(key), 'w') as f:
        # Write one feature per line, so tippecanoe can process in parallel
        f.write('\n'.join(json.dumps(feat) for feat in geojson))

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
with open('gen/regions.json', 'w') as f:
    json.dump(region_bboxes, f)

with open('gen/schools.geojson', 'w') as f:
    json.dump(schools_geojson, f)

if not os.path.exists('gen/schools'):
    os.makedirs('gen/schools')
for id, school in schools_by_year.items():
    school['id'] = id
    with open('gen/schools/{}.json'.format(id), 'w') as f:
        json.dump(school, f)

with open('gen/meta.json', 'w') as f:
    json.dump(meta, f)

if not os.path.exists('gen/bboxes'):
    os.makedirs('gen/bboxes')
for zip, bbox in bboxes.items():
    with open('gen/bboxes/{}.json'.format(zip), 'w') as f:
        json.dump(bbox, f)

if not os.path.exists('zips'):
    os.makedirs('zips')
for key, schools_by_zip in data_by_key_zip.items():
    for zip, schools in schools_by_zip.items():
        path = 'gen/zips/{}'.format(key)
        if not os.path.exists(path):
            os.makedirs(path)
        with open('{}/{}.json'.format(path, zip), 'w') as f:
                json.dump(schools, f)

with open('gen/zctas.json', 'w') as f:
    json.dump(data, f)

print('Done')