import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Container, Button } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import AttendanceMarking from './components/AttendanceMarking';
import AddStudent from './components/AddStudent';
import Schedule from './components/Schedule';

function App() {
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
    <Router>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Attendance System
          </Typography>
          <Button color="inherit" component={Link} to="/">Attendance</Button>
          <Button color="inherit" component={Link} to="/schedule">Schedule</Button>
          <Button color="inherit" component={Link} to="/add-student">Add Student</Button>
        </Toolbar>
      </AppBar>

      <Container sx={{ mt: 4 }}>
        <Routes>
          <Route path="/" element={<AttendanceMarking />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/add-student" element={<AddStudent />} />
        </Routes>
      </Container>
    </Router>
    </LocalizationProvider>
  );
}

export default App;
