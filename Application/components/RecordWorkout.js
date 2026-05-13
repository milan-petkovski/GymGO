import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, KeyboardAvoidingView, Platform, Pressable, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../supabaseClient';
import { styled } from 'nativewind';
import { X, Calendar } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);
const StyledTouchableOpacity = styled(TouchableOpacity);

export default function RecordWorkout({ visible, onClose }) {
  const [exercise, setExercise] = useState('');
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!exercise || !weight || !reps) {
      Alert.alert('Missing info', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // 1. Get or Create Session
      const { data: session, error: sessionError } = await supabase
        .from('workout_sessions')
        .insert([{ 
          user_id: user.id, 
          status: 'completed', 
          started_at: date.toISOString(),
          completed_at: new Date(date.getTime() + 60 * 60 * 1000).toISOString() // Default 1hr session
        }])
        .select()
        .single();
      
      if (sessionError) throw sessionError;

      // 2. Find or Create Exercise
      let { data: exData, error: exError } = await supabase
        .from('exercises')
        .select('id')
        .ilike('name', exercise)
        .single();
      
      if (!exData) {
        const { data: newEx, error: newExError } = await supabase
          .from('exercises')
          .insert([{ name: exercise, category: 'strength', equipment_type: 'other' }])
          .select()
          .single();
        if (newExError) throw newExError;
        exData = newEx;
      }

      // 3. Create Session Exercise record
      const { data: sessEx, error: sessExError } = await supabase
        .from('workout_session_exercises')
        .insert([{ session_id: session.id, exercise_id: exData.id, order_index: 1 }])
        .select()
        .single();
      
      if (sessExError) throw sessExError;

      // 4. Record the Set
      const { error: setError } = await supabase
        .from('exercise_sets')
        .insert([{ 
          session_exercise_id: sessEx.id, 
          set_number: 1, 
          reps_completed: parseInt(reps), 
          weight_kg: parseFloat(weight) 
        }]);
      
      if (setError) throw setError;

      Alert.alert('Success', 'Set recorded successfully!');
      setExercise('');
      setWeight('');
      setReps('');
      onClose();
    } catch (error) {
      Alert.alert('Save Error', error.message);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <Pressable 
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
        onPress={onClose}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <StyledView className="bg-white rounded-t-[24px] p-6" style={{ minHeight: 340 }}>
              {/* Handle bar */}
              <StyledView className="items-center mb-4">
                <StyledView className="w-10 h-1 bg-gray-200 rounded-full" />
              </StyledView>

              <StyledView className="flex-row items-center justify-between mb-6">
                <StyledText className="text-2xl font-bold text-gray-900">Record Set</StyledText>
                <StyledTouchableOpacity onPress={onClose} className="bg-gray-100 p-2 rounded-full">
                  <X color="#6B7280" size={20} />
                </StyledTouchableOpacity>
              </StyledView>
              
              <StyledView className="mb-4">
                <StyledText className="text-sm text-gray-500 mb-2 font-medium">Workout Date</StyledText>
                <StyledTouchableOpacity 
                  onPress={() => setShowDatePicker(true)}
                  className="bg-surface border border-gray-200 rounded-xl px-4 py-3 flex-row items-center justify-between"
                >
                  <StyledText className="text-lg text-gray-900 font-bold">
                    {date.toLocaleDateString('en-GB')}
                  </StyledText>
                  <Calendar color="#FF5722" size={20} />
                </StyledTouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    maximumDate={new Date()}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) setDate(selectedDate);
                    }}
                  />
                )}
              </StyledView>

              <StyledView className="mb-4">
                <StyledText className="text-sm text-gray-500 mb-2 font-medium">Exercise Name</StyledText>
                <StyledTextInput 
                  className="bg-surface border border-gray-200 rounded-xl px-4 py-3 text-lg text-gray-900 font-bold"
                  placeholder="e.g. Bench Press"
                  placeholderTextColor="#CBD5E1"
                  value={exercise}
                  onChangeText={setExercise}
                />
              </StyledView>

              <StyledView className="flex-row space-x-4 mb-8">
                <StyledView className="flex-1">
                  <StyledText className="text-sm text-gray-500 mb-2 font-medium">Weight (kg)</StyledText>
                  <StyledTextInput 
                    className="bg-surface border border-gray-200 rounded-xl px-4 py-3 text-lg text-gray-900 font-bold"
                    placeholder="0"
                    keyboardType="numeric"
                    placeholderTextColor="#CBD5E1"
                    value={weight}
                    onChangeText={setWeight}
                  />
                </StyledView>
                <StyledView className="flex-1">
                  <StyledText className="text-sm text-gray-500 mb-2 font-medium">Reps</StyledText>
                  <StyledTextInput 
                    className="bg-surface border border-gray-200 rounded-xl px-4 py-3 text-lg text-gray-900 font-bold"
                    placeholder="0"
                    keyboardType="numeric"
                    placeholderTextColor="#CBD5E1"
                    value={reps}
                    onChangeText={setReps}
                  />
                </StyledView>
              </StyledView>

              <StyledTouchableOpacity 
                className="bg-primary py-4 rounded-xl items-center"
                onPress={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <StyledText className="text-white text-lg font-bold">Save & Start Timer</StyledText>
                )}
              </StyledTouchableOpacity>
            </StyledView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}
