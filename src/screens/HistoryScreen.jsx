import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';

const HistoryScreen = () => {
  const { isDarkMode } = useTheme();
  const [completedTimersLog, setCompletedTimersLog] = useState([]);

  const fetchCompletedTimersLog = async () => {
    try {
      const storedLog = await AsyncStorage.getItem('completedTimersLog');
      const parsedLog = storedLog ? JSON.parse(storedLog) : [];
      setCompletedTimersLog(parsedLog);
    } catch (error) {
      console.error('Failed to fetch completed timers log', error);
    }
  };

  useEffect(() => {
    fetchCompletedTimersLog();
  }, []);

  const renderLogItem = ({ item }) => (
    <View style={[styles.logItem, isDarkMode && styles.darkLogItem]}>
      <Text style={[styles.logTitle, isDarkMode && styles.darkText]}>{item.name}</Text>
      <Text style={[styles.logTime, isDarkMode && styles.darkText]}>{item.completionTime}</Text>
    </View>
  );

  return (
    <View style={[styles.container, isDarkMode && styles.darkContainer]}>
      <Text style={[styles.title, isDarkMode && styles.darkText]}>Completed Timers</Text>
      <FlatList
        data={completedTimersLog}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderLogItem}
        ListEmptyComponent={<Text style={[styles.emptyText, isDarkMode && styles.darkText]}>No completed timers yet.</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: '#f5f5f5'
  },
  darkContainer: { backgroundColor: '#181818' },
  title: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333'
  },
  darkText: { color: '#e0e0e0' },
  logItem: {
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  darkLogItem: { backgroundColor: '#252525' },
  logTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  logTime: { fontSize: 14, color: '#666', marginTop: 5 },
  emptyText: { textAlign: 'center', marginTop: 20, fontSize: 16, color: '#777' },
});

export default HistoryScreen;
