import stream  from "stream"
import multer from "multer"
import formidable from 'formidable'
import { file } from "googleapis/build/src/apis/file";
import fs from 'fs';
import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';


function getGoogleAuth (){
  const SCOPES = ['https://www.googleapis.com/auth/drive'];
  const auth = new google.auth.GoogleAuth({
    scopes: SCOPES,
    keyFile: ".google_auth_key.json"
  });

  return auth;
};

async function getDropzone(hash){
  const config = useRuntimeConfig().public
  const dropzoneQuery = await fetch(config.GQL_HOST, {
    method: "POST",
    headers: {
      "Authorization" : `Bearer ${config.GQL_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `query Dropzones($filter: dropzones_filter) {
          dropzones(filter: $filter) {
            status
            title
            hash
            folder_id
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
  })

  const dropzoneResponse = await dropzoneQuery.json()
  const dropzone = dropzoneResponse.data.dropzones[0]
  return dropzone
}

async function uploadFile(file, folderId){
  const auth = getGoogleAuth()
  console.log(folderId)

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
      resource: fileMetadata,
      media: media,
      fields: 'id,name',
    });
    console.log('File Id:', file.data.id);
    return file.data.id;
  } catch (err) {
    // TODO(developer) - Handle error
    throw err;
  }
}

export default defineEventHandler(async (event) => {
  const hash = event.context.params.slug

  const dropzone = await getDropzone(hash)

  const form = formidable({ multiples: true })
  const upload = multer();

  return new Promise(async (resolve) => {
    form.parse(event.req, async (err, fields, files) => {
      console.log(files.file.filepath)
      const uploadStatus = await uploadFile(files.file, dropzone.folder_id)
      resolve(uploadStatus)
    })
  })
})