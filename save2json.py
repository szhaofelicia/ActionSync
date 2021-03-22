import numpy as np
import json
import csv
import random
import pandas as pd

action='bbgame_swing_ball'
split='train'
date='0815'
s=3 # 3,4,5

# embs_path='/media/felicia/Data/tcc_results/multi_class/%s_%s_%s_embs.npy'
# embs_dict= np.load(embs_path%(action,split,date),allow_pickle=True)

# embs_path='/media/felicia/Data/tcc_results/multi_class/%s_%s_%s_embs_flow_thresholds_%s.npy'
# embs_dict= np.load(embs_path%(action,split,date,s),allow_pickle=True)

embs_path='/media/felicia/Data/tcc_results/multi_class/%s_%s_%s_embs_flow_48videos.npy'
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
ave_flow=embs_dict['flow'].tolist()  # list

###################################
## save 2 json

names_list=[n.decode('utf-8') for n in names_list]
id_list=[i for i in range(len(dtw_align))]
json_dict={
    'embs':np_embs,
    'pca':pca_list,
    'tsne':np_tsne,
    'names':names_list,
    'seq_lens':seq_lens_list,
    'steps':steps_list,
    'dtw':dtw_align,
    'nn':nn_align,
    'seq_labels':seq_labels_list,
    'flow':ave_flow,
    'id':id_list
}


json_path='/media/felicia/Data/tcc_results/jsons/%s_%s_%s_embs_flow_%d.json'
with open(json_path%(action,split,date,s),'w') as file:
    json.dump(json_dict,file)


#######################################
## save 2 csv

csv_data=[]
for i in range(len(np_embs)):
    temp_dict={}
    for k in embs_dict.keys():
        if k!='summary':
            temp_dict[k]=embs_dict[k][i].tolist()
    temp_dict['id']=i
    csv_data.append(temp_dict)
csv_columns=temp_dict.keys()

# csv_path='data/%s_%s_%s_embs_flow_%d.csv'
csv_path='data/%s_%s_%s_embs_flow_48videos.csv'

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
    temp_dict['id']=i
    csv_data.append(temp_dict)
csv_columns=temp_dict.keys()

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
    temp_dict['id']=i
    csv_data.append(temp_dict)
csv_columns=temp_dict.keys()


csv_path='data/%s_%s_%s_200_embs.csv'
with open(csv_path%(action,split,date),'w') as csvfile:
    writer=csv.DictWriter(csvfile,fieldnames=csv_columns)
    writer.writeheader()
    for data in csv_data:
        writer.writerow(data)



###################  load patch and save it to csv ######################

patch_time='11-10-20-48'

patch_dir_swing="/media/felicia/Data/object_detection/patch/swing/patch_dict_%s.npy"%patch_time
patch_dir_swing= np.load(patch_dir_swing,allow_pickle=True)
patch_dir_swing=patch_dir_swing.item()

patch_dir_ball="/media/felicia/Data/object_detection/patch/ball/patch_dict_12-22-17-59.npy"
patch_dir_ball= np.load(patch_dir_ball,allow_pickle=True)
patch_dir_ball=patch_dir_ball.item()

patch_dict=patch_dir_swing.update(patch_dir_ball)

action='bbgame_swing_ball'
split='train'
date='0815'
# csv_path='data/%s_%s_%s_embs_flow_48videos.csv'%(action,split,date)
csv_path='data/%s_%s_%s_5000_embs.csv'%(action,split,date)

new_path='data/%s_%s_%s_5000_embs_patch.csv'%(action,split,date)


embs_df=pd.read_csv(csv_path,header=0)
embs_data=embs_df.values

nembs=len(embs_data)
left=[]
right=[]

