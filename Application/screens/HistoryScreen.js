import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  ScrollView,
  Image,
  Dimensions,
  Animated,
  Easing,
  RefreshControl,
  Linking,
  Pressable,
  StyleSheet,
  TextInput
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Calendar,
  ChevronRight,
  Clock,
  Dumbbell,
  TrendingUp,
  X,
  Plus,
  Zap,
  Crown,
  Headset,
  Lock,
  Sparkles,
  Target,
  CheckCircle2,
  ExternalLink,
  Flame,
  ArrowRight,
  Smile,
  Meh,
  Frown,
  Timer,
  CalendarDays,
  Users,
  ArrowUpRight,
  Music,
  ShieldCheck
} from 'lucide-react-native';
import { supabase } from '../supabaseClient';
import { format, subDays, differenceInDays, startOfDay, isSameDay, subYears } from 'date-fns';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

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

function PremiumFeature({ icon, text }) {
  return (
    <View className="flex-row items-center bg-gray-50 px-3 py-3 rounded-2xl border border-gray-100 mb-2">
      <View className="bg-orange-500/10 p-2 rounded-lg">{icon}</View>
      <Text className="text-gray-900 font-bold ml-3 flex-1 text-[13px]" numberOfLines={1}>{text}</Text>
    </View>
  );
}

