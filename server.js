const express = require('express');
const cors = require('cors')
const multer = require('multer');
const progress = require('progress-stream');

const app = express();
app.use(express.json());
app.use(cors());

let progressPercent = 0;

// create multer storage instance
let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, req.destination);
  },
  filename: function (req, file, cb) {
    cb(null, 'new day' + file.originalname);
  }
});

// create multer upload instance
let upload = multer({
  storage: storage
}).array('file1');


// Upload Endpoint
app.post('/upload', (req, res) => {
  
  if (req.files === null) {
    return res.status(400).json({ msg: 'No file uploaded' });
  }

  // read file size from req.file and replace in length below
  const singleFileSize = req.headers["content-length"];
  
  // NOTE:- for multi file upload,read each file size from file object and iterate over files


  const progressObj = progress({length: singleFileSize});

  // path to store uploaded file
  progressObj.destination = '/Users/surendragalwa/Documents/Learning/NodeJs/react_file_uploader/client/uploads';

  // pipe file upload request with progress stream to get upload progress
  req.pipe(progressObj);
  progressObj.headers = req.headers;
  progressObj.on('progress', (progress) => {
    // set upload progress global variable
    progressPercent = progress.percentage;
  })


  // multer upload
  upload(progressObj, res, function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(500).json(err);
    } else if (err) {
      return res.status(500).json(err);
    }

    console.log('Files uploaded. Bye! Grab your response.');
    return res.status(200).send(req.file);
  });

});

// get request for SSE to get upload progress
app.get('/upload', (req, res) => {
  
  // customized response headers
  res.writeHead(200, {
    Connection: 'keep-alive',
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache'
  });

  // read file upload progress after each 100ms
  const intervalInstance = setInterval(() => {

    // close connection and clear interval if file has uploaded
    if (parseInt(progressPercent) == 100) {
      console.log('Final upload progress:', progressPercent);
      
      clearInterval(intervalInstance);
      // return res.end();
    }

    res.write(
      `event: uploadProgress\nid: ${new Date()}\ndata: ${parseInt(progressPercent)}`
    );
    
    res.write('\n\n');
    
    console.log(`Reading & Sending upload progress as: ${JSON.stringify(progressPercent)}%`);
  
  }, 100);
  
});

app.listen(5000, () => console.log('Server Started...'));