for i in range(nembs):
    if embs_data[i][-3]==0:
        step=int(embs_data[i][5]//3)
        key='%s_%s'%(embs_data[i][3][2:-1],"{:02d}".format(step))
        l,r,t,b=list(map(int, patch_dir_swing[key]['left']))
        left.append([l,t])

        l,r,t,b=list(map(int, patch_dir_swing[key]['right']))
        right.append([l,t])
    else:
        left.append([0,160])
        right.append([720,60])

embs_df['left']=left
embs_df['right']=right

embs_df.to_csv(new_path, index=False)


################### patch ######################

action='bbgame_swing_ball'
split='train'
date='0815'

embs_path='/media/felicia/Data/tcc_results/multi_class/%s_%s_%s_embs.npy'
embs_dict= np.load(embs_path%(action,split,date),allow_pickle=True)
embs_dict=embs_dict.item()

pca_list=embs_dict['pca'].tolist()
np_tsne=embs_dict['tsne'].tolist()
names_list= embs_dict['names'].tolist()
seq_lens_list= embs_dict['seq_lens'].tolist()
steps_list=embs_dict['steps'].tolist()
dtw_align=embs_dict['dtw'].tolist()
seq_labels_list=embs_dict['seq_labels'].tolist() # multi-class

nframes=len(np_tsne)
csv_data=[]

# for i in range(nframes):
#     temp_dict={}
#     if seq_labels_list[i]==0: ## swing
#         temp_dict['x']=np_tsne[i][0]
#         temp_dict['y']=np_tsne[i][1]
#         temp_dict['dtw']=dtw_align[i]
#         temp_dict['domain']="image"
#         csv_data.append(temp_dict)
# csv_columns=csv_data[0].keys()

for i in range(nframes):
    temp_dict={}
    if seq_labels_list[i]==0: ## swing
        temp_dict['x']=pca_list[i][0]
        temp_dict['y']=pca_list[i][1]
        temp_dict['dtw']=dtw_align[i]
        temp_dict['domain']="image"
        csv_data.append(temp_dict)
csv_columns=csv_data[0].keys()


patch_dir='/media/felicia/Data/tcc_results/multi_class/%s_%s_%s_embs.npy'%("bbgame_swing_patch",split,"1119")

patch_dict= np.load(patch_dir,allow_pickle=True)
patch_dict=patch_dict.item()

pca_list=patch_dict['pca'].tolist()
np_tsne=patch_dict['tsne'].tolist()
names_list= patch_dict['names'].tolist()
seq_lens_list= patch_dict['seq_lens'].tolist()
steps_list=patch_dict['steps'].tolist()
dtw_align=patch_dict['dtw'].tolist()
seq_labels_list=patch_dict['seq_labels'].tolist() # multi-class

# for i in range(len(np_tsne)):
#     temp_dict={}
#     temp_dict['x']=np_tsne[i][0]
#     temp_dict['y']=np_tsne[i][1]
#     temp_dict['dtw']=dtw_align[i]
#     if seq_labels_list[i]==0: ## swing
#         temp_dict['domain']="left"
#     else:
#         temp_dict['domain']="right"
#     csv_data.append(temp_dict)

for i in range(len(np_tsne)):
    temp_dict={}
    temp_dict['x']=pca_list[i][0]
    temp_dict['y']=pca_list[i][1]
    temp_dict['dtw']=dtw_align[i]
    if seq_labels_list[i]==0: ## swing
        temp_dict['domain']="left"
    else:
        temp_dict['domain']="right"
    csv_data.append(temp_dict)

# csv_path='data/bbgame_swing_multiple_%s_%s_tsne_dtw.csv'%(split,date)
# with open(csv_path,'w') as csvfile:
#     writer=csv.DictWriter(csvfile,fieldnames=csv_columns)
#     writer.writeheader()
#     for data in csv_data:
#         writer.writerow(data)

csv_path='data/bbgame_swing_multiple_%s_%s_pca_dtw.csv'%(split,date)
with open(csv_path,'w') as csvfile:
    writer=csv.DictWriter(csvfile,fieldnames=csv_columns)
    writer.writeheader()
    for data in csv_data:
        writer.writerow(data)