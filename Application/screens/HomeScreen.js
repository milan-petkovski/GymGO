import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  Animated, 
  Dimensions, 
  Easing,
  ActivityIndicator,
  StyleSheet,
  Linking,
  RefreshControl,
  TextInput,
  Modal,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  initialize, 
  requestPermission, 
  readRecords, 
  getSdkStatus, 
  SdkAvailabilityStatus 
} from 'react-native-health-connect';
import { supabase } from '../supabaseClient';
import { 
  Flame, 
  Target, 
  Zap, 
  TrendingUp, 
  Clock, 
  Crown, 
  ChevronRight,
  Dumbbell,
  Users,
  Headset,
  X,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Calendar,
  Award,
  HelpCircle,
  ChevronDown,
  Plus,
  ArrowUpRight,
  Star,
  Activity,
  Footprints,
  Music,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ShieldCheck,
  Utensils,
  Droplet,
  PlusCircle,
  ArrowRight
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { startOfDay, format, differenceInYears } from 'date-fns';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const AdBanner = ({ extraClass = '' }) => (
  <View className={`h-16 bg-white items-center justify-center border border-gray-100 rounded-[24px] my-3 shadow-sm ${extraClass}`}>
    <Text className="text-gray-300 text-[9px] font-black tracking-[4px] uppercase">ADVERTISEMENT</Text>
  </View>
);

function FadeInView({ delay = 0, children, style, trigger, ready = true, ...props }) {
  const isFocused = useIsFocused();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const scale = useRef(new Animated.Value(0.95)).current;
  
  const hasAnimated = useRef(false);
  const lastTrigger = useRef(trigger);

  useEffect(() => {
    let needsReset = false;
    
    if (!isFocused || !ready) needsReset = true;
    if (typeof trigger === 'boolean' && trigger === true) needsReset = true;
    if (typeof trigger === 'number' && trigger !== lastTrigger.current) needsReset = true;

    if (needsReset) {
      hasAnimated.current = false;
      lastTrigger.current = trigger;
      opacity.setValue(0);
      translateY.setValue(20);
      scale.setValue(0.95);
      return;
    }

    if (!hasAnimated.current) {
      opacity.stopAnimation();
      translateY.stopAnimation();
      scale.stopAnimation();

      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 500, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 500, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 8, tension: 40, delay, useNativeDriver: true }),
      ]).start();

      hasAnimated.current = true;
      lastTrigger.current = trigger;
    }
  }, [isFocused, ready, trigger, delay]);

  return (
    <Animated.View {...props} style={[{ opacity, transform: [{ translateY }, { scale }] }, style]}>
      {children}
    </Animated.View>
  );
}


function FAQItem({ item, isExpanded, onToggle }) {
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animation, {
      toValue: isExpanded ? 1 : 0,
      duration: 300,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      useNativeDriver: false,
    }).start();
  }, [isExpanded]);

  const heightInterpolate = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 500], // Increased to accommodate longer answers
  });

  const opacityInterpolate = animation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <View className={`bg-white border ${isExpanded ? 'border-orange-500/20 shadow-lg shadow-orange-500/5' : 'border-gray-100'} rounded-[32px] mb-3 overflow-hidden`}>
      <TouchableOpacity onPress={onToggle} activeOpacity={0.7} className="p-6 flex-row items-center justify-between">
        <View className="flex-1 pr-4">
          <Text className={`font-black text-[15px] tracking-tight leading-6 ${isExpanded ? 'text-orange-500' : 'text-gray-900'}`}>{item.question}</Text>
        </View>
        <Animated.View 
          className={`p-2 rounded-xl ${isExpanded ? 'bg-orange-500' : 'bg-gray-50'}`}
          style={{ transform: [{ rotate: animation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }] }}
        >
          <ChevronDown color={isExpanded ? "white" : "#D1D5DB"} size={14} />
        </Animated.View>
      </TouchableOpacity>
      <Animated.View style={{ maxHeight: heightInterpolate, opacity: opacityInterpolate }}>
        <View className="px-6 pb-7">
          <View className="h-[1px] bg-gray-50 mb-5" />
          <Text className="text-gray-500 font-medium leading-6 text-[14px]">{item.answer}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

function AnimatedCounter({ value, duration = 800, delay = 0, suffix = "" }) {
  const [count, setCount] = useState(0);
  const prevValue = useRef(0);

  useEffect(() => {
    let start = prevValue.current;
    const end = parseInt(value) || 0;
    
    let startTime = null;
    let animationFrame;

    const timeout = setTimeout(() => {
      const animate = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const currentCount = Math.floor(start + progress * (end - start));
        setCount(currentCount);
        
        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate);
        } else {
          prevValue.current = end;
        }
      };
      animationFrame = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [value, duration, delay]);

  return <>{count.toLocaleString()}{suffix}</>;
}

function SectionHeader({ label, title, onPress, navigation }) {
  return (
    <View className="flex-row justify-between items-end mb-6 px-6">
      <View>
        <Text className="text-gray-400 font-black text-[9px] uppercase tracking-[5px] mb-1.5">{label}</Text>
        <Text className="text-2xl font-black text-gray-900 tracking-tighter leading-none">{title}</Text>
      </View>
      {onPress && (
        <TouchableOpacity 
          onPress={onPress} 
          className="bg-white p-3 rounded-2xl border border-gray-100 shadow-sm active:scale-95 transition-all"
        >
          <ChevronRight color="#FF5722" size={20} />
        </TouchableOpacity>
      )}
    </View>
  );
}

