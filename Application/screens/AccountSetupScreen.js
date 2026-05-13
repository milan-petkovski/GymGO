import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Animated,
  Linking,
  Image,
  Dimensions,
  Easing
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronRight,
  ChevronLeft,
  Ruler,
  Scale,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Crown,
  Zap,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Heart,
  Activity,
  User,
  UserRound,
  ArrowRight,
  Target,
  ExternalLink
} from 'lucide-react-native';
import { supabase } from '../supabaseClient';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  aggregateRecord,
  getSdkStatus,
  initialize,
  requestPermission,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';
import * as Haptics from 'expo-haptics';
import { useOnboardingStore } from '../store/useOnboardingStore';

const { width } = Dimensions.get('window');

const GOALS = [
  { id: 'muscle_gain', label: 'Muscle Gain', icon: '💪' },
  { id: 'weight_loss', label: 'Weight Loss', icon: '🔥' },
  { id: 'endurance', label: 'Endurance', icon: '🏃' },
  { id: 'strength', label: 'Strength', icon: '🏋️' },
];

const ACTIVITY_LEVELS = [
  { id: 'sedentary', label: 'Sedentary', description: 'Little to no exercise', icon: '🛋️' },
  { id: 'light', label: 'Lightly Active', description: '1-2 times per week', icon: '🚶' },
  { id: 'moderate', label: 'Moderately Active', description: '3-4 times per week', icon: '🏃' },
  { id: 'active', label: 'Very Active', description: '5-6 times per week', icon: '🏋️' },
  { id: 'very_active', label: 'Extremely Active', description: 'Daily exercise', icon: '🔥' },
];

function PremiumFeature({ icon, text }) {
  return (
    <View className="flex-row items-center bg-gray-50 px-5 py-4 rounded-[24px] border border-gray-100 mb-3">
      <View className="bg-orange-500/10 p-3 rounded-2xl">{icon}</View>
      <Text className="text-gray-900 font-bold ml-4 flex-1 text-sm">{text}</Text>
    </View>
  );
}

