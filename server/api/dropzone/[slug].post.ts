const stream = require('stream');
const express = require('express');
const multer = require('multer');
const { google } = require('googleapis');

const uploadRouter = express.Router();
const upload = multer();

const uploadFile = async (fileObject, folderId) => {
  const bufferStream = new stream.PassThrough();
  bufferStream.end(fileObject.buffer);
  const { data } = await google.drive({ version: 'v3' }).files.create({
    media: {
      mimeType: fileObject.mimeType,
      body: bufferStream,
    },
    requestBody: {
      name: fileObject.originalname,
      parents: [folderId],
    },
    fields: 'id,name',
  });
  console.log(`Uploaded file ${data.name} ${data.id}`);
};




export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig().public
  const hash = event.context.params.slug

  var auth = { "Authorization" : `Bearer ${config.GQL_TOKEN}` };
  const dropzoneData = await fetch(config.GQL_HOST, {
    headers: auth
  })

  try {
    const { body, files } = req;

    for (let f = 0; f < files.length; f += 1) {
      await uploadFile(files[f], '1ZmM3nM8gsz5nccy5NZ6bAKUSJzPKbw5t');
    }

    console.log(body);
    return {
      status: "Success"
    }
  } catch (f) {
    return {
      status: "Error"
    }
  }
})