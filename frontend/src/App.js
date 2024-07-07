// import React, { useState } from 'react';

// const App = () => {
//   const [file, setFile] = useState(null);

//   const handleFileChange = (event) => {
//     setFile(event.target.files[0]);
//   };

//   const handleFileUpload = async (event) => {
//     event.preventDefault();
//     const formData = new FormData();
//     formData.append('mp3File', file);

//     try {
//       const response = await fetch('/upload', {
//         method: 'POST',
//         body: formData,
//       });

//       if (response.ok) {
//         alert('File uploaded successfully');
//       } else {
//         alert('File upload failed');
//       }
//     } catch (error) {
//       console.error('Error:', error);
//     }
//   };

//   return (
//     <div>
//       <h1>Upload your Voice as MP3</h1>
//       <form onSubmit={handleFileUpload}>
//         <input type="file" accept=".mp3" onChange={handleFileChange} required />
//         <button type="submit">Upload</button>
//       </form>
//     </div>
//   );
// };

// export default App;

import React, { useState } from 'react';

const App = () => {
  const [file, setFile] = useState(null);
  const [transcription, setTranscription] = useState('');

  const handleFileChange = (event) => {
    setFile(event.target.files[0]);
  };

  const handleFileUpload = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append('mp3File', file);

    try {
      const response = await fetch('/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setTranscription(data.transcription);
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
    </div>
  );
};

export default App;
