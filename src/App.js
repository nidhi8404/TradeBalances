import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [timestamp, setTimestamp] = useState('');
  const [balances, setBalances] = useState(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      alert('Please select a file to upload');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:5000/upload-csv', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      alert('File uploaded successfully');
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file');
    }
  };

  const handleTimestampChange = (e) => {
    setTimestamp(e.target.value);
  };

  const fetchBalances = async () => {
    try {
      const response = await axios.post('http://localhost:5000/asset-balance', { timestamp });
      setBalances(response.data);
    } catch (error) {
      console.error('Error fetching balances:', error);
      alert('Failed to fetch balances');
    }
  };

  return (
    <div>
      <h1>Hello! User</h1>
      <div>
        <h2>Upload CSV</h2>
        <input type="file" onChange={handleFileChange} />
        <button onClick={handleUpload}>Upload</button>
      </div>
      <div>
        <h2>Get Asset Balance</h2>
        <input
          type="text"
          placeholder="DD-MM-YYYY HH:mm"
          value={timestamp}
          onChange={handleTimestampChange}
        />
        <button onClick={fetchBalances}>Get Balance</button>
        {balances && (
          <div>
            <h3>Balances</h3>
            <pre>{JSON.stringify(balances, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
