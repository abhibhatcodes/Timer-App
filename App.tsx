import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, Switch } from 'react-native';
import AddTimerScreen from './src/screens/AddTimerScreen';
import TimerListScreen from './src/screens/TimerListScreen';
import HistoryScreen from './src/screens/HistoryScreen';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

const Stack = createStackNavigator();

const ThemeToggle = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 10 }}>
      <Text style={{ color: isDarkMode ? '#fff' : '#000', marginRight: 8 }}>
        {isDarkMode ? 'Light Mode' : 'Dark Mode'}
      </Text>
      <Switch value={isDarkMode} onValueChange={toggleTheme} />
    </View>
  );
};

const AppNavigator = () => {
  const { isDarkMode } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: isDarkMode ? '#000' : '#fff' },
        headerTintColor: isDarkMode ? '#fff' : '#000',
      }}
    >
      <Stack.Screen
        name="Home"
        component={TimerListScreen}
        options={{
          headerRight: () => <ThemeToggle />,
        }}
      />
      <Stack.Screen name="Add Timer" component={AddTimerScreen} />
      <Stack.Screen name="History" component={HistoryScreen} />
    </Stack.Navigator>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </ThemeProvider>
  );
};

export default App;
