import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity,
  ScrollView, 
  Animated, 
  Easing,
  Dimensions, 
  TextInput, 
  Modal, 
  ActivityIndicator, 
  Platform, 
  Vibration,
  Pressable,
  Linking
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  X, 
  Plus, 
  Trash2, 
  Check, 
  Dumbbell, 
  Search,
  Zap,
  Flame,
  ArrowRight,
  Smile,
  Frown,
  Meh,
  ShieldAlert,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Sparkles,
  ChevronLeft,
  ExternalLink
} from 'lucide-react-native';
import { supabase } from '../supabaseClient';
import { format, parse, differenceInMinutes, subHours, isValid, startOfDay } from 'date-fns';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar } from 'lucide-react-native';
import { useIsFocused } from '@react-navigation/native';

const AdBanner = ({ extraClass = '' }) => {
  return (
    <View className={`h-16 bg-gray-50 items-center justify-center border border-dashed border-gray-200 rounded-2xl my-4 ${extraClass}`}>
      <Text className="text-gray-300 text-[10px] font-black tracking-[3px] uppercase">ADVERTISEMENT</Text>
    </View>
  );
};

function FadeInView({ delay = 0, children, style, trigger, ready = true, ...props }) {
  const isFocused = useIsFocused();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const scale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    let anim;
    if (isFocused && ready) {
      opacity.setValue(0);
      translateY.setValue(20);
      scale.setValue(0.95);

      anim = Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 600, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 600, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 8, tension: 40, delay, useNativeDriver: true }),
      ]);
      anim.start();
    } else {
      opacity.setValue(0);
      translateY.setValue(20);
      scale.setValue(0.95);
    }
    return () => { if (anim) anim.stop(); };
  }, [isFocused, ready, trigger, delay]);

  return (
    <Animated.View {...props} style={[{ opacity, transform: [{ translateY }, { scale }] }, style]}>
      {children}
    </Animated.View>
  );
}

