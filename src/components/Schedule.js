import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Typography,
  Box
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import api from '../api/config';

const Schedule = () => {
  const [schedule, setSchedule] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  
  // Form state
  const [formData, setFormData] = useState({
    day: '',
    startTime: '',
    endTime: '',
    subject: '',
    class: '',
    section: ''
  });

  const days = useMemo(() => ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], []);

  // Fetch schedule data
  const fetchSchedule = useCallback(async () => {
    try {
      const response = await api.get('/schedules');
      const sortedSchedule = response.data.sort((a, b) => {
        const dayOrder = days.indexOf(a.day) - days.indexOf(b.day);
        if (dayOrder !== 0) return dayOrder;
        return a.startTime.localeCompare(b.startTime);
      });
      setSchedule(sortedSchedule);
    } catch (error) {
      console.error('Error fetching schedule:', error);
    }
  }, [days]);

  // Fetch classes
  const fetchClasses = useCallback(async () => {
    try {
      const response = await api.get('/students/classes');
      setClasses(response.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  }, []);

  // Fetch sections
  const fetchSections = useCallback(async () => {
    if (!formData.class) return;
    try {
      const response = await api.get(`/students/sections?class=${formData.class}`);
      setSections(response.data);
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  }, [formData.class]);

  useEffect(() => {
    fetchSchedule();
    fetchClasses();
  }, [fetchSchedule, fetchClasses]);

  useEffect(() => {
    fetchSections();
  }, [formData.class, fetchSections]);

  const handleOpenDialog = (slot = null) => {
    if (slot) {
      setFormData(slot);
      setSelectedSlot(slot);
    } else {
      setFormData({
        day: '',
        startTime: '',
        endTime: '',
        subject: '',
        class: '',
        section: ''
      });
      setSelectedSlot(null);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedSlot(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      if (selectedSlot) {
        await api.put(`/schedules/${selectedSlot._id}`, formData);
      } else {
        await api.post('/schedules', formData);
      }
      fetchSchedule();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving schedule:', error);
      alert('Error saving schedule. Please try again.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      try {
        await api.delete(`/schedules/${id}`);
        fetchSchedule();
      } catch (error) {
        console.error('Error deleting schedule:', error);
        alert('Error deleting schedule. Please try again.');
      }
    }
  };

  const groupByDay = (scheduleData) => {
    const grouped = {};
    days.forEach(day => {
      grouped[day] = scheduleData.filter(slot => slot.day === day);
    });
    return grouped;
  };

  return (
    <div>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Class Schedule</Typography>
        <Button variant="contained" color="primary" onClick={() => handleOpenDialog()}>
          Add Schedule
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Day</TableCell>
              <TableCell>Time</TableCell>
              <TableCell>Class</TableCell>
              <TableCell>Section</TableCell>
              <TableCell>Subject</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(groupByDay(schedule)).map(([day, slots]) => (
              <React.Fragment key={day}>
                {slots.length > 0 ? (
                  slots.map((slot, index) => (
                    <TableRow key={slot._id}>
                      {index === 0 && (
                        <TableCell rowSpan={slots.length}>{day}</TableCell>
                      )}
                      <TableCell>{`${slot.startTime} - ${slot.endTime}`}</TableCell>
                      <TableCell>{slot.class}</TableCell>
                      <TableCell>{slot.section}</TableCell>
                      <TableCell>{slot.subject}</TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleOpenDialog(slot)} size="small">
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDelete(slot._id)} size="small" color="error">
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell>{day}</TableCell>
                    <TableCell colSpan={5}>No schedule</TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {selectedSlot ? 'Edit Schedule' : 'Add Schedule'}
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Day</InputLabel>
            <Select
              name="day"
              value={formData.day}
              onChange={handleInputChange}
            >
              {days.map(day => (
                <MenuItem key={day} value={day}>{day}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            margin="normal"
            label="Start Time"
            type="time"
            name="startTime"
            value={formData.startTime}
            onChange={handleInputChange}
            InputLabelProps={{ shrink: true }}
          />

          <TextField
            fullWidth
            margin="normal"
            label="End Time"
            type="time"
            name="endTime"
            value={formData.endTime}
            onChange={handleInputChange}
            InputLabelProps={{ shrink: true }}
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Class</InputLabel>
            <Select
              name="class"
              value={formData.class}
              onChange={handleInputChange}
            >
              {classes.map(cls => (
                <MenuItem key={cls} value={cls}>{cls}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth margin="normal">
            <InputLabel>Section</InputLabel>
            <Select
              name="section"
              value={formData.section}
              onChange={handleInputChange}
              disabled={!formData.class}
            >
              {sections.map(section => (
                <MenuItem key={section} value={section}>{section}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            margin="normal"
            label="Subject"
            name="subject"
            value={formData.subject}
            onChange={handleInputChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} color="primary">
            {selectedSlot ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Schedule;