export default function HistoryScreen({ navigation }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
    const [stats, setStats] = useState({ today: 0, week: 0, month: 0 });
  const [heatmapData, setHeatmapData] = useState([]);
  const [selectedDay, setSelectedDay] = useState(null);
  const [hasHiddenSessions, setHasHiddenSessions] = useState(false);

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

  const SQUARE_SIZE = 12;
  const GAP = 2;
  const HORIZONTAL_PADDING = 48;
  const availableWidth = SCREEN_WIDTH - HORIZONTAL_PADDING;
  const maxWeeks = Math.floor(availableWidth / (SQUARE_SIZE + GAP));

  const [listRefreshKey, setListRefreshKey] = useState(0);
  const [headerRefreshKey, setHeaderRefreshKey] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const listRef = useRef(null);
  const pageSize = 10;

  
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
      fetchProfileAndHistory(0);
    }, [])
  );

  const fetchProfileAndHistory = async (pageToFetch = 0, isRefresh = false) => {
    try {
      if (pageToFetch === 0) setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      let freshStats = { today: 0, week: 0, month: 0 };
      let freshHeatmap = [];
      let freshIsPremium = isPremium;

      if (pageToFetch === 0 || isRefresh) {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const weekStart = subDays(new Date(), 7).toISOString();
        const monthStart = subDays(new Date(), 30).toISOString();
        const heatmapLimit = subYears(new Date(), 1).toISOString();

        const [profileRes, todayRes, weekRes, monthRes, heatmapRes] = await Promise.all([
          supabase.from('profiles').select('is_premium, role').eq('id', user.id).single(),
          supabase.from('workout_sessions').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('started_at', todayStart),
          supabase.from('workout_sessions').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('started_at', weekStart),
          supabase.from('workout_sessions').select('*', { count: 'exact', head: true }).eq('user_id', user.id).gte('started_at', monthStart),
          supabase.from('workout_sessions').select('started_at').eq('user_id', user.id).gte('started_at', heatmapLimit)
        ]);

        if (profileRes.data) freshIsPremium = profileRes.data.is_premium;
        freshStats = { today: todayRes.count || 0, week: weekRes.count || 0, month: monthRes.count || 0 };
        freshHeatmap = heatmapRes.data || [];

        const olderThanSevenDays = freshHeatmap.some(s => new Date(s.started_at) < new Date(weekStart));
        setHasHiddenSessions(olderThanSevenDays);
      }


      const sevenDaysAgo = subDays(new Date(), 7).toISOString();
      const twoYearAgo = subDays(new Date(), 730).toISOString();

      const activeLimit = freshIsPremium ? twoYearAgo : sevenDaysAgo;

      const { data, count, error: historyError } = await supabase
        .from('workout_sessions')
        .select(`
          id,
          started_at,
          completed_at,
          duration_seconds,
          calories_burned,
          feeling,
          notes,
          status,
          workout_session_exercises (
            id,
            exercises (name),
            exercise_sets (weight_kg, reps_completed)
          )
        `, { count: 'exact' })
        .eq('user_id', user.id)
        .gte('started_at', activeLimit)
        .order('started_at', { ascending: false })
        .order('created_at', { ascending: false })
        .range(pageToFetch * pageSize, (pageToFetch + 1) * pageSize - 1);


      if (historyError) throw historyError;

      if (pageToFetch === 0 || isRefresh) {
        setIsPremium(freshIsPremium);
        setStats(freshStats);
        setHeatmapData(freshHeatmap);
        setTotalCount(count || 0);
        setTotalPages(Math.ceil((count || 0) / pageSize));
        setHistory(data || []);
        setPage(0);
        setHeaderRefreshKey(prev => prev + 1);
        setListRefreshKey(prev => prev + 1);
        setSelectedDay(null);
      } else {
        setHistory(prev => [...prev, ...(data || [])]);
        setPage(pageToFetch);
      }
    } catch (e) {
      console.error('History fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    setPage(0);
    await fetchProfileAndHistory(0, true);
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

  const renderHeatmap = () => {
    if (loading && history.length === 0) return <View className="h-32 bg-gray-50/50 rounded-3xl items-center justify-center border border-dashed border-gray-100"><ActivityIndicator size="small" color="#FF5722" /></View>;

    const today = startOfDay(new Date());
    const totalDaysToShow = maxWeeks * 7;
    const days = [];
    for (let i = 0; i < totalDaysToShow; i++) {
      const day = subDays(today, (totalDaysToShow - 1) - i);
      const workouts = heatmapData.filter(d => isSameDay(new Date(d.started_at), day));
      days.push({ day, count: workouts.length });
    }

    const weeks = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    const finalWeeks = weeks.slice(-maxWeeks);

    return (
      <View className="relative">
        {selectedDay && (
          <View
            className="absolute -top-12 self-center bg-gray-900 px-4 py-2 rounded-2xl shadow-xl shadow-black/20 z-[100] items-center"
            style={{ left: '50%', marginLeft: -60, width: 120 }}
          >
            <Text className="text-white/50 font-black text-[7px] uppercase tracking-widest mb-0.5">{format(selectedDay.day, 'MMM d, yyyy')}</Text>
            <Text className="text-white font-black text-[10px] uppercase">{selectedDay.count} Sessions</Text>
            <View className="absolute -bottom-1 w-2 h-2 bg-gray-900 rotate-45" />
          </View>
        )}
        <View className="flex-row justify-between py-2 overflow-hidden">
          {finalWeeks.map((week, weekIdx) => (
            <View key={weekIdx} className="flex-col">
              {week.map((d, dayIdx) => (
                <TouchableOpacity
                  key={dayIdx}
                  onPress={() => setSelectedDay(selectedDay && isSameDay(selectedDay.day, d.day) ? null : d)}
                  activeOpacity={0.8}
                  className={`w-[12px] h-[12px] rounded-[3px] m-[1px] ${d.count > 0 ? 'bg-orange-500 shadow-sm shadow-orange-500/20' : 'bg-gray-100'} ${selectedDay && isSameDay(selectedDay.day, d.day) ? 'border-2 border-gray-900 scale-125 z-50' : ''}`}
                  style={{ opacity: d.count > 0 ? Math.min(1, 0.4 + d.count * 0.2) : 1 }}
                />
              ))}
            </View>
          ))}
        </View>
        <View className="flex-row items-center justify-between mt-2 px-1">
          <Text className="text-gray-300 font-bold text-[8px] uppercase tracking-widest">Less</Text>
          <View className="flex-row space-x-1 items-center">
            <View className="w-[10px] h-[10px] rounded-[2px] bg-gray-100" /><View className="w-[10px] h-[10px] rounded-[2px] bg-orange-500 opacity-40" /><View className="w-[10px] h-[10px] rounded-[2px] bg-orange-500 opacity-70" /><View className="w-[10px] h-[10px] rounded-[2px] bg-orange-500" />
          </View>
          <Text className="text-gray-300 font-bold text-[8px] uppercase tracking-widest ml-1">More</Text>
        </View>
      </View>
    );
  };



  const renderItem = ({ item: session, index: idx }) => (
    <View key={session.id}>
      <FadeInView delay={200 + (idx % 10) * 80} trigger={listRefreshKey} ready={!loading}>
        <TouchableOpacity onPress={() => setSelectedSession(session)} activeOpacity={0.7} className="bg-white p-4 rounded-[28px] border border-gray-100 shadow-sm shadow-gray-200 mb-3 flex-row items-center mx-6">
          <View className="bg-orange-500/10 p-3 rounded-2xl mr-4"><Calendar color="#FF5722" size={20} /></View>
          <View className="flex-1">
            <Text className="text-gray-900 font-black text-lg" numberOfLines={1}>{session.workout_session_exercises?.[0]?.exercises?.name || 'Workout Session'}{session.workout_session_exercises?.length > 1 ? ` +${session.workout_session_exercises.length - 1}` : ''}</Text>
            <Text className="text-gray-400 font-bold text-xs">
              {format(new Date(session.started_at), 'MMMM d • HH:mm')}
              {session.completed_at ? ` - ${format(new Date(session.completed_at), 'HH:mm')}` : ''}
            </Text>
          </View>
          <View className="items-end"><Text className="text-[#FF5722] font-black text-base">{calculateTotalWeight(session).toLocaleString()}</Text><Text className="text-gray-400 font-bold text-[10px] uppercase">kg</Text></View>
          <ChevronRight color="#D1D5DB" size={16} className="ml-2" />
        </TouchableOpacity>
      </FadeInView>
      {(idx + 1) % 5 === 0 && (idx + 1) !== history.length && !isPremium && (
        <FadeInView delay={100} trigger={listRefreshKey} className="mb-6 px-6" ready={!loading}>
          <AdBanner />
        </FadeInView>
      )}
    </View>
  );

  const renderFooter = () => {
    if (loading && page > 0) {
      return <ActivityIndicator className="my-8" color="#FF5722" size="small" />;
    }

    return (
      <View className="pb-12">
        {page < totalPages - 1 && !loading && history.length > 0 && (
          <TouchableOpacity
            onPress={() => fetchProfileAndHistory(page + 1)}
            className="mx-6 mt-4 mb-6 py-4 bg-gray-50 rounded-3xl border border-gray-100 items-center"
          >
            <Text className="text-gray-400 font-black text-[10px] uppercase tracking-widest">Load More Sessions</Text>
          </TouchableOpacity>
        )}

        {!isPremium && !loading && hasHiddenSessions && history.length > 0 && (
          <FadeInView delay={100} className="mx-6 mb-4 bg-orange-50 p-6 rounded-[32px] border border-orange-100 items-center">
            <Crown color="#FF5722" size={24} className="mb-2" />
            <Text className="text-gray-900 font-black text-center text-sm mb-1">Unlock Your Full History</Text>
            <Text className="text-gray-500 text-center text-xs font-bold leading-4">Upgrade to premium to see workouts older than 7 days and track your long-term progress.</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Premium')} className="mt-4 bg-[#FF5722] px-6 py-2.5 rounded-2xl shadow-sm"><Text className="text-white font-black text-[10px] uppercase tracking-widest">Upgrade Now</Text></TouchableOpacity>
          </FadeInView>
        )}

        {!isPremium && !loading && history.length > 0 && (
          <FadeInView delay={200} className="px-6 mb-4">
            <AdBanner />
          </FadeInView>
        )}

        <View className="h-4" />
      </View>
    );
  };

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
          <TouchableOpacity onPress={() => navigation.navigate('WorkoutPlayer', { mode: 'standard', workoutName: 'New Workout' })} className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
            <Plus color="#111" size={20} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => isPremium ? Linking.openURL('https://milanwebportal.com/support') : navigation.navigate('Premium')} className={`p-2.5 rounded-xl border ${isPremium ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'}`}>
            {isPremium ? <Headset color="#3B82F6" size={20} /> : <Crown color="#FF5722" size={20} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* REFINED LOADING LAYOUT */}
      {loading ? (
        <View className="flex-1 items-center justify-center bg-white z-50">
          <View className="items-center justify-center">
            <ActivityIndicator color="#FF5722" size="large" />
            <Text className="text-gray-400 font-bold mt-4 uppercase text-[10px] tracking-[3px]">SYNCING YOUR LOGS...</Text>
          </View>
          {!isPremium && (
            <View className="absolute bottom-10 w-full px-6">
              <AdBanner />
            </View>
          )}
        </View>
      ) : (
        <FlatList
          ref={listRef}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 0 }}

          data={history}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF5722" />}
          ListHeaderComponent={
            <Pressable onPress={() => setSelectedDay(null)}>
              <View className="px-6">
                <FadeInView delay={150} className="mt-8 mb-8" trigger={headerRefreshKey} ready={!loading}>
                  <Text className="text-2xl font-black text-gray-900 mb-4 tracking-tight">Activity Tracker</Text>
                  <View className="flex-row space-x-3 mb-6">
                    <View className="bg-gray-50/80 p-4 rounded-[24px] border border-gray-100 items-center flex-1">
                      <Text className="text-gray-400 font-black text-[8px] uppercase tracking-widest mb-1">Today</Text>
                      <Text className="text-2xl font-black text-gray-900">{stats.today}</Text>
                    </View>
                    <View className="bg-gray-50/80 p-4 rounded-[24px] border border-gray-100 items-center flex-1">
                      <Text className="text-gray-400 font-black text-[8px] uppercase tracking-widest mb-1">7 Days</Text>
                      <Text className="text-2xl font-black text-gray-900">{stats.week}</Text>
                    </View>
                    <View className="bg-gray-50/80 p-4 rounded-[24px] border border-gray-100 items-center flex-1">
                      <Text className="text-gray-400 font-black text-[8px] uppercase tracking-widest mb-1">30 Days</Text>
                      <Text className="text-2xl font-black text-gray-900">{stats.month}</Text>
                    </View>
                  </View>
                  {renderHeatmap()}
                </FadeInView>
                <FadeInView delay={250} trigger={headerRefreshKey} ready={!loading}><Text className="text-2xl font-black text-gray-900 mb-4 mt-4 tracking-tight">Workout History</Text></FadeInView>
              </View>
            </Pressable>
          }
          ListEmptyComponent={!loading && <FadeInView delay={300} className="mx-6 py-20 items-center bg-gray-50 rounded-[32px] border border-dashed border-gray-200"><Calendar color="#D1D5DB" size={40} /><Text className="text-gray-400 font-bold mt-4">No sessions found</Text></FadeInView>}
          ListFooterComponent={renderFooter}
        />

      )}

      {/* DETAIL MODAL */}
      <Modal visible={!!selectedSession} animationType="fade" transparent>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white rounded-t-[50px] p-8 pb-10 h-[80%] shadow-2xl">
            <View className="flex-row justify-between items-start mb-6"><FadeInView delay={100}><Text className="text-gray-400 font-bold text-[10px] uppercase tracking-[3px] mb-1">SUMMARY</Text><Text className="text-3xl font-black text-gray-900">Training Done</Text></FadeInView><TouchableOpacity onPress={() => setSelectedSession(null)} className="bg-gray-100 p-2.5 rounded-full"><X color="#6B7280" size={20} /></TouchableOpacity></View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <FadeInView delay={200} className="mb-8 items-center"><Text className="text-gray-400 font-black text-[10px] uppercase tracking-widest mb-2">{selectedSession ? format(new Date(selectedSession.started_at), 'EEEE, MMMM d') : ''}</Text><View className="flex-row items-center bg-gray-50 px-6 py-3 rounded-2xl border border-gray-100"><Text className="text-gray-900 text-xl font-black">{selectedSession ? format(new Date(selectedSession.started_at), 'HH:mm') : ''}</Text><View className="mx-4 h-0.5 w-4 bg-gray-200" /><Text className="text-gray-900 text-xl font-black">{selectedSession ? format(new Date(selectedSession.completed_at), 'HH:mm') : ''}</Text></View></FadeInView>
              <FadeInView delay={300} className="flex-row space-x-3 mb-8"><View className="bg-gray-900 flex-1 p-5 rounded-3xl justify-center items-center"><Dumbbell color="rgba(255,255,255,0.2)" size={14} className="mb-2" /><Text className="text-white text-lg font-black">{selectedSession ? calculateTotalWeight(selectedSession).toLocaleString() : 0}kg</Text><Text className="text-white/40 font-black text-[7px] uppercase tracking-widest mt-1">Weight</Text></View><View className="bg-orange-500 flex-1 p-5 rounded-3xl justify-center items-center"><Timer color="rgba(255,255,255,0.4)" size={14} className="mb-2" /><Text className="text-white text-lg font-black">{selectedSession ? Math.floor(selectedSession.duration_seconds / 60) : 0}m</Text><Text className="text-white/60 font-black text-[7px] uppercase tracking-widest mt-1">Time</Text></View><View className="bg-gray-50 flex-1 p-5 rounded-3xl justify-center items-center border border-gray-100"><Flame color="#FF5722" size={14} className="mb-2" /><Text className="text-gray-900 text-lg font-black">{selectedSession?.calories_burned || 0}</Text><Text className="text-gray-400 font-black text-[7px] uppercase tracking-widest mt-1">Kcal</Text></View></FadeInView>
              <FadeInView delay={400} className="px-1"><Text className="text-gray-400 font-bold text-[10px] uppercase tracking-[3px] mb-4">EXERCISES</Text>{selectedSession?.workout_session_exercises?.map((ex, i) => (<View key={i} className="mb-4 bg-white border border-gray-100 p-5 rounded-3xl"><Text className="text-base font-black text-gray-900 mb-3">{ex.exercises?.name}</Text><View className="space-y-2">{ex.exercise_sets?.map((set, si) => (<View key={si} className="flex-row justify-between items-center py-1.5 border-b border-gray-50/50"><Text className="text-gray-400 font-bold text-[9px] uppercase tracking-widest">Set {si + 1}</Text><Text className="text-gray-900 font-black text-sm">{set.weight_kg}kg <Text className="text-gray-400 font-bold text-[10px]">x</Text> {set.reps_completed}</Text></View>))}</View></View>))}</FadeInView>
              {selectedSession?.notes && (<FadeInView delay={500} className="bg-gray-50 p-5 rounded-3xl mt-2 mb-6 border border-gray-100"><Text className="text-gray-400 font-black text-[8px] uppercase tracking-widest mb-2">Notes</Text><Text className="text-gray-900 font-bold text-xs leading-4">{selectedSession.notes}</Text></FadeInView>)}
              <View className="h-10" />
            </ScrollView>
            <FadeInView delay={600}><TouchableOpacity onPress={() => setSelectedSession(null)} className="bg-gray-900 py-5 rounded-[24px] items-center mt-2 shadow-xl shadow-gray-900/30"><Text className="text-white font-black text-sm uppercase tracking-widest">Close Summary</Text></TouchableOpacity></FadeInView>
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
