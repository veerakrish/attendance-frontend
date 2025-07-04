import React, { useState, useRef } from 'react';
import {
  Paper,
  TextField,
  Button,
  Box,
  Divider,
  Typography,
  Alert
} from '@mui/material';
import api from '../api/config';

const AddStudent = ({ onStudentAdded }) => {
  const fileInputRef = useRef();
  const [formData, setFormData] = useState({
    rollNumber: '',
    name: '',
    class: '',
    section: ''
  });
  const [csvError, setCsvError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/students', formData);
      setFormData({ rollNumber: '', name: '', class: '', section: '' });
      if (onStudentAdded) onStudentAdded();
    } catch (error) {
      console.error('Error adding student:', error);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'text/csv') {
      setCsvError('Please upload a CSV file');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      await api.post('/import/students', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (onStudentAdded) onStudentAdded();
      setCsvError('');
      fileInputRef.current.value = '';
    } catch (error) {
      console.error('Error importing students:', error);
      setCsvError('Error importing students. Please check the CSV format.');
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Add Student</Typography>
      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Roll Number"
          name="rollNumber"
          value={formData.rollNumber}
          onChange={handleChange}
          margin="normal"
          required
        />
        <TextField
          fullWidth
          label="Name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          margin="normal"
          required
        />
        <TextField
          fullWidth
          label="Class"
          name="class"
          value={formData.class}
          onChange={handleChange}
          margin="normal"
          required
        />
        <TextField
          fullWidth
          label="Section"
          name="section"
          value={formData.section}
          onChange={handleChange}
          margin="normal"
          required
        />
        <TextField
          fullWidth
          label="Class"
          name="class"
          value={formData.class}
          onChange={handleChange}
          margin="normal"
          required
        />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          sx={{ mt: 2 }}
        >
          Add Student
        </Button>

        <Divider sx={{ my: 3 }} />
        
        <Typography variant="h6" gutterBottom>Import Students from CSV</Typography>
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          ref={fileInputRef}
        />
        <Button
          variant="outlined"
          color="primary"
          fullWidth
          onClick={() => fileInputRef.current.click()}
          sx={{ mt: 1 }}
        >
          Upload CSV File
        </Button>
        {csvError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {csvError}
          </Alert>
        )}
      </Box>
    </Paper>
  );
};

export default AddStudent;
