import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../context/ThemeContext';

const AddTimerScreen = ({ navigation }) => {
  const { isDarkMode } = useTheme();
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('');
  const [category, setCategory] = useState('');

  const saveTimer = async () => {
    if (!name || !duration || !category) {
      alert('Please fill out all fields!');
      return;
    }

    const parsedDuration = Number(duration);

    if (!Number.isInteger(parsedDuration) || parsedDuration <= 0) {
      alert('Duration must be a positive whole number!');
      setDuration('');
      return;
    }

    const newTimer = {
      id: new Date().getTime().toString(),
      name,
      duration: parsedDuration,
      category,
      status: 'Pending'
    };

    try {
      const existingTimers = JSON.parse(await AsyncStorage.getItem('timers')) || [];
      await AsyncStorage.setItem('timers', JSON.stringify([...existingTimers, newTimer]));
      alert('Timer added successfully!');
      navigation.goBack();
    } catch (error) {
      console.error('Error saving timer:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#333' : '#fff' }]}>
      <Text style={[styles.label, { color: isDarkMode ? '#fff' : '#000' }]}>Timer Name:</Text>
      <TextInput style={[styles.input, { color: isDarkMode ? '#fff' : '#000', borderColor: isDarkMode ? '#555' : '#ccc' }]} value={name} onChangeText={setName} placeholder="e.g., Workout Timer" placeholderTextColor={isDarkMode ? '#aaa' : '#666'} />

      <Text style={[styles.label, { color: isDarkMode ? '#fff' : '#000' }]}>Duration (in seconds):</Text>
      <TextInput
        style={[styles.input, { color: isDarkMode ? '#fff' : '#000', borderColor: isDarkMode ? '#555' : '#ccc' }]}
        value={duration}
        onChangeText={setDuration}
        placeholder="e.g., 60"
        placeholderTextColor={isDarkMode ? '#aaa' : '#666'}
        keyboardType="numeric"
      />

      <Text style={[styles.label, { color: isDarkMode ? '#fff' : '#000' }]}>Category:</Text>
      <TextInput style={[styles.input, { color: isDarkMode ? '#fff' : '#000', borderColor: isDarkMode ? '#555' : '#ccc' }]} value={category} onChangeText={setCategory} placeholder="e.g., Workout" placeholderTextColor={isDarkMode ? '#aaa' : '#666'} />

      <TouchableOpacity style={[styles.button, { backgroundColor: isDarkMode ? '#555' : '#007BFF' }]} onPress={saveTimer}>
        <Text style={styles.buttonText}>Save Timer</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  label: { fontSize: 16, marginVertical: 8 },
  input: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
    marginBottom: 16,
  },
  button: {
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16 },
});

export default AddTimerScreen;
