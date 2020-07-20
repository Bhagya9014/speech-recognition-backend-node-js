"use strict";

const express = require("express");
const app = express();
const { get } = require("lodash");
const speech = require("./utils/speechclient");
const bodyParser = require("body-parser");
var path = require("path");
const multer = require("multer");
var crypto = require("crypto");
var storage = multer.diskStorage({
  destination: "uploads/",
  filename: function(req, file, cb) {
    crypto.pseudoRandomBytes(16, function(err, raw) {
      if (err) return cb(err);

      cb(null, raw.toString("hex") + path.extname(file.originalname));
    });
  }
});

var upload = multer({ storage: storage });

const fs = require("fs");
const port = 3005;

app.use(
  bodyParser.urlencoded({
    extended: true
  })
);

app.use(bodyParser.json());

app.post("/speech", upload.single("uploaded_file"), async(request, response) => {
    console.log(request.file);
    const data = request;
    if (data.file) {
    try {
       const client = speech.init();
        const name = data.file.filename;
        const path = __dirname + "/uploads/" + name;
        const savedFile = fs.readFileSync(path);
        const audioBytes = await savedFile.toString("base64");
        const audio = {
          content: audioBytes
        };
        const config = {
          encoding: "AMR",
          sampleRateHertz: 8000,
          languageCode: "en-US"
        };
        const request = {
          audio: audio,
          config: config
        };
        client
          .recognize(request)
          .then(data => {
            const results = get(data[0], "results", []);
            const transcript = results
              .map(result => result.alternatives[0].transcript)
              .join("\n");
            console.log(`Transcription: ${transcript}`);
             console.log("Result: ", transcript);
            fs.unlinkSync(path);
            response.send(transcript);
          })
          .catch(err => {
            console.error("ERROR:", err);
          });
      }
     catch (err) {
      console.log(err);
      response.status(500);
    }
  }
});
app.listen(port, () => console.log(`Example app listening on port ${port}!`));
