const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AWS = require('aws-sdk');
const cors = require('cors');
require('dotenv').config(); // Load environment variables from .env file

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
  console.log('Uploads directory created:', uploadDir);
} else {
  console.log('Uploads directory already exists:', uploadDir);
}

// Configure AWS SDK
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const transcribeService = new AWS.TranscribeService();
const s3 = new AWS.S3();
const polly = new AWS.Polly();
const sagemakerRuntime = new AWS.SageMakerRuntime();

const app = express();
const port = 3000;

app.use(cors()); // Enable CORS for all routes

// Configure multer to save files in the uploads directory
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/';
    console.log('Saving file to:', dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const filename = file.fieldname + '-' + Date.now() + path.extname(file.originalname);
    console.log('Saving file as:', filename);
    cb(null, filename);
  },
});

const upload = multer({ storage: storage });

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Handle file upload and processing
app.post('/upload', upload.single('mp3File'), async (req, res) => {
  console.log('Received request to /upload');
  if (req.file) {
    const filePath = path.join(__dirname, 'uploads', req.file.filename);
    console.log('File received and saved at:', filePath);

    // Ensure the file is fully written before uploading to S3
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (err) {
        console.error('Error: File does not exist', err);
        return res.status(500).send('Error: File does not exist');
      }

      // Upload the file to S3
      const bucketName = 'your-s3-bucket-name'; // Ensure this is the correct bucket name
      const key = `uploads/${req.file.filename}`;
      console.log('Uploading file to S3 with key:', key);

      const uploadParams = {
        Bucket: bucketName,
        Key: key,
        Body: fs.createReadStream(filePath),
      };

      s3.upload(uploadParams, (err, data) => {
        if (err) {
          console.error('Error uploading file to S3:', err);
          return res.status(500).send('Error uploading file to S3');
        }

        console.log('File uploaded successfully to S3:', data);

        const transcribeParams = {
          TranscriptionJobName: `transcription-job-${Date.now()}`,
          LanguageCode: 'en-US',
          Media: {
            MediaFileUri: data.Location,
          },
          MediaFormat: 'mp3',
          OutputBucketName: bucketName,
        };

        transcribeService.startTranscriptionJob(transcribeParams, (err, data) => {
          if (err) {
            console.error('Error starting transcription job:', err);
            return res.status(500).send('Error starting transcription job');
          }

          console.log('Transcription job started successfully:', data);

          const jobName = data.TranscriptionJob.TranscriptionJobName;

          const checkTranscriptionJob = setInterval(() => {
            transcribeService.getTranscriptionJob({ TranscriptionJobName: jobName }, async (err, data) => {
              if (err) {
                console.error('Error getting transcription job:', err);
                clearInterval(checkTranscriptionJob);
                return res.status(500).send('Error getting transcription job');
              }

              if (data.TranscriptionJob.TranscriptionJobStatus === 'COMPLETED') {
                clearInterval(checkTranscriptionJob);

                const transcriptionUri = data.TranscriptionJob.Transcript.TranscriptFileUri;
                s3.getObject({ Bucket: bucketName, Key: key }, async (err, data) => {
                  if (err) {
                    console.error('Error getting transcription result:', err);
                    return res.status(500).send('Error getting transcription result');
                  }

                  const transcription = JSON.parse(data.Body.toString('utf-8')).results.transcripts[0].transcript;

                  // Invoke AI Model
                  const params = {
                    EndpointName: 'your-sagemaker-endpoint',
                    Body: JSON.stringify({ text: transcription }),
                    ContentType: 'application/json'
                  };

                  sagemakerRuntime.invokeEndpoint(params, (err, data) => {
                    if (err) {
                      console.error('Error invoking AI model:', err);
                      return res.status(500).send('Error invoking AI model');
                    }

                    const aiResponse = JSON.parse(Buffer.from(data.Body).toString('utf8')).body;

                    // Use Polly to convert text to speech
                    const pollyParams = {
                      Text: aiResponse,
                      OutputFormat: 'mp3',
                      VoiceId: 'Joanna'
                    };

                    polly.synthesizeSpeech(pollyParams, (err, data) => {
                      if (err) {
                        console.error('Error synthesizing speech:', err);
                        return res.status(500).send('Error synthesizing speech');
                      }

                      console.log('Speech synthesized successfully:', data);

                      // Send response back to client
                      res.status(200).json({
                        transcription,
                        aiResponse,
                        audioStream: Buffer.from(data.AudioStream).toString('base64')
                      });
                    });
                  });
                });
              } else if (data.TranscriptionJob.TranscriptionJobStatus === 'FAILED') {
                clearInterval(checkTranscriptionJob);
                console.error('Transcription job failed:', data.TranscriptionJob.FailureReason);
                res.status(500).send('Transcription job failed');
              }
            });
          }, 5000);
        });
      });
    });
  } else {
    console.error('File upload failed: No file received');
    res.status(400).send('File upload failed');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