function PremiumFeature({ icon, text, subtitle }) {
  return (
    <View className="flex-row items-center bg-gray-50/50 px-5 py-4 rounded-[24px] border border-gray-100 mb-3">
      <View className="bg-orange-500/10 p-3 rounded-2xl">{icon}</View>
      <View className="ml-4 flex-1">
        <Text className="text-gray-900 font-black text-[13px] uppercase tracking-wider">{text}</Text>
        {subtitle && <Text className="text-gray-400 font-bold text-[9px] uppercase tracking-widest mt-0.5">{subtitle}</Text>}
      </View>
    </View>
  );
}

export default function HomeScreen({ navigation }) {
  const [userName, setUserName] = useState('');
  const [stats, setStats] = useState({ 
    todayCalories: 0, 
    calorieGoal: 2000,
    todayIntake: 0,
    waterIntake: 0,
    waterGoal: 2500,
    todaySteps: 0, 
    sessionCount: 0, 
    weight: null, 
    latestAchievement: null, 
    healthConnected: false,
    streak: 0
  });
  const [trainers, setTrainers] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [expandedFaq, setExpandedFaq] = useState(null);
  const [activePrograms, setActivePrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [musicLinks, setMusicLinks] = useState({ spotify: '', youtube: '' });
  const [activePlatform, setActivePlatform] = useState('spotify');
  const [tempMusicUrl, setTempMusicUrl] = useState('');
  const [showMusicModal, setShowMusicModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const musicModalAnim = useRef(new Animated.Value(600)).current;
  const calorieAnim = useRef(new Animated.Value(0)).current;
  const celebrationAnim = useRef(new Animated.Value(1)).current;
  const [celebrated, setCelebrated] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [manualCalories, setManualCalories] = useState('');
  const [showCalorieModal, setShowCalorieModal] = useState(false);
  const [showWaterModal, setShowWaterModal] = useState(false);

  useEffect(() => {
    if (showMusicModal) {
      musicModalAnim.setValue(600);
      Animated.spring(musicModalAnim, {
        toValue: 0,
        friction: 9,
        tension: 35,
        useNativeDriver: true
      }).start();
    }
  }, [showMusicModal]);

  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setPlaybackProgress(prev => (prev >= 1 ? 0 : prev + 0.005));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    loadMusicLinks();
  }, []);

  const loadMusicLinks = async () => {
    try {
      const saved = await AsyncStorage.getItem('gymgo_music_links');
      if (saved) setMusicLinks(JSON.parse(saved));
    } catch (e) { console.log(e); }
  };

  const saveMusicLink = async (platform, url) => {
    try {
      const newLinks = { ...musicLinks, [platform]: url };
      setMusicLinks(newLinks);
      await AsyncStorage.setItem('gymgo_music_links', JSON.stringify(newLinks));
      setTempMusicUrl('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) { console.log(e); }
  };

  useEffect(() => {
    if (!loading) {
      Animated.timing(calorieAnim, {
        toValue: stats.todayIntake / stats.calorieGoal,
        duration: 1500,
        useNativeDriver: false
      }).start();
      
      if (stats.todayIntake >= stats.calorieGoal && !celebrated) {
        setCelebrated(true);
        Animated.sequence([
          Animated.timing(celebrationAnim, { toValue: 1.1, duration: 200, useNativeDriver: true }),
          Animated.spring(celebrationAnim, { toValue: 1, friction: 4, useNativeDriver: true })
        ]).start();
      }
    }
  }, [loading, stats.todayIntake, stats.calorieGoal, celebrated]);

  const calculateCalorieGoal = (profile, latestWeight) => {
    // Default values
    const weight = latestWeight || profile.weight_kg || 80;
    const height = profile.height_cm || 180;
    const dob = profile.date_of_birth ? new Date(profile.date_of_birth) : new Date(1995, 0, 1);
    const age = differenceInYears(new Date(), dob) || 25;
    const gender = profile.gender || 'male';
    const activityLevel = profile.activity_level || 'moderate';

    // Mifflin-St Jeor Equation
    let bmr = (10 * weight) + (6.25 * height) - (5 * age);
    if (gender === 'male') bmr += 5;
    else bmr -= 161;

    // Activity Multiplier
    const multipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };
    const multiplier = multipliers[activityLevel] || 1.55;
    let tdee = Math.round(bmr * multiplier);

    // Goal adjustment (Assume maintenance unless we know otherwise)
    // You could fetch this from fitness_goals table if needed
    return tdee;
  };

  const calculateTotalWeight = (session) => {
    let total = 0;
    session.workout_session_exercises?.forEach(ex => {
      ex.exercise_sets?.forEach(set => {
        total += (set.weight_kg || 0) * (set.reps_completed || 0);
      });
    });
    return total;
  };

  const syncHealthData = async () => {
    if (Platform.OS !== 'android') return;
    try {
      const sdkStatus = await getSdkStatus();
      if (sdkStatus !== SdkAvailabilityStatus.SDK_AVAILABLE && sdkStatus !== SdkAvailabilityStatus.SDK_INSTALLED) {
        return;
      }
      
      const isInit = await initialize();
      if (!isInit) return;

      const now = new Date();
      const startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const endTime = now.toISOString();

      const steps = await readRecords('Steps', {
        timeRangeFilter: {
          operator: 'between',
          startTime,
          endTime,
        },
      });

      const totalSteps = steps.reduce((acc, cur) => acc + (cur.count || 0), 0);
      return { totalSteps, connected: true };
    } catch (e) {
      return { totalSteps: 0, connected: false };
    }
  };

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const localStart = startOfDay(new Date()).toISOString();
      
      const [profileRes, measurementRes, userAchRes, sessionDataRes, trainersRes, activityRes, faqRes, nutritionRes, hydrationRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('body_measurements').select('weight_kg').eq('user_id', user.id).order('measured_at', { ascending: false }).limit(1),
        supabase.from('user_achievements').select('achievements(name, icon_url)').eq('user_id', user.id).order('earned_at', { ascending: false }).limit(1),
        supabase.from('workout_sessions').select('calories_burned').eq('user_id', user.id).gte('started_at', localStart),
        supabase.from('trainer_profiles').select('*, profiles:user_id(first_name, last_name, avatar_url)').eq('is_active', true).limit(5),
        supabase.from('workout_sessions').select(`*, workouts(name), workout_session_exercises (id, exercises (name), exercise_sets (weight_kg, reps_completed))`).eq('user_id', user.id).order('started_at', { ascending: false }).limit(3),
        supabase.from('faqs').select('*').eq('is_active', true).order('order_index', { ascending: true }),
        supabase.from('nutrition_logs').select('calories').eq('user_id', user.id).gte('logged_at', localStart),
        supabase.from('hydration_logs').select('amount_ml').eq('user_id', user.id).gte('logged_at', localStart)
      ]);

      const profile = profileRes.data;
      const todaySessions = sessionDataRes.data || [];
      const totalCaloriesToday = todaySessions.reduce((acc, s) => acc + (s.calories_burned || 0), 0);
      
      const totalIntakeToday = (nutritionRes.data || []).reduce((acc, log) => acc + (log.calories || 0), 0);
      const totalWaterToday = (hydrationRes.data || []).reduce((acc, log) => acc + (log.amount_ml || 0), 0);
      
      const latestWeight = measurementRes.data?.[0]?.weight_kg || profile?.weight_kg;
      const calorieGoal = profile ? calculateCalorieGoal(profile, latestWeight) : 2000;
      const waterGoal = latestWeight ? Math.round(latestWeight * 35) : 2500;

      const healthData = await syncHealthData();

      const allSessionsData = (await supabase.from('workout_sessions').select('started_at').eq('user_id', user.id)).data || [];
      
      const calculateStreak = (sessionsData) => {
        if (!sessionsData || sessionsData.length === 0) return 0;
        const dates = [...new Set(sessionsData.map(s => {
          if (!s.started_at) return null;
          const d = new Date(s.started_at);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }))].filter(Boolean).sort().reverse();
        if (dates.length === 0) return 0;
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        const yesterdayDate = new Date(); yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterday = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;
        if (dates[0] !== today && dates[0] !== yesterday) return 0;
        let streak = 1;
        for (let i = 0; i < dates.length - 1; i++) {
          const current = new Date(dates[i]);
          const next = new Date(dates[i + 1]);
          const diffTime = Math.abs(current - next);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays === 1) streak++;
          else break;
        }
        return streak;
      };

      const purchaseData = (await supabase.from('user_purchases').select('program_id').eq('user_id', user.id)).data || [];
      const purchasedIds = purchaseData.map(p => p.program_id);
      const { data: programsData } = await supabase
        .from('training_programs')
        .select('*, trainer_profiles(profiles(first_name, last_name))')
        .or(`id.in.(${purchasedIds.length > 0 ? purchasedIds.join(',') : '00000000-0000-0000-0000-000000000000'}),is_premium.eq.false`)
        .limit(2);
      
      setActivePrograms(programsData || []);

      setStats({
        todayCalories: totalCaloriesToday,
        todayIntake: totalIntakeToday,
        waterIntake: totalWaterToday,
        waterGoal: waterGoal,
        calorieGoal: calorieGoal,
        todaySteps: healthData?.totalSteps || profile?.daily_steps || 0,
        sessionCount: todaySessions.length,
        weight: latestWeight || null,
        latestAchievement: userAchRes.data?.[0]?.achievements || null,
        healthConnected: healthData?.connected || profile?.google_fit_connected || false,
        streak: calculateStreak(allSessionsData)
      });


      if (profile) {
        setUserName(profile.first_name);
        setIsPremium(profile.is_premium);
      }

      setTrainers((trainersRes.data || []).map(t => ({
        id: t.id,
        name: t.profiles ? `${t.profiles.first_name} ${t.profiles.last_name}` : 'Trainer',
        specialty: t.specializations?.[0] || 'Expert Coach',
        image: t.profiles?.avatar_url || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80',
        rating: t.rating_avg || 5.0,
        is_verified: t.is_verified || false
      })));

      if (activityRes.data) setRecentActivity(activityRes.data);
      if (faqRes.data) setFaqs(faqRes.data);
    } catch (error) { 
      console.error('Fetch Error:', error); 
    } finally { 
      setLoading(false); 
      setRefreshing(false); 
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleAddCalories = async (amount) => {
    if (!amount) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const calories = parseInt(amount);
      if (isNaN(calories)) return;

      const { error } = await supabase.from('nutrition_logs').insert({
        user_id: user.id,
        name: 'Quick Log',
        type: 'Snack',
        calories: calories,
        protein: 0,
        carbs: 0,
        fats: 0
      });

      if (error) throw error;

      setStats(prev => ({ ...prev, todayIntake: prev.todayIntake + calories }));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddWater = async (amount) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('hydration_logs').insert({
        user_id: user.id,
        amount_ml: amount
      });

      if (error) throw error;

      setStats(prev => ({ ...prev, waterIntake: prev.waterIntake + amount }));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (e) {
      console.error(e);
    }
  };

  useFocusEffect(useCallback(() => { fetchUserData(); }, []));

  const calorieProgress = Math.min(100, (stats.todayIntake / stats.calorieGoal) * 100);

  return (
    <SafeAreaView className="flex-1 bg-[#FBFBFB]" edges={['top']}>
      {/* HEADER */}
      <View className="px-6 py-4 flex-row items-center justify-between z-[100]">
        <Image source={require('../assets/4.png')} style={{ width: 130, height: 35, resizeMode: 'contain' }} />
        <View className="flex-row items-center space-x-2">
          <TouchableOpacity 
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowMusicModal(true); }} 
            className="p-2.5 rounded-xl border bg-gray-50 border-gray-100"
          >
            <Music color="#111" size={20} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('WorkoutPlayer', { mode: 'standard', workoutName: 'New Workout' })} className="p-2.5 rounded-xl bg-gray-50 border border-gray-100"><Plus color="#111" size={20} /></TouchableOpacity>
          <TouchableOpacity onPress={() => isPremium ? Linking.openURL('https://milanwebportal.com/support') : navigation.navigate('Premium')} className={`p-2.5 rounded-xl border ${isPremium ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'}`}>{isPremium ? <Headset color="#3B82F6" size={20} /> : <Crown color="#FF5722" size={20} />}</TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center z-50">
          <View className="items-center justify-center">
            <ActivityIndicator color="#FF5722" size="large" />
            <Text className="text-gray-400 font-bold mt-4 uppercase text-[10px] tracking-[3px]">LOADING DASHBOARD...</Text>
          </View>
          {!isPremium && (
            <View className="absolute bottom-10 w-full px-6">
              <AdBanner />
            </View>
          )}
        </View>
      ) : (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 0 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setLoading(true); fetchUserData(); }} tintColor="#FF5722" />}>

          <FadeInView delay={50} trigger={refreshing} className="px-6 pt-5 pb-5">
            <View className="flex-row items-baseline">
              <Text className="text-4xl font-black text-gray-900 tracking-tighter">Hey, {userName || 'Athlete'}</Text>
              <Text className="text-orange-500 text-4xl font-black ml-1">.</Text>
            </View>
          </FadeInView>

          {/* QUICK ACTIONS ROW */}
          <FadeInView delay={100} trigger={refreshing} className="px-6 mb-8 flex-row space-x-3">
            <TouchableOpacity 
              onPress={() => navigation.navigate('WorkoutPlayer', { mode: 'standard', workoutName: 'New Session' })}
              className="flex-1 bg-[#FF5722] py-5 rounded-[28px] flex-row items-center justify-center shadow-xl shadow-orange-500/30 active:scale-95"
            >
              <Play color="white" size={16} fill="white" />
              <Text className="text-white font-black text-[11px] uppercase tracking-widest ml-2" numberOfLines={1}>Start Workout</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => navigation.navigate('Trainers')}
              className="flex-1 bg-white border border-gray-100 py-5 rounded-[28px] flex-row items-center justify-center shadow-sm shadow-gray-200 active:scale-95"
            >
              <Users color="#111" size={16} />
              <Text className="text-gray-900 font-black text-[11px] uppercase tracking-widest ml-2" numberOfLines={1}>Find Trainer</Text>
            </TouchableOpacity>
          </FadeInView>

          {/* ACTIVITY HERO: Dynamic Calorie Goal & Quick Actions */}
          <FadeInView delay={150} trigger={refreshing} className="px-6 mb-8">
            <Animated.View 
              style={{ transform: [{ scale: celebrationAnim }] }}
              className="bg-[#1A1C1E] rounded-[36px] p-8 shadow-2xl shadow-black/20 relative overflow-hidden"
            >
              {stats.todayIntake >= stats.calorieGoal && (
                <View className="absolute -top-10 -right-10 opacity-20">
                   <Sparkles color="#FF5722" size={150} />
                </View>
              )}
               <View style={{ backgroundColor: 'rgba(255, 87, 34, 0.08)' }} className="absolute -top-20 -right-20 w-64 h-64 rounded-full" />
               
               <View className="flex-row items-center justify-between mb-8">
                  <View className="flex-row items-center">
                    <View className="bg-[#FF5722] w-10 h-10 rounded-[18px] items-center justify-center shadow-xl shadow-orange-500/30 mr-3"><Flame color="white" size={20} /></View>
                    <View>
                      <Text className="text-white font-black text-[12px] uppercase tracking-[3px]">ENERGY</Text>
                    </View>
                  </View>
                  <View className="flex-row items-center space-x-3">
                    <TouchableOpacity 
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowWaterModal(true); }}
                      className="bg-blue-500/10 p-2.5 rounded-xl border border-blue-500/20"
                    >
                      <Droplet color="#3B82F6" size={18} fill="#3B82F6" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowCalorieModal(true); }}
                      className="bg-[#FF5722]/10 p-2.5 rounded-xl border border-[#FF5722]/20"
                    >
                      <Plus color="#FF5722" size={18} strokeWidth={3} />
                    </TouchableOpacity>
                  </View>
               </View>

               <View className="flex-row items-end mb-5">
                 <Text className="text-white text-5xl font-black tracking-tighter"><AnimatedCounter value={stats.todayIntake} delay={400} /></Text>
                 <Text className="text-white/20 text-lg font-bold ml-3 mb-1 tracking-widest uppercase">/ {stats.calorieGoal} kcal</Text>
               </View>
               
               <View className="h-[3px] bg-white/5 rounded-full overflow-hidden">
                  <Animated.View className="h-full bg-orange-500" style={{ 
                    width: calorieAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                      extrapolate: 'clamp'
                    }) 
                  }} />
               </View>

               <View className="mt-4 flex-row items-center justify-between">
                 <View className="flex-row items-center">
                   <View className={`w-2 h-2 rounded-full mr-2 ${calorieProgress >= 100 ? 'bg-green-500' : 'bg-orange-500/50'}`} />
                   <Text className="text-white/30 font-bold text-[10px] uppercase tracking-widest">
                     {calorieProgress >= 100 ? 'Goal Reached!' : `${Math.round(stats.calorieGoal - stats.todayIntake)} kcal left`}
                   </Text>
                 </View>
                 
                 <View className="flex-row items-center">
                   <Droplet color="#3B82F6" size={10} fill="#3B82F6" />
                   <Text className="text-blue-400 font-black text-[10px] ml-1.5 uppercase tracking-widest">
                      <AnimatedCounter value={stats.waterIntake} delay={600} /> / {stats.waterGoal}ml
                   </Text>
                 </View>
               </View>
            </Animated.View>
          </FadeInView>

          {/* MULTIPLE STATS: mb-8 */}
          <FadeInView delay={250} trigger={refreshing} className="px-6 mb-8">
            <View className="bg-white rounded-[32px] px-2 py-5 flex-row items-center justify-between border border-gray-100 shadow-sm shadow-gray-200/50">
              <View className="items-center flex-1">
                <View className="flex-row items-center mb-1.5">
                  <Flame color="#FF5722" size={12} fill="#FF5722" />
                  <Text className="text-gray-400 text-[9px] font-black uppercase ml-1.5 tracking-[2px]">Streak</Text>
                </View>
                <View className="flex-row items-baseline">
                  <Text className="text-2xl font-black text-gray-900">
                    <AnimatedCounter value={stats.streak} delay={700} />
                  </Text>
                  <Text className="text-[10px] text-gray-300 font-bold ml-1 uppercase">Days</Text>
                </View>
              </View>

              <View className="w-[1px] h-10 bg-gray-100" />

              <View className="items-center flex-1">
                <View className="flex-row items-center mb-1.5">
                  <TrendingUp color="#3B82F6" size={12} />
                  <Text className="text-gray-400 text-[9px] font-black uppercase ml-1.5 tracking-[2px]">Weight</Text>
                </View>
                <View className="flex-row items-baseline">
                  <Text className="text-2xl font-black text-gray-900">
                    <AnimatedCounter value={stats.weight} delay={800} />
                  </Text>
                  <Text className="text-[10px] text-gray-300 font-bold ml-1 uppercase">kg</Text>
                </View>
              </View>

              <View className="w-[1px] h-10 bg-gray-100" />

              <View className="items-center flex-1">
                <View className="flex-row items-center mb-1.5">
                  <Zap color="#EAB308" size={12} fill="#EAB308" />
                  <Text className="text-gray-400 text-[9px] font-black uppercase ml-1.5 tracking-[2px]">Sessions</Text>
                </View>
                <View className="flex-row items-baseline">
                  <Text className="text-2xl font-black text-gray-900">
                    <AnimatedCounter value={stats.sessionCount} delay={900} />
                  </Text>
                  <Text className="text-[10px] text-gray-300 font-bold ml-1 uppercase">Total</Text>
                </View>
              </View>
            </View>
          </FadeInView>



          {/* STEPS: mb-8 */}
          {stats.healthConnected && (
            <FadeInView delay={300} trigger={refreshing} className="px-6 mb-8">
              <View className="bg-white border border-gray-100 rounded-[28px] p-6 flex-row items-center justify-between shadow-lg shadow-gray-200/10">
                <View className="flex-row items-center">
                  <View className="bg-green-50 p-3.5 rounded-xl mr-4"><Footprints color="#10B981" size={22} /></View>
                  <View>
                    <Text className="text-gray-900 text-2xl font-black tracking-tighter">
                      <AnimatedCounter value={stats.todaySteps} delay={1000} />
                    </Text>
                    <Text className="text-gray-400 font-black text-[8px] uppercase tracking-[3px] mt-0.5">Steps Today</Text>
                  </View>
                </View>
                <Activity color="#F9FAFB" size={28} />
              </View>
            </FadeInView>
          )}

          {/* ACHIEVEMENT: mb-8 */}
          {stats.latestAchievement && (
            <FadeInView delay={350} trigger={refreshing} className="px-6 mb-8">
              <View className="bg-[#F8F9FA] rounded-2xl p-4 flex-row items-center border border-gray-100">
                <Award color="#FF5722" size={16} className="mr-3" />
                <View className="flex-1"><Text className="text-gray-900 font-black text-[12px] uppercase tracking-wider" numberOfLines={1}>{stats.latestAchievement.name}</Text></View>
                <Text className="text-orange-400 font-black text-[7px] uppercase tracking-[2px]">TOP BADGE</Text>
              </View>
            </FadeInView>
          )}

          {/* ACTIVE PROGRAMS */}
          {activePrograms.length > 0 && (
            <FadeInView delay={400} trigger={refreshing} className="mb-8">
              <SectionHeader 
                label="Your Journey" 
                title="Active Programs" 
                onPress={() => navigation.navigate('Training')} 
              />
              <View className="px-6 space-y-4">
                {activePrograms.map(program => (
                  <TouchableOpacity 
                    key={program.id}
                    onPress={() => navigation.navigate('VideoPlayer', { program })}
                    className="bg-gray-900 rounded-[36px] p-7 flex-row items-center shadow-2xl shadow-black/20 active:scale-[0.98]"
                  >
                    <View className="bg-white/10 p-4 rounded-2xl mr-5 border border-white/5"><Play color="white" size={20} fill="white" /></View>
                    <View className="flex-1">
                      <Text className="text-white font-black text-xl tracking-tight mb-1" numberOfLines={1}>{program.title}</Text>
                      <Text className="text-white/40 font-bold text-[10px] uppercase tracking-[3px]">{program.difficulty} • {program.duration_weeks} Weeks</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </FadeInView>
          )}

          {!isPremium && <FadeInView delay={450} trigger={refreshing} className="px-6 mb-8"><AdBanner /></FadeInView>}

          {/* FEATURED TRAINERS */}
          <FadeInView delay={500} trigger={refreshing} className="mb-8">
            <SectionHeader 
              label="Train with Elite" 
              title="Featured Coaches" 
              onPress={() => navigation.navigate('Trainers')} 
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-6" contentContainerStyle={{ paddingRight: 48 }}>
              {trainers.map((trainer) => (
                <TouchableOpacity key={trainer.id} className="mr-5 relative shadow-2xl shadow-black/15 active:scale-95" onPress={() => navigation.navigate('TrainerDetail', { trainer })}>
                  <Image source={{ uri: trainer.image }} className="w-64 h-64 rounded-[40px] bg-gray-50 border border-gray-100" />
                  <View style={{ backgroundColor: 'rgba(0,0,0,0.45)' }} className="absolute inset-0 p-7 justify-end rounded-[40px]">
                    <View className="flex-row items-center mb-2.5">
                       <View className="bg-[#FF5722] px-2.5 py-1 rounded-lg flex-row items-center shadow-lg shadow-orange-500/30">
                          <Star color="white" size={10} fill="white" /><Text className="text-white font-black text-[9px] ml-1.5">{trainer.rating}</Text>
                       </View>
                       {trainer.is_verified && <View className="ml-2.5 bg-blue-500 p-1 rounded-full border border-white/20"><CheckCircle2 color="white" size={8} /></View>}
                    </View>
                    <Text className="text-white font-black text-xl tracking-tight mb-0.5" numberOfLines={1}>{trainer.name}</Text>
                    <Text className="text-white/60 font-bold text-[9px] uppercase tracking-[3px]">{trainer.specialty}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </FadeInView>

          {/* RECENT ACTIVITY */}
          <FadeInView delay={600} trigger={refreshing} className="mb-8">
            <SectionHeader 
              label="Your Progress" 
              title="Recent Activity" 
              onPress={() => navigation.navigate('History')} 
            />
            <View className="px-6">
              {recentActivity.length > 0 ? recentActivity.map((session) => (
                <TouchableOpacity 
                  key={session.id} 
                  onPress={() => navigation.navigate('History')} 
                  activeOpacity={0.7}
                  className="bg-white p-4 rounded-[28px] border border-gray-100 shadow-sm shadow-gray-200 mb-3 flex-row items-center"
                >
                  <View className="bg-orange-500/10 p-3 rounded-2xl mr-4">
                    <Calendar color="#FF5722" size={20} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 font-black text-lg" numberOfLines={1}>
                      {session.workout_session_exercises?.[0]?.exercises?.name || 'Workout Session'}
                      {session.workout_session_exercises?.length > 1 ? ` +${session.workout_session_exercises.length - 1}` : ''}
                    </Text>
                    <Text className="text-gray-400 font-bold text-xs">
                      {format(new Date(session.started_at), 'MMMM d • HH:mm')}
                      {session.completed_at ? ` - ${format(new Date(session.completed_at), 'HH:mm')}` : ''}
                    </Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-[#FF5722] font-black text-base">
                      {calculateTotalWeight(session).toLocaleString()}
                    </Text>
                    <Text className="text-gray-400 font-bold text-[10px] uppercase">kg</Text>
                  </View>
                  <ChevronRight color="#D1D5DB" size={16} className="ml-2" />
                </TouchableOpacity>
              )) : (
                <View className="bg-gray-50 rounded-[36px] p-10 items-center border border-dashed border-gray-200 mx-6">
                  <Dumbbell color="#D1D5DB" size={32} />
                  <Text className="text-gray-400 font-black uppercase tracking-[4px] text-[10px] mt-4">No recent activity</Text>
                </View>
              )}
            </View>
          </FadeInView>

          {!isPremium && <FadeInView delay={650} trigger={refreshing} className="px-6 mb-8"><AdBanner /></FadeInView>}

          {/* FAQ: Prominent FAQ */}
          <FadeInView delay={750} trigger={refreshing} className="px-6 mb-8">
            <View className="mb-6">
              <Text className="text-gray-400 font-black text-[9px] uppercase tracking-[5px] mb-1">Quick answers</Text>
              <View className="flex-row justify-between items-center">
                <Text className="text-2xl font-black text-gray-900 tracking-tighter">Frequently Asked</Text>
                <View className="bg-orange-50 p-3 rounded-2xl border border-orange-100"><HelpCircle color="#FF5722" size={20} /></View>
              </View>
            </View>
            <View>{faqs.map((faq) => (<FAQItem key={faq.id} item={faq} isExpanded={expandedFaq === faq.id} onToggle={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)} />))}</View>
          </FadeInView>

          {/* PREMIUM BANNER: Small Font Title */}
          {!isPremium && (
<FadeInView delay={850} trigger={refreshing} className="px-6 mb-8">
              <TouchableOpacity
                onPress={() => navigation.navigate('Premium')}
                className="bg-[#FF5722] rounded-[32px] p-8 shadow-2xl shadow-orange-500/30 active:scale-95 transition-transform"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} className="self-start px-3 py-1 rounded-full mb-3">
                      <Text className="text-white font-black text-[9px] uppercase tracking-widest">7 Days Free Trial</Text>
                    </View>
                    <Text className="text-white font-black text-2xl tracking-tighter leading-[28px]">Unlock Premium</Text>
                    <Text className="text-white/70 font-bold text-[9px] mt-2 uppercase tracking-widest">Pro Features • AI Coach</Text>
                  </View>
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} className="p-5 rounded-[24px]">
                    <Crown color="white" size={28} />
                  </View>
                </View>
              </TouchableOpacity>
            </FadeInView>
          )}

          {!isPremium && <FadeInView delay={950} trigger={refreshing} className="px-6 mb-4"><AdBanner /></FadeInView>}
          <View className="h-4" /> 
        </ScrollView>
      )}

      {/* QUICK LOG MODALS */}
      <Modal visible={showCalorieModal} animationType="fade" transparent onRequestClose={() => setShowCalorieModal(false)}>
        <View className="flex-1 bg-black/60 justify-center px-6">
          <View className="bg-white rounded-[40px] p-8 shadow-2xl">
            <View className="flex-row items-center justify-between mb-8">
              <View>
                <Text className="text-gray-900 text-2xl font-black tracking-tight">Add Fuel</Text>
                <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1">Manual Calorie Entry</Text>
              </View>
              <TouchableOpacity onPress={() => setShowCalorieModal(false)} className="bg-gray-100 p-2.5 rounded-full">
                <X color="#111" size={20} />
              </TouchableOpacity>
            </View>

            <View className="flex-row space-x-3 mb-8">
              <TextInput 
                className="flex-1 bg-gray-50 border border-gray-100 rounded-[24px] px-6 py-5 text-gray-900 font-bold text-lg"
                placeholder="0 kcal"
                placeholderTextColor="#CBD5E0"
                keyboardType="numeric"
                autoFocus
                value={manualCalories}
                onChangeText={setManualCalories}
              />
            </View>

            <TouchableOpacity 
              onPress={() => {
                handleAddCalories(manualCalories);
                setManualCalories('');
                setShowCalorieModal(false);
              }}
              className={`py-5 rounded-[28px] items-center ${manualCalories ? 'bg-orange-500 shadow-xl shadow-orange-500/30' : 'bg-gray-200'}`}
              disabled={!manualCalories}
            >
              <Text className="text-white font-black uppercase tracking-widest">Save Log</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showWaterModal} animationType="fade" transparent onRequestClose={() => setShowWaterModal(false)}>
        <View className="flex-1 bg-black/60 justify-center px-6">
          <View className="bg-white rounded-[40px] p-8 shadow-2xl">
            <View className="flex-row items-center justify-between mb-8">
              <View>
                <Text className="text-gray-900 text-2xl font-black tracking-tight">Hydration</Text>
                <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1">Quick Water Intake</Text>
              </View>
              <TouchableOpacity onPress={() => setShowWaterModal(false)} className="bg-gray-100 p-2.5 rounded-full">
                <X color="#111" size={20} />
              </TouchableOpacity>
            </View>

            <View className="flex-row space-x-3 mb-8">
              {[250, 500].map(amt => (
                <TouchableOpacity 
                  key={amt}
                  onPress={() => {
                    handleAddWater(amt);
                    setShowWaterModal(false);
                  }}
                  className="flex-1 bg-blue-50/50 py-6 rounded-[28px] items-center border border-blue-100 active:scale-95"
                >
                  <Droplet color="#3B82F6" size={24} fill="#3B82F6" className="mb-2" />
                  <Text className="text-blue-500 font-black text-xs uppercase">+{amt}ml</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View className="items-center">
              <Text className="text-gray-300 font-bold text-[9px] uppercase tracking-widest">Goal: {stats.waterGoal}ml / Day</Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* MUSIC PLAYER MODAL */}
      <Modal visible={showMusicModal} animationType="none" transparent={true} onRequestClose={() => setShowMusicModal(false)}>
        <View className="flex-1 bg-black/40 justify-end">
          <TouchableOpacity 
            activeOpacity={1} 
            className="absolute inset-0" 
            onPress={() => setShowMusicModal(false)} 
          />
          <Animated.View 
            style={{ 
              transform: [{ translateY: musicModalAnim }],
              opacity: musicModalAnim.interpolate({ inputRange: [0, 600], outputRange: [1, 0] })
            }}
            className="bg-white rounded-t-[48px] p-8 pb-10 shadow-2xl"
          >
            <View className="flex-row items-center justify-between mb-8">
              <View>
                <Text className="text-gray-900 text-3xl font-black tracking-tight">Soundtrack</Text>
                <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Your Workout Vibes</Text>
              </View>
              <TouchableOpacity onPress={() => setShowMusicModal(false)} className="bg-gray-100 p-3 rounded-2xl">
                <X color="#111" size={20} />
              </TouchableOpacity>
            </View>

            {!musicLinks[activePlatform] ? (
              <View className="space-y-6">
                <View className="flex-row bg-gray-100 p-1.5 rounded-2xl mb-2">
                  <TouchableOpacity onPress={() => setActivePlatform('spotify')} className={`flex-1 py-3 rounded-xl items-center ${activePlatform === 'spotify' ? 'bg-white shadow-sm' : ''}`}>
                    <Text className={`font-black text-[10px] uppercase tracking-widest ${activePlatform === 'spotify' ? 'text-green-600' : 'text-gray-400'}`}>Spotify</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setActivePlatform('youtube')} className={`flex-1 py-3 rounded-xl items-center ${activePlatform === 'youtube' ? 'bg-white shadow-sm' : ''}`}>
                    <Text className={`font-black text-[10px] uppercase tracking-widest ${activePlatform === 'youtube' ? 'text-red-600' : 'text-gray-400'}`}>YouTube</Text>
                  </TouchableOpacity>
                </View>

                <View className="bg-gray-50 border border-gray-100 rounded-[32px] p-6">
                  <Text className="text-gray-900 font-black text-sm mb-4">Add {activePlatform === 'spotify' ? 'Spotify' : 'YouTube'} Link</Text>
                  <TextInput 
                    className="bg-white border border-gray-100 rounded-2xl px-5 py-4 text-gray-900 font-bold"
                    placeholder="Paste URL here..."
                    placeholderTextColor="#CBD5E0"
                    value={tempMusicUrl}
                    onChangeText={setTempMusicUrl}
                    autoCapitalize="none"
                  />
                </View>
                <TouchableOpacity 
                  onPress={() => saveMusicLink(activePlatform, tempMusicUrl)}
                  className={`py-5 rounded-[28px] items-center ${tempMusicUrl ? 'bg-orange-500 shadow-xl shadow-orange-500/30' : 'bg-gray-200'}`}
                  disabled={!tempMusicUrl}
                >
                  <Text className="text-white font-black uppercase tracking-widest">Connect {activePlatform === 'spotify' ? 'Spotify' : 'YouTube'}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <View className="bg-gray-900 rounded-[40px] p-8 mb-8 shadow-2xl">
                  <View className="flex-row items-center justify-between mb-8">
                    <View className="flex-row items-center">
                      <View className={`p-2.5 rounded-2xl mr-4 ${activePlatform === 'spotify' ? 'bg-green-500' : 'bg-red-500'}`}>
                        <Music color="white" size={20} />
                      </View>
                      <View>
                        <Text className="text-white font-black text-lg tracking-tight">{activePlatform === 'spotify' ? 'Spotify Mix' : 'YouTube Playlist'}</Text>
                        <Text className="text-white/40 text-[8px] font-bold uppercase tracking-widest">Direct Link Control</Text>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => setIsPlaying(!isPlaying)} className="bg-white/10 w-12 h-12 rounded-full items-center justify-center">
                      {isPlaying ? <Pause color="white" size={20} fill="white" /> : <Play color="white" size={20} fill="white" className="ml-1" />}
                    </TouchableOpacity>
                  </View>

                  <View className="w-full h-1 bg-white/10 rounded-full mb-8">
                    <View style={{ width: `${playbackProgress * 100}%`, height: '100%', backgroundColor: activePlatform === 'spotify' ? '#22C55E' : '#EF4444', borderRadius: 100 }} />
                  </View>

                  <View className="flex-row justify-between">
                    <TouchableOpacity 
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); Linking.openURL(musicLinks[activePlatform]); }}
                      className="bg-white/10 px-6 py-4 rounded-2xl flex-row items-center"
                    >
                      <ExternalLink color="white" size={16} />
                      <Text className="text-white font-black text-[10px] uppercase ml-2 tracking-widest">Open in App</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => { 
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); 
                        const nextPlatform = activePlatform === 'spotify' ? 'youtube' : 'spotify';
                        setActivePlatform(nextPlatform);
                      }}
                      className="bg-white/5 px-4 py-4 rounded-2xl flex-row items-center"
                    >
                      <Text className="text-white/70 font-black text-[10px] uppercase tracking-widest">Switch Player</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View className="flex-row space-x-3 mb-6">
                  <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPlaybackProgress(prev => Math.max(0, prev - 0.1)); }} className="flex-1 bg-white/5 py-4 rounded-2xl items-center border border-white/5">
                    <SkipBack color="white" size={20} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setIsPlaying(!isPlaying)} className="flex-1 bg-[#FF5722] py-4 rounded-2xl items-center shadow-lg shadow-orange-500/20">
                    {isPlaying ? <Pause color="white" size={20} fill="white" /> : <Play color="white" size={20} fill="white" className="ml-1" />}
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setPlaybackProgress(prev => Math.min(1, prev + 0.1)); }} className="flex-1 bg-white/5 py-4 rounded-2xl items-center border border-white/5">
                    <SkipForward color="white" size={20} />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity 
                  onPress={() => { 
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); 
                    const newLinks = { ...musicLinks, [activePlatform]: '' };
                    setMusicLinks(newLinks);
                    AsyncStorage.setItem('gymgo_music_links', JSON.stringify(newLinks));
                  }}
                  className="items-center"
                >
                  <Text className="text-gray-400 font-black text-[9px] uppercase tracking-[3px]">Reset {activePlatform} Link</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

