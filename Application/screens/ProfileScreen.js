import React, { useRef, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Animated, ActivityIndicator, Modal, Linking, TextInput, RefreshControl, Easing, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Target, Crown, Zap, Activity, Heart, LogOut, TrendingUp, CheckCircle2, X, Sparkles, Flame, ChevronRight, Scale, MoveVertical, ExternalLink, Edit3, Save, AlertCircle, User, Users, Play, ArrowUpRight, Music, Pause, SkipBack, SkipForward, ShieldCheck } from 'lucide-react-native';
import {
  aggregateRecord,
  getSdkStatus,
  initialize,
  requestPermission,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';
const AdBanner = ({ extraClass = '' }) => {
  // ADMOB NEUTRALIZED FOR EXPO GO STABILITY
  // Uncomment the lines below when building for production/dev-build
  /*
  try {
    const { BannerAd, BannerAdSize, TestIds } = require('react-native-google-mobile-ads');
    const AD_UNIT_ID = __DEV__ ? TestIds.BANNER : 'ca-app-pub-1498623250201325/1418992672';

    return (
      <View className={`items-center justify-center my-4 ${extraClass}`}>
        <BannerAd
          unitId={AD_UNIT_ID}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        />
      </View>
    );
  } catch (e) {
    // Fallback to placeholder
  }
  */

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

export default function ProfileScreen({ navigation }) {
  const scrollRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
    const [musicLinks, setMusicLinks] = useState({ spotify: '', youtube: '' });
  const [activePlatform, setActivePlatform] = useState('spotify');
  const [tempMusicUrl, setTempMusicUrl] = useState('');
  const [showMusicModal, setShowMusicModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [stats, setStats] = useState({ workouts: 0, totalWeight: 0, streak: 0 });
  const [trainers, setTrainers] = useState([]);
  const [trainersLoading, setTrainersLoading] = useState(true);
  const [trainersError, setTrainersError] = useState(false);
  const [myPrograms, setMyPrograms] = useState([]);
  const [programsLoading, setProgramsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const toastOpacity = useRef(new Animated.Value(0)).current;
    const editSlideAnim = useRef(new Animated.Value(600)).current;
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
  const [healthConnectConnecting, setHealthConnectConnecting] = useState(false);
  const [healthConnectAvailable, setHealthConnectAvailable] = useState(true);
  const [healthConnectData, setHealthConnectData] = useState({
    daily_steps: 0,
    daily_calories: 0,
    daily_distance: 0
  });

  const [editData, setEditData] = useState({
    first_name: '',
    last_name: '',
    height_cm: '',
    weight_kg: '',
    avatar_url: ''
  });

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

  const showToast = (message, type = 'success') => {
    setToast({ visible: true, message, type });
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      Animated.delay(2500),
      Animated.timing(toastOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => setToast({ visible: false, message: '', type: 'success' }));
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);
      setIsPremium(profileData.is_premium || profileData.role === 'trainer' || profileData.role === 'admin');
      setEditData({
        first_name: profileData.first_name || '',
        last_name: profileData.last_name || '',
        height_cm: profileData.height_cm?.toString() || '',
        weight_kg: profileData.weight_kg?.toString() || '',
        avatar_url: profileData.avatar_url || ''
      });

      // Set Health Connect data if available
      if (profileData?.google_fit_connected) {
        setHealthConnectData({
          daily_steps: profileData?.daily_steps || 0,
          daily_calories: profileData?.daily_calories || 0,
          daily_distance: profileData?.daily_distance || 0
        });
      }

      const { data: sessions } = await supabase
        .from('workout_sessions')
        .select(`id, started_at, workout_session_exercises(exercise_sets(weight_kg, reps_completed))`)
        .eq('user_id', user.id);

      if (sessions) {
        let total = 0;
        sessions.forEach(s => {
          if (s.workout_session_exercises) {
            s.workout_session_exercises.forEach(e => {
              if (e.exercise_sets) {
                e.exercise_sets.forEach(set => {
                  total += (set.weight_kg || 0) * (set.reps_completed || 0);
                });
              }
            });
          }
        });

        // Calculate real streak
        const calculateStreak = (sessionsData) => {
          if (!sessionsData || sessionsData.length === 0) return 0;

          // Get unique local dates (YYYY-MM-DD)
          const dates = [...new Set(sessionsData.map(s => {
            if (!s.started_at) return null;
            const d = new Date(s.started_at);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
          }))].filter(Boolean).sort().reverse();

          if (dates.length === 0) return 0;

          const now = new Date();
          const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

          const yesterdayDate = new Date();
          yesterdayDate.setDate(yesterdayDate.getDate() - 1);
          const yesterday = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;

          // If latest session is not today or yesterday, streak is broken
          if (dates[0] !== today && dates[0] !== yesterday) return 0;

          let streak = 1;
          for (let i = 0; i < dates.length - 1; i++) {
            const current = new Date(dates[i]);
            const next = new Date(dates[i + 1]);

            // Check if 'next' is exactly 1 day before 'current'
            const diffTime = Math.abs(current - next);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
              streak++;
            } else {
              break;
            }
          }
          return streak;
        };

        setStats({
          workouts: sessions?.length || 0,
          totalWeight: total,
          streak: calculateStreak(sessions || [])
        });
      }

      // Fetch dynamic trainers from real database tables
      const fetchTrainers = async () => {
        try {
          setTrainersLoading(true);
          setTrainersError(false);

          // 1. Fetch from bookings
          const { data: bookingsData } = await supabase
            .from('bookings')
            .select(`
              trainer_id,
              trainer_profiles (
                specializations,
                profiles (first_name, last_name, avatar_url)
              )
            `)
            .eq('user_id', user.id)
            .not('trainer_id', 'is', null);

          // 2. Fetch from sessions
          const { data: sessionsData } = await supabase
            .from('workout_sessions')
            .select(`
              trainer_id,
              trainer_profiles (
                specializations,
                profiles (first_name, last_name, avatar_url)
              )
            `)
            .eq('user_id', user.id)
            .eq('is_pt_session', true)
            .not('trainer_id', 'is', null);

          // 3. Fetch from purchased programs
          const { data: purchaseData } = await supabase
            .from('user_purchases')
            .select(`
              program_id,
              training_programs (
                trainer_id,
                trainer_profiles (
                  specializations,
                  profiles (first_name, last_name, avatar_url)
                )
              )
            `)
            .eq('user_id', user.id);

          // Merge and unique-ify
          const uniqueTrainers = [];
          const seenIds = new Set();

          // Helper to process raw items
          const processItem = (trainerId, trainerProfile) => {
            if (trainerId && trainerProfile && !seenIds.has(trainerId)) {
              seenIds.add(trainerId);
              uniqueTrainers.push({
                id: trainerId,
                name: `${trainerProfile.profiles?.first_name || 'Trainer'} ${trainerProfile.profiles?.last_name || ''}`,
                specialty: trainerProfile.specializations?.[0] || 'Fitness Specialist',
                image: trainerProfile.profiles?.avatar_url || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80',
                status: 'Active'
              });
            }
          };

          // Process all sources
          bookingsData?.forEach(item => processItem(item.trainer_id, item.trainer_profiles));
          sessionsData?.forEach(item => processItem(item.trainer_id, item.trainer_profiles));
          purchaseData?.forEach(item => {
            const tp = item.training_programs?.trainer_profiles;
            const tid = item.training_programs?.trainer_id;
            if (tid && tp) processItem(tid, tp);
          });

          setTrainers(uniqueTrainers);
        } catch (e) {
          console.error('Error fetching trainers:', e);
          setTrainersError(true);
        } finally {
          setTrainersLoading(false);
        }
      };

      fetchTrainers();
      
      // 3. Fetch My Programs
      const fetchMyPrograms = async () => {
        try {
          setProgramsLoading(true);
          
          // Fetch purchases
          const { data: purchaseData } = await supabase
            .from('user_purchases')
            .select('program_id')
            .eq('user_id', user.id);
          
          const purchasedIds = (purchaseData || []).map(p => p.program_id);
          
          // Fetch program details
          const { data: programsData } = await supabase
            .from('training_programs')
            .select('*, trainer_profiles(profiles(first_name, last_name))')
            .or(`id.in.(${purchasedIds.length > 0 ? purchasedIds.join(',') : '00000000-0000-0000-0000-000000000000'}),is_premium.eq.false`);
          
          setMyPrograms(programsData || []);
        } catch (e) {
          console.error('Error fetching programs:', e);
        } finally {
          setProgramsLoading(false);
        }
      };
      fetchMyPrograms();

    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const fetchHealthConnectMetrics = async (promptForPermission = false) => {
    if (Platform.OS !== 'android') {
      setHealthConnectAvailable(false);
      throw new Error('Health Connect is available only on Android');
    }

    try {
      const sdkStatus = await getSdkStatus();
      if (sdkStatus !== SdkAvailabilityStatus.SDK_AVAILABLE && sdkStatus !== SdkAvailabilityStatus.SDK_INSTALLED) {
        setHealthConnectAvailable(false);
        throw new Error('Health Connect is not ready on this device');
      }

      const isInitialized = await initialize();
      if (!isInitialized) {
        setHealthConnectAvailable(false);
        throw new Error('Unable to initialize Health Connect');
      }

      if (promptForPermission) {
        await requestPermission([
          { accessType: 'read', recordType: 'Steps' },
          { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
          { accessType: 'read', recordType: 'Distance' },
        ]);
      }

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

      return {
        daily_steps: stepsResult?.COUNT_TOTAL || 0,
        daily_calories: Math.round(caloriesResult?.ACTIVE_CALORIES_TOTAL?.inKilocalories || 0),
        daily_distance: Number((distanceResult?.DISTANCE?.inKilometers || 0).toFixed(2)),
      };
    } catch (error) {
      setHealthConnectAvailable(false);
      return null;
    }
  };

  const syncHealthConnectData = async (promptForPermission = false) => {
    const dailyData = await fetchHealthConnectMetrics(promptForPermission);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('user_integrations')
        .upsert({
          user_id: user.id,
          provider: 'health_connect',
          connected_at: new Date().toISOString(),
          is_active: true,
          last_sync_at: new Date().toISOString(),
          metadata: dailyData,
        });

      await supabase
        .from('profiles')
        .update({
          google_fit_connected: true,
          daily_steps: dailyData.daily_steps,
          daily_calories: dailyData.daily_calories,
          daily_distance: dailyData.daily_distance,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
    }

    setHealthConnectData(dailyData);
    setProfile(prev => prev ? ({
      ...prev,
      google_fit_connected: true,
      daily_steps: dailyData.daily_steps,
      daily_calories: dailyData.daily_calories,
      daily_distance: dailyData.daily_distance,
    }) : prev);

    return dailyData;
  };

  const handleHealthConnectConnect = async () => {
    try {
      setHealthConnectConnecting(true);
      await syncHealthConnectData(true);
      showToast('✓ Health Connect Connected!', 'success');
    } catch (error) {
      // Silently fail
    } finally {
      setHealthConnectConnecting(false);
    }
  };

  useEffect(() => {
    if (profile?.google_fit_connected) {
      syncHealthConnectData(false).catch((error) => {
        console.error('Error refreshing Health Connect data:', error);
      });
    }
  }, [profile?.google_fit_connected]);

  useEffect(() => {
    fetchProfile();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchProfile();
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  const lastRefresh = useRef(0);
  const onRefresh = () => {
    if (loading || refreshing) return;
    setRefreshKey(prev => prev + 1);
    fetchProfile();
  };

  const handleUpdateProfile = async () => {
    try {
      setUpdating(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const updates = {
        first_name: editData.first_name,
        last_name: editData.last_name,
        height_cm: parseFloat(editData.height_cm) || null,
        weight_kg: parseFloat(editData.weight_kg) || null,
        avatar_url: editData.avatar_url,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('Profile updated successfully!', 'success');
      setShowEditModal(false);
      setRefreshKey(prev => prev + 1);
      fetchProfile();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleUpgrade = async () => {
    Linking.openURL('https://gogym.milanwebportal.com/premium');
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setShowSignOutModal(false);
  };



  useEffect(() => {
    if (showEditModal) {
      editSlideAnim.setValue(500);
      Animated.timing(editSlideAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }).start();
    }
  }, [showEditModal, editSlideAnim]);



  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* HEADER */}
      <View className="px-6 py-4 flex-row items-center justify-between z-[100] bg-white">
        <Image source={require('../assets/4.png')} style={{ width: 130, height: 35, resizeMode: 'contain' }} />
        <View className="flex-row items-center space-x-2">
          <TouchableOpacity 
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowMusicModal(true); }} 
            className="p-2.5 rounded-xl border bg-gray-50 border-gray-100"
          >
            <Music color="#111" size={20} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setShowSignOutModal(true)} 
            className="p-2.5 rounded-xl bg-red-50 border border-red-100"
          >
            <LogOut color="#EF4444" size={20} />
          </TouchableOpacity>
        </View>
      </View>

      {toast.visible && (
        <Animated.View
          style={{
            opacity: toastOpacity,
            position: 'absolute',
            top: 80,
            left: 20,
            right: 20,
            zIndex: 999,
          }}
        >
          <View className={`flex-row items-center p-4 rounded-2xl shadow-xl ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
            {toast.type === 'success' ? <CheckCircle2 color="white" size={20} /> : <AlertCircle color="white" size={20} />}
            <Text className="text-white font-bold ml-3 flex-1">{toast.message}</Text>
          </View>
        </Animated.View>
      )}

      {loading ? (
        <View className="flex-1 items-center justify-center bg-white z-50">
          <View className="items-center justify-center">
            <ActivityIndicator color="#FF5722" size="large" />
            <Text className="text-gray-400 font-bold mt-4 uppercase text-[10px] tracking-[3px]">SYNCING YOUR PROFILE...</Text>
          </View>
          {!isPremium && (
            <View className="absolute bottom-10 w-full px-10">
              <AdBanner />
            </View>
          )}
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 0 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF5722" />
          }
        >
        <FadeInView delay={100} trigger={refreshKey} style={{ paddingHorizontal: 24, marginTop: 24 }} ready={!loading}>
          <View className="flex-row items-center">
            <View className="relative">
              <View className="w-20 h-20 rounded-[32px] bg-gray-50 overflow-hidden border-2 border-gray-50 shadow-xl shadow-gray-100/50 items-center justify-center">
                {profile?.avatar_url ? (
                  <Image
                    source={{ uri: profile.avatar_url }}
                    className="w-full h-full"
                  />
                ) : (
                  <View className="bg-gray-100 w-full h-full items-center justify-center">
                    <User color="#D1D5DB" size={40} />
                  </View>
                )}
              </View>
              {isPremium && (
                <View className="absolute -bottom-1 -right-1 bg-[#FF5722] p-1.5 rounded-xl border-2 border-white shadow-sm">
                  <Crown color="white" size={12} />
                </View>
              )}
            </View>

            <View className="ml-6 flex-1">
              <Text className="text-2xl font-black text-gray-900 tracking-tight mb-2" numberOfLines={1}>
                {profile?.first_name ? `${profile.first_name} ${profile.last_name || ''}` : 'Elite Athlete'}
              </Text>

              <View className="flex-row items-center">
                <View className={`h-7 px-2.5 rounded-lg justify-center mr-2 ${isPremium ? 'bg-orange-500' : 'bg-gray-100'}`}>
                  <Text className={`text-[10px] font-black uppercase tracking-widest ${isPremium ? 'text-white' : 'text-gray-400'}`}>
                    {isPremium ? 'PREMIUM ACCOUNT' : 'FREE ACCOUNT'}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => setShowEditModal(true)}
                  className="h-7 px-3 rounded-lg border border-gray-100 bg-gray-50 flex-row items-center justify-center"
                >
                  <Edit3 color="#6B7280" size={10} />
                  <Text className="text-[10px] font-black text-gray-400 ml-1.5 uppercase tracking-widest">EDIT</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </FadeInView>

        <FadeInView delay={250} trigger={refreshKey} style={{ paddingHorizontal: 24, marginTop: 16 }} ready={!loading}>
          <View className="bg-gray-50/80 rounded-[32px] px-2 py-4 flex-row items-center justify-between border border-gray-100 shadow-xl shadow-gray-100/30">
            <View className="items-center flex-1">
              <View className="flex-row items-center mb-1">
                <MoveVertical color="#FF5722" size={14} />
                <Text className="text-gray-400 text-[10px] font-black uppercase ml-1.5 tracking-widest">Height</Text>
              </View>
              <Text className="text-2xl font-black text-gray-900">
                {profile?.height_cm || '—'}
                <Text className="text-[12px] text-gray-400 font-bold ml-1.5"> cm</Text>
              </Text>
            </View>

            <View className="w-[1px] h-10 bg-gray-200" />

            <View className="items-center flex-1">
              <View className="flex-row items-center mb-1">
                <Scale color="#FF5722" size={14} />
                <Text className="text-gray-400 text-[10px] font-black uppercase ml-1.5 tracking-widest">Weight</Text>
              </View>
              <Text className="text-2xl font-black text-gray-900">
                {profile?.weight_kg || '—'}
                <Text className="text-[12px] text-gray-400 font-bold ml-1.5"> kg</Text>
              </Text>
            </View>

            <View className="w-[1px] h-10 bg-gray-200" />

            <View className="items-center flex-1">
              <View className="flex-row items-center mb-1">
                <Flame color="#FF5722" size={14} fill="#FF5722" />
                <Text className="text-gray-400 text-[10px] font-black uppercase ml-1.5 tracking-widest">Streak</Text>
              </View>
              <Text className="text-2xl font-black text-gray-900">
                {stats.streak || '0'}
                <Text className="text-[12px] text-gray-400 font-bold ml-1.5"> days</Text>
              </Text>
            </View>
          </View>
        </FadeInView>

        <FadeInView delay={400} trigger={refreshKey} style={{ paddingHorizontal: 24, marginTop: 20 }} ready={!loading}>
          {healthConnectAvailable && profile?.google_fit_connected ? (
            <View className="bg-gradient-to-r from-green-50 to-green-50/50 rounded-[32px] p-6 border border-green-200 shadow-lg shadow-green-100/30">
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center">
                  <View className="bg-green-500/10 p-3 rounded-xl">
                    <Heart color="#10B981" size={20} fill="#10B98133" />
                  </View>
                  <View className="ml-3">
                    <Text className="text-xs font-black text-green-600 uppercase tracking-widest mb-1">Health Connect</Text>
                    <View className="flex-row items-center">
                      <CheckCircle2 color="#10B981" size={14} fill="#10B981" />
                      <Text className="text-[13px] font-bold text-green-700 ml-1.5">Successfully Connected</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View className="bg-white/60 rounded-2xl p-4 flex-row items-center justify-between mt-3">
                <View className="items-center flex-1">
                  <Text className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Today's Steps</Text>
                  <Text className="text-xl font-black text-gray-900">{healthConnectData.daily_steps?.toLocaleString() || '0'}</Text>
                </View>
                <View className="w-[1px] h-12 bg-gray-200" />
                <View className="items-center flex-1">
                  <Text className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Calories</Text>
                  <Text className="text-xl font-black text-gray-900">{healthConnectData.daily_calories || '0'}</Text>
                </View>
                <View className="w-[1px] h-12 bg-gray-200" />
                <View className="items-center flex-1">
                  <Text className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Distance</Text>
                  <Text className="text-xl font-black text-gray-900">{healthConnectData.daily_distance?.toFixed(2) || '0'} km</Text>
                </View>
              </View>
            </View>
          ) : healthConnectAvailable ? (
            <TouchableOpacity
              onPress={handleHealthConnectConnect}
              disabled={healthConnectConnecting}
              className="bg-blue-50 rounded-[32px] p-6 border border-blue-200 active:scale-95 transition-transform"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="bg-blue-500/10 p-3 rounded-xl">
                    <Heart color="#3B82F6" size={20} fill="#3B82F633" />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-xs font-black text-blue-600 uppercase tracking-widest mb-1">Health Data</Text>
                    <Text className="text-sm font-bold text-blue-900">Connect Health Connect</Text>
                  </View>
                </View>
                {healthConnectConnecting && (
                  <ActivityIndicator color="#3B82F6" />
                )}
                {!healthConnectConnecting && (
                  <ChevronRight color="#3B82F6" size={20} />
                )}
              </View>
            </TouchableOpacity>
          ) : (
            <View className="bg-amber-50 rounded-[32px] p-4 border border-amber-200">
              <View className="flex-row items-center">
                <View className="bg-amber-500/10 p-2 rounded-xl">
                  <Heart color="#F59E0B" size={16} fill="#F59E0B33" />
                </View>
                <Text className="text-[10px] font-black text-amber-700 uppercase tracking-widest ml-3">Health Connect: Unavailable</Text>
              </View>
            </View>
          )}
        </FadeInView>

        {!isPremium && (
          <FadeInView delay={550} trigger={refreshKey} style={{ paddingHorizontal: 24, marginTop: 24 }} ready={!loading}>
            <TouchableOpacity
              onPress={() => navigation.navigate('Premium')}
              className="bg-[#FF5722] rounded-[32px] p-6 shadow-2xl shadow-orange-500/40 active:scale-95 transition-transform"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <View style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} className="self-start px-3 py-1 rounded-full mb-2">
                    <Text className="text-white font-black text-[10px] uppercase">7 Days Free Trial</Text>
                  </View>
                  <Text className="text-white font-black text-2xl">Unlock Premium</Text>
                  <Text className="text-white/70 font-medium text-xs mt-1">AI Coach, Pro Plans & Analytics.</Text>
                </View>
                <View style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} className="p-4 rounded-full">
                  <Crown color="white" size={32} />
                </View>
              </View>
            </TouchableOpacity>
          </FadeInView>
        )}

        <FadeInView delay={700} trigger={refreshKey} style={{ paddingHorizontal: 24, marginTop: 32 }} ready={!loading}>
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-2xl font-black text-gray-900 tracking-tight">My Trainers</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Trainers')}
              className="flex-row items-center"
            >
              <Text className="text-[#FF5722] font-black text-xs mr-1 uppercase">Find More</Text>
              <ChevronRight color="#FF5722" size={14} />
            </TouchableOpacity>
          </View>
          <View className="space-y-4">
            {trainersLoading ? (
              <View className="py-10 items-center justify-center bg-gray-50 rounded-[32px] border border-gray-100">
                <ActivityIndicator color="#FF5722" />
                <Text className="text-gray-400 font-bold mt-4">Loading trainers...</Text>
              </View>
            ) : trainersError ? (
              <View className="py-10 items-center justify-center bg-red-50 rounded-[32px] border border-red-100">
                <AlertCircle color="#EF4444" size={32} />
                <Text className="text-red-600 font-black mt-4 uppercase text-[10px] tracking-widest">Connection Error</Text>
                <TouchableOpacity onPress={() => fetchProfile()} className="mt-2"><Text className="text-gray-400 font-bold text-xs">Try again</Text></TouchableOpacity>
              </View>
            ) : trainers.length === 0 ? (
              <View className="py-5 items-center justify-center bg-gray-50 rounded-[32px] border border-dashed border-gray-200">
                <View className="flex-row items-center mb-1">
                  <Users color="#D1D5DB" size={24} />
                  <Text className="text-gray-900 font-black text-lg ml-2">No Trainers</Text>
                </View>
                <Text className="text-gray-400 font-medium text-xs text-center px-8 mb-3">Find your trainer and start an expert program.</Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('Trainers')}
                  className="bg-white border border-gray-200 px-6 py-2 rounded-2xl"
                >
                  <Text className="text-[#FF5722] font-black text-xs uppercase tracking-widest">Find Your Trainer</Text>
                </TouchableOpacity>
              </View>
            ) : (
              trainers.map((trainer, index) => (
                <FadeInView key={trainer.id} delay={650 + (index * 100)} trigger={refreshKey} ready={!loading}>
                  <TouchableOpacity 
                    onPress={() => navigation.navigate('TrainerDetail', { trainer: trainer })}
                    className="bg-white border border-gray-100 rounded-[32px] p-4 flex-row items-center shadow-xl shadow-gray-100/50 mb-4"
                  >
                    <Image
                      source={{ uri: trainer.image }}
                      className="w-16 h-16 rounded-2xl"
                    />
                    <View className="ml-4 flex-1">
                      <Text className="text-gray-900 font-black text-lg">{trainer.name}</Text>
                      <View className="flex-row items-center mt-0.5">
                        <View className={`px-2 py-0.5 rounded-md mr-2 ${trainer.status === 'Active' ? 'bg-green-100' : 'bg-gray-100'}`}>
                          <Text className={`text-[10px] font-black uppercase tracking-widest ${trainer.status === 'Active' ? 'text-green-600' : 'text-gray-500'}`}>
                            {trainer.status}
                          </Text>
                        </View>
                        <Text className="text-gray-400 font-medium text-xs">{trainer.specialty}</Text>
                      </View>
                    </View>
                    <ChevronRight color="#D1D5DB" size={20} />
                  </TouchableOpacity>
                </FadeInView>
              ))
            )}
          </View>
        </FadeInView>

        <FadeInView delay={750} trigger={refreshKey} style={{ paddingHorizontal: 24, marginTop: 32 }} ready={!loading}>
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-2xl font-black text-gray-900 tracking-tight">My Programs</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Trainers')}
              className="flex-row items-center"
            >
              <Text className="text-[#FF5722] font-black text-xs mr-1 uppercase">Browse All</Text>
              <ChevronRight color="#FF5722" size={14} />
            </TouchableOpacity>
          </View>
          
          <View className="space-y-4">
            {programsLoading ? (
              <ActivityIndicator color="#FF5722" />
            ) : myPrograms.length === 0 ? (
              <View className="py-5 items-center justify-center bg-gray-50 rounded-[32px] border border-dashed border-gray-200">
                <View className="bg-white p-3 rounded-2xl mb-2">
                  <Play color="#D1D5DB" size={24} fill="#D1D5DB" />
                </View>
                <Text className="text-gray-400 font-bold text-xs">No active programs</Text>
              </View>
            ) : (
              myPrograms.map((prog, index) => (
                <FadeInView key={prog.id} delay={850 + (index * 100)} trigger={refreshKey} ready={!loading}>
                  <TouchableOpacity 
                    onPress={() => navigation.navigate('VideoPlayer', { program: prog })}
                    className="bg-gray-900 rounded-[32px] p-6 mb-4 flex-row items-center shadow-xl shadow-black/20"
                  >
                    <View className="bg-[#FF5722] p-3 rounded-2xl mr-4">
                      <Play color="white" size={20} fill="white" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-black text-lg" numberOfLines={1}>{prog.title}</Text>
                      <Text className="text-white/50 font-bold text-[10px] uppercase tracking-widest">
                        By {prog.trainer_profiles?.profiles?.first_name || 'Coach'}
                      </Text>
                    </View>
                    <View className="bg-white/10 p-2 rounded-full">
                      <ChevronRight color="white" size={16} />
                    </View>
                  </TouchableOpacity>
                </FadeInView>
              ))
            )}
          </View>
        </FadeInView>

        <FadeInView delay={800} trigger={refreshKey} style={{ paddingHorizontal: 24, marginTop: 32, marginBottom: 32 }} ready={!loading}>
          <Text className="text-2xl font-black text-gray-900 mb-6 tracking-tight">Performance Analytics</Text>
          <View className="flex-row space-x-3">
            <TouchableOpacity
              onPress={() => !isPremium ? navigation.navigate('Premium') : showToast('Volume analytics coming soon!', 'success')}
              className="flex-1 bg-white p-5 rounded-[32px] items-center border border-gray-100 shadow-xl shadow-gray-100/50"
            >
              <View className="bg-blue-500/10 p-3 rounded-2xl mb-2">
                <TrendingUp color="#3B82F6" size={24} />
              </View>
              <Text className="text-gray-900 font-black text-sm text-center">Volume</Text>
              <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-widest text-center mt-1">Growth</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => !isPremium ? navigation.navigate('Premium') : showToast('Consistency score coming soon!', 'success')}
              className="flex-1 bg-white p-5 rounded-[32px] items-center border border-gray-100 shadow-xl shadow-gray-100/50"
            >
              <View className="bg-green-500/10 p-3 rounded-2xl mb-2">
                <Activity color="#22C55E" size={24} />
              </View>
              <Text className="text-gray-900 font-black text-sm text-center">Consistency</Text>
              <Text className="text-gray-500 text-[10px] font-bold uppercase tracking-widest text-center mt-1">Monthly</Text>
            </TouchableOpacity>
          </View>
        </FadeInView>

        {/* Real AdMob Banner */}
        {!isPremium && (
          <View className="px-6">
            <AdBanner extraClass="mb-4" />
          </View>
        )}

        <FadeInView delay={1100} trigger={refreshKey} ready={!loading}>
          <View className="pb-4 items-center">
            <View className="flex-row items-center justify-center space-x-10 mb-3">
              <TouchableOpacity onPress={() => Linking.openURL('https://milanwebportal.com/privacy')}>
                <Text className="text-gray-900 font-black text-xs uppercase tracking-widest">Privacy</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Linking.openURL('https://milanwebportal.com/terms')}>
                <Text className="text-gray-900 font-black text-xs uppercase tracking-widest">Terms</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Linking.openURL('https://milanwebportal.com/support')}>
                <Text className="text-gray-900 font-black text-xs uppercase tracking-widest">Support</Text>
              </TouchableOpacity>
            </View>

            <View className="items-center">
              <Text className="text-gray-400 font-bold text-[10px] mb-1">Version 1.0.0</Text>
              <Text className="text-gray-400 font-bold text-[10px]">© 2026 milanwebportal.com</Text>
            </View>
            <View className="h-4" />
          </View>
        </FadeInView>
      </ScrollView>
      )}


      {/* EDIT PROFILE MODAL */}
      <Modal visible={showEditModal} animationType="fade" transparent>
        <View className="flex-1 bg-black/60 justify-end">
          <Animated.View
            style={{ transform: [{ translateY: editSlideAnim }] }}
            className="bg-white rounded-t-[40px] p-8 pb-10 h-[85%] shadow-2xl shadow-black overflow-visible"
          >
            {/* Background Filler to cover bottom gap during animation */}
            <View style={{ position: 'absolute', bottom: -500, left: 0, right: 0, height: 500, backgroundColor: 'white' }} />

            <View className="flex-row justify-between items-center mb-8">
              <Text className="text-2xl font-black text-gray-900 tracking-tight">Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)} className="bg-gray-100 p-2 rounded-full">
                <X color="#6B7280" size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
              <View className="space-y-6">
                <View>
                  <Text className="text-gray-400 text-[10px] font-black uppercase mb-2 ml-1">First Name</Text>
                  <TextInput
                    value={editData.first_name}
                    onChangeText={(val) => setEditData({ ...editData, first_name: val })}
                    placeholder="Enter first name"
                    placeholderTextColor="#CBD5E1"
                    className="bg-gray-50 p-4 rounded-2xl border border-gray-100 font-bold text-gray-900"
                  />
                </View>

                <View>
                  <Text className="text-gray-400 text-[10px] font-black uppercase mb-2 ml-1">Last Name</Text>
                  <TextInput
                    value={editData.last_name}
                    onChangeText={(val) => setEditData({ ...editData, last_name: val })}
                    placeholder="Enter last name"
                    placeholderTextColor="#CBD5E1"
                    className="bg-gray-50 p-4 rounded-2xl border border-gray-100 font-bold text-gray-900"
                  />
                </View>

                <View className="flex-row space-x-4">
                  <View className="flex-1">
                    <Text className="text-gray-400 text-[10px] font-black uppercase mb-2 ml-1">Height (cm)</Text>
                    <TextInput
                      value={editData.height_cm}
                      onChangeText={(val) => setEditData({ ...editData, height_cm: val })}
                      placeholder="cm"
                      placeholderTextColor="#CBD5E1"
                      keyboardType="numeric"
                      className="bg-gray-50 p-4 rounded-2xl border border-gray-100 font-bold text-gray-900"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-400 text-[10px] font-black uppercase mb-2 ml-1">Weight (kg)</Text>
                    <TextInput
                      value={editData.weight_kg}
                      onChangeText={(val) => setEditData({ ...editData, weight_kg: val })}
                      placeholder="kg"
                      placeholderTextColor="#CBD5E1"
                      keyboardType="numeric"
                      className="bg-gray-50 p-4 rounded-2xl border border-gray-100 font-bold text-gray-900"
                    />
                  </View>
                </View>

                <View>
                  <Text className="text-gray-400 text-[10px] font-black uppercase mb-2 ml-1">Avatar URL</Text>
                  <TextInput
                    value={editData.avatar_url}
                    onChangeText={(val) => setEditData({ ...editData, avatar_url: val })}
                    placeholder="Image URL link"
                    placeholderTextColor="#CBD5E1"
                    className="bg-gray-50 p-4 rounded-2xl border border-gray-100 font-bold text-gray-900"
                  />
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              className="bg-[#FF5722] py-5 rounded-3xl items-center shadow-lg shadow-orange-500/40 mt-6 flex-row justify-center"
              onPress={handleUpdateProfile}
              disabled={updating}
            >
              {updating ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Save color="white" size={20} className="mr-2" />
                  <Text className="text-white text-xl font-black ml-2">Save Changes</Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      <Modal visible={showSignOutModal} animationType="fade" transparent>
        <View className="flex-1 bg-black/60 justify-center items-center px-6">
          <View className="bg-white w-full rounded-[32px] p-8 items-center shadow-2xl shadow-black">
            <View className="bg-red-50 p-4 rounded-full mb-4">
              <LogOut color="#EF4444" size={32} />
            </View>
            <Text className="text-2xl font-black text-gray-900 text-center mb-2">Sign Out</Text>
            <Text className="text-gray-500 text-center mb-8 font-medium">Are you sure you want to exit? Your progress will be saved.</Text>

            <View className="flex-row space-x-3 w-full">
              <TouchableOpacity
                onPress={() => setShowSignOutModal(false)}
                className="flex-1 bg-gray-100 py-4 rounded-2xl items-center"
              >
                <Text className="text-gray-600 font-black">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSignOut}
                className="flex-1 bg-red-500 py-4 rounded-2xl items-center shadow-lg shadow-red-500/30"
              >
                <Text className="text-white font-black">Sign Out</Text>
              </TouchableOpacity>
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