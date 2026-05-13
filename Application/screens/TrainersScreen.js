import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Image, 
  Animated, 
  TextInput, 
  Easing, 
  ActivityIndicator,
  Modal,
  RefreshControl,
  Linking
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../supabaseClient';
import { 
  Search, 
  Star, 
  ChevronRight,
  Filter,
  Award,
  CheckCircle2,
  TrendingUp,
  Dumbbell,
  Users,
  Crown,
  Headset,
  X,
  Sparkles,
  Zap,
  Target,
  ExternalLink,
  ArrowUpRight,
  Music,
  Link,
  ShieldCheck
} from 'lucide-react-native';
import { useIsFocused, useFocusEffect } from '@react-navigation/native';

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



function PremiumFeature({ icon, text }) {
  return (
    <View className="flex-row items-center bg-gray-50 px-3 py-3 rounded-2xl border border-gray-100 mb-2">
      <View className="bg-orange-500/10 p-2 rounded-lg">{icon}</View>
      <Text className="text-gray-900 font-bold ml-3 flex-1 text-[13px]" numberOfLines={1}>{text}</Text>
    </View>
  );
}

export default function TrainersScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
    const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [musicLinks, setMusicLinks] = useState({ spotify: '', youtube: '' });
  const [activePlatform, setActivePlatform] = useState('spotify');
  const [tempMusicUrl, setTempMusicUrl] = useState('');
  const [showMusicModal, setShowMusicModal] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
    const filterSlideAnim = useRef(new Animated.Value(600)).current;
  const musicModalAnim = useRef(new Animated.Value(600)).current;
  const [refreshKey, setRefreshKey] = useState(0);
  const isFetchingRef = useRef(false);

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
    if (showFilterModal) {
      filterSlideAnim.setValue(600);
      Animated.timing(filterSlideAnim, {
        toValue: 0,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true
      }).start();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [showFilterModal]);



  const fetchTrainers = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('is_premium')
          .eq('id', user.id)
          .single();
        if (profileData) setIsPremium(profileData.is_premium);
      }

      // 1. Fetch Trainers
      const { data: trainersData, error: tError } = await supabase
        .from('trainer_profiles')
        .select(`
          *,
          profiles:user_id (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('is_active', true);

      const { data: allPrograms } = await supabase
        .from('training_programs')
        .select('id, trainer_id');

      const formatted = (trainersData || []).map(t => {
        const trainerPrograms = (allPrograms || []).filter(p => 
          String(p.trainer_id).trim().toLowerCase() === String(t.id).trim().toLowerCase()
        );
        
        return {
          id: t.id,
          name: t.profiles ? `${t.profiles.first_name} ${t.profiles.last_name}` : 'Professional Trainer',
          specialty: t.specializations?.[0] || 'Elite Coach',
          rating: t.rating_avg || 0,
          reviews: t.total_reviews || 0,
          image: t.profiles?.avatar_url || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80',
          bio: t.biography || 'Certified elite trainer dedicated to your transformation and health.',
          rate: t.hourly_rate ? `${t.hourly_rate} ${t.currency || 'RSD'}` : 'Contact for price',
          programsCount: trainerPrograms.length,
          is_verified: t.is_verified || false
        };
      });

      setTrainers(formatted);
    } catch (error) {
      // Silent fail for production or minimal logging
    } finally {
      setLoading(false);
      setRefreshing(false);
      setRefreshKey(prev => prev + 1);
      isFetchingRef.current = false;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const dynamicCategories = useMemo(() => {
    const specs = new Set(['All']);
    trainers.forEach(t => {
      if (t.specialty) specs.add(t.specialty);
    });
    return Array.from(specs);
  }, [trainers]);

  useFocusEffect(
    useCallback(() => {
      if (!isFetchingRef.current) {
        isFetchingRef.current = true;
        fetchTrainers();
      }
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchTrainers();
  };

  const filteredTrainers = trainers.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         t.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || t.specialty.includes(selectedCategory);
    return matchesSearch && matchesCategory;
  });

  const featuredTrainers = trainers.slice(0, 3); // Just as an example for featured

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {/* Fixed Header */}
      <View className="px-6 py-4 flex-row items-center justify-between z-50 shadow-sm shadow-black/[0.02]">
        <Image
          source={require('../assets/4.png')}
          style={{ width: 130, height: 35, resizeMode: 'contain' }}
        />
        <View className="flex-row items-center space-x-2">
          <TouchableOpacity 
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowMusicModal(true); }} 
            className="p-2.5 rounded-xl border bg-gray-50 border-gray-100"
          >
            <Music color="#111" size={20} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => isPremium ? Linking.openURL('https://milanwebportal.com/support') : navigation.navigate('Premium')}
            className={`p-2.5 rounded-xl border ${isPremium ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'}`}
          >
          {isPremium ? (
            <Headset color="#3B82F6" size={20} />
          ) : (
            <Crown color="#FF5722" size={20} />
          )}
        </TouchableOpacity>
      </View>
    </View>

      {loading ? (
        <View className="flex-1 items-center justify-center z-50">
          <View className="items-center justify-center">
            <ActivityIndicator color="#FF5722" size="large" />
            <Text className="text-gray-400 font-bold mt-4 uppercase text-[10px] tracking-[3px]">LOADING TRAINERS...</Text>
          </View>
          {!isPremium && (
            <View className="absolute bottom-10 w-full px-6">
              <AdBanner />
            </View>
          )}
        </View>
      ) : (
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF5722" />
        }
      >
        {/* Section Header */}
        <FadeInView delay={100} trigger={refreshKey} ready={!loading}>
          <View className="px-6 py-6">
            <Text className="text-2xl font-black text-gray-900 tracking-tight">Trainers</Text>
          </View>
        </FadeInView>

        {/* Search Bar */}
        <FadeInView delay={200} className="px-6 mb-6" trigger={refreshKey} ready={!loading}>
          <View className="flex-row items-center bg-white rounded-3xl px-5 h-14 shadow-sm shadow-black/[0.03] border border-gray-100">
            <Search color="#9CA3AF" size={18} />
            <TextInput 
              placeholder="Search specialists..."
              className="flex-1 ml-3 font-bold text-gray-900 text-sm"
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
            <TouchableOpacity 
              onPress={() => setShowFilterModal(true)}
              className="ml-2"
            >
              <Filter color={selectedCategory !== 'All' ? '#FF5722' : '#9CA3AF'} size={18} />
            </TouchableOpacity>
          </View>
        </FadeInView>

          <View className="px-6">
            {filteredTrainers.map((trainer, idx) => (
              <FadeInView key={trainer.id} delay={300 + (idx * 100)} trigger={refreshKey} ready={!loading}>
                <TouchableOpacity 
                  onPress={() => navigation.navigate('TrainerDetail', { trainer })}
                  activeOpacity={0.7}
                  className="bg-white rounded-3xl mb-4 shadow-sm shadow-black/[0.03] flex-row p-3 items-center border border-gray-100/50"
                >
                  <Image 
                    source={{ uri: trainer.image }} 
                    className="w-20 h-20 rounded-2xl bg-gray-50"
                    resizeMode="cover"
                  />
                  
                  <View className="flex-1 ml-4">
                    <Text className="text-gray-400 font-bold text-[9px] uppercase tracking-widest mb-1">
                      {trainer.specialty}
                    </Text>
                    <View className="flex-row items-center mb-1">
                      <Text className="text-gray-900 font-black text-lg mr-1.5" numberOfLines={1}>
                        {trainer.name}
                      </Text>
                      {trainer.is_verified && (
                        <CheckCircle2 color="#3B82F6" size={14} fill="white" />
                      )}
                    </View>
                    <View className="flex-row items-center">
                      <Star color="#FBBF24" size={10} fill="#FBBF24" />
                      <Text className="text-gray-400 font-bold text-[10px] ml-1">{trainer.rating} • {trainer.reviews} Clients</Text>
                    </View>
                  </View>

                  <View className="bg-gray-50 p-2 rounded-xl ml-2">
                    <ChevronRight color="#D1D5DB" size={16} />
                  </View>
                </TouchableOpacity>

                {/* Ad after every 2nd trainer */}
                {(idx + 1) % 2 === 0 && (idx + 1) < filteredTrainers.length && !isPremium && (
                  <AdBanner extraClass="mb-4 rounded-2xl" />
                )}
              </FadeInView>
            ))}

            {/* ALWAYS show ad at the end */}
            {!isPremium && filteredTrainers.length > 0 && (
              <FadeInView delay={filteredTrainers.length * 100} trigger={refreshKey} ready={!loading}>
                <AdBanner extraClass="mb-10 rounded-2xl" />
              </FadeInView>
            )}

            {filteredTrainers.length === 0 && (
              <View className="items-center py-20">
                <Text className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">No trainers found</Text>
              </View>
            )}
          </View>

      </ScrollView>
      )}

      {/* FILTER MODAL */}
      <Modal visible={showFilterModal} animationType="fade" transparent>
        <View className="flex-1 bg-black/60 justify-end">
          <Animated.View 
            style={{ transform: [{ translateY: filterSlideAnim }] }}
            className="bg-white rounded-t-[40px] p-8 pb-10 shadow-2xl shadow-black"
          >
            <View style={{ position: 'absolute', bottom: -500, left: 0, right: 0, height: 500, backgroundColor: 'white' }} />
            <View className="flex-row justify-between items-center mb-8">
              <View>
                <Text className="text-2xl font-black text-gray-900">Filter Specialists</Text>
                <Text className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mt-1">Select your training style</Text>
              </View>
              <TouchableOpacity onPress={() => setShowFilterModal(false)} className="bg-gray-100 p-2 rounded-full">
                <X color="#6B7280" size={20} />
              </TouchableOpacity>
            </View>
            
            <View className="flex-row flex-wrap">
              {dynamicCategories.map((cat) => (
                <TouchableOpacity 
                  key={cat}
                  onPress={() => {
                    setSelectedCategory(cat);
                    setShowFilterModal(false);
                  }}
                  className={`px-4 py-2.5 rounded-2xl mr-2 mb-3 border ${selectedCategory === cat ? 'bg-gray-900 border-gray-900 shadow-md shadow-gray-900/40' : 'bg-gray-50 border-gray-100'}`}
                >
                  <Text className={`font-black text-xs uppercase tracking-widest ${selectedCategory === cat ? 'text-white' : 'text-gray-500'}`}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              onPress={() => {
                setSelectedCategory('All');
                setShowFilterModal(false);
              }}
              className="mt-8 py-5 rounded-2xl bg-orange-50 items-center border border-orange-100"
            >
              <Text className="text-[#FF5722] font-black uppercase tracking-[2px] text-xs">Reset All Filters</Text>
            </TouchableOpacity>
          </Animated.View>
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
