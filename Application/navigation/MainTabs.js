import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform, View, Text } from 'react-native';
import { 
  Home, 
  Dumbbell, 
  Users, 
  Calendar, 
  User 
} from 'lucide-react-native';

import HomeScreen from '../screens/HomeScreen';
import TrainingScreen from '../screens/TrainingScreen';
import TrainersScreen from '../screens/TrainersScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FF5722',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '900',
          textTransform: 'uppercase',
          letterSpacing: 1.2,
          marginBottom: Platform.OS === 'ios' ? 0 : 10,
        },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
          height: Platform.OS === 'ios' ? 95 : 75 + (insets.bottom > 0 ? insets.bottom : 0),
          paddingBottom: Platform.OS === 'ios' ? 35 : Math.max(insets.bottom, 10),
          paddingTop: 12,
          elevation: 0,
          shadowOpacity: 0,
        },
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => <Home color={color} size={22} strokeWidth={focused ? 2.5 : 2} />,
        }}
      />
      <Tab.Screen 
        name="Workouts" 
        component={TrainingScreen} 
        options={{
          tabBarLabel: 'Track',
          tabBarIcon: ({ color, focused }) => <Dumbbell color={color} size={22} strokeWidth={focused ? 2.5 : 2} />,
        }}
      />
      <Tab.Screen 
        name="Trainers" 
        component={TrainersScreen} 
        options={{
          tabBarLabel: 'Trainers',
          tabBarIcon: ({ color, focused }) => <Users color={color} size={22} strokeWidth={focused ? 2.5 : 2} />,
        }}
      />
      <Tab.Screen 
        name="History" 
        component={HistoryScreen} 
        options={{
          tabBarLabel: 'History',
          tabBarIcon: ({ color, focused }) => <Calendar color={color} size={22} strokeWidth={focused ? 2.5 : 2} />,
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => <User color={color} size={22} strokeWidth={focused ? 2.5 : 2} />,
        }}
      />
    </Tab.Navigator>
  );
}