export default function WorkoutPlayerScreen({ navigation, route }) {
  const { templateId, workoutName, mode = 'standard' } = route.params || {};
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sessionExercises, setSessionExercises] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [showExerciseSearch, setShowExerciseSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  
  // SESSION INFO
  const [startTime, setStartTime] = useState(format(subHours(new Date(), 1), 'HH:mm'));
  const [endTime, setEndTime] = useState(format(new Date(), 'HH:mm'));
  const [workoutDate, setWorkoutDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  const [feeling, setFeeling] = useState('good');
  const [calories, setCalories] = useState('0');

  // GUIDED MODE SPECIFIC (Step-based)
  const [currentStep, setCurrentStep] = useState(mode === 'guided' ? 0 : 2);
  const [countdown, setCountdown] = useState(null);

  const [alertConfig, setAlertConfig] = useState({ visible: false, title: '', message: '' });


  useEffect(() => {
    fetchData();
  }, []);





  useEffect(() => {
    if (userProfile) {
      const volume = calculateTotalVolume();
      const durationMins = calculateDuration() || 1;
      const burned = Math.round((volume * 0.04) + (durationMins * 3));
      setCalories(burned.toString());
    }
  }, [startTime, endTime, sessionExercises, userProfile]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setUserProfile(profile);
      }
      const { data: exData } = await supabase.from('exercises').select('*').eq('is_active', true);
      if (exData) setExercises(exData);

      if (templateId) {
        const { data: tempExData } = await supabase
          .from('workout_exercises').select('*, exercises(*)').eq('workout_id', templateId).order('order_index', { ascending: true });
        if (tempExData) {
          setSessionExercises(tempExData.map(te => ({
            id: te.exercises.id,
            name: te.exercises.name,
            sets: Array.from({ length: te.sets || 3 }).map(() => ({
              id: Math.random().toString(),
              reps: te.reps?.toString() || '10',
              weight: te.weight_kg?.toString() || '0'
            }))
          })));
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (title, message) => {
    Vibration.vibrate(100);
    setAlertConfig({ visible: true, title, message });
  };

  const parseInputTime = (timeStr) => {
    const baseDate = startOfDay(workoutDate);
    // Try HH:mm
    let d = parse(timeStr, 'HH:mm', baseDate);
    if (isValid(d)) return d;
    
    // Try H:mm
    d = parse(timeStr, 'H:mm', new Date());
    if (isValid(d)) return d;

    // Try HHmm
    d = parse(timeStr, 'HHmm', new Date());
    if (isValid(d)) return d;

    return null;
  };

  const calculateDuration = () => {
    const start = parseInputTime(startTime);
    const end = parseInputTime(endTime);
    if (!start || !end) return 0;
    
    let diff = differenceInMinutes(end, start);
    if (diff < 0) diff += 1440; // Overnight
    return diff;
  };

  const calculateTotalVolume = () => {
    let total = 0;
    sessionExercises.forEach(ex => {
      ex.sets.forEach(set => {
        total += (parseFloat(set.weight) || 0) * (parseInt(set.reps) || 0);
      });
    });
    return total;
  };

  const addExercise = (ex) => {
    setSessionExercises([...sessionExercises, {
      id: ex.id,
      name: ex.name,
      sets: [{ id: Math.random().toString(), reps: '10', weight: '0' }]
    }]);
    setShowExerciseSearch(false);
    setSearchQuery('');
  };

  const updateSet = (exIdx, setIdx, field, val) => {
    const sanitized = val.replace(/[^0-9.]/g, '');
    const newEx = [...sessionExercises];
    newEx[exIdx].sets[setIdx][field] = sanitized;
    setSessionExercises(newEx);
  };

  const validateWorkout = () => {
    if (sessionExercises.length === 0) {
      showAlert('Empty Session', 'Add at least one exercise to your workout.');
      return false;
    }
    
    const start = parseInputTime(startTime);
    const end = parseInputTime(endTime);
    
    if (!start || !end) {
      showAlert('Invalid Time', 'Please enter time in HH:mm format (e.g., 20:30).');
      return false;
    }

    const dur = calculateDuration();
    if (dur <= 0) {
      showAlert('Timing Error', 'End time cannot be the same as start time.');
      return false;
    }

    for (let i = 0; i < sessionExercises.length; i++) {
      const ex = sessionExercises[i];
      if (ex.sets.length === 0) {
        showAlert('Audit Error', `${ex.name} has no sets. Remove it or add a set.`);
        return false;
      }
      for (let s = 0; s < ex.sets.length; s++) {
        const reps = parseInt(ex.sets[s].reps);
        if (!reps || reps <= 0) {
          showAlert('Invalid Data', `Set ${s + 1} of ${ex.name} is missing reps.`);
          return false;
        }
      }
    }
    return true;
  };

  const saveWorkout = async () => {
    if (!validateWorkout() || saving) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Auth expired');

      const startD = parseInputTime(startTime);
      const endD = parseInputTime(endTime);
      
      // If end is in the future compared to 'now', and it's currently late, 
      // maybe they are logging for yesterday? 
      // But standard behavior is 'today'.
      if (endD < startD) {
        // Overnight logic already handled by duration, but for ISO storage:
        startD.setDate(startD.getDate() - 1);
      }

      const durSeconds = calculateDuration() * 60;

      const { data: session, error: sErr } = await supabase.from('workout_sessions').insert({
        user_id: user.id,
        workout_id: templateId || null,
        started_at: startD.toISOString(),
        completed_at: endD.toISOString(),
        duration_seconds: durSeconds,
        status: 'completed',
        notes: sessionNotes.trim(),
        feeling: feeling,
        calories_burned: parseInt(calories) || 0
      }).select().single();

      if (sErr) throw sErr;

      for (let i = 0; i < sessionExercises.length; i++) {
        const ex = sessionExercises[i];
        const { data: sEx, error: seErr } = await supabase.from('workout_session_exercises').insert({
          session_id: session.id,
          exercise_id: ex.id,
          order_index: i
        }).select().single();

        if (seErr) throw seErr;

        const setsToInsert = ex.sets.map((set, sIdx) => ({
          session_exercise_id: sEx.id,
          set_number: sIdx + 1,
          reps_completed: parseInt(set.reps),
          weight_kg: parseFloat(set.weight) || 0
        }));
        await supabase.from('exercise_sets').insert(setsToInsert);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs', params: { screen: 'History' } }],
      });
    } catch (e) {
      console.error(e);
      showAlert('Error', 'Could not save workout. Try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <View className="flex-1 bg-white items-center justify-center"><ActivityIndicator color="#FF5722" size="large" /></View>;

  // GUIDED INTRO
  if (currentStep === 0 && mode === 'guided') {
    return (
      <SafeAreaView className="flex-1 bg-gray-900 justify-center items-center">
        {countdown !== null ? (
          <View className="items-center">
            <Text className="text-white text-[160px] font-black">{countdown}</Text>
            <Text className="text-orange-500 font-black text-2xl uppercase tracking-[12px]">Get Set</Text>
          </View>
        ) : (
          <View className="items-center px-10 w-full">
            <View className="bg-orange-500 w-24 h-24 rounded-[32px] items-center justify-center mb-10 shadow-2xl shadow-orange-500/40">
              <Play color="white" size={40} fill="white" />
            </View>
            <Text className="text-white text-4xl font-black text-center mb-2">Ready?</Text>
            <Text className="text-white/30 text-center text-lg mb-12 font-medium">{workoutName}</Text>
            <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy); setCountdown(3); }} className="bg-white w-full py-6 rounded-[32px] items-center"><Text className="text-gray-900 font-black text-xl uppercase tracking-widest">Start Now</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.goBack()} className="mt-8 p-4"><Text className="text-white/20 font-black uppercase text-xs tracking-widest">Cancel</Text></TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    );
  }

  // UNIFIED LOG SCREEN
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="px-6 py-4 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => navigation.goBack()} className="bg-gray-100 p-3 rounded-2xl" disabled={saving}>
          <X color="#6B7280" size={24} />
        </TouchableOpacity>

        <TouchableOpacity onPress={saveWorkout} disabled={saving} className={`w-12 h-12 rounded-2xl items-center justify-center shadow-lg ${saving ? 'bg-gray-200' : 'bg-orange-500 shadow-orange-500/30'}`}>
          {saving ? <ActivityIndicator color="#9CA3AF" size="small" /> : <Check color="white" size={24} />}
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1 px-6 pt-2" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* GLOBAL HEADER STYLE */}
        <FadeInView delay={50} className="mb-8">
           <Text className="text-4xl font-black text-gray-900">{workoutName || 'New Session'}</Text>
        </FadeInView>

        {/* 1. TOP STATS */}
        <FadeInView delay={150}>
          <View className="flex-row space-x-3 mb-6">
            <View className="bg-gray-900 flex-[1.5] p-6 rounded-[32px] justify-center shadow-xl shadow-gray-900/10">
              <Text className="text-white/40 font-black text-[8px] uppercase tracking-widest mb-1">Total Weight</Text>
              <Text className="text-white text-3xl font-black">{calculateTotalVolume().toLocaleString()} kg</Text>
            </View>
            <View className="bg-orange-500 flex-1 p-6 rounded-[32px] justify-center shadow-xl shadow-orange-500/10">
              <Text className="text-white/60 font-black text-[8px] uppercase tracking-widest mb-1">Duration</Text>
              <Text className="text-white text-2xl font-black">{calculateDuration()} min</Text>
            </View>
          </View>
        </FadeInView>

        {/* 2. DATE & TIME CONTROLS */}
        <FadeInView delay={250}>
          <View className="bg-gray-50 rounded-[32px] p-8 mb-8 border border-gray-100">
            {/* Date Selection */}
            <View className="mb-6">
              <Text className="text-gray-400 font-black text-[8px] uppercase tracking-widest mb-3 text-center">Workout Date</Text>
              <TouchableOpacity 
                onPress={() => setShowDatePicker(true)}
                className="bg-white border border-gray-100 rounded-2xl px-6 py-4 flex-row items-center justify-between shadow-sm"
              >
                <Text className="text-gray-900 text-lg font-black">
                  {format(workoutDate, 'EEEE, dd MMM yyyy')}
                </Text>
                <Calendar color="#FF5722" size={20} />
              </TouchableOpacity>
              
              {showDatePicker && (
                <DateTimePicker
                  value={workoutDate}
                  mode="date"
                  display="default"
                  maximumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) setWorkoutDate(selectedDate);
                  }}
                />
              )}
            </View>

            <View className="h-[1px] bg-gray-100 w-full mb-6" />

            <View className="flex-row items-center justify-between">
              <View className="flex-1 items-center">
                <Text className="text-gray-400 font-black text-[8px] uppercase tracking-widest mb-2">Start Time</Text>
                <TextInput className="text-gray-900 text-3xl font-black p-0" value={startTime} onChangeText={setStartTime} placeholder="HH:mm" maxLength={5} keyboardType="numeric" />
              </View>
              <View className="px-4"><ArrowRight color="#D1D5DB" size={20} /></View>
              <View className="flex-1 items-center">
                <Text className="text-gray-400 font-black text-[8px] uppercase tracking-widest mb-2">End Time</Text>
                <TextInput className="text-gray-900 text-3xl font-black p-0" value={endTime} onChangeText={setEndTime} placeholder="HH:mm" maxLength={5} keyboardType="numeric" />
              </View>
            </View>
            <Text className="text-center text-gray-300 font-bold text-[8px] mt-4 uppercase tracking-widest">Use 24h format (e.g. 21:30)</Text>
          </View>
        </FadeInView>
 


        {/* 3. EXERCISES LIST */}
        <FadeInView delay={350}>
          <View className="flex-row items-center justify-between mb-6 px-2">
            <Text className="text-gray-900 font-black text-xl tracking-tight">Exercises</Text>
            <TouchableOpacity onPress={() => setShowExerciseSearch(true)} className="bg-gray-100 px-4 py-2 rounded-full flex-row items-center">
              <Plus color="#333" size={14} />
              <Text className="text-gray-900 font-black text-[10px] uppercase ml-1">Add</Text>
            </TouchableOpacity>
          </View>

          {sessionExercises.map((ex, exIdx) => (
            <View key={exIdx} className="mb-6 bg-white border border-gray-100 rounded-[40px] p-8 shadow-sm">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-xl font-black text-gray-900 flex-1">{ex.name}</Text>
                <TouchableOpacity onPress={() => { const n = [...sessionExercises]; n.splice(exIdx, 1); setSessionExercises(n); }} className="bg-red-50 p-2 rounded-xl">
                  <Trash2 color="#EF4444" size={18} />
                </TouchableOpacity>
              </View>
              {ex.sets.map((s, si) => (
                <View key={si} className="mb-4 flex-row items-center space-x-3">
                   <View className="bg-gray-100 w-8 h-8 rounded-full items-center justify-center">
                    <Text className="text-gray-400 font-black text-[8px]">{si + 1}</Text>
                  </View>
                  <View className="bg-gray-50 flex-1 rounded-2xl px-4 h-14 flex-row items-center"><TextInput className="flex-1 font-black text-gray-900" keyboardType="numeric" value={s.weight} onChangeText={(v) => updateSet(exIdx, si, 'weight', v)} /><Text className="text-gray-400 font-bold text-[10px]">KG</Text></View>
                  <View className="bg-gray-50 flex-1 rounded-2xl px-4 h-14 flex-row items-center"><TextInput className="flex-1 font-black text-gray-900" keyboardType="numeric" value={s.reps} onChangeText={(v) => updateSet(exIdx, si, 'reps', v)} /><Text className="text-gray-400 font-bold text-[10px]">REPS</Text></View>
                </View>
              ))}
              <TouchableOpacity onPress={() => { const n = [...sessionExercises]; n[exIdx].sets.push({ id: Math.random().toString(), reps: '10', weight: '0' }); setSessionExercises(n); }} className="mt-2 items-center"><Text className="text-gray-400 font-black text-[8px] uppercase tracking-widest">+ Add Set</Text></TouchableOpacity>
            </View>
          ))}

          {sessionExercises.length === 0 && (
             <TouchableOpacity onPress={() => setShowExerciseSearch(true)} className="bg-gray-50 py-10 rounded-[40px] items-center border border-dashed border-gray-200 mb-10">
               <Plus color="#D1D5DB" size={32} />
               <Text className="text-gray-400 font-black text-[10px] uppercase tracking-[2px] mt-4">Add your first exercise</Text>
             </TouchableOpacity>
          )}
        </FadeInView>

        {/* 4. FEELING, CALORIES & NOTES */}
        <FadeInView delay={450}>
          <View className="bg-gray-50 rounded-[40px] p-8 mb-8 border border-gray-100">
            <Text className="text-gray-900 font-black text-lg mb-6">How was it?</Text>
            <View className="flex-row space-x-4 mb-8">
              {[{ id: 'good', icon: Smile }, { id: 'neutral', icon: Meh }, { id: 'bad', icon: Frown }].map((item) => (
                <TouchableOpacity key={item.id} onPress={() => setFeeling(item.id)} className={`flex-1 py-4 rounded-3xl items-center ${feeling === item.id ? 'bg-white shadow-md' : 'bg-transparent'}`}><item.icon color={feeling === item.id ? '#FF5722' : '#D1D5DB'} size={32} /></TouchableOpacity>
              ))}
            </View>
            <View className="flex-row items-center justify-between mb-8 bg-white p-6 rounded-3xl border border-gray-100">
              <View><Text className="text-gray-400 font-black text-[10px] uppercase tracking-widest mb-1">Total Burn</Text><Text className="text-gray-900 font-black text-3xl">{calories} kcal</Text></View>
              <View className="bg-orange-500/10 p-4 rounded-2xl"><Flame color="#FF5722" size={32} fill="#FF5722" /></View>
            </View>
            <TextInput className="bg-white rounded-3xl p-6 font-bold text-gray-900 border border-gray-100 h-24" placeholder="Training notes..." multiline value={sessionNotes} onChangeText={setSessionNotes} maxLength={500} />
          </View>
        </FadeInView>

        {userProfile && !userProfile.is_premium && (
          <FadeInView delay={550}>
            <View className="mb-8">
              <AdBanner />
            </View>
          </FadeInView>
        )}

      </ScrollView>

      {/* MODALS */}
      <Modal visible={showExerciseSearch} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-end"><View className="bg-white rounded-t-[50px] p-10 pb-10 h-[85%]"><View className="flex-row justify-between items-center mb-10"><Text className="text-3xl font-black text-gray-900">Exercises</Text><TouchableOpacity onPress={() => setShowExerciseSearch(false)} className="bg-gray-100 p-3 rounded-full"><X color="#6B7280" size={24} /></TouchableOpacity></View><View className="bg-gray-50 rounded-[30px] flex-row items-center px-8 h-16 border border-gray-100 mb-8"><Search color="#9CA3AF" size={24} /><TextInput className="flex-1 ml-4 font-bold text-gray-900" placeholder="Search..." value={searchQuery} onChangeText={setSearchQuery} /></View><ScrollView>{exercises.filter(ex => ex.name.toLowerCase().includes(searchQuery.toLowerCase())).map(ex => (
                <TouchableOpacity key={ex.id} onPress={() => addExercise(ex)} className="flex-row items-center py-6 border-b border-gray-100"><View className="bg-orange-50 p-5 rounded-3xl mr-6"><Dumbbell color="#FF5722" size={28} /></View><Text className="text-gray-900 font-black text-xl flex-1">{ex.name}</Text><Plus color="#D1D5DB" size={28} /></TouchableOpacity>
              ))}</ScrollView></View></View>
      </Modal>



      <Modal visible={alertConfig.visible} transparent animationType="fade">
        <View className="flex-1 bg-black/60 items-center justify-center px-10">
          <View className="bg-white rounded-[40px] p-10 w-full items-center shadow-2xl">
            <View className="bg-red-50 p-5 rounded-[24px] mb-6"><ShieldAlert color="#EF4444" size={40} /></View>
            <Text className="text-gray-900 font-black text-2xl text-center mb-2">{alertConfig.title}</Text>
            <Text className="text-gray-400 font-bold text-center mb-10 leading-6">{alertConfig.message}</Text>
            <TouchableOpacity onPress={() => setAlertConfig({ ...alertConfig, visible: false })} className="bg-gray-900 w-full py-5 rounded-[24px] items-center"><Text className="text-white font-black uppercase tracking-widest">Correct It</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
