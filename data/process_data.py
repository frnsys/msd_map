"""
Structures data by facets ("categories"), attaching
some data to map features and some to an "API" that can be queried
by feature id and facet/category.

Note: occurences of "." in a column name
are replaced w/ "_"
"""

import os
import sys
import json
import simplejson
import pandas as pd
from lib import Processor, Mapper

# loa = Level of analysis
LOA = sys.argv[1] # 'zcta' OR 'state' OR 'county'

zctaToState = json.load(open('src/zctaToState.json'))

INPUTS_BY_LOA = {
    'zcta': {
        # Main input files CSV
        'files': [{
            # 'path': 'src/2021/map_data_zcta_2021.csv',
            # 'cat': {'Y': 2021},
        # }, {
            'paths': [
                'src/2022/map_data_zcta_2022.csv',
                'src/2022/map_data_zctaschools_2022.csv',
            ],
            'join_column': 'ZCTA',
            'cat': {'Y': 2022},
        }],

        # The main input CSV column that
        # links it to a shape feature
        'main_feature_id': 'ZCTA',

        # Input shapefile
        'shape': 'src/geo/zcta/tl_2021_us_zcta520.shp',

        # The shape feature id field,
        # to link it to `main_feature_id`
        'shape_feature_id': 'ZCTA5CE20',
        'shape_feature_name': 'ZCTA5CE20',
        'shape_feature_name': lambda props: f"{props['ZCTA5CE20']}, {zctaToState[props['ZCTA5CE20']]}",
    },
    'state': {
        'files': [{
            # 'path': 'src/2021/map_data_state_2021.csv',
            # 'cat': {'Y': 2021},
        # }, {
            'paths': [
                'src/2022/map_data_state_2022.csv',
                'src/2022/map_data_stateschools_2022.csv',
            ],
            'join_column': 'State',
            'cat': {'Y': 2022},
        }],
        'main_feature_id': 'State',
        'shape': 'src/geo/state/cb_2021_us_state_500k.shp',
        'shape_feature_id': 'STUSPS',
        'shape_feature_name': 'NAME',
    },
    'county': {
        'files': [{
            # 'path': 'src/2021/map_data_county_2021.csv',
            # 'cat': {'Y': 2021},
        # }, {
            'paths': [
                'src/2022/map_data_county_2022.csv',
                'src/2022/map_data_countyschools_2022.csv',
            ],
            'join_column': 'County',
            'cat': {'Y': 2022},
        }],
        'main_feature_id': 'County',
        'shape': 'src/geo/county/cb_2021_us_county_500k.shp',
        'shape_feature_id': 'GEOID',
        'shape_feature_name': lambda props: f"{props['NAMELSAD']}, {props['STUSPS']}",
    }
}

INPUTS = INPUTS_BY_LOA[LOA]

# How data is sliced up
# Maybe should have been called "facets"
CATEGORIES = {
    'Y': [
        # '2021',
        '2022',
    ],
    'R': [
        'ALL',
        'BLACK',
        'WHITE',
        'NATVAM',
        'ASIAN',
        'LATINO'
    ]
}

# What gets included in the geojson features,
# try to include only that will be used to color tiles
FEAT_FIELDS = {
    'med_bal': ['Y'],
    'med_dti': ['Y'],
    'med_inc': ['Y'],
    'pct_bal_grt': ['Y'],
    'med_bal_sh_obal': ['Y'],
}

# These are queried separately via the "api"
# when a feature is focused on,
# instead of being embedded as part of the feature itself
QUERY_FIELDS = {
    'avg_bal': ['Y'],
    'avg_bal_rankNat': ['Y'],
    'avg_bal_pctNat': ['Y'],
    'med_bal': ['Y'],
    'med_bal_rankNat': ['Y'],
    'med_bal_pctNat': ['Y'],
    'avg_dti': ['Y'],
    'avg_dti_rankNat': ['Y'],
    'avg_dti_pctNat': ['Y'],
    'med_dti': ['Y'],
    'med_dti_rankNat': ['Y'],
    'med_dti_pctNat': ['Y'],
    'avg_inc': ['Y'],
    'avg_inc_rankNat': ['Y'],
    'avg_inc_pctNat': ['Y'],
    'med_inc': ['Y'],
    'med_inc_rankNat': ['Y'],
    'med_inc_pctNat': ['Y'],
    'avg_bal_sh_obal': ['Y'],
    'avg_bal_sh_obal_rankNat': ['Y'],
    'avg_bal_sh_obal_pctNat': ['Y'],
    'med_bal_sh_obal': ['Y'],
    'med_bal_sh_obal_rankNat': ['Y'],
    'med_bal_sh_obal_pctNat': ['Y'],
    'pct_bal_grt': ['Y'],
    'pct_bal_grt_rankNat': ['Y'],
    'pct_bal_grt_pctNat': ['Y'],

    # School-level data
    'n_allschools': ['Y'],
    'dsug_allschools': ['Y'],
    'gr_allschools': ['Y'],
    'avgtf_allschools': ['Y'],
    'n_public': ['Y'],
    'dsug_public': ['Y'],
    'gr_public': ['Y'],
    'avgtf_public': ['Y'],
    'n_private': ['Y'],
    'dsug_private': ['Y'],
    'gr_private': ['Y'],
    'avgtf_private': ['Y'],
    'n_4yr': ['Y'],
    'dsug_4yr': ['Y'],
    'gr_4yr': ['Y'],
    'avgtf_4yr': ['Y'],
    'n_not4yr': ['Y'],
    'dsug_not4yr': ['Y'],
    'gr_not4yr': ['Y'],
    'avgtf_not4yr': ['Y'],
    'n_public4yr': ['Y'],
    'dsug_public4yr': ['Y'],
    'gr_public4yr': ['Y'],
    'avgtf_public4yr': ['Y'],
    'n_private4yr': ['Y'],
    'dsug_private4yr': ['Y'],
    'gr_private4yr': ['Y'],
    'avgtf_private4yr': ['Y'],
}

