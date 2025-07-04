import React, { useState, useCallback, useEffect } from 'react';
import {
  Container,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Backdrop,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel
} from '@mui/material';
import {
  AdapterDayjs
} from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import dayjs from 'dayjs';
import api from '../api/config';

const AttendanceMarking = () => {
  // State for students and their selection
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  
  // State for attendance data
  const [date, setDate] = useState(dayjs());
  const [attendance, setAttendance] = useState({});
  const [markingMode, setMarkingMode] = useState('present');
  const [historicalAttendance, setHistoricalAttendance] = useState([]);

  
  // UI state
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [scheduleAlert, setScheduleAlert] = useState(null);
  const [scheduleConflictDialog, setScheduleConflictDialog] = useState(false);
  const [availableSchedules, setAvailableSchedules] = useState([]);
  const [selectedAbsentees, setSelectedAbsentees] = useState([]);
  
  // Class and section state
  const [classes, setClasses] = useState([]);
  const [sections, setSections] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSection, setSelectedSection] = useState('');

  // Utility functions
  const formatDate = useCallback((date) => {
    return dayjs(date).format('YYYY-MM-DD');
  }, []);

  const validateDate = useCallback((selectedDate) => {
    const today = dayjs().startOf('day');
    return dayjs(selectedDate).startOf('day').isSameOrBefore(today);
  }, []);

  // API calls
  const fetchClasses = useCallback(async () => {
    try {
      const response = await api.get('/students/classes');
      setClasses(response.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  }, []);

  const fetchSections = useCallback(async () => {
    if (!selectedClass) return;
    try {
      const response = await api.get(`/students/sections?class=${selectedClass}`);
      setSections(response.data);
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  }, [selectedClass]);

  const fetchStudents = useCallback(async () => {
    if (!selectedClass || !selectedSection) return;
    try {
      const response = await api.get(`/students?class=${selectedClass}&section=${selectedSection}`);
      const sortedStudents = response.data.sort((a, b) => 
        (a.rollNumber || '').localeCompare(b.rollNumber || '')
      );
      setStudents(sortedStudents);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  }, [selectedClass, selectedSection]);

  const fetchAttendance = useCallback(async () => {
    if (!selectedClass || !selectedSection || !date) return;
    try {
      const response = await api.get(`/attendance?class=${selectedClass}&section=${selectedSection}&date=${formatDate(date)}`);
      const attendanceMap = {};
      response.data.forEach(record => {
        attendanceMap[record.student._id] = record.status;
      });
      setAttendance(attendanceMap);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  }, [selectedClass, selectedSection, date, formatDate]);

  const fetchHistoricalAttendance = useCallback(async () => {
    if (!selectedClass || !selectedSection) return;
    try {
      const response = await api.get(`/attendance/history?class=${selectedClass}&section=${selectedSection}`);
      setHistoricalAttendance(response.data);
    } catch (error) {
      console.error('Error fetching historical attendance:', error);
    }
  }, [selectedClass, selectedSection]);

  const fetchScheduleForDate = useCallback(async (selectedDate) => {
    const isTimeInRange = (currentTime, startTime, endTime) => {
      const current = dayjs(currentTime, 'HH:mm');
      const start = dayjs(startTime, 'HH:mm');
      const end = dayjs(endTime, 'HH:mm');
      
      // Allow marking attendance 15 minutes before class starts and up to 30 minutes after class ends
      const rangeStart = start.subtract(15, 'minute');
      const rangeEnd = end.add(30, 'minute');
      
      return current.isAfter(rangeStart) && current.isBefore(rangeEnd);
    };

    const getNextSchedule = (schedules, currentTime) => {
      const upcoming = schedules
        .filter(s => dayjs(s.startTime, 'HH:mm').isAfter(dayjs(currentTime, 'HH:mm')))
        .sort((a, b) => dayjs(a.startTime, 'HH:mm').diff(dayjs(b.startTime, 'HH:mm')));
      return upcoming[0];
    };
    try {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayOfWeek = days[selectedDate.day()];
      const currentTime = selectedDate.format('HH:mm');
      
      const response = await api.get(`/schedules?day=${dayOfWeek}&class=${selectedClass || ''}&section=${selectedSection || ''}`);
      const schedules = response.data;
      
      if (schedules.length === 0) {
        setScheduleAlert({ type: 'info', message: 'No classes scheduled for this day.' });
        return;
      }

      // Filter schedules that are within the allowed time range
      const relevantSchedules = schedules.filter(schedule => 
        isTimeInRange(currentTime, schedule.startTime, schedule.endTime)
      );

      if (relevantSchedules.length === 0) {
        const nextSchedule = getNextSchedule(schedules, currentTime);
        setScheduleAlert({ 
          type: 'warning', 
          message: nextSchedule
            ? `No classes right now. Next class: ${nextSchedule.subject} at ${nextSchedule.startTime} (${nextSchedule.class} ${nextSchedule.section})`
            : 'No more classes scheduled for today.'
        });
        return;
      }

      if (relevantSchedules.length === 1) {
        const schedule = relevantSchedules[0];
        setSelectedClass(schedule.class);
        setSelectedSection(schedule.section);
        setScheduleAlert({ 
          type: 'success', 
          message: `Current class: ${schedule.subject} (${schedule.startTime} - ${schedule.endTime})`
        });
      } else {
        setAvailableSchedules(relevantSchedules);
        setScheduleConflictDialog(true);
      }
    } catch (error) {
      console.error('Error fetching schedule:', error);
      setScheduleAlert({ type: 'error', message: 'Error fetching schedule information.' });
    }
  }, [selectedClass, selectedSection]);

  // Event handlers
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleDateChange = (newDate) => {
    setDate(newDate);
    setScheduleAlert(null);
    fetchScheduleForDate(newDate);
  };

  const handleScheduleSelect = (schedule) => {
    setSelectedClass(schedule.class);
    setSelectedSection(schedule.section);
    setScheduleConflictDialog(false);
    setScheduleAlert({ 
      type: 'success', 
      message: `Selected class: ${schedule.subject} (${schedule.startTime} - ${schedule.endTime})`
    });
  };

  const handleStudentSelect = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAllStudents = (event) => {
    setSelectedStudents(
      event.target.checked ? students.map(s => s._id) : []
    );
  };

  const handleConfirmDialog = () => {
    if (markingMode === 'absent') {
      const absentees = selectedStudents
        .map(id => {
          const student = students.find(s => s._id === id);
          return student 
            ? { 
                id: student._id, 
                rollNumber: student.rollNumber, 
                name: student.name 
              } 
            : null;
        })
        .filter(Boolean);
      setSelectedAbsentees(absentees);
    }
    setConfirmDialogOpen(true);
  };

  const markAttendance = async (studentIds, status) => {
    try {
      const promises = studentIds.map(studentId => 
        api.post('/attendance', {
          studentId,
          date: formatDate(date),
          status,
          class: selectedClass,
          section: selectedSection
        })
      );
      await Promise.all(promises);
    } catch (error) {
      console.error('Error marking attendance:', error);
      throw error;
    }
  };

  const handleConfirmAttendance = async () => {
    setConfirmDialogOpen(false);
    setLoading(true);
    try {
      if (!validateDate(date)) {
        alert('Cannot mark attendance for future dates!');
        return;
      }

      if (markingMode === 'absent') {
        // First mark all students as present
        await markAttendance(
          students.map(s => s._id),
          'present'
        );
        // Then mark selected students as absent
        if (selectedStudents.length > 0) {
          await markAttendance(selectedStudents, 'absent');
        }
      } else {
        // Mark selected students as present
        if (selectedStudents.length > 0) {
          await markAttendance(selectedStudents, 'present');
        }
      }

      // Refresh data
      await Promise.all([
        fetchAttendance(),
        fetchAttendance()
      ]);
      setSelectedStudents([]);
    } catch (error) {
      console.error('Error submitting attendance:', error);
      alert('Failed to mark attendance. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAttendance = () => {
    setConfirmDialogOpen(false);
    setSelectedAbsentees([]);
  };

  // Effects
  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  useEffect(() => {
    if (selectedClass) {
      fetchSections();
      setSelectedSection('');
      setStudents([]);
      setAttendance({});
      setHistoricalAttendance([]);
    }
  }, [selectedClass, fetchSections]);

  useEffect(() => {
    if (selectedClass && selectedSection) {
      fetchStudents();
      fetchAttendance();
      fetchHistoricalAttendance();
    }
  }, [selectedClass, selectedSection, fetchStudents, fetchAttendance, fetchHistoricalAttendance]);

  // Render helpers
  const renderScheduleConflictDialog = () => (
    <Dialog open={scheduleConflictDialog} onClose={() => setScheduleConflictDialog(false)}>
      <DialogTitle>Multiple Classes Scheduled</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Please select the class you want to mark attendance for:
        </DialogContentText>
        <List>
          {availableSchedules.map((schedule) => (
            <ListItem 
              button 
              key={schedule._id} 
              onClick={() => handleScheduleSelect(schedule)}
            >
              <ListItemText
                primary={schedule.subject}
                secondary={`${schedule.class} ${schedule.section} (${schedule.startTime} - ${schedule.endTime})`}
              />
            </ListItem>
          ))}
        </List>
      </DialogContent>
    </Dialog>
  );

  const renderAttendanceMarking = () => (
    <div>
      <div className="marking-mode">
        <FormControl component="fieldset">
          <FormLabel component="legend">Marking Mode</FormLabel>
          <RadioGroup
            row
            value={markingMode}
            onChange={(e) => setMarkingMode(e.target.value)}
          >
            <FormControlLabel
              value="present"
              control={<Radio />}
              label="Mark Present"
            />
            <FormControlLabel
              value="absent"
              control={<Radio />}
              label="Mark Absent"
            />
          </RadioGroup>
        </FormControl>
      </div>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={
                    selectedStudents.length > 0 &&
                    selectedStudents.length < students.length
                  }
                  checked={
                    students.length > 0 &&
                    selectedStudents.length === students.length
                  }
                  onChange={handleSelectAllStudents}
                />
              </TableCell>
              <TableCell>Roll Number</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {students.map((student) => (
              <TableRow
                key={student._id}
                selected={selectedStudents.includes(student._id)}
              >
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedStudents.includes(student._id)}
                    onChange={() => handleStudentSelect(student._id)}
                  />
                </TableCell>
                <TableCell>{student.rollNumber}</TableCell>
                <TableCell>{student.name}</TableCell>
                <TableCell>
                  {attendance[student._id] ||
                    (markingMode === 'present' ? 'Absent' : 'Present')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Button
        variant="contained"
        color="primary"
        onClick={handleConfirmDialog}
        disabled={selectedStudents.length === 0}
        sx={{ mt: 2 }}
      >
        Mark {markingMode === 'present' ? 'Present' : 'Absent'}
      </Button>
    </div>
  );

  const renderAttendanceHistory = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Roll Number</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Status</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {historicalAttendance.map((record) => (
            <TableRow key={record._id}>
              <TableCell>{record.student.rollNumber}</TableCell>
              <TableCell>{record.student.name}</TableCell>
              <TableCell>{formatDate(record.date)}</TableCell>
              <TableCell>{record.status}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <div className="attendance-marking">
      <Container maxWidth="md">
        {scheduleAlert && (
          <Alert 
            severity={scheduleAlert.type} 
            sx={{ mb: 2 }}
            onClose={() => setScheduleAlert(null)}
          >
            {scheduleAlert.message}
          </Alert>
        )}
        <Paper sx={{ p: 2 }}>
          <div className="filters">
            <FormControl sx={{ m: 1, minWidth: 120 }}>
              <InputLabel>Class</InputLabel>
              <Select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                {classes.map((cls) => (
                  <MenuItem key={cls} value={cls}>
                    {cls}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl sx={{ m: 1, minWidth: 120 }}>
              <InputLabel>Section</InputLabel>
              <Select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                disabled={!selectedClass}
              >
                {sections.map((section) => (
                  <MenuItem key={section} value={section}>
                    {section}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Date"
                value={date}
                onChange={(newDate) => handleDateChange(newDate)}
                maxDate={dayjs()}
                sx={{ m: 1 }}
              />
            </LocalizationProvider>
          </div>

          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Mark Attendance" />
            <Tab label="View History" />
          </Tabs>

          {tabValue === 0 && renderAttendanceMarking()}
          {tabValue === 1 && renderAttendanceHistory()}

          <Dialog
            open={confirmDialogOpen}
            onClose={handleCancelAttendance}
            aria-labelledby="confirm-dialog-title"
          >
            <DialogTitle id="confirm-dialog-title">
              Confirm Attendance Marking
            </DialogTitle>
            <DialogContent>
              {markingMode === 'absent' ? (
                <>
                  <DialogContentText>
                    The following students will be marked as absent:
                  </DialogContentText>
                  <List>
                    {selectedAbsentees.map((student) => (
                      <ListItem key={student.id}>
                        <ListItemText
                          primary={`${student.rollNumber} - ${student.name}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              ) : (
                <DialogContentText>
                  Mark {selectedStudents.length} student
                  {selectedStudents.length === 1 ? '' : 's'} as present?
                </DialogContentText>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCancelAttendance}>Cancel</Button>
              <Button onClick={handleConfirmAttendance} color="primary">
                Confirm
              </Button>
            </DialogActions>
          </Dialog>

          {renderScheduleConflictDialog()}

          {loading && (
            <Backdrop open={true}>
              <CircularProgress color="inherit" />
            </Backdrop>
          )}
        </Paper>
      </Container>
    </div>
  );
};

export default AttendanceMarking;