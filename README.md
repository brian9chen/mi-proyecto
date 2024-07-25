# Conversar

## Description:
Conversar is a website for practicing conversational Spanish speaking with an AI partner. During my journey to learn Spanish, I’ve realized that the best way to learn a language rapidly is by speaking. However, this requires a fluent partner or teacher which is hard to come by. Conversar allows you to practice conversational speaking skills with an AI partner. Before each session, you lay out any specific skills you want to practice (e.g. imperfect and preterite tense with vocabulary about clothing) as well as the structure of your conversation (ask me a series of questions that follow up on my responses). Currently Conversar is only for practicing Spanish, but we plan on expanding to other languages.

## How it was built:
This website was built using a combination of web development tools and cloud services. The frontend was developed with React, utilizing Webpack and Babel for bundling and transpiling the JavaScript code. We used multer for handling file uploads on the backend, which is powered by an Express.js server. We employed a variety of AWS services: S3 for file storage, Transcribe for converting speech to text, Polly for text-to-speech synthesis, and SageMaker for invoking an AI model to process the transcribed text. The backend ensures the uploaded files are fully written and accessible before uploading to S3, followed by starting a transcription job. As a developer tool, nodemon was used to automatically restart the backend server when changes have been made, and webpack-dev-server handled the live reloading of the frontend.

