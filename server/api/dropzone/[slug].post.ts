// This script uploads a file to google drive using information provided by a dropzone entry on content.zebrapig.com
// The a .google_auth_key.json for a service account is required

import stream  from "stream"
import multer from "multer"
import formidable from 'formidable'
import { file } from "googleapis/build/src/apis/file";
import fs from 'fs';
import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';

function sendNotification(webhookUrl: string, file, dropzone) {
  const data = JSON.stringify({
    cardsV2: [
      {
        cardId: "unique-card-id",
        card: {
          header: {
            title: "File uploaded",
            subtitle: file.name,
            imageUrl: file.thumbnailLink,
            imageAltText: "Thumbnail",
          },
          sections: [
            {
              header: "Dropzone: "+dropzone.title,
              widgets: [
                {
                  buttonList: {
                    buttons: [
                      {
                        text: "View",
                        onClick: {
                          openLink: {
                            url: file.webViewLink,
                          }
                        }
                      },
                    ],
                  }
                },
              ],
            },
          ],
        },
      }
    ],
  });
  
  let resp;
  fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: data,
  }).then((response) => {
    resp = response;
    console.log(response);
  });
  return resp;
}


function getGoogleAuth (){
  const SCOPES = ['https://www.googleapis.com/auth/drive'];
  const auth = new google.auth.GoogleAuth({
    scopes: SCOPES,
    keyFile: "./.keys/google_auth_uploader.json"
  });

  return auth;
};

async function gql({query, variables}){
  const config = useRuntimeConfig()
  const q = await fetch(config.public.GQL_HOST, {
    method: "POST",
    headers: {
      "Authorization" : `Bearer ${config.GQL_PRIVATE_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      variables
    })
  })

  return q.json()
}

async function getDropzone(hash){
  const config = useRuntimeConfig()
  const dropzoneQuery = await gql({
    query: `query Dropzones($filter: dropzones_filter) {
          dropzones(filter: $filter) {
            status
            title
            hash
            folder_id
            webhook {
              url
            }
          }
        }`,
    variables: {
      "filter": {
        "hash": {
          "_eq": hash
        }
      }
    }
  })

  const dropzone = dropzoneQuery.data.dropzones[0]
  return dropzone
}

async function uploadFile(file, folderId, event){
  const auth = getGoogleAuth()

  const service = google.drive({version: 'v3', auth});
  const fileMetadata = {
    name: file.originalFilename,
    parents: [folderId]
  };
  const media = {
    mimeType: file.mimetype,
    body: fs.createReadStream(file.filepath),
  };
  try {
    const file = await service.files.create({
      supportsAllDrives: true,
      resource: fileMetadata,
      media: media,
      fields: 'id,name,thumbnailLink,webViewLink',
    });
    console.log('File Id:', file.data.id);
    return file.data;
  } catch (err) {
    sendError(event, createError({
      statusCode: 500,
      statusMessage: "Upload failed"
    }))
  }
}

export default defineEventHandler(async (event) => {
  const hash = event.context.params.slug

  const dropzone = await getDropzone(hash)
  if(!dropzone.folder_id){
    sendError(event, createError({
      statusCode: 500,
      statusMessage:  "No upload target for the file found"
    }))
  }

  const form = formidable({ multiples: true })
  const upload = multer();

  return new Promise(async (resolve) => {
    form.parse(event.req, async (err, fields, files) => {
      if(files.file == undefined){
        sendError(event, createError({
          statusCode: 422,
          statusMessage: "No file found"
        }))
      }
      const file = await uploadFile(files.file, dropzone.folder_id, event)
      if(file && dropzone.webhook?.url){
        sendNotification(dropzone.webhook.url, file, dropzone)
      }
      resolve({
        id: file.id
      })
    })
  })
})