import numpy as np
import json
import csv
import random

action='bbgame_swing_ball'
split='train'
date='0815'

embs_path='/media/felicia/Data/tcc_results/multi_class/%s_%s_%s_embs.npy'

embs_dict= np.load(embs_path%(action,split,date),allow_pickle=True)
embs_dict=embs_dict.item()

np_embs=embs_dict['embs'].tolist()
pca_list=embs_dict['pca'].tolist()
np_tsne=embs_dict['tsne'].tolist()
names_list= embs_dict['names'].tolist()
seq_lens_list= embs_dict['seq_lens'].tolist()
steps_list=embs_dict['steps'].tolist()
dtw_align=embs_dict['dtw'].tolist()
nn_align=embs_dict['nn'].tolist()
seq_labels_list=embs_dict['seq_labels'].tolist() # multi-class

###################################
## save 2 json

names_list=[n.decode('utf-8') for n in names_list]
json_dict={
    'embs':np_embs,
    'pca':pca_list,
    'tsne':np_tsne,
    'names':names_list,
    'seq_lens':seq_lens_list,
    'steps':steps_list,
    'dtw':dtw_align,
    'nn':nn_align,
    'seq_labels':seq_labels_list
}


json_path='/media/felicia/Data/tcc_results/jsons/%s_%s_%s_embs.json'
with open(json_path%(action,split,date),'w') as file:
    json.dump(json_dict,file)


#######################################
## save 2 csv

csv_data=[]
for i in range(len(np_embs)):
    temp_dict={}
    for k in embs_dict.keys():
        temp_dict[k]=embs_dict[k][i].tolist()
    csv_data.append(temp_dict)

csv_columns=embs_dict.keys()

csv_path='data/%s_%s_%s_embs.csv'
with open(csv_path%(action,split,date),'w') as csvfile:
    writer=csv.DictWriter(csvfile,fieldnames=csv_columns)
    writer.writeheader()
    for data in csv_data:
        writer.writerow(data)

## test
# import pandas as pd 
# df=pd.read_csv(csv_path%(action,split,date),header=0)


# sampel 5000
samp_idx=[x for x in range(200)] +random.sample([x for x in range(200,len(np_tsne))],4800) 

csv_data=[]
for i in samp_idx:
    temp_dict={}
    for k in embs_dict.keys():
        temp_dict[k]=embs_dict[k][i].tolist()
    csv_data.append(temp_dict)

csv_columns=embs_dict.keys()

csv_path='data/%s_%s_%s_5000_embs.csv'
with open(csv_path%(action,split,date),'w') as csvfile:
    writer=csv.DictWriter(csvfile,fieldnames=csv_columns)
    writer.writeheader()
    for data in csv_data:
        writer.writerow(data)


# sampel 200
samp_idx=[x for x in range(200)]  

csv_data=[]
for i in samp_idx:
    temp_dict={}
    for k in embs_dict.keys():
        temp_dict[k]=embs_dict[k][i].tolist()
    csv_data.append(temp_dict)

csv_columns=embs_dict.keys()

csv_path='data/%s_%s_%s_200_embs.csv'
with open(csv_path%(action,split,date),'w') as csvfile:
    writer=csv.DictWriter(csvfile,fieldnames=csv_columns)
    writer.writeheader()
    for data in csv_data:
        writer.writerow(data)
