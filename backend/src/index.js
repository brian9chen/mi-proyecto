// // const express = require('express');
// // const multer = require('multer');
// // const path = require('path');
// // const cors = require('cors');

// // const app = express();
// // const port = 3000;

// // // Middleware
// // app.use(cors()); // To allow cross-origin requests
// // app.use(express.static(path.join(__dirname, 'public')));

// // // Configure multer for file uploads
// // const storage = multer.diskStorage({
// //   destination: (req, file, cb) => {
// //     cb(null, 'uploads/');
// //   },
// //   filename: (req, file, cb) => {
// //     cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
// //   },
// // });

// // const upload = multer({ storage });

// // // Define the upload route
// // app.post('/upload', upload.single('mp3File'), (req, res) => {
// //   if (req.file) {
// //     res.status(200).send('File uploaded successfully');
// //   } else {
// //     res.status(400).send('File upload failed');
// //   }
// // });

// // // Start the server
// // app.listen(port, () => {
// //   console.log(`Server running at http://localhost:${port}`);
// // });


// const express = require('express');
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');
// const AWS = require('aws-sdk');

// // Configure AWS SDK
// AWS.config.update({
//   accessKeyId: 'your-access-key-id',
//   secretAccessKey: 'your-secret-access-key',
//   region: 'your-region'
// });

// const transcribeService = new AWS.TranscribeService();

// const app = express();
// const port = 3000;

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'uploads/');
//   },
//   filename: (req, file, cb) => {
//     cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
//   },
// });

// const upload = multer({ storage: storage });

// app.use(express.static(path.join(__dirname, 'public')));

// app.post('/upload', upload.single('mp3File'), async (req, res) => {
//   if (req.file) {
//     const filePath = path.join(__dirname, 'uploads', req.file.filename);

//     // Upload the file to S3
//     const s3 = new AWS.S3();
//     const bucketName = 'your-s3-bucket-name';
//     const key = `uploads/${req.file.filename}`;

//     const uploadParams = {
//       Bucket: bucketName,
//       Key: key,
//       Body: fs.createReadStream(filePath),
//     };

//     s3.upload(uploadParams, (err, data) => {
//       if (err) {
//         console.error('Error uploading file to S3:', err);
//         return res.status(500).send('Error uploading file');
//       }

//       const transcribeParams = {
//         TranscriptionJobName: `transcription-job-${Date.now()}`,
//         LanguageCode: 'en-US',
//         Media: {
//           MediaFileUri: data.Location,
//         },
//         MediaFormat: 'mp3',
//         OutputBucketName: bucketName,
//       };

//       transcribeService.startTranscriptionJob(transcribeParams, (err, data) => {
//         if (err) {
//           console.error('Error starting transcription job:', err);
//           return res.status(500).send('Error starting transcription job');
//         }

//         const jobName = data.TranscriptionJob.TranscriptionJobName;

//         const checkTranscriptionJob = setInterval(() => {
//           transcribeService.getTranscriptionJob({ TranscriptionJobName: jobName }, (err, data) => {
//             if (err) {
//               console.error('Error getting transcription job:', err);
//               clearInterval(checkTranscriptionJob);
//               return res.status(500).send('Error getting transcription job');
//             }

//             if (data.TranscriptionJob.TranscriptionJobStatus === 'COMPLETED') {
//               clearInterval(checkTranscriptionJob);

//               const transcriptionUri = data.TranscriptionJob.Transcript.TranscriptFileUri;
//               s3.getObject({ Bucket: bucketName, Key: key }, (err, data) => {
//                 if (err) {
//                   console.error('Error getting transcription result:', err);
//                   return res.status(500).send('Error getting transcription result');
//                 }

//                 const transcription = JSON.parse(data.Body.toString('utf-8')).results.transcripts[0].transcript;
//                 res.status(200).json({ transcription });
//               });
//             } else if (data.TranscriptionJob.TranscriptionJobStatus === 'FAILED') {
//               clearInterval(checkTranscriptionJob);
//               console.error('Transcription job failed:', data.TranscriptionJob.FailureReason);
//               res.status(500).send('Transcription job failed');
//             }
//           });
//         }, 5000);
//       });
//     });
//   } else {
//     res.status(400).send('File upload failed');
//   }
// });

// app.listen(port, () => {
//   console.log(`Server running at http://localhost:${port}`);
// });

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AWS = require('aws-sdk');

const AWS = require('aws-sdk');
require('dotenv').config(); // Load environment variables from .env file

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

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

app.use(express.static(path.join(__dirname, 'public')));

app.post('/upload', upload.single('mp3File'), async (req, res) => {
  if (req.file) {
    const filePath = path.join(__dirname, 'uploads', req.file.filename);

    // Upload the file to S3
    const bucketName = 'your-s3-bucket-name';
    const key = `uploads/${req.file.filename}`;

    const uploadParams = {
      Bucket: bucketName,
      Key: key,
      Body: fs.createReadStream(filePath),
    };

    s3.upload(uploadParams, (err, data) => {
      if (err) {
        console.error('Error uploading file to S3:', err);
        return res.status(500).send('Error uploading file');
      }

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

                    res.status(200).json({ transcription, aiResponse, audioStream: data.AudioStream });
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
  } else {
    res.status(400).send('File upload failed');
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
