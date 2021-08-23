from __future__ import print_function
import os.path
import pandas as pd
import numpy as np

from googleapiclient.discovery import build
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials

SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly']
if os.path.exists('token.json'):
    creds = Credentials.from_authorized_user_file('token.json', SCOPES)
drive_service = build('drive', 'v3', credentials=creds)

page_token = None

names = []
ids = []
while True:
    response = drive_service.files().list(q="mimeType='image/jpeg'",
                                          spaces='drive',
                                          fields='nextPageToken, files(id, name)',
                                          pageToken=page_token).execute()
    for file in response.get('files', []):
        # Process change
        # print('Found file: %s (%s)' % (file.get('name'), file.get('id')))
        name = file.get("name")[:-4]
        if len(name) == 16:
            names.append(name)
            ids.append(file.get("id"))
    page_token = response.get('nextPageToken', None)
    if page_token is None:
        break

df_list = pd.DataFrame(np.array([names, ids]).T, columns=["name", "id"])
df_list.to_csv("data/image_url.csv")
# df_list = pd.read_csv("data/image_url.csv", header=0, index_col=0)
df_list.to_json("data/image_url.json", orient="table")
