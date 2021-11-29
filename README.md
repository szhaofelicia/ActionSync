# ActionSync: A Visual Analytics System

__ActionSync__ is an interactive visual analytics system that analyzes the correlation between the player actions and the results of pitches in base baseball games.

Our system visually analyze the sports video clips extracted from the MLB-YouTube dataset, which consists of various activities of pitching in baseball games.

ActionSync supports analysis of actions on two levels: video level and image level. 
On the video level, it can visually summarize and compare the actions in video clips and detect frames related to the results of actions, and guide users to analyze videos of interest; 
on the image level, it can detect the frames related to the results and allow users to check the actual frame of selection.



## Table of Content

- [Repository Structure](#repository-structure)
- [Generate explanations for your own video dataset](#generate-explanations-for-your-own-video-dataset)
- [Run the web app locally](#web-application)

## Repository Structure

`backend/` folder:
- `quickstart.py` contains the function that use Drive v3 API to quickly access to the Google Drive folder where store the images extracted from the video clips.
- `drive_files.py` loads the urls of each images and save them into `data/image_url.csv`.
- `save2json.py` add the attributes in `data/image_url.csv` to `"data/84videos_image_embs.json` where contain the image embeddings of 84 videos.

`data/` folder:
-  `image_url.csv` contains the data of image embeddings, which are shown in the image embedding video.
-  `84videos_image_embs.json` contain the data of image embeddings, which are shown in the image embedding video.
-  `84videos_vector.csv` contain the data of image embeddings, which are shown in the image embedding video.
-  `video_attribute.json` contain the data of image embeddings, which are shown in the image embedding video.
-  `video_events.json` contain the data of image embeddings, which are shown in the image embedding video.

`js/` and `css/` folder:
- these folders contain all the front-end code of the visual analytics system __ActionSync__.

## Generate explanations for your own video dataset
The codes for video processing is shown in https://github.com/szhaofelicia/TripletTCC


## Web application

- Download the repository.
- Open the terminal at the home directory
- Run the server:
    - run the command `python -m http.server`
- Visit the web application at `localhost:8000/index.html`.

