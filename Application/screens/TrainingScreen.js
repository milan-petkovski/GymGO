import React, { useRef, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  Animated, 
  Easing, 
  ActivityIndicator, 
  Modal, 
  Linking, 
  Dimensions,
  RefreshControl,
  StyleSheet,
  TextInput
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../supabaseClient';
import { 
  Plus, 
  ChevronRight, 
  Sparkles,
  Zap,
  Crown,
  Headset,
  X,
  Lock,
  CheckCircle2,
  ExternalLink,
  Users,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  ArrowRight,
  Music,
  Target,
  Dumbbell,
  ArrowUpRight,
  Link,
  Flame,
  Utensils,
  Coffee,
  Pizza,
  Apple,
  Beef,
  Cookie,
  PlusCircle,
  TrendingDown,
  Info,
  Droplet,
  PieChart,
  Activity,
  Heart,
  TrendingUp,
  BarChart2,
  ShieldCheck
} from 'lucide-react-native';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { startOfDay, format, differenceInYears } from 'date-fns';
import Svg, { Circle } from 'react-native-svg';

const { width } = Dimensions.get('window');

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

function PremiumFeature({ icon, text, subtitle }) {
  return (
    <View className="flex-row items-center bg-gray-50/50 px-4 py-4 rounded-[24px] border border-gray-100 mb-3">
      <View className="bg-orange-500/10 p-3 rounded-2xl">{icon}</View>
      <View className="ml-4 flex-1">
        <Text className="text-gray-900 font-black text-[13px] uppercase tracking-wider">{text}</Text>
        {subtitle && <Text className="text-gray-400 font-bold text-[9px] uppercase tracking-widest mt-0.5">{subtitle}</Text>}
      </View>
    </View>
  );
}

export default function TrainingScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [isPremium, setIsPremium] = useState(false);
  const [stats, setStats] = useState({ 
    workouts: 0, 
    minutes: 0, 
    todayCalories: 0, 
    calorieGoal: 2000, 
    todayIntake: 0,
    waterIntake: 0,
    waterGoal: 2500,
    protein: 0,
    carbs: 0,
    fats: 0,
    macroGoals: { protein: 180, carbs: 250, fats: 70 }
  });
  const [meals, setMeals] = useState([]);
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [foodData, setFoodData] = useState({ name: '', calories: '', type: 'Lunch', protein: '', carbs: '', fats: '' });
  const foodSlideAnim = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    if (showFoodModal) {
      foodSlideAnim.setValue(600);
      Animated.spring(foodSlideAnim, { toValue: 0, friction: 9, tension: 35, useNativeDriver: true }).start();
    }
  }, [showFoodModal]);
  const [musicLinks, setMusicLinks] = useState({ spotify: '', youtube: '' });
  const [activePlatform, setActivePlatform] = useState('spotify');
  const [tempMusicUrl, setTempMusicUrl] = useState('');
  const [showMusicModal, setShowMusicModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
      const musicModalAnim = useRef(new Animated.Value(600)).current;

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

  const fetchData = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = startOfDay(new Date());

      // SYNCED CALORIE GOAL CALCULATION (Matches HomeScreen.js)
      const calculateDailyGoal = (p, latestW) => {
        const weight = latestW || p.weight_kg || 80;
        const height = p.height_cm || 180;
        const dob = p.date_of_birth ? new Date(p.date_of_birth) : new Date(1995, 0, 1);
        const age = differenceInYears(new Date(), dob) || 25;
        const gender = p.gender || 'male';
        const activityLevel = p.activity_level || 'moderate';

        let bmr = (10 * weight) + (6.25 * height) - (5 * age);
        if (gender === 'male') bmr += 5;
        else bmr -= 161;

        const multipliers = {
          sedentary: 1.2,
          light: 1.375,
          moderate: 1.55,
          active: 1.725,
          very_active: 1.9
        };
        const multiplier = multipliers[activityLevel] || 1.55;
        return Math.round(bmr * multiplier);
      };

      const [profileRes, measurementRes, sessionsRes, templatesRes, nutritionRes, hydrationRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('body_measurements').select('weight_kg').eq('user_id', user.id).order('measured_at', { ascending: false }).limit(1),
        supabase.from('workout_sessions').select('id, duration_seconds, started_at, calories_burned').eq('user_id', user.id),
        supabase.from('workouts').select('*').eq('is_template', true).limit(1),
        supabase.from('nutrition_logs').select('*').eq('user_id', user.id).gte('logged_at', today.toISOString()),
        supabase.from('hydration_logs').select('*').eq('user_id', user.id).gte('logged_at', today.toISOString())
      ]);

      const profile = profileRes.data;
      const latestWeight = measurementRes.data?.[0]?.weight_kg || profile?.weight_kg;
      const calorieGoal = profile ? calculateDailyGoal(profile, latestWeight) : 2000;
      const waterGoal = latestWeight ? Math.round(latestWeight * 35) : 2500;

      if (profile) {
        setIsPremium(profile.is_premium);
      }
      
      const sessions = sessionsRes.data || [];
      const totalMins = Math.floor(sessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0) / 60);

      // Calculate today's calories from sessions (Burned)
      const todaySessions = sessions.filter(s => new Date(s.started_at) >= today);
      const todayCaloriesBurned = todaySessions.reduce((acc, s) => acc + (s.calories_burned || 0), 0);

      // Macro Goals based on synced TDEE
      const proteinTarget = latestWeight ? Math.round(latestWeight * 2) : 180;
      const fatTarget = Math.round((calorieGoal * 0.25) / 9);
      const carbTarget = Math.round((calorieGoal - (proteinTarget * 4) - (fatTarget * 9)) / 4);

      // Process Nutrition
      const nutritionLogs = nutritionRes.data || [];
      const mealsList = nutritionLogs.map(log => ({
        id: log.id,
        name: log.name,
        type: log.type || 'Lunch',
        calories: log.calories,
        protein: log.protein,
        carbs: log.carbs,
        fats: log.fats,
        time: format(new Date(log.logged_at), 'HH:mm')
      }));

      const totalIntake = nutritionLogs.reduce((acc, log) => acc + (log.calories || 0), 0);
      const totalProtein = Math.round(nutritionLogs.reduce((acc, log) => acc + (log.protein || 0), 0));
      const totalCarbs = Math.round(nutritionLogs.reduce((acc, log) => acc + (log.carbs || 0), 0));
      const totalFats = Math.round(nutritionLogs.reduce((acc, log) => acc + (log.fats || 0), 0));

      // Process Hydration
      const hydrationLogs = hydrationRes.data || [];
      const totalWater = hydrationLogs.reduce((acc, log) => acc + (log.amount_ml || 0), 0);

      setTemplates(templatesRes.data || []);
      setMeals(mealsList);
      setStats({ 
        workouts: sessions.length, 
        minutes: totalMins, 
        todayCalories: todayCaloriesBurned,
        todayIntake: totalIntake,
        waterIntake: totalWater,
        waterGoal: waterGoal,
        protein: totalProtein,
        carbs: totalCarbs,
        fats: totalFats,
        macroGoals: { protein: proteinTarget, carbs: carbTarget, fats: fatTarget },
        calorieGoal: calorieGoal 
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };
 
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


  useFocusEffect(
    useCallback(() => {
      fetchData(true);
    }, [])
  );



  const onRefresh = () => {
    setRefreshing(true);
    setLoading(true);
    fetchData(false);
  };

  const handleAIStart = () => {
    if (!isPremium) {
      navigation.navigate('Premium');
      return;
    }
    const dailyTemplate = templates[0];
    navigation.navigate('WorkoutPlayer', { templateId: dailyTemplate?.id, workoutName: dailyTemplate?.name || 'AI Coach Training', mode: 'guided' });
  };

  const handleAddCalories = async () => {
    if (!manualCalories) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const caloriesToAdd = parseInt(manualCalories);
      if (isNaN(caloriesToAdd)) return;

      // Log manual calories as a quick session or just update a log table
      // For now, we'll create a minimal 'completed' session to represent the calorie entry
      const { error } = await supabase.from('workout_sessions').insert({
        user_id: user.id,
        workout_id: null,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        duration_seconds: 0,
        status: 'completed',
        notes: 'Manual calorie entry',
        calories_burned: caloriesToAdd
      });

      if (error) throw error;

      setStats(prev => ({ ...prev, todayCalories: prev.todayCalories + caloriesToAdd }));
      setManualCalories('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddMeal = async () => {
    if (!foodData.name || !foodData.calories) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const calories = parseInt(foodData.calories);
      const prot = parseFloat(foodData.protein) || 0;
      const carb = parseFloat(foodData.carbs) || 0;
      const fat = parseFloat(foodData.fats) || 0;

      const { data, error } = await supabase.from('nutrition_logs').insert({
        user_id: user.id,
        name: foodData.name,
        type: foodData.type,
        calories: calories,
        protein: prot,
        carbs: carb,
        fats: fat
      }).select().single();

      if (error) throw error;

      const newMeal = {
        id: data.id,
        name: foodData.name,
        type: foodData.type,
        calories: calories,
        protein: prot,
        carbs: carb,
        fats: fat,
        time: format(new Date(), 'HH:mm')
      };

      setMeals([newMeal, ...meals]);
      setStats(prev => ({ 
        ...prev, 
        todayIntake: prev.todayIntake + calories,
        protein: Math.round(prev.protein + prot),
        carbs: Math.round(prev.carbs + carb),
        fats: Math.round(prev.fats + fat)
      }));
      setFoodData({ name: '', calories: '', type: 'Lunch', protein: '', carbs: '', fats: '' });
      setShowFoodModal(false);
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

  const getMealIcon = (type) => {
    switch (type) {
      case 'Breakfast': return <Coffee color="#FF5722" size={18} />;
      case 'Lunch': return <Pizza color="#FF5722" size={18} />;
      case 'Dinner': return <Beef color="#FF5722" size={18} />;
      default: return <Cookie color="#FF5722" size={18} />;
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="px-6 py-4 flex-row items-center justify-between bg-white z-[100]">
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
        <View className="flex-1 items-center justify-center bg-white z-50">
          <View className="items-center justify-center">
            <ActivityIndicator color="#FF5722" size="large" />
            <Text className="text-gray-400 font-bold mt-4 uppercase text-[10px] tracking-[3px]">LOADING WORKOUTS...</Text>
          </View>
          {!isPremium && (
            <View className="absolute bottom-10 w-full px-10">
              <AdBanner />
            </View>
          )}
        </View>
      ) : (
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 0 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF5722" />}>


<FadeInView delay={50} trigger={refreshing} className="px-6 pt-6 pb-2">
            <Text className="text-2xl font-black text-gray-900 leading-none">Workouts</Text>
          </FadeInView>

          <View className="px-6 mt-6 space-y-4">
            <FadeInView delay={100} trigger={refreshing}>
              <TouchableOpacity onPress={() => navigation.navigate('WorkoutPlayer', { mode: 'standard', workoutName: 'New Workout' })} className="bg-white border border-gray-100 rounded-[32px] p-6 flex-row items-center shadow-sm">
                <View className="bg-orange-500 w-12 h-12 rounded-2xl items-center justify-center mr-5 shadow-md shadow-orange-500/20"><Plus color="white" size={24} strokeWidth={3} /></View>
                <View><Text className="text-gray-900 text-lg font-black">New Exercise</Text><Text className="text-gray-400 font-bold text-[9px] uppercase tracking-widest mt-0.5">Quick logging mode</Text></View>
                <View className="flex-1 items-end"><ChevronRight color="#D1D5DB" size={18} /></View>
              </TouchableOpacity>
            </FadeInView>

            <FadeInView delay={150} trigger={refreshing}>
              <TouchableOpacity onPress={handleAIStart} className="bg-gray-900 rounded-[32px] p-6 shadow-xl shadow-gray-900/20 relative overflow-hidden">
                <View style={{ backgroundColor: 'rgba(255, 87, 34, 0.1)' }} className="absolute -top-10 -right-10 w-32 h-32 rounded-full" />
                <View className="flex-row items-center mb-4 justify-between">
                  <View className="bg-[#FF5722] w-10 h-10 rounded-xl items-center justify-center"><Sparkles color="white" size={18} /></View>
                  {!isPremium && <View className="bg-white/10 px-3 py-1 rounded-lg flex-row items-center"><Lock color="white" size={10} /><Text className="text-white font-black text-[8px] ml-2 uppercase tracking-widest">Premium</Text></View>}
                </View>
                <View><Text className="text-white text-lg font-black">AI Coach Premium</Text><Text className="text-white/40 font-bold text-[10px] mt-1 leading-4">Personalized routines & guidance.</Text></View>
              </TouchableOpacity>
            </FadeInView>
          </View>

          {!isPremium && <FadeInView delay={200} trigger={refreshing} className="px-6 mt-6"><AdBanner extraClass="my-0" /></FadeInView>}

          <FadeInView delay={250} trigger={refreshing} className="px-6 pt-10 pb-4">
            <Text className="text-2xl font-black text-gray-900 leading-none">Calories</Text>
          </FadeInView>

          {/* COMPACT BIOMETRICS DASHBOARD */}
          <FadeInView delay={300} trigger={refreshing} className="px-6 mb-8">
            <View className="bg-gray-900 rounded-[40px] p-6 shadow-xl shadow-gray-900/30 border border-white/5">
              {/* ULTRA MODERN PERFORMANCE HUB */}
              <View className="flex-row items-center justify-between mb-8">
                <View>
                  <Text className="text-[#FF5722] text-[8px] font-black uppercase tracking-[5px] mb-1">Live Metrics</Text>
                  <Text className="text-white text-2xl font-black tracking-tight">Fuel & Energy</Text>
                </View>
                <View className="bg-white/5 p-3 rounded-2xl border border-white/10">
                  <PieChart color="white" size={18} />
                </View>
              </View>

              {/* RE-ARCHITECTED PERFORMANCE HUB - FOCUSED LAYOUT */}
              <View className="items-center mb-10">
                <Text className="text-[#FF5722] text-[10px] font-black uppercase tracking-[6px] mb-8">Daily Energy Focus</Text>
                
                {/* CALORIE HERO RING */}
                <View className="relative items-center justify-center mb-6">
                  <Svg width={180} height={180} viewBox="0 0 180 180" style={{ transform: [{ rotate: '-90deg' }] }}>
                    <Circle cx="90" cy="90" r="82" stroke="rgba(255,255,255,0.05)" strokeWidth="10" fill="none" />
                    <Circle
                      cx="90" cy="90" r="82"
                      stroke={stats.todayIntake >= stats.calorieGoal ? '#22C55E' : '#FF5722'}
                      strokeWidth="10" fill="none"
                      strokeDasharray={`${2 * Math.PI * 82}`}
                      strokeDashoffset={`${2 * Math.PI * 82 * (1 - Math.min(1, stats.todayIntake / stats.calorieGoal))}`}
                      strokeLinecap="round"
                    />
                  </Svg>
                  <View className="absolute inset-0 items-center justify-center">
                    {stats.todayIntake >= stats.calorieGoal ? (
                      <View className="items-center">
                        <Sparkles color="#22C55E" size={32} fill="#22C55E" />
                        <Text className="text-white text-[10px] font-black uppercase tracking-[4px] mt-2">Goal Hit</Text>
                      </View>
                    ) : (
                      <View className="items-center">
                        <Text className="text-white text-4xl font-black tracking-tighter">{stats.todayIntake}</Text>
                        <Text className="text-white/20 text-[10px] font-bold uppercase tracking-widest mt-1">/ {stats.calorieGoal} kcal</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* REMAINING STATUS - ENGLISH & HIGH CONTRAST */}
                <View className="bg-white/10 px-8 py-3 rounded-full border border-white/10">
                   <Text className="text-white font-black text-sm uppercase tracking-widest">
                     {stats.todayIntake >= stats.calorieGoal 
                       ? "TARGET ACHIEVED" 
                       : `${stats.calorieGoal - stats.todayIntake} KCAL REMAINING`}
                   </Text>
                </View>
              </View>

              {/* COMPACT MACRO GRID - SINGLE ROW */}
              <View className="flex-row items-center justify-between space-x-1 mb-2">
                {[
                  { label: 'PROTEIN', val: stats.protein, goal: stats.macroGoals.protein, color: 'bg-orange-500' },
                  { label: 'CARBS', val: stats.carbs, goal: stats.macroGoals.carbs, color: 'bg-green-500' },
                  { label: 'FATS', val: stats.fats, goal: stats.macroGoals.fats, color: 'bg-blue-500' }
                ].map((m, idx) => (
                  <View key={idx} className="flex-1 bg-white/5 py-4 px-3 rounded-[24px] items-center">
                    <Text numberOfLines={1} className="text-white/40 text-[7px] font-black uppercase tracking-[2px] mb-2">{m.label}</Text>
                    <Text numberOfLines={1} className="text-white font-black text-base mb-3">{m.val}g</Text>
                    <View className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <View 
                        style={{ width: `${Math.min(100, (m.val / m.goal) * 100)}%` }}
                        className={`h-full ${m.color} rounded-full`} 
                      />
                    </View>
                    <Text numberOfLines={1} className="text-white/20 text-[6px] font-bold mt-1.5 uppercase">Goal: {m.goal}g</Text>
                  </View>
                ))}
              </View>

              {/* WATER SYSTEM - COMPACT */}
              <View className="bg-blue-500/10 border border-blue-500/20 rounded-[32px] p-6 mb-6">
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center">
                    <Droplet color="#3B82F6" size={20} fill="#3B82F6" />
                    <View className="ml-4">
                      <Text className="text-white font-black text-base tracking-tight">Hydration</Text>
                      <Text className="text-white/40 text-[9px] font-black uppercase tracking-widest mt-0.5">{stats.waterIntake} / {stats.waterGoal} ml</Text>
                    </View>
                  </View>
                  <Text className="text-white text-lg font-black">{Math.round((stats.waterIntake / stats.waterGoal) * 100)}%</Text>
                </View>
                
                {/* WATER PROGRESS BAR */}
                <View className="h-2 w-full bg-blue-500/10 rounded-full mb-6 overflow-hidden">
                  <View 
                    style={{ width: `${Math.min(100, (stats.waterIntake / stats.waterGoal) * 100)}%` }} 
                    className="h-full bg-blue-500 rounded-full shadow-lg shadow-blue-500/50" 
                  />
                </View>

                <View className="flex-row space-x-3">
                  {[250, 500].map(amt => (
                    <TouchableOpacity 
                      key={amt}
                      onPress={() => handleAddWater(amt)}
                      className="flex-1 bg-blue-500/20 py-4 rounded-2xl items-center border border-blue-500/10 active:scale-95"
                    >
                      <Text className="text-blue-400 font-black text-[10px] uppercase tracking-widest">+{amt}ml</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity 
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowFoodModal(true); }}
                className="bg-white py-4 rounded-[24px] items-center flex-row justify-center shadow-lg"
              >
                <PlusCircle color="#111" size={18} strokeWidth={3} />
                <Text className="text-gray-900 font-black uppercase tracking-[2px] ml-3 text-[10px]">New Fuel Log</Text>
              </TouchableOpacity>
            </View>
          </FadeInView>

          {!isPremium && <FadeInView delay={350} trigger={refreshing} className="px-6 mb-8"><AdBanner extraClass="my-0" /></FadeInView>}

          {/* FUEL LOG TIMELINE */}
          <FadeInView delay={400} trigger={refreshing} className="px-6 mb-12">
            <View className="flex-row items-center justify-between mb-6">
              <View>
                <Text className="text-gray-900 text-xl font-black tracking-tight">Timeline</Text>
                <Text className="text-gray-400 text-[8px] font-black uppercase tracking-widest mt-0.5">Today's Activity</Text>
              </View>
              <View className="bg-gray-100 px-3 py-1 rounded-xl"><Text className="text-gray-500 font-black text-[9px] uppercase tracking-widest">{meals.length} ENTRIES</Text></View>
            </View>
            
            {meals.length === 0 ? (
              <View className="bg-gray-50 border border-dashed border-gray-200 rounded-[32px] p-10 items-center justify-center">
                <View className="bg-white p-4 rounded-2xl shadow-sm mb-4"><Utensils color="#D1D5DB" size={24} /></View>
                <Text className="text-gray-400 font-bold text-center text-xs tracking-tight">No activity logged today.</Text>
              </View>
            ) : (
              <View className="space-y-3">
                {meals.map((meal) => (
                  <View key={meal.id} className="bg-white border border-gray-100 rounded-[28px] p-4 flex-row items-center shadow-sm">
                    <View className="bg-orange-50 p-3 rounded-xl mr-4">{getMealIcon(meal.type)}</View>
                    <View className="flex-1">
                      <Text className="text-gray-900 font-black text-[14px] tracking-tight">{meal.name}</Text>
                      <Text className="text-gray-400 font-bold text-[8px] uppercase tracking-widest mt-0.5">{meal.time}</Text>
                    </View>
                    <View className="items-end bg-gray-50 px-3 py-2 rounded-xl">
                      <Text className="text-gray-900 font-black text-sm">+{meal.calories}</Text>
                      <Text className="text-gray-400 font-bold text-[7px] uppercase tracking-widest">KCAL</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </FadeInView>
          <View className="h-4" />
        </ScrollView>
      )}

      
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

      {/* ADVANCED FOOD MODAL */}
      <Modal visible={showFoodModal} animationType="none" transparent={true} onRequestClose={() => setShowFoodModal(false)}>
        <View className="flex-1 bg-black/40 justify-end">
          <TouchableOpacity activeOpacity={1} className="absolute inset-0" onPress={() => setShowFoodModal(false)} />
          <Animated.View 
            style={{ 
              transform: [{ translateY: foodSlideAnim }],
              opacity: foodSlideAnim.interpolate({ inputRange: [0, 600], outputRange: [1, 0] }),
              height: '85%'
            }}
            className="bg-white rounded-t-[48px] p-8 pb-10 shadow-2xl"
          >
            <View className="flex-row items-center justify-between mb-8">
              <View>
                <Text className="text-gray-900 text-3xl font-black tracking-tight">Fuel Log</Text>
                <Text className="text-gray-400 text-[10px] font-black uppercase tracking-widest mt-1">What's the vibe today?</Text>
              </View>
              <TouchableOpacity onPress={() => setShowFoodModal(false)} className="bg-gray-100 p-3 rounded-2xl">
                <X color="#111" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
              <View className="space-y-6 pb-10">
                <View className="flex-row bg-gray-100 p-2 rounded-2xl mb-4">
                  {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(type => (
                    <TouchableOpacity key={type} onPress={() => setFoodData({ ...foodData, type })} className={`flex-1 py-3.5 rounded-xl items-center ${foodData.type === type ? 'bg-white shadow-sm' : ''}`}>
                      <Text className={`font-black text-[9px] uppercase tracking-widest ${foodData.type === type ? 'text-orange-500' : 'text-gray-400'}`}>{type}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View className="space-y-4">
                  <View className="bg-gray-50 border border-gray-100 rounded-[32px] p-6">
                    <Text className="text-gray-900 font-black text-sm mb-4">Meal Name</Text>
                    <TextInput 
                      className="bg-white border border-gray-100 rounded-2xl px-6 py-4 text-gray-900 font-bold"
                      placeholder="e.g. Avocado Toast"
                      placeholderTextColor="#CBD5E0"
                      value={foodData.name}
                      onChangeText={(val) => setFoodData({ ...foodData, name: val })}
                    />
                  </View>

                  <View className="bg-gray-50 border border-gray-100 rounded-[32px] p-6">
                    <Text className="text-gray-900 font-black text-sm mb-4">Calories</Text>
                    <TextInput 
                      className="bg-white border border-gray-100 rounded-2xl px-5 py-4 text-gray-900 font-bold"
                      placeholder="0"
                      keyboardType="numeric"
                      value={foodData.calories}
                      onChangeText={(val) => setFoodData({ ...foodData, calories: val })}
                    />
                  </View>

                  <View className="bg-gray-50 border border-gray-100 rounded-[32px] p-8">
                    <Text className="text-gray-900 font-black text-base mb-6">Macronutrients (g)</Text>
                    <View className="flex-row space-x-3">
                      {[
                        { label: 'Prot', key: 'protein', color: 'bg-orange-500' },
                        { label: 'Carb', key: 'carbs', color: 'bg-green-500' },
                        { label: 'Fat', key: 'fats', color: 'bg-blue-500' }
                      ].map(macro => (
                        <View key={macro.key} className="flex-1">
                          <View className={`${macro.color} w-8 h-1 rounded-full mb-3`} />
                          <Text className="text-gray-400 font-black text-[9px] uppercase tracking-widest mb-2">{macro.label}</Text>
                          <TextInput 
                            className="bg-white border border-gray-100 rounded-xl px-3 py-3 text-gray-900 font-black text-center"
                            placeholder="0"
                            keyboardType="numeric"
                            value={foodData[macro.key]}
                            onChangeText={(val) => setFoodData({ ...foodData, [macro.key]: val })}
                          />
                        </View>
                      ))}
                    </View>
                  </View>
                </View>

                <TouchableOpacity 
                  onPress={handleAddMeal}
                  className="bg-gray-900 py-6 rounded-[32px] items-center mt-6 shadow-xl shadow-gray-900/20"
                >
                  <Text className="text-white font-black uppercase tracking-[3px] text-xs">Log Biometric Fuel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
