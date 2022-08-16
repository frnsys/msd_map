import fiona
import pandas as pd
from tqdm import tqdm
from collections import defaultdict
from itertools import product
from shapely.geometry import shape

# Generates keys for categories
# and converts keys into categories
class Labeler:
    def __init__(self, categories):
        self.categories = categories

    def keyForCat(self, cat, k=None):
        tags = '.'.join(['{}:{}'.format(c, cat[c]) for c in sorted(cat.keys())])
        if k:
            if tags:
                return '{}.{}'.format(k, tags)
            else:
                return k
        else:
            return tags

    def catsForKey(self, key):
        parts = key.split('.')
        if ':' not in parts[0]:
            k = parts.pop(0)
        else:
            k = None
        parts = [p.split(':') for p in parts]
        return {p[0]: p[1] for p in parts}, k

    def removeCats(self, key):
        _, k = self.catsForKey(key)
        return k


class Processor:
    def __init__(self, categories, feat_fields, query_fields, feat_id_col, ranges):
        self.categories = categories
        self.labeler = Labeler(categories)
        self.feat_fields = feat_fields
        self.query_fields = query_fields
        self.feat_id_col = feat_id_col
        self.ranges = ranges

        # Data embedded in features as properties
        self.feat_data = defaultdict(dict)

        # Data queried via "api"
        self.query_data = defaultdict(dict)

        # Map-wide metadata
        self.meta = {}

    def extract_data(self, csv_file, file_cats, col_for_cat):
        """Extract data from a single CSV file,
        with the provided category values.
        - `file_cats` is the dict of categories this CSV file represents.
            For example, if you have a CSV for each year, this would be e.g. {'Y': 2021}
        - `col_for_cat` is a function that returns a column name given a field name and a cat dict
            For example, say you have columns by race, e.g. `med_bal_BLACK`.
            Your function could be: `lambda field, cat: f'{field}_{cat["R"]}'`
        """
        df = pd.read_csv(csv_file, dtype={self.feat_id_col: object})
        for row in tqdm(df.itertuples(), total=len(df), desc=csv_file):
            row_data = dict(row._asdict())
            feat_id = row_data[self.feat_id_col]
            if feat_id is None or not isinstance(feat_id, str): continue

            for data, fields in [(self.feat_data, self.feat_fields), (self.query_data, self.query_fields)]:
                for field, cats in fields.items():
                    # Cats that aren't part of the overall csv file category
                    # are assumed to at the column level.
                    col_cats = [c for c in cats if c not in file_cats]
                    cat_groups = product(*[self.categories[c] for c in col_cats])
                    for g in cat_groups:
                        # Build the category dict
                        cat = {k: v for k, v in zip(col_cats, g)}
                        cat.update(file_cats)
                        cat = {t: cat[t] for t in cats}

                        # Figure out the column name for this field and category
                        col = col_for_cat(field, cat)
                        val = row_data[col]

                        if field in self.feat_fields:
                            key = self.labeler.keyForCat(cat, field)
                            data[feat_id][key] = val

                        # Query fields handled slightly differently
                        else:
                            key = self.labeler.keyForCat(cat)
                            if key not in data:
                                data[key] = defaultdict(dict)
                            data[key][feat_id][field] = val

    def update_meta(self):
        """Update map-wide metadata,
        such as ranges for different field values"""
        # Collect all values for all feature fields
        data = {k: [] for k in self.feat_fields.keys()}
        for feat_data in self.feat_data.values():
            for cat_key, v in feat_data.items():
                k = self.labeler.removeCats(cat_key)
                if v is not None:
                    data[k].append(v)

        self._update_ranges(data)

    def _update_ranges(self, data):
        """Compute ranges for feature fields,
        across all categories.
        E.g not the range of just `med_bal.Y:2021`
        but of all `med_bal`"""
        self.meta['ranges'] = {}

        # Use user-specified ranges if provided
        for k, vals in data.items():
            limits = self.ranges.get(k, {})
            mn = limits.get('min', min(vals))
            mx = limits.get('max', max(vals))
            self.meta['ranges'][k] = (mn, mx)


class Mapper:
    # ISO A2
    COUNTRIES = ['US', 'PR', 'AS', 'GU', 'MP', 'VI']

    NON_MAINLAND_STATES = ['72', '78', '60', '66', '69', '02', '15']
    REMOVE_LAKES_FROM = ['55', '26'] # WI, MI
    LAKES = [shape(s['geometry']) for s in fiona.open('src/geo/lakes/ne_10m_lakes.shp')]

    def calculate_region_bboxes(self):
        """Calculate bounding boxes for larger map regions"""
        countries = fiona.open('src/geo/countries/ne_10m_admin_0_countries.shp')
        region_bboxes = {}
        for country in countries:
            props = country['properties']
            iso = props['ISO_A2']
            if iso not in self.COUNTRIES:
                continue
            if iso == 'US':
                shp = max(shape(country['geometry']), key=lambda s: s.area)
                region_bboxes['Mainland'] = shp.bounds
            else:
                bbox = shape(country['geometry']).bounds
                region_bboxes[props['NAME']] = bbox

        region_bboxes['Hawaii'] = [-160.555771, 18.917466, -154.809379, 22.23317]
        region_bboxes['Alaska'] = [-207.4133546365765, 50.796925749084465, -104.93451956255066, 71.79270027924889]
        region_bboxes['American Samoa'] = [-171.84922996050645, -14.93534547358692, -168.25721358668446, -13.663497668009555]
        return region_bboxes

    def gen_geojson(self, shape_path, feat_data, feat_id_prop):
        """Generate geojson, using `self.feat_data` as feature properties,
        and calculate bounding boxes for features"""
        geojson = []
        bboxes = {}
        for f in tqdm(fiona.open(shape_path), desc='Generating geojson'):
            feat_id = f['properties'][feat_id_prop]

            # Only keep non-null values
            f['properties'] = {k: v for k, v in feat_data[feat_id].items() if v is not None}

            # Remove id, if any, will be replaced
            if 'id' in f:
                del f['id']

            f['properties']['id'] = feat_id
            bboxes[feat_id] = shape(f['geometry']).bounds
            geojson.append(f)
        return geojson, bboxes