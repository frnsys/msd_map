import json
import math
import pandas as pd

dfs = [pd.read_csv(f) for f in [
    'src/factsheets/MSD_State_Lvl_02.03.21.csv',
    'src/factsheets/MSD_CD_Lvl_02.03.21.csv',
]]

demographics = ['asian', 'black', 'latino', 'white']
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
                'label': 'MED_DEBT_INC_19',
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
                'MED_DEBT_INC_19_{}',
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
                'nationalRank': 'rawcount_allschools_NatRank',
                'stateRank': 'rawcount_allschools_StateRank',
                'change': 'rawcount_allschools_pch_Label'
            },
            'students': {
                'name': 'Unduplicated Undergraduate Students',
                'label': 'enrolled_allschools_Label',
                'nationalRank': 'enrolled_allschools_NatRank',
                'stateRank': 'enrolled_allschools_StateRank',
                'change': 'enrolled_allschools_pch_Label'
            },
            'tuition_fees': {
                'name': 'Average Tuition & Fees',
                'label': 'AVGTF_allschools_Label',
                'nationalRank': 'AVGTF_allschools_NatRank',
                'stateRank': 'AVGTF_allschools_StateRank',
                'change': 'AVGTF_allschools_pch_Label'
            },
            'sticker_price': {
                'name': 'Average Sticker Price of College*',
                'label': 'AVGCINSOFF_allschools_Label',
                'nationalRank': 'AVGCINSOFF_allschools_NatRank',
                'stateRank': 'AVGCINSOFF_allschools_StateRank',
                'change': 'AVGCINSOFF_allschools_pch_Label'
            },
            'real_cost': {
                'name': 'Average Real Cost of College**',
                'label': 'AVGNP_allschools_Label',
                'nationalRank': 'AVGNP_allschools_NatRank',
                'stateRank': 'AVGNP_allschools_StateRank',
                'change': 'AVGNP_allschools_pch_Label'
            },
            'sci': {
                'name': 'Average School Concentration Index***',
                'label': 'SCI_allschools',
                'nationalRank': 'SCI_allschools_NatRank',
                'stateRank': 'SCI_allschools_StateRank',
                'change': 'SCI_allschools_pch_Label'
            }
        },
        'public': {
            'count': {
                'name': 'Number of Higher Ed Institutions',
                'label': 'rawcount_con_1_Label',
                'nationalRank': 'rawcount_con_1_NatRank',
                'stateRank': 'rawcount_con_1_StateRank',
                'change': 'rawcount_con_1_pch_Label'
            },
            'students': {
                'name': 'Unduplicated Undergraduate Students',
                'label': 'enrolled_con_1_Label',
                'nationalRank': 'enrolled_con_1_NatRank',
                'stateRank': 'enrolled_con_1_StateRank',
                'change': 'enrolled_con_1_pch_Label'
            },
            'tuition_fees': {
                'name': 'Average Tuition & Fees',
                'label': 'AVGTF_con_1_Label',
                'nationalRank': 'AVGTF_con_1_NatRank',
                'stateRank': 'AVGTF_con_1_StateRank',
                'change': 'AVGTF_con_1_pch_Label'
            },
            'sticker_price': {
                'name': 'Average Sticker Price of College*',
                'label': 'AVGCINSOFF_con_1_Label',
                'nationalRank': 'AVGCINSOFF_con_1_NatRank',
                'stateRank': 'AVGCINSOFF_con_1_StateRank',
                'change': 'AVGCINSOFF_con_1_pch_Label'
            },
            'real_cost': {
                'name': 'Average Real Cost of College**',
                'label': 'AVGNP_con_1_Label',
                'nationalRank': 'AVGNP_con_1_NatRank',
                'stateRank': 'AVGNP_con_1_StateRank',
                'change': 'AVGNP_con_1_pch_Label'
            },
            'sci': {
                'name': 'Average School Concentration Index***',
                'label': 'SCI_con_1',
                'nationalRank': 'SCI_con_1_NatRank',
                'stateRank': 'SCI_con_1_StateRank',
                'change': 'SCI_con_1_pch_Label'
            }
        },
        'private_for_profit': {
            'count': {
                'name': 'Number of Higher Ed Institutions',
                'label': 'rawcount_con_3_Label',
                'nationalRank': 'rawcount_con_3_NatRank',
                'stateRank': 'rawcount_con_3_StateRank',
                'change': 'rawcount_con_3_pch_Label'
            },
            'students': {
                'name': 'Unduplicated Undergraduate Students',
                'label': 'enrolled_con_3_Label',
                'nationalRank': 'enrolled_con_3_NatRank',
                'stateRank': 'enrolled_con_3_StateRank',
                'change': 'enrolled_con_3_pch_Label'
            },
            'tuition_fees': {
                'name': 'Average Tuition & Fees',
                'label': 'AVGTF_con_3_Label',
                'nationalRank': 'AVGTF_con_3_NatRank',
                'stateRank': 'AVGTF_con_3_StateRank',
                'change': 'AVGTF_con_3_pch_Label'
            },
            'sticker_price': {
                'name': 'Average Sticker Price of College**',
                'label': 'AVGCINSOFF_con_3_Label',
                'nationalRank': 'AVGCINSOFF_con_3_NatRank',
                'stateRank': 'AVGCINSOFF_con_3_StateRank',
                'change': 'AVGCINSOFF_con_3_pch_Label'
            },
            'real_cost': {
                'name': 'Average Real Cost of College***',
                'label': 'AVGNP_con_3_Label',
                'nationalRank': 'AVGNP_con_3_NatRank',
                'stateRank': 'AVGNP_con_3_StateRank',
                'change': 'AVGNP_con_3_pch_Label'
            },
            'sci': {
                'name': 'Average School Concentration Index****',
                'label': 'SCI_con_3',
                'nationalRank': 'SCI_con_3_NatRank',
                'stateRank': 'SCI_con_3_StateRank',
                'change': 'SCI_con_3_pch_Label'
            }
        },
        'private_not_for_profit': {
            'count': {
                'name': 'Number of Higher Ed Institutions',
                'label': 'rawcount_con_2_Label',
                'nationalRank': 'rawcount_con_2_NatRank',
                'stateRank': 'rawcount_con_2_StateRank',
                'change': 'rawcount_con_2_pch_Label'
            },
            'students': {
                'name': 'Unduplicated Undergraduate Students',
                'label': 'enrolled_con_2_Label',
                'nationalRank': 'enrolled_con_2_NatRank',
                'stateRank': 'enrolled_con_2_StateRank',
                'change': 'enrolled_con_2_pch_Label'
            },
            'tuition_fees': {
                'name': 'Average Tuition & Fees',
                'label': 'AVGTF_con_2_Label',
                'nationalRank': 'AVGTF_con_2_NatRank',
                'stateRank': 'AVGTF_con_2_StateRank',
                'change': 'AVGTF_con_2_pch_Label'
            },
            'sticker_price': {
                'name': 'Average Sticker Price of College**',
                'label': 'AVGCINSOFF_con_2_Label',
                'nationalRank': 'AVGCINSOFF_con_2_NatRank',
                'stateRank': 'AVGCINSOFF_con_2_StateRank',
                'change': 'AVGCINSOFF_con_2_pch_Label'
            },
            'real_cost': {
                'name': 'Average Real Cost of College***',
                'label': 'AVGNP_con_2_Label',
                'nationalRank': 'AVGNP_con_2_NatRank',
                'stateRank': 'AVGNP_con_2_StateRank',
                'change': 'AVGNP_con_2_pch_Label'
            },
            'sci': {
                'name': 'Average School Concentration Index****',
                'label': 'SCI_con_2',
                'nationalRank': 'SCI_con_2_NatRank',
                'stateRank': 'SCI_con_2_StateRank',
                'change': 'SCI_con_2_pch_Label'
            }
        },
        'bachelors': {
            'count': {
                'name': 'Number of Higher Ed Institutions',
                'label': 'rawcount_lev_1_Label',
                'nationalRank': 'rawcount_lev_1_NatRank',
                'stateRank': 'rawcount_lev_1_StateRank',
                'change': 'rawcount_lev_1_pch_Label'
            },
            'students': {
                'name': 'Unduplicated Undergraduate Students',
                'label': 'enrolled_lev_1_Label',
                'nationalRank': 'enrolled_lev_1_NatRank',
                'stateRank': 'enrolled_lev_1_StateRank',
                'change': 'enrolled_lev_1_pch_Label'
            },
            'tuition_fees': {
                'name': 'Average Tuition & Fees',
                'label': 'AVGTF_lev_1_Label',
                'nationalRank': 'AVGTF_lev_1_NatRank',
                'stateRank': 'AVGTF_lev_1_StateRank',
                'change': 'AVGTF_lev_1_pch_Label'
            },
            'sticker_price': {
                'name': 'Average Sticker Price of College**',
                'label': 'AVGCINSOFF_lev_1_Label',
                'nationalRank': 'AVGCINSOFF_lev_1_NatRank',
                'stateRank': 'AVGCINSOFF_lev_1_StateRank',
                'change': 'AVGCINSOFF_lev_1_pch_Label'
            },
            'real_cost': {
                'name': 'Average Real Cost of College***',
                'label': 'AVGNP_lev_1_Label',
                'nationalRank': 'AVGNP_lev_1_NatRank',
                'stateRank': 'AVGNP_lev_1_StateRank',
                'change': 'AVGNP_lev_1_pch_Label'
            },
            'sci': {
                'name': 'Average School Concentration Index****',
                'label': 'SCI_lev_1',
                'nationalRank': 'SCI_lev_1_NatRank',
                'stateRank': 'SCI_lev_1_StateRank',
                'change': 'SCI_lev_1_pch_Label'
            }
        },
        'associates': {
            'count': {
                'name': 'Number of Higher Ed Institutions',
                'label': 'rawcount_lev_2_Label',
                'nationalRank': 'rawcount_lev_2_NatRank',
                'stateRank': 'rawcount_lev_2_StateRank',
                'change': 'rawcount_lev_2_pch_Label'
            },
            'students': {
                'name': 'Unduplicated Undergraduate Students',
                'label': 'enrolled_lev_2_Label',
                'nationalRank': 'enrolled_lev_2_NatRank',
                'stateRank': 'enrolled_lev_2_StateRank',
                'change': 'enrolled_lev_2_pch_Label'
            },
            'tuition_fees': {
                'name': 'Average Tuition & Fees',
                'label': 'AVGTF_lev_2_Label',
                'nationalRank': 'AVGTF_lev_2_NatRank',
                'stateRank': 'AVGTF_lev_2_StateRank',
                'change': 'AVGTF_lev_2_pch_Label'
            },
            'sticker_price': {
                'name': 'Average Sticker Price of College**',
                'label': 'AVGCINSOFF_lev_2_Label',
                'nationalRank': 'AVGCINSOFF_lev_2_NatRank',
                'stateRank': 'AVGCINSOFF_lev_2_StateRank',
                'change': 'AVGCINSOFF_lev_2_pch_Label'
            },
            'real_cost': {
                'name': 'Average Real Cost of College***',
                'label': 'AVGNP_lev_2_Label',
                'nationalRank': 'AVGNP_lev_2_NatRank',
                'stateRank': 'AVGNP_lev_2_StateRank',
                'change': 'AVGNP_lev_2_pch_Label'
            },
            'sci': {
                'name': 'Average School Concentration Index****',
                'label': 'SCI_lev_2',
                'nationalRank': 'SCI_lev_2_NatRank',
                'stateRank': 'SCI_lev_2_StateRank',
                'change': 'SCI_lev_2_pch_Label'
            }
        },
        'below_associates': {
            'count': {
                'name': 'Number of Higher Ed Institutions',
                'label': 'rawcount_lev_3_Label',
                'nationalRank': 'rawcount_lev_3_NatRank',
                'stateRank': 'rawcount_lev_3_StateRank',
                'change': 'rawcount_lev_3_pch_Label'
            },
            'students': {
                'name': 'Unduplicated Undergraduate Students',
                'label': 'enrolled_lev_3_Label',
                'nationalRank': 'enrolled_lev_3_NatRank',
                'stateRank': 'enrolled_lev_3_StateRank',
                'change': 'enrolled_lev_3_pch_Label'
            },
            'tuition_fees': {
                'name': 'Average Tuition & Fees',
                'label': 'AVGTF_lev_3_Label',
                'nationalRank': 'AVGTF_lev_3_NatRank',
                'stateRank': 'AVGTF_lev_3_StateRank',
                'change': 'AVGTF_lev_3_pch_Label'
            },
            'sticker_price': {
                'name': 'Average Sticker Price of College**',
                'label': 'AVGCINSOFF_lev_3_Label',
                'nationalRank': 'AVGCINSOFF_lev_3_NatRank',
                'stateRank': 'AVGCINSOFF_lev_3_StateRank',
                'change': 'AVGCINSOFF_lev_3_pch_Label'
            },
            'real_cost': {
                'name': 'Average Real Cost of College***',
                'label': 'AVGNP_lev_3_Label',
                'nationalRank': 'AVGNP_lev_3_NatRank',
                'stateRank': 'AVGNP_lev_3_StateRank',
                'change': 'AVGNP_lev_3_pch_Label'
            },
            'sci': {
                'name': 'Average School Concentration Index****',
                'label': 'SCI_lev_3',
                'nationalRank': 'SCI_lev_3_NatRank',
                'stateRank': 'SCI_lev_3_StateRank',
                'change': 'SCI_lev_3_pch_Label'
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