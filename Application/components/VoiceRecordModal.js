import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  ActivityIndicator, 
  Animated,
  Alert,
  Pressable,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { styled } from 'nativewind';
import { Mic, X, Send, Zap, Sparkles } from 'lucide-react-native';
import { processWorkoutVoiceInput } from '../services/aiService';
import { supabase } from '../supabaseClient';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);
const StyledTouchableOpacity = styled(TouchableOpacity);

export default function VoiceRecordModal({ visible, onClose, onSaved }) {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible && !isProcessing) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [visible, isProcessing]);

  const handleProcess = async () => {
    if (!inputText) return;
    setIsProcessing(true);
    
    const result = await processWorkoutVoiceInput(inputText);
    if (result && result.exercise) {
      setParsedData(result);
    } else {
      Alert.alert('AI Error', 'Could not parse your input. Try saying something like: "Bench press 3 sets 100kg"');
    }
    setIsProcessing(false);
  };

  const handleConfirmSave = async () => {
    if (!parsedData) return;
    setIsProcessing(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // 1. Session (Simplification: create or find active)
      const { data: session } = await supabase
        .from('workout_sessions')
        .insert([{ user_id: user.id, status: 'in_progress', started_at: new Date() }])
        .select().single();

      // 2. Exercise
      let { data: exData } = await supabase.from('exercises').select('id').ilike('name', parsedData.exercise).single();
      if (!exData) {
        const { data: newEx } = await supabase.from('exercises').insert([{ name: parsedData.exercise, category: 'strength', equipment_type: 'other' }]).select().single();
        exData = newEx;
      }

      // 3. Record
      const { data: sessEx } = await supabase.from('workout_session_exercises').insert([{ session_id: session.id, exercise_id: exData.id, order_index: 1 }]).select().single();
      
      await supabase.from('exercise_sets').insert([{ 
        session_exercise_id: sessEx.id, 
        set_number: 1, 
        reps_completed: parsedData.sets || 10, 
        weight_kg: parsedData.weight || 0 
      }]);

      Alert.alert('Success', `AI recorded: ${parsedData.exercise}`);
      setParsedData(null);
      setInputText('');
      onSaved();
      onClose();
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable 
        className="flex-1 bg-black/60 justify-center p-6"
        onPress={onClose}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <StyledView className="bg-white rounded-[32px] p-8 shadow-2xl overflow-hidden">
              {/* Premium Glow Effect */}
              <StyledView className="absolute top-[-50] right-[-50] w-32 h-32 bg-primary/20 rounded-full blur-3xl" />
              
              <StyledView className="flex-row items-center justify-between mb-8">
                <StyledView className="flex-row items-center">
                  <StyledView className="bg-primary/10 p-2 rounded-lg mr-3">
                    <Sparkles color="#FF5722" size={20} />
                  </StyledView>
                  <StyledText className="text-xl font-black text-gray-900">AI Assistant</StyledText>
                </StyledView>
                <StyledTouchableOpacity onPress={onClose} className="bg-gray-100 p-2 rounded-full">
                  <X color="#6B7280" size={18} />
                </StyledTouchableOpacity>
              </StyledView>

              {!parsedData ? (
                <StyledView className="items-center">
                  <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                    <StyledView className="bg-primary p-8 rounded-full shadow-lg shadow-primary/40 mb-8">
                      <Mic color="white" size={40} />
                    </StyledView>
                  </Animated.View>
                  
                  <StyledText className="text-center text-gray-500 font-medium mb-6 px-4">
                    "Say or type your exercise. For example: Bench press, 100 kg, 3 sets."
                  </StyledText>

                  <StyledView className="w-full bg-surface border border-gray-100 rounded-2xl flex-row items-center px-4 py-4 mb-4">
                    <StyledTextInput 
                      className="flex-1 text-gray-900 font-bold"
                      placeholder="Record with AI..."
                      value={inputText}
                      onChangeText={setInputText}
                      onSubmitEditing={handleProcess}
                    />
                    <StyledTouchableOpacity 
                      onPress={handleProcess}
                      disabled={!inputText || isProcessing}
                    >
                      {isProcessing ? (
                        <ActivityIndicator color="#FF5722" />
                      ) : (
                        <Send color="#FF5722" size={20} />
                      )}
                    </StyledTouchableOpacity>
                  </StyledView>
                </StyledView>
              ) : (
                <StyledView>
                  <StyledText className="text-gray-500 font-bold mb-4 uppercase tracking-widest text-xs">AI Parsed Result</StyledText>
                  <StyledView className="bg-surface border border-primary/20 rounded-2xl p-6 mb-8">
                    <StyledView className="flex-row items-center mb-4">
                      <Zap color="#FF5722" size={20} />
                      <StyledText className="text-2xl font-black text-gray-900 ml-2">{parsedData.exercise}</StyledText>
                    </StyledView>
                    <StyledView className="flex-row space-x-8">
                      <StyledView>
                        <StyledText className="text-gray-400 text-xs font-bold uppercase">Weight</StyledText>
                        <StyledText className="text-xl font-black text-primary">{parsedData.weight} kg</StyledText>
                      </StyledView>
                      <StyledView>
                        <StyledText className="text-gray-400 text-xs font-bold uppercase">Sets/Reps</StyledText>
                        <StyledText className="text-xl font-black text-primary">{parsedData.sets}</StyledText>
                      </StyledView>
                    </StyledView>
                  </StyledView>

                  <StyledTouchableOpacity 
                    className="bg-primary py-4 rounded-xl items-center shadow-lg shadow-primary/30"
                    onPress={handleConfirmSave}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <StyledText className="text-white text-lg font-bold">Confirm & Record</StyledText>
                    )}
                  </StyledTouchableOpacity>
                  
                  <StyledTouchableOpacity 
                    className="mt-4 items-center"
                    onPress={() => setParsedData(null)}
                  >
                    <StyledText className="text-gray-400 font-bold">Try again</StyledText>
                  </StyledTouchableOpacity>
                </StyledView>
              )}
            </StyledView>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}
