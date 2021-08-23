import cv2
import os
import pandas as pd

action = 'bbgame_swing_ball'
split = 'train'
date = '0815'
csv_path = 'data/%s_%s_%s_200_embs.csv'

embs = pd.read_csv(csv_path % (action, split, date), header=0)
names = embs['names']
labels = embs['seq_labels']

videos = list(set([(x, y) for x, y in zip(names, labels)]))

video_path = ['/media/felicia/Data/mlb-youtube/swing_videos/rm_noise/videos/',
              '/media/felicia/Data/mlb-youtube/ball_videos/rm_noise/videos/']
frame_path = ['/media/felicia/Data/mlb-youtube/swing_videos/rm_noise/frames/',
              '/media/felicia/Data/mlb-youtube/ball_videos/rm_noise/frames/']

aws_path = '/media/felicia/Data/mlb-youtube/aws_frames/'
actions = ['swing/', 'ball/']

for i in range(len(videos)):
    v, l = videos[i]
    v = v[2:-1]
    vidcap = cv2.VideoCapture(video_path[l] + v + '.mp4')
    success, image = vidcap.read()
    count = 0
    while success:
        cv2.imwrite(aws_path + actions[l] + v + "{:04d}".format(count) + ".jpg", image)  # save frame as JPEG file
        success, image = vidcap.read()
        count += 1
    print('Read video: ', v)