export default function AccountSetupScreen({ onComplete }) {
  const store = useOnboardingStore();
  const [step, setStep] = useState(1); // 1: Gender/DOB, 2: Metrics, 3: Activity, 4: Goal, 5: Processing, 6: Premium, 7: Sync
  const [unit, setUnit] = useState('metric'); // 'metric' or 'imperial'
  const [loading, setLoading] = useState(false);
  const [healthConnectAvailable, setHealthConnectAvailable] = useState(true);
  const [processingProgress] = useState(new Animated.Value(0));
  const insets = useSafeAreaInsets();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const progressAnim = useRef(new Animated.Value(0.25)).current;
  const logoScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(20);

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
      Animated.timing(progressAnim, {
        toValue: step <= 4 ? step / 4 : 1,
        duration: 300,
        useNativeDriver: false
      })
    ]).start();

    if (step === 5) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(logoScale, { toValue: 1.1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(logoScale, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
        ])
      ).start();

      Animated.timing(processingProgress, {
        toValue: 1,
        duration: 3500,
        easing: Easing.linear,
        useNativeDriver: false
      }).start(() => setStep(6));
    }
  }, [step]);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [alert, setAlert] = useState({ visible: false, message: '', type: 'error' });
  const alertAnim = useRef(new Animated.Value(-150)).current;

  const showAlert = (message, type = 'error') => {
    setAlert({ visible: true, message, type });
    Animated.spring(alertAnim, { toValue: insets.top > 0 ? insets.top : 20, useNativeDriver: true }).start();
    setTimeout(() => {
      Animated.timing(alertAnim, { toValue: -150, duration: 500, useNativeDriver: true }).start(() => setAlert(prev => ({ ...prev, visible: false })));
    }, 5000);
  };

  const isStepComplete = () => {
    if (step === 1) return !!store.dateOfBirth && !!store.gender;
    if (step === 2) return !!store.height && !!store.weight;
    if (step === 3) return !!store.activityLevel;
    if (step === 4) return !!store.goal;
    return true;
  };

  const handleBack = () => step > 1 && setStep(step - 1);

  const handleNext = () => {
    if (step === 1 && (!store.dateOfBirth || !store.gender)) return;
    if (step === 2 && (!store.height || !store.weight)) return;
    if (step === 3 && !store.activityLevel) return;
    if (step === 4 && !store.goal) return;

    if (step < 4) {
      setStep(step + 1);
    } else if (step === 4) {
      setStep(5);
    } else if (step === 6) {
      setStep(7);
    }
  };

  const handleGoogleFitConnect = async () => {
    try {
      setLoading(true);
      if (Platform.OS !== 'android') {
        setHealthConnectAvailable(false);
        return;
      }

      try {
        const sdkStatus = await getSdkStatus();
        if (sdkStatus !== SdkAvailabilityStatus.SDK_AVAILABLE && sdkStatus !== SdkAvailabilityStatus.SDK_INSTALLED) {
          setHealthConnectAvailable(false);
          return;
        }

        const isInitialized = await initialize();
        if (!isInitialized) {
          setHealthConnectAvailable(false);
          return;
        }

        await requestPermission([
          { accessType: 'read', recordType: 'Steps' },
          { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
          { accessType: 'read', recordType: 'Distance' },
        ]);

        const startTime = new Date();
        startTime.setHours(0, 0, 0, 0);
        const endTime = new Date();
        endTime.setHours(23, 59, 59, 999);

        const timeRangeFilter = {
          operator: 'between',
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        };

        const [stepsResult, caloriesResult, distanceResult] = await Promise.all([
          aggregateRecord({ recordType: 'Steps', timeRangeFilter }),
          aggregateRecord({ recordType: 'ActiveCaloriesBurned', timeRangeFilter }),
          aggregateRecord({ recordType: 'Distance', timeRangeFilter }),
        ]);

        const dailySteps = stepsResult?.COUNT_TOTAL || 0;
        const dailyCalories = Math.round(caloriesResult?.ACTIVE_CALORIES_TOTAL?.inKilocalories || 0);
        const dailyDistance = Number((distanceResult?.DISTANCE?.inKilometers || 0).toFixed(2));

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.from('user_integrations').upsert({
            user_id: user.id,
            provider: 'health_connect',
            connected_at: new Date().toISOString(),
            is_active: true,
            last_sync_at: new Date().toISOString(),
            metadata: {
              daily_steps: dailySteps,
              daily_calories: dailyCalories,
              daily_distance: dailyDistance,
            },
          });

          await supabase.from('profiles').update({
            google_fit_connected: true,
            daily_steps: dailySteps,
            daily_calories: dailyCalories,
            daily_distance: dailyDistance
          }).eq('id', user.id);
        }

        showAlert('Health Connect connected successfully!', 'success');
        setStep(7);
        handleSubmit();
      } catch (nativeError) {
        setHealthConnectAvailable(false);
      }
    } catch (error) {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const dob = store.dateOfBirth ? new Date(store.dateOfBirth) : null;
      const dateString = dob ? `${dob.getFullYear()}-${(dob.getMonth() + 1).toString().padStart(2, '0')}-${dob.getDate().toString().padStart(2, '0')}` : null;

      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email,
        first_name: store.firstName || 'Athlete',
        last_name: store.lastName || '',
        gender: store.gender,
        height_cm: unit === 'metric' ? parseInt(store.height) : Math.round(parseInt(store.height) * 2.54),
        weight_kg: unit === 'metric' ? parseFloat(store.weight) : parseFloat((parseFloat(store.weight) * 0.453592).toFixed(1)),
        date_of_birth: dateString,
        activity_level: store.activityLevel,
        is_verified: true,
      });

      if (error) throw error;
      await supabase.from('fitness_goals').upsert([{ user_id: user.id, type: store.goal, title: 'Primary Goal', start_date: new Date() }]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onComplete();
    } catch (error) {
      showAlert(error.message);
      setStep(4);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <Animated.View style={{ transform: [{ translateY: alertAnim }] }} className={`absolute top-0 left-6 right-6 p-4 rounded-2xl flex-row items-center z-50 shadow-lg ${alert.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
        {alert.type === 'success' ? <CheckCircle2 color="white" size={24} /> : <AlertCircle color="white" size={24} />}
        <Text className="text-white font-bold ml-3 flex-1">{alert.message}</Text>
      </Animated.View>

      <View className="flex-1">
        {/* Progress Bar */}
        {step <= 4 && (
          <View className="h-1.5 w-full bg-gray-100 mt-2">
            <Animated.View style={{
              width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
              height: '100%',
              backgroundColor: '#FF5722'
            }} />
          </View>
        )}

        {step <= 4 && (
          <View className="flex-row items-center px-6 mt-6 mb-4">
            {step > 1 ? (
              <TouchableOpacity onPress={handleBack} className="bg-gray-50 p-2 rounded-xl border border-gray-100">
                <ChevronLeft color="#111" size={20} />
              </TouchableOpacity>
            ) : (
              <View className="w-10 h-10" />
            )}
            <View className="flex-1 items-center">
              <Text className="text-gray-400 font-black text-[10px] uppercase tracking-widest">Step {step} of 4</Text>
            </View>
            <View className="w-10 h-10" />
          </View>
        )}

        <View className="flex-1 px-6">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>

            {step === 1 && (
              <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                <Text className="text-3xl font-black text-gray-900">Tell us</Text>
                <Text className="text-3xl font-black text-[#FF5722] mb-2">About You</Text>
                <Text className="text-gray-400 text-sm font-medium mb-8 leading-5">Select your gender to help us customize your journey.</Text>

                <Text className="text-[10px] font-black text-gray-400 mb-3 uppercase tracking-widest ml-1">Select Gender</Text>
                <View className="flex-row space-x-4 mb-8">
                  <TouchableOpacity
                    activeOpacity={0.7}
                    className={`flex-1 py-6 rounded-[32px] border-2 items-center justify-center ${store.gender === 'male' ? 'border-blue-500 bg-blue-50' : 'border-gray-100 bg-gray-50'}`}
                    onPress={() => store.setGender('male')}
                  >
                    <View className={`w-14 h-14 rounded-full items-center justify-center mb-3 ${store.gender === 'male' ? 'bg-blue-500 shadow-lg shadow-blue-500/40' : 'bg-gray-200'}`}>
                      <User color="white" size={28} />
                    </View>
                    <Text className={`font-black text-xs uppercase tracking-widest ${store.gender === 'male' ? 'text-blue-500' : 'text-gray-400'}`}>Male</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    className={`flex-1 py-6 rounded-[32px] border-2 items-center justify-center ${store.gender === 'female' ? 'border-pink-500 bg-pink-50' : 'border-gray-100 bg-gray-50'}`}
                    onPress={() => store.setGender('female')}
                  >
                    <View className={`w-14 h-14 rounded-full items-center justify-center mb-3 ${store.gender === 'female' ? 'bg-pink-500 shadow-lg shadow-pink-500/40' : 'bg-gray-200'}`}>
                      <UserRound color="white" size={28} />
                    </View>
                    <Text className={`font-black text-xs uppercase tracking-widest ${store.gender === 'female' ? 'text-pink-500' : 'text-gray-400'}`}>Female</Text>
                  </TouchableOpacity>
                </View>

                <Text className="text-[10px] font-black text-gray-400 mb-3 uppercase tracking-widest ml-1">Date of Birth</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(true)} className="flex-row items-center bg-gray-50 border border-gray-100 rounded-3xl px-6 py-5 mb-2">
                  <Calendar size={20} color="#FF5722" />
                  <Text className={`flex-1 ml-4 text-base font-black ${store.dateOfBirth ? 'text-gray-900' : 'text-gray-400'}`}>
                    {store.dateOfBirth ? new Date(store.dateOfBirth).toLocaleDateString('en-GB') : 'Birth Date'}
                  </Text>
                  <ChevronRight color="#D1D5DB" size={18} />
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={store.dateOfBirth ? new Date(store.dateOfBirth) : new Date(2000, 0, 1)}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(e, date) => { setShowDatePicker(false); if (date) store.setDateOfBirth(date); }}
                    maximumDate={new Date()}
                  />
                )}
              </Animated.View>
            )}

            {step === 2 && (
              <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                <View className="flex-row justify-between items-end mb-2">
                  <View>
                    <Text className="text-3xl font-black text-gray-900">Stats &</Text>
                    <Text className="text-3xl font-black text-[#FF5722]">Metrics</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setUnit(unit === 'metric' ? 'imperial' : 'metric')}
                    className="bg-gray-100 px-4 py-2 rounded-full border border-gray-200"
                  >
                    <Text className="text-gray-600 font-black text-[10px] uppercase tracking-widest">
                      Switch to {unit === 'metric' ? 'Imperial' : 'Metric'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text className="text-gray-400 text-sm font-medium mb-8 leading-5">Your body stats help us calculate your requirements.</Text>

                <View className="space-y-4">
                  <View>
                    <Text className="text-[10px] font-black text-gray-400 mb-2 ml-1 uppercase">Height ({unit === 'metric' ? 'cm' : 'inches'})</Text>
                    <View className="flex-row items-center bg-gray-50 border border-gray-100 rounded-[24px] px-6 h-16">
                      <Ruler size={20} color="#FF5722" />
                      <TextInput className="flex-1 ml-4 text-xl font-black text-gray-900" keyboardType="numeric" placeholder={unit === 'metric' ? "180" : "71"} placeholderTextColor="#CBD5E1" value={store.height} onChangeText={(v) => store.setMetrics(v, store.weight)} />
                      <Text className="text-gray-400 font-bold">{unit === 'metric' ? 'cm' : 'in'}</Text>
                    </View>
                  </View>
                  <View>
                    <Text className="text-[10px] font-black text-gray-400 mb-2 ml-1 uppercase">Weight ({unit === 'metric' ? 'kg' : 'lbs'})</Text>
                    <View className="flex-row items-center bg-gray-50 border border-gray-100 rounded-[24px] px-6 h-16">
                      <Scale size={20} color="#FF5722" />
                      <TextInput className="flex-1 ml-4 text-xl font-black text-gray-900" keyboardType="numeric" placeholder={unit === 'metric' ? "85" : "187"} placeholderTextColor="#CBD5E1" value={store.weight} onChangeText={(v) => store.setMetrics(store.height, v)} />
                      <Text className="text-gray-400 font-bold">{unit === 'metric' ? 'kg' : 'lbs'}</Text>
                    </View>
                  </View>
                </View>
              </Animated.View>
            )}

            {step === 3 && (
              <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                <Text className="text-3xl font-black text-gray-900">Activity</Text>
                <Text className="text-3xl font-black text-[#FF5722] mb-2">Level</Text>
                <View className="space-y-2 mt-4">
                  {ACTIVITY_LEVELS.map((level) => (
                    <TouchableOpacity
                      key={level.id}
                      onPress={() => store.setActivityLevel(level.id)}
                      className={`flex-row items-center p-4 rounded-[24px] border-2 ${store.activityLevel === level.id ? 'border-[#FF5722] bg-[#FF5722]/5' : 'border-gray-100 bg-gray-50'}`}
                    >
                      <Text className="text-2xl mr-4">{level.icon}</Text>
                      <View className="flex-1">
                        <Text className={`font-black text-sm ${store.activityLevel === level.id ? 'text-[#FF5722]' : 'text-gray-900'}`}>{level.label}</Text>
                        <Text className="text-gray-500 text-[10px]">{level.description}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </Animated.View>
            )}

            {step === 4 && (
              <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                <Text className="text-3xl font-black text-gray-900">What is Your</Text>
                <Text className="text-3xl font-black text-[#FF5722] mb-6">Goal?</Text>
                <View className="flex-row flex-wrap justify-between">
                  {GOALS.map((g) => (
                    <TouchableOpacity
                      key={g.id}
                      className={`w-[48%] mb-4 p-6 rounded-[32px] border-2 items-center ${store.goal === g.id ? 'border-[#FF5722] bg-[#FF5722]/5' : 'border-gray-100 bg-gray-50'}`}
                      onPress={() => store.setGoal(g.id)}
                    >
                      <Text className="text-4xl mb-2">{g.icon}</Text>
                      <Text className={`font-black text-center text-xs uppercase ${store.goal === g.id ? 'text-[#FF5722]' : 'text-gray-400'}`}>{g.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </Animated.View>
            )}

            {step === 5 && (
              <View className="flex-1 items-center justify-center">
                <Animated.View style={{ transform: [{ scale: logoScale }] }}>
                  <View className="bg-orange-500/10 p-10 rounded-[60px] border-4 border-orange-500/20">
                    <TrendingUp color="#FF5722" size={100} strokeWidth={2.5} />
                  </View>
                </Animated.View>

                <View className="mt-12 items-center">
                  <Text className="text-3xl font-black text-gray-900 text-center">Creating Your</Text>
                  <Text className="text-4xl font-black text-[#FF5722] text-center mb-4">Elite Plan</Text>

                  <View className="w-64 h-2 bg-gray-100 rounded-full overflow-hidden mt-4">
                    <Animated.View
                      style={{
                        width: processingProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                        height: '100%',
                        backgroundColor: '#FF5722'
                      }}
                    />
                  </View>

                  <View className="flex-row items-center mt-6">
                    <ActivityIndicator size="small" color="#FF5722" />
                    <Text className="text-gray-400 font-bold ml-3 uppercase tracking-widest text-[10px]">
                      Analyzing your metrics...
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {step === 6 && (
              <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                <View className="items-center mb-6 mt-2">
                  <View className="bg-[#FF5722] p-5 rounded-[30px] shadow-2xl shadow-orange-500/50 mb-4">
                    <Crown color="white" size={48} strokeWidth={2} />
                  </View>
                  <Text className="text-3xl font-black text-gray-900 text-center mb-1 tracking-tight">GymGo Premium</Text>
                  <View className="bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                    <Text className="text-[#FF5722] font-black text-[10px] uppercase tracking-widest">7 Days Free Trial Included</Text>
                  </View>
                </View>

                <View className="space-y-1">
                  <PremiumFeature icon={<Sparkles color="#FF5722" size={20} />} text="AI Voice Workout Assistant" />
                  <PremiumFeature icon={<Zap color="#FF5722" size={20} />} text="Advanced Performance Analytics" />
                  <PremiumFeature icon={<Target color="#FF5722" size={20} />} text="Personalized Training Plans" />
                  <PremiumFeature icon={<CheckCircle2 color="#FF5722" size={20} />} text="Ad-free Experience & Much More" />
                </View>

                <View className="mt-auto pb-10">
                  <TouchableOpacity
                    onPress={handleNext}
                    className="bg-[#FF5722] py-5 rounded-[28px] items-center shadow-xl shadow-orange-500/40 flex-row justify-center mb-4"
                  >
                    <Text className="text-white font-black text-lg mr-2">Try Free & Continue</Text>
                    <ArrowRight color="white" size={22} />
                  </TouchableOpacity>

                  <TouchableOpacity onPress={handleNext} className="items-center">
                    <Text className="text-gray-400 font-bold text-xs tracking-wide">Maybe later, continue with free</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}

            {step === 7 && (
              <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
                <View className="flex-1 items-center justify-center">
                  <View className="bg-rose-50 p-10 rounded-[50px] mb-8">
                    <Heart color="#F43F5E" size={100} fill="#F43F5E33" strokeWidth={1.5} />
                  </View>
                  <Text className="text-4xl font-black text-gray-900 text-center">Sync Health</Text>
                  <Text className="text-gray-500 text-center mt-4 px-8 text-lg font-medium leading-7">
                    Connect with Health Connect to automatically track steps, calories, and daily activity.
                  </Text>

                  {!healthConnectAvailable && (
                    <View className="w-full mt-6 bg-amber-50 border border-amber-200 rounded-[24px] p-4 flex-row items-center">
                      <View className="bg-amber-500/10 p-2 rounded-xl">
                        <Heart color="#F59E0B" size={16} fill="#F59E0B33" />
                      </View>
                      <Text className="text-amber-900 font-black text-[10px] uppercase tracking-widest ml-3">Health Connect: Unavailable</Text>
                    </View>
                  )}

                  <View className="w-full mt-12 space-y-4">
                    {healthConnectAvailable && (
                      <TouchableOpacity
                        onPress={handleGoogleFitConnect}
                        disabled={loading}
                        className="bg-[#F43F5E] w-full py-5 rounded-[32px] items-center shadow-2xl shadow-rose-500/30 flex-row justify-center"
                      >
                        {loading ? (
                          <ActivityIndicator color="white" />
                        ) : (
                          <>
                            <Text className="text-white font-black text-xl mr-2">Connect Health Connect</Text>
                            <Activity color="white" size={24} />
                          </>
                        )}
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity 
                      onPress={handleSubmit} 
                      disabled={loading}
                      className={`items-center py-5 rounded-[32px] ${!healthConnectAvailable ? 'bg-gray-900 shadow-xl' : ''}`}
                    >
                      <Text className={!healthConnectAvailable ? 'text-white font-black text-xl' : 'text-gray-400 font-bold text-sm'}>
                        {!healthConnectAvailable ? 'Finish Setup' : 'Skip for now'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            )}

            {step <= 4 && (
              <View className="mt-auto py-8">
                <TouchableOpacity
                  activeOpacity={0.8}
                  className={`py-5 rounded-[32px] flex-row items-center justify-center shadow-xl ${isStepComplete() && !loading ? 'bg-[#FF5722] shadow-orange-500/40' : 'bg-gray-100'}`}
                  onPress={handleNext}
                  disabled={loading || !isStepComplete()}
                >
                  {loading ? <ActivityIndicator color="white" /> : (
                    <>
                      <Text className={`text-xl font-black mr-2 ${isStepComplete() ? 'text-white' : 'text-gray-400'}`}>
                        {step === 4 ? 'Get Started' : 'Continue'}
                      </Text>
                      <ChevronRight color={isStepComplete() ? 'white' : '#D1D5DB'} size={24} />
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </KeyboardAvoidingView>
        </View>
      </View>
    </SafeAreaView>
  );
}
