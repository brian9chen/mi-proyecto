import React, { useState } from 'react';

const App = () => {
  const [file, setFile] = useState(null);
  const [transcription, setTranscription] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [audioUrl, setAudioUrl] = useState('');

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleFileUpload = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append('mp3File', file);

    try {

        const response = await fetch('http://localhost:3000/upload', {
            method: 'POST',
            body: formData,
          });
          
    //   const response = await fetch('/upload', {
    //     method: 'POST',
    //     body: formData,
    //   });

      if (response.ok) {
        const data = await response.json();
        setTranscription(data.transcription);
        setAiResponse(data.aiResponse);

        // Convert base64 audio stream to Blob URL
        const byteCharacters = atob(data.audioStream);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'audio/mp3' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      } else {
        alert('File upload failed');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div>
      <h1>Upload your Voice as MP3</h1>
      <form onSubmit={handleFileUpload}>
        <input type="file" accept=".mp3" onChange={handleFileChange} required />
        <button type="submit">Upload</button>
      </form>
      {transcription && (
        <div>
          <h2>Transcription</h2>
          <p>{transcription}</p>
        </div>
      )}
      {aiResponse && (
        <div>
          <h2>AI Response</h2>
          <p>{aiResponse}</p>
        </div>
      )}
      {audioUrl && (
        <div>
          <h2>AI Response Audio</h2>
          <audio controls>
            <source src={audioUrl} type="audio/mp3" />
            Your browser does not support the audio element.
          </audio>
        </div>
      )}
    </div>
  );
};

export default App;
