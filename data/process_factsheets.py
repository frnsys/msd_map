import json
import math
import pandas as pd

dfs = [pd.read_csv(f) for f in [
    'src/factsheets/MSD_State_Lvl_12.14.2020.csv',
    'src/factsheets/MSD_CD_Lvl_12.14.2020.csv',
]]

demographics = ['asian', 'black', 'hispanic', 'white', 'minority']
schema = {
    'debt': {
        'average': {
            'debt': {
                'name': 'Average Student Debt Burden (Ages 18-35)',
                'label': 'AVG_BAL_19_Label',
                'nationalRank': 'AVG_BAL_19_NatRank',
                'stateRank': 'AVG_BAL_19_StateRank'
            },
            'debt_change': {
                'name': 'Percent Change of Average Student Debt since 2009',
                'label': 'AVG_BAL_pch_0919_Label',
                'nationalRank': 'AVG_BAL_pch_0919_NatRank',
                'stateRank': 'AVG_BAL_pch_0919_StateRank'
            },
            'debt_demographics': [
                'AVG_BAL_19_{}_Label',
                'AVG_BAL_19_{}_NatRank',
                'AVG_BAL_19_{}_StateRank',
                'AVG_BAL_pch_0919_{}_Label',
                'AVG_BAL_pch_0919_{}_NatRank',
                'AVG_BAL_pch_0919_{}_StateRank'
            ],
        },
        'median': {
            'debt': {
                'name': 'Median Student Debt Burden (Ages 18-35)',
                'label': 'MED_BAL_19_Label',
                'nationalRank': 'MED_BAL_19_NatRank',
                'stateRank': 'MED_BAL_19_StateRank',
            },
            'debt_change': {
                'name': 'Percent Change of Median Student Debt since 2009',
                'label': 'MED_BAL_pch_0919_Label',
                'nationalRank': 'MED_BAL_pch_0919_NatRank',
                'stateRank': 'MED_BAL_pch_0919_StateRank'
            },
            'debt_demographics': [
                'MED_BAL_19_{}_Label',
                'MED_BAL_19_{}_NatRank',
                'MED_BAL_19_{}_StateRank',
                'MED_BAL_pch_0919_{}_Label',
                'MED_BAL_pch_0919_{}_NatRank',
                'MED_BAL_pch_0919_{}_StateRank'
            ],
            'debtincome': {
                'name': 'Median Student Debt to Income Ratio',
                'label': 'MED_DEBT_INC_19_Label',
                'nationalRank': 'MED_DEBT_INC_19_NatRank',
                'stateRank': 'MED_DEBT_INC_19_StateRank'
            },
            'debtincome_change': {
                'name': 'Percent Change in Median Student Debt to Income Ratio',
                'label': 'MED_DEBT_INC_pch_0919_Label',
                'nationalRank': 'MED_DEBT_INC_pch_0919_NatRank',
                'stateRank': 'MED_DEBT_INC_pch_0919_StateRank'
            },
            'debtincome_demographics': [
                'MED_DEBT_INC_19_{}_Label',
                'MED_DEBT_INC_19_{}_NatRank',
                'MED_DEBT_INC_19_{}_StateRank',
                'MED_DEBT_INC_pch_0919_{}_Label',
                'MED_DEBT_INC_pch_0919_{}_NatRank',
                'MED_DEBT_INC_pch_0919_{}_StateRank'
            ],
            'income': {
                'name': 'Median Income of Borrowers',
                'label': 'MED_INC_19_Label',
                'nationalRank': 'MED_INC_19_NatRank',
                'stateRank': 'MED_INC_19_StateRank'
            },
            'income_change': {
                'name': 'Percent Change of Median Income since 2009',
                'label': 'MED_INC_pch_0919_Label',
                'nationalRank': 'MED_INC_pch_0919_NatRank',
                'stateRank': 'MED_INC_pch_0919_StateRank'
            },
            'income_demographics': [
                'MED_INC_19_{}_Label',
                'MED_INC_19_{}_NatRank',
                'MED_INC_19_{}_StateRank',
                'MED_INC_pch_0919_{}_Label',
                'MED_INC_pch_0919_{}_NatRank',
                'MED_INC_pch_0919_{}_StateRank'
            ]
        }
    },
    'institutions': {
        'all': {
            'count': {
                'name': 'Number of Higher Ed Institutions',
                'label': 'rawcount_allschools_Label',
                'rank': 'rawcount_allschools_NatRank',
                'change': 'rawcount_allschools_pch_Label'
            },
            'students': {
                'name': 'Unduplicated Undergraduate Students',
                'label': 'enrolled_allschools_Label',
                'rank': 'enrolled_allschools_NatRank',
                'change': 'enrolled_allschools_pch_Label'
            },
            'tuition_fees': {
                'name': 'Average Tuition & Fees',
                'label': 'AVGTF_allschools_Label',
                'rank': 'AVGTF_allschools_NatRank',
                'change': 'AVGTF_allschools_pch_Label'
            },
            'sticker_price': {
                'name': 'Average Sticker Price of College*',
                'label': 'AVGCINSOFF_allschools_Label',
                'rank': 'AVGCINSOFF_allschools_NatRank',
                'change': 'AVGCINSOFF_allschools_pch_Label'
            },
            'real_cost': {
                'name': 'Average Real Cost of College**',
                'label': 'AVGNP_allschools_Label',
                'rank': 'AVGNP_allschools_NatRank',
                'change': 'AVGNP_allschools_pch_Label'
            },
            'sci': {
                'name': 'Average School Concentration Index***',
                'label': 'SCI_allschools',
                'rank': 'SCI_allschools_NatRank',
                'change': 'SCI_allschools_pch_Label'
            }
        },
        'public': {
            'count': {
                'name': 'Number of Higher Ed Institutions',
                'label': 'rawcount_con_1_Label',
                'rank': 'rawcount_con_1_NatRank',
                'change': 'rawcount_con_1_pch_Label'
            },
            'students': {
                'name': 'Unduplicated Undergraduate Students',
                'label': 'enrolled_con_1_Label',
                'rank': 'enrolled_con_1_NatRank',
                'change': 'enrolled_con_1_pch_Label'
            },
            'tuition_fees': {
                'name': 'Average Tuition & Fees',
                'label': 'AVGTF_con_1_Label',
                'rank': 'AVGTF_con_1_NatRank',
                'change': 'AVGTF_con_1_pch_Label'
            },
            'sticker_price': {
                'name': 'Average Sticker Price of College*',
                'label': 'AVGCINSOFF_con_1_Label',
                'rank': 'AVGCINSOFF_con_1_NatRank',
                'change': 'AVGCINSOFF_con_1_pch_Label'
            },
            'real_cost': {
                'name': 'Average Real Cost of College**',
                'label': 'AVGNP_con_1_Label',
                'rank': 'AVGNP_con_1_NatRank',
                'change': 'AVGNP_con_1_pch_Label'
            },
            'sci': {
                'name': 'Average School Concentration Index***',
                'label': 'SCI_con_1',
                'rank': 'SCI_con_1_NatRank',
                'change': 'SCI_con_1_pch_Label'
            }
        },
        'private_for_profit': {
            'count': {
                'name': 'Number of Higher Ed Institutions',
                'label': 'rawcount_con_3_Label',
                'rank': 'rawcount_con_3_NatRank',
                'change': 'rawcount_con_3_pch_Label'
            },
            'students': {
                'name': 'Unduplicated Undergraduate Students',
                'label': 'enrolled_con_3_Label',
                'rank': 'enrolled_con_3_NatRank',
                'change': 'enrolled_con_3_pch_Label'
            },
            'tuition_fees': {
                'name': 'Average Tuition & Fees',
                'label': 'AVGTF_con_3_Label',
                'rank': 'AVGTF_con_3_NatRank',
                'change': 'AVGTF_con_3_pch_Label'
            },
            'sticker_price': {
                'name': 'Average Sticker Price of College**',
                'label': 'AVGCINSOFF_con_3_Label',
                'rank': 'AVGCINSOFF_con_3_NatRank',
                'change': 'AVGCINSOFF_con_3_pch_Label'
            },
            'real_cost': {
                'name': 'Average Real Cost of College***',
                'label': 'AVGNP_con_3_Label',
                'rank': 'AVGNP_con_3_NatRank',
                'change': 'AVGNP_con_3_pch_Label'
            },
            'sci': {
                'name': 'Average School Concentration Index****',
                'label': 'SCI_con_3',
                'rank': 'SCI_con_3_NatRank',
                'change': 'SCI_con_3_pch_Label'
            }
        }
    }
}