if LOA != 'state':
    QUERY_FIELDS.update({
        'avg_bal_pctState': ['Y'],
        'med_bal_pctState': ['Y'],
        'avg_dti_pctState': ['Y'],
        'med_dti_pctState': ['Y'],
        'avg_inc_pctState': ['Y'],
        'med_inc_pctState': ['Y'],
        'avg_bal_sh_obal_pctState': ['Y'],
        'med_bal_sh_obal_pctState': ['Y'],
        'pct_bal_grt_pctState': ['Y'],
    })


SCHOOL_FIELDS = [
    'n_allschools',
    'dsug_allschools',
    'gr_allschools',
    'avgtf_allschools',
    'n_public',
    'dsug_public',
    'gr_public',
    'avgtf_public',
    'n_private',
    'dsug_private',
    'gr_private',
    'avgtf_private',
    'n_4yr',
    'dsug_4yr',
    'gr_4yr',
    'avgtf_4yr',
    'n_not4yr',
    'dsug_not4yr',
    'gr_not4yr',
    'avgtf_not4yr',
    'n_public4yr',
    'dsug_public4yr',
    'gr_public4yr',
    'avgtf_public4yr',
    'n_private4yr',
    'dsug_private4yr',
    'gr_private4yr',
    'avgtf_private4yr',
]

# Queries may want to include multiple subcategories
# even if they aren't facted over all of them.
# E.g. say `avg_bal` is faceted by Y (by year).
# But I have multiple columns per year broken down by race.
# So I don't just want e.g. `avg_bal.2021`; I instead want
# `avg_bal.2021.BLACK, avg_bal.2021.WHITE, etc`.
# QUERY_CATEGORIES defines what additional categories,
# beyond the defined facets in QUERY_FIELDS, should be used.
QUERY_CATEGORIES = {
    'default': CATEGORIES,
}
for field in SCHOOL_FIELDS:
    QUERY_CATEGORIES[field] = {
        'Y': CATEGORIES['Y']
    }

# Use these instead of the actual data max
# To deal with outliers squashing the visual data range
RANGES = {
    'med_inc': {
        'min': 10000,
        'max': 40000,
    }
}

# Get a column name given a field name and categories
def col_for_cat(field, cat):
    if field in SCHOOL_FIELDS:
        return field
    if cat.get('R', 'ALL') == 'ALL':
        return field
    else:
        return f'{field}_{cat["R"]}'

if __name__ == '__main__':
    processor = Processor(
            categories=CATEGORIES,
            feat_fields=FEAT_FIELDS,
            query_fields=QUERY_FIELDS,
            query_cats=QUERY_CATEGORIES,
            feat_id_col=INPUTS['main_feature_id'],
            ranges=RANGES)

    for f in INPUTS['files']:
        path = f.get('path')
        if 'paths' in f:
            col = f['join_column']
            dfs = [pd.read_csv(f, dtype={col: object}).set_index(col) for f in f['paths']]
            df = pd.concat(dfs, axis=1, join='inner').reset_index()
            df.to_csv('/tmp/data.csv', index=None)
            path = '/tmp/data.csv'
        processor.extract_data(
                path,
                f['cat'],
                col_for_cat)
    processor.update_meta()

    mapper = Mapper()
    region_bboxes = mapper.calculate_region_bboxes()
    geojson, bboxes = mapper.gen_geojson(
            INPUTS['shape'], processor.feat_data,
            INPUTS['shape_feature_id'], INPUTS['shape_feature_name'])

    print('Saving files...')

    with open('gen/tile_data/{}.geojson'.format(LOA), 'w') as f:
        # Write one feature per line, so tippecanoe can process in parallel
        f.write('\n'.join(json.dumps(feat) for feat in geojson))

    # Common to all LOA
    with open('gen/regions.json', 'w') as f:
        json.dump(region_bboxes, f)

    with open('gen/prop_cats.json', 'w') as f:
        prop_cats = {}
        prop_cats.update(FEAT_FIELDS)
        prop_cats.update(QUERY_FIELDS)
        json.dump(prop_cats, f)

    # LOA specific
    if not os.path.exists('gen/{}'.format(LOA)):
        os.makedirs('gen/{}'.format(LOA))

    with open('gen/{}/meta.json'.format(LOA), 'w') as f:
        json.dump(processor.meta, f)

    bboxes_dir = 'gen/{}/bboxes'.format(LOA)
    if not os.path.exists(bboxes_dir):
        os.makedirs(bboxes_dir)
    for zip, bbox in bboxes.items():
        with open('{}/{}.json'.format(bboxes_dir, zip), 'w') as f:
            json.dump(bbox, f)

    for cat_key, feats in processor.query_data.items():
        cat_dir = 'gen/{}/by_cat/{}/'.format(LOA, cat_key)
        if not os.path.exists(cat_dir):
            os.makedirs(cat_dir)
        for feat_id, data in feats.items():
            with open(os.path.join(cat_dir, '{}.json'.format(feat_id)), 'w') as f:
                simplejson.dump(data, f, ignore_nan=True)

    print('Done')