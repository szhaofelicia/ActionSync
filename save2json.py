import os
import pandas as pd

action = 'bbgame_swing_ball'
split = 'train'
date = '0815'
s = 3  # 3,4,5

df_list = pd.read_csv("data/image_url.csv", header=0, index_col=0).values.tolist()
url_dict = {}
for value in df_list:
    # print(value)
    url_dict[value[0]] = value[1]

data_dir = "/media/felicia/Data/tcc_results/multi_class"
embs_path = 'csv/%s_%s_%s_84videos_embs_patch.csv' % (action, split, date)
embs_df = pd.read_csv(os.path.join(data_dir, embs_path), header=0)

## add column of url
embs_video = embs_df["video"]
embs_step = embs_df["step"]

embs_url = []
for video, step in zip(embs_video, embs_step):
    name = video + "{:04d}".format(step)
    if not url_dict.get(name):
        print(name)
        continue
    url = url_dict[name]
    embs_url.append(url)
    # print(name)

embs_df['url_id'] = embs_url
embs_df.to_json("data/84videos_image_embs.json", orient="table")