data = {}
for df in dfs:
    for i, row in df.iterrows():
        # state = row['State']
        state = row['State_Name']
        if 'CONG_DIST' in row:
            state = '{}, District {}'.format(state, str(row['CONG_DIST'])[-2:])
        data[state] = {}
        for category, scheme in schema.items():
            data[state][category] = {}
            for group, keys in scheme.items():
                data[state][category][group] = {}
                for key, columns in keys.items():
                    if 'demographics' in key:
                        data[state][category][group][key] = {}
                        for demo in demographics:
                            data[state][category][group][key][demo] = []
                            for col_tmpl in columns:
                                column = col_tmpl.format(demo.upper())
                                try:
                                    val = row[column]
                                except KeyError:
                                    val = None
                                if not isinstance(val, str) and (isinstance(val, (int, float)) and math.isnan(val)):
                                    val = None
                                data[state][category][group][key][demo].append(val)
                    else:
                        data[state][category][group][key] = {}
                        for colkey in ['label', 'rank', 'change', 'nationalRank', 'stateRank']:
                            if colkey not in columns: continue
                            column = columns[colkey]

                            if column is None:
                                val = None
                            else:
                                try:
                                    val = row[column]
                                except KeyError:
                                    val = None
                            if val is None or isinstance(val, str) or not math.isnan(val):
                                data[state][category][group][key][colkey] = val
                            else:
                                data[state][category][group][key][colkey] = None
                        data[state][category][group][key]['name'] = columns['name']

with open('gen/factsheets.json', 'w') as f:
    json.dump(data, f)