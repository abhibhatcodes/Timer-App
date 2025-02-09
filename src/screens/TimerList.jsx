import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  SectionList,
  Button,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';

const TimerListScreen = ({ navigation }) => {
  const { isDarkMode, toggleTheme } = useTheme();
  const [timers, setTimers] = useState([]);
  const [expandedSections, setExpandedSections] = useState(new Set());
  const intervalsRef = useRef({});
  const [completedTimer, setCompletedTimer] = useState(null);
  const [completedTimersLog, setCompletedTimersLog] = useState([]);
  const [halfwayAlert, setHalfwayAlert] = useState(false);

  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) {return '0:00';}
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const fetchTimers = async () => {
    try {
      const storedTimers = await AsyncStorage.getItem('timers');
      const parsedTimers = storedTimers ? JSON.parse(storedTimers) : [];

      const groupedTimers = parsedTimers.reduce((groups, timer) => {
        if (!groups[timer.category]) {
          groups[timer.category] = [];
        }
        groups[timer.category].push({
          ...timer,
          remainingTime: timer.remainingTime || timer.duration,
          status: timer.status || 'Paused',
        });
        return groups;
      }, {});

      const sections = Object.keys(groupedTimers).map((category) => ({
        title: category,
        data: groupedTimers[category],
      }));

      setTimers(sections);
    } catch (error) {
      console.error('Failed to fetch timers', error);
    }
  };

  useEffect(() => {

    const unsubscribe = navigation.addListener('focus', fetchTimers);
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    const allSections = new Set(timers.map(section => section.title));
    setExpandedSections(allSections);
  }, [timers]);

  const toggleSection = (sectionTitle) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionTitle)) {
        next.delete(sectionTitle);
      } else {
        next.add(sectionTitle);
      }
      return next;
    });
  };

  const updateTimer = (timerId, updates) => {
    setTimers(prev => prev.map(section => ({
      ...section,
      data: section.data.map(timer =>
        timer.id === timerId ? { ...timer, ...updates } : timer
      ),
    })));
  };

  const calculateProgress = (current, total) => {
    if (!current || !total) {return 0;}
    const progress = (current / total) * 100;
    return Math.max(0, Math.min(100, 100 - progress));
  };

  const logCompletedTimer = async (timer) => {
    const completionTime = new Date().toLocaleString();
    const newLogEntry = { name: timer.name, completionTime };
    setCompletedTimersLog(prev => [...prev, newLogEntry]);

    try {
      const storedLog = await AsyncStorage.getItem('completedTimersLog');
      const parsedLog = storedLog ? JSON.parse(storedLog) : [];
      parsedLog.push(newLogEntry);
      await AsyncStorage.setItem('completedTimersLog', JSON.stringify(parsedLog));
    } catch (error) {
      console.error('Failed to log completed timer', error);
    }
  };

  const checkHalfwayAlert = (timer) => {
    if (timer.halfwayAlert && timer.remainingTime === Math.floor(timer.duration / 2)) {
      alert(`Halfway alert for timer "${timer.name}"`);
    }
  };

  const startTimer = (timer) => {
    if (timer.status === 'Running' || timer.status === 'Completed') {return;}

    const duration = parseInt(timer.duration);
    const currentRemaining = parseInt(timer.remainingTime || duration);

    updateTimer(timer.id, {
      status: 'Running',
      remainingTime: currentRemaining,
      duration: duration,
    });

    intervalsRef.current[timer.id] = setInterval(() => {
      setTimers(prev => {
        const newTimers = prev.map(section => ({
          ...section,
          data: section.data.map(t => {
            if (t.id === timer.id) {
              const newRemainingTime = Math.max(0, parseInt(t.remainingTime) - 1);

              checkHalfwayAlert(t);

              if (newRemainingTime === 0) {
                clearInterval(intervalsRef.current[timer.id]);
                delete intervalsRef.current[timer.id];
                setCompletedTimer(t);
                logCompletedTimer(t);
                return {
                  ...t,
                  remainingTime: 0,
                  status: 'Completed',
                };
              }

              return {
                ...t,
                remainingTime: newRemainingTime,
                status: 'Running',
              };
            }
            return t;
          }),
        }));
        return newTimers;
      });
    }, 1000);
  };

  const pauseTimer = (timer) => {
    if (!intervalsRef.current[timer.id]) {return;}

    clearInterval(intervalsRef.current[timer.id]);
    delete intervalsRef.current[timer.id];
    updateTimer(timer.id, { status: 'Paused' });
  };

  const resetTimer = (timer) => {
    if (intervalsRef.current[timer.id]) {
      clearInterval(intervalsRef.current[timer.id]);
      delete intervalsRef.current[timer.id];
    }

    const duration = parseInt(timer.duration);
    updateTimer(timer.id, {
      remainingTime: duration,
      duration: duration,
      status: 'Paused',
    });
  };

  const handleBulkAction = (category, action) => {
    const categoryTimers = timers.find(section =>
      section.title === category
    )?.data || [];

    categoryTimers.forEach(timer => {
      switch (action) {
        case 'start':
          if (timer.status !== 'Running' && timer.status !== 'Completed') {
            startTimer(timer);
          }
          break;
        case 'pause':
          if (timer.status === 'Running') {
            pauseTimer(timer);
          }
          break;
        case 'reset':
          resetTimer(timer);
          break;
      }
    });
  };

  const hasRunningTimers = (category) => {
    const categoryTimers = timers.find(section => section.title === category)?.data || [];
    return categoryTimers.some(timer => timer.status === 'Running');
  };

  useEffect(() => {
    return () => {
      Object.values(intervalsRef.current).forEach(interval => {
        clearInterval(interval);
      });
      intervalsRef.current = {};
    };
  }, []);

  const deleteTimer = async (timerId) => {
    try {
      const storedTimers = await AsyncStorage.getItem('timers');
      const parsedTimers = storedTimers ? JSON.parse(storedTimers) : [];
      const updatedTimers = parsedTimers.filter(timer => timer.id !== timerId);
      await AsyncStorage.setItem('timers', JSON.stringify(updatedTimers));
      fetchTimers();
    } catch (error) {
      console.error('Failed to delete timer', error);
    }
  };

  const toggleHalfwayAlert = (timerId) => {
    setTimers(prev => prev.map(section => ({
      ...section,
      data: section.data.map(timer =>
        timer.id === timerId ? { ...timer, halfwayAlert: !timer.halfwayAlert } : timer
      ),
    })));
  };

  const renderTimer = ({ item }) => (
    <View style={[styles.card, isDarkMode && styles.cardDark]}>
      <View style={styles.timerHeader}>
        <Text style={[styles.timerTitle, isDarkMode && styles.timerTitleDark]}>{item.name}</Text>
        <TouchableOpacity onPress={() => deleteTimer(item.id)}>
          <Text style={styles.deleteIcon}>✖</Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.status, styles[item.status?.toLowerCase() || 'paused'], isDarkMode && styles.statusDark]}>
        {item.status || 'Paused'}
      </Text>
      <View style={styles.timeContainer}>
        <Text style={[styles.timeText, isDarkMode && styles.timeTextDark]}>
          {formatTime(parseInt(item.remainingTime))} / {formatTime(parseInt(item.duration))}
        </Text>
      </View>
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${calculateProgress(item.remainingTime, item.duration)}%` }]} />
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.actionButton, styles.startButton]} onPress={() => startTimer(item)}>
          <Text style={styles.buttonText}>▶</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.pauseButton]} onPress={() => pauseTimer(item)}>
          <Text style={styles.buttonText}>⏸</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.resetButton]} onPress={() => resetTimer(item)}>
          <Text style={styles.buttonText}>↺</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
  return (
    <View style={[styles.container, isDarkMode && styles.containerDark]}>
      <View style={styles.addButtonContainer}>
        <Button
          title="Add Timer"
          onPress={() => navigation.navigate('Add Timer')}
          color="orange"
        />
        <Button
          onPress={() => navigation.navigate('History')}
          title="History"
          color="orange"
        />
      </View>

      <SectionList
        sections={timers}
        keyExtractor={(item) => item.id}
        renderItem={({ item, section }) =>
          expandedSections.has(section.title) ? renderTimer({ item }) : null
        }
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionContainer}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => toggleSection(title)}
            >
              <Text style={[styles.sectionTitle, isDarkMode && styles.sectionTitleDark]}>
                {title} {expandedSections.has(title) ? '▼' : '▶'}
              </Text>
            </TouchableOpacity>
            {expandedSections.has(title) && (
              <View style={styles.bulkActions}>
                <TouchableOpacity
                  style={[styles.bulkButton, isDarkMode && styles.bulkButtonDark]}
                  onPress={() => handleBulkAction(title, 'start')}
                >
                  <Text style={styles.buttonText}>Start All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.bulkButton, !hasRunningTimers(title) && styles.buttonDisabled, isDarkMode && styles.bulkButtonDark]}
                  onPress={() => handleBulkAction(title, 'pause')}
                  disabled={!hasRunningTimers(title)}
                >
                  <Text style={styles.buttonText}>Pause All</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.bulkButton, isDarkMode && styles.bulkButtonDark]}
                  onPress={() => handleBulkAction(title, 'reset')}
                >
                  <Text style={styles.buttonText}>Reset All</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          <Text style={[styles.emptyText, isDarkMode && styles.emptyTextDark]}>No timers added yet.</Text>
        }
      />
      <Modal
        visible={!!completedTimer}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setCompletedTimer(null)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, isDarkMode && styles.modalContentDark]}>
            <Text style={[styles.modalText, isDarkMode && styles.modalTextDark]}>Congratulations!</Text>
            <Text style={[styles.modalText, isDarkMode && styles.modalTextDark]}>Timer "{completedTimer?.name}" has completed.</Text>
            <Button title="Close" onPress={() => setCompletedTimer(null)} />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f0f0f0' },
  containerDark: { backgroundColor: '#121212' },
  addButtonContainer: { display: 'flex', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, alignItems: 'center' },
  timerItem: {
    padding: 15,
    marginVertical: 3,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  timerItemDark: {
    backgroundColor: '#1e1e1e',
  },
  timerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  timerInfo: {
    flex: 1,
  },
  timerName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  timerNameDark: { color: '#ffffff' },
  timerControls: { flexDirection: 'row', justifyContent: 'space-between' },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    overflow: 'hidden',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4caf50',
    position: 'absolute',
    left: 0,
    top: 0,
  },
  sectionHeader: { padding: 10, backgroundColor: '#00796b', borderRadius: 50, marginBottom: 5, alignItems: 'center', marginTop: 10 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
  sectionTitleDark: { color: '#ffffff' },
  bulkActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
    gap: 10,
  },
  bulkButton: {
    backgroundColor: '#00796b',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
  },
  bulkButtonDark: {
    backgroundColor: '#004d40',
  },
  emptyText: { textAlign: 'center', marginTop: 30, fontSize: 18, color: '#999' },
  emptyTextDark: { color: '#cccccc' },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginTop: 15,
  },
  button: {
    backgroundColor: '#00796b',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 5,
    flex: 1,
    alignItems: 'center',
  },
  buttonDark: {
    backgroundColor: '#004d40',
  },
  buttonDisabled: {
    backgroundColor: '#b0bec5',
    opacity: 0.7,
  },
  deleteButton: {
    backgroundColor: '#d32f2f',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 14,
  },
  statusText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  paused: { color: '#757575' },
  running: { color: '#388e3c' },
  completed: { color: '#d32f2f' },
  statusTextDark: { color: '#ffffff' },
  timeText: {
    fontSize: 16,
    color: '#555',
    marginVertical: 10,
  },
  timeTextDark: { color: '#ffffff' },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    marginBottom: 6
  },
  percentText: {
    minWidth: 50,
    textAlign: 'right',
    fontSize: 14,
    color: '#666',
  },
  percentTextDark: { color: '#ffffff' },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    width: 320,
    padding: 25,
    backgroundColor: 'white',
    borderRadius: 15,
    alignItems: 'center',
  },
  modalContentDark: { backgroundColor: '#1e1e1e' },
  modalText: {
    fontSize: 20,
    marginBottom: 15,
    color: '#333',
  },
  modalTextDark: { color: '#ffffff' },
  alertContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 150,
  },
  textDark: { color: '#ffffff' },
  card: {
    padding: 20,
    marginVertical: 10,
    borderRadius: 15,
    backgroundColor: '#E3F2FD',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  cardDark: {
    backgroundColor: '#1E293B',
  },
  timerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#37474F',
  },
  timerTitleDark: {
    color: '#ECEFF1',
  },
  deleteIcon: {
    fontSize: 20,
    color: '#D32F2F',
  },
  status: {
    fontSize: 14,
    marginTop: 5,
    fontWeight: 'bold',
  },
  paused: { color: '#FF8A65' },
  running: { color: '#4CAF50' },
  completed: { color: '#2196F3' },
  statusDark: {
    color: '#FFD700',
  },
  timeContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  timeText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#263238',
  },
  timeTextDark: {
    color: '#CFD8DC',
  },

  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    padding: 10,
    borderRadius: 10,
  },
  startButton: { backgroundColor: '#81C784' },
  pauseButton: { backgroundColor: '#FFB74D' },
  resetButton: { backgroundColor: '#E57373' },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});

export default TimerListScreen;
