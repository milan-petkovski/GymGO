import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Dimensions, ActivityIndicator, Alert, BackHandler, StatusBar, ScrollView, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Video, ResizeMode } from 'expo-av';
import * as ScreenCapture from 'expo-screen-capture';
import { X, ShieldCheck, ListMusic, ChevronRight, Play, Pause, Trophy, PartyPopper } from 'lucide-react-native';
import { supabase } from '../supabaseClient';

const { width, height } = Dimensions.get('window');

export default function VideoPlayerScreen({ navigation, route }) {
  const { program } = route.params;
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState({});
  const [playlist, setPlaylist] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showEpisodes, setShowEpisodes] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const videoRef = useRef(null);
  const countdownTimer = useRef(null);
  const successAnim = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (showSuccess) {
      Animated.parallel([
        Animated.timing(successAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(successScale, {
          toValue: 1,
          friction: 4,
          useNativeDriver: true,
        })
      ]).start();
    }
  }, [showSuccess]);

  useEffect(() => {
    if (program && program.id) {
      fetchPlaylist();
    } else {
      console.log('No program ID found in route params');
    }
    const enableProtection = async () => {
      try {
        await ScreenCapture.preventScreenCaptureAsync();
      } catch (e) {
        console.error('Failed to enable screen capture protection:', e);
      }
    };
    enableProtection();
    return () => ScreenCapture.allowScreenCaptureAsync();
  }, [program?.id]);

  const fetchPlaylist = async () => {
    try {
      const { data, error } = await supabase
        .from('program_videos')
        .select('*')
        .eq('program_id', program.id)
        .order('order_index', { ascending: true });
      
      if (error) throw error;

      if (data && data.length > 0) {
        setPlaylist(data);
      } else {
        setPlaylist([{
          id: program.id,
          title: program.title || program.name || 'Main Session',
          video_url: program.video_url || program.image_url
        }]);
      }
    } catch (e) {
      setPlaylist([{
        id: program.id,
        title: program.title || program.name || 'Main Session',
        video_url: program.video_url || program.image_url
      }]);
    }
  };

  useEffect(() => {
    if (status.didJustFinish) {
      if (currentIndex < playlist.length - 1) {
        startCountdown();
      } else {
        setShowSuccess(true);
      }
    }
  }, [status.didJustFinish]);

  const startCountdown = () => {
    setCountdown(5);
    if (countdownTimer.current) clearInterval(countdownTimer.current);
    countdownTimer.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownTimer.current);
          playNext();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const playNext = () => {
    if (countdownTimer.current) {
      clearInterval(countdownTimer.current);
      countdownTimer.current = null;
    }
    if (currentIndex < playlist.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setCountdown(null);
    }
  };

  useEffect(() => {
    if (status.isLoaded && !status.isPlaying && playlist.length > 0) {
      videoRef.current?.playAsync();
    }
  }, [status.isLoaded, currentIndex]);

  const selectVideo = (index) => {
    if (videoRef.current) {
      videoRef.current.stopAsync();
    }
    setCurrentIndex(index);
    setShowEpisodes(false);
    setCountdown(null);
    if (countdownTimer.current) clearInterval(countdownTimer.current);
  };

  const getDirectLink = (url) => {
    if (!url) return null;
    if (url.includes('drive.google.com')) {
      const fileId = url.split('/d/')[1]?.split('/')[0] || url.split('id=')[1]?.split('&')[0];
      if (fileId) return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }
    return url;
  };

  const formatTime = (millis) => {
    if (!millis) return '00:00';
    const minutes = Math.floor(millis / 60000);
    const seconds = ((millis % 60000) / 1000).toFixed(0);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const progress = status.positionMillis / status.durationMillis || 0;
  const currentVideo = playlist[currentIndex] || {};
  const videoUri = getDirectLink(currentVideo?.video_url || program.video_url || program.image_url);

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}>
        {!status.isLoaded && (
          <View style={{ position: 'absolute', zIndex: 5, width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#000' }}>
            <ActivityIndicator color="#FF5722" size="large" />
          </View>
        )}
        <Video
          key={`video-player-${currentIndex}`}
          ref={videoRef}
          style={{ width: width, height: height }}
          source={{ uri: videoUri }}
          useNativeControls={false}
          shouldPlay={true}
          resizeMode={ResizeMode.COVER}
          progressUpdateIntervalMillis={100}
          onPlaybackStatusUpdate={status => setStatus(() => status)}
          onError={(e) => {}}
        />
      </View>

      {/* SUCCESS VICTORY OVERLAY */}
      {showSuccess && (
        <View 
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 200, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}
        >
          <Animated.View 
            style={{ 
              opacity: successAnim, 
              transform: [{ scale: successScale }],
              alignItems: 'center',
              paddingHorizontal: 40
            }}
          >
            <View className="bg-[#FF5722]/10 h-32 w-32 rounded-full items-center justify-center mb-8 border border-[#FF5722]/20">
              <Trophy color="#FF5722" size={60} />
            </View>
            
            <View className="flex-row items-center mb-4">
              <PartyPopper color="#FF5722" size={20} />
              <Text className="text-[#FF5722] font-black text-xs uppercase tracking-[4px] mx-3">Mission Accomplished</Text>
              <PartyPopper color="#FF5722" size={20} />
            </View>

            <Text className="text-white text-4xl font-black text-center tracking-tighter mb-4">Workout Complete!</Text>
            <Text className="text-white/40 text-center font-medium leading-6 mb-16">
              Congratulations! You have successfully completed all sessions of this program. Your progress has been recorded.
            </Text>

            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              className="bg-[#FF5722] px-12 py-5 rounded-[24px] shadow-2xl shadow-[#FF5722]/40 w-full items-center"
            >
              <Text className="text-white font-black uppercase tracking-[3px] text-xs">Finish Workout</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}

      {/* HEADER */}
      {!showEpisodes && countdown === null && !showSuccess && (
        <View 
          style={{ paddingTop: insets.top + 10, zIndex: 50 }}
          className="absolute top-0 left-0 right-0 px-6 flex-row items-center justify-between"
        >
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            className="bg-black/60 h-10 w-10 rounded-xl items-center justify-center border border-white/10"
          >
            <X color="white" size={20} />
          </TouchableOpacity>
          
          <View className="flex-row items-center bg-black/60 h-10 px-4 rounded-xl border border-white/10">
            <ShieldCheck color="#22C55E" size={14} />
            <Text className="text-white font-black text-[9px] ml-2 uppercase tracking-[1.5px]">Secure View</Text>
          </View>
        </View>
      )}

      {/* CENTRAL TAP OVERLAY */}
      {!showEpisodes && countdown === null && !showSuccess && (
        <TouchableOpacity 
          activeOpacity={1}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10 }}
          onPress={() => {
            if (status.isPlaying) videoRef.current?.pauseAsync();
            else videoRef.current?.playAsync();
          }}
        >
          {!status.isPlaying && status.isLoaded && (
            <View className="flex-1 items-center justify-center">
              <View className="bg-black/40 h-24 w-24 rounded-full items-center justify-center border border-white/10">
                <Play color="white" size={48} fill="white" />
              </View>
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* COUNTDOWN */}
      {countdown !== null && (
        <View 
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' }}
        >
          <Text className="text-white/40 font-black text-sm uppercase tracking-[6px] mb-6">Next Episode In</Text>
          <Text className="text-white text-[120px] font-black mb-10 leading-[120px]">{countdown}</Text>
          <Text className="text-white font-black text-2xl mb-16 px-10 text-center tracking-tight" numberOfLines={2}>
            {playlist[currentIndex + 1]?.title}
          </Text>
          <TouchableOpacity 
            onPress={playNext}
            className="bg-[#FF5722] px-12 py-6 rounded-[32px] shadow-2xl shadow-[#FF5722]/40"
          >
            <Text className="text-white font-black uppercase tracking-[3px] text-xs">Play Now</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* EPISODES DRAWER */}
      {showEpisodes && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 150, backgroundColor: '#000' }}>
          <View style={{ paddingTop: insets.top + 20 }} className="px-6 flex-row items-center justify-between mb-8">
            <View className="flex-row items-center">
              <TouchableOpacity onPress={() => setShowEpisodes(false)} className="bg-white/5 h-10 w-10 rounded-xl border border-white/10 items-center justify-center">
                <X color="white" size={18} />
              </TouchableOpacity>
              <Text className="text-white font-black text-xl ml-5 tracking-tight">Episodes</Text>
            </View>
            <View className="bg-white/5 h-10 px-4 rounded-xl border border-white/10 flex-row items-center">
              <ShieldCheck color="#22C55E" size={14} />
              <Text className="text-white font-black text-[9px] ml-2 uppercase tracking-[1.5px]">Secure View</Text>
            </View>
          </View>
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {playlist.map((item, index) => (
              <TouchableOpacity key={item.id} onPress={() => selectVideo(index)} style={{ width: '100%', borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.03)' }} className={`flex-row items-center p-6 ${index === currentIndex ? 'bg-white/[0.03]' : 'bg-transparent'}`}>
                {index === currentIndex && <View className="absolute left-0 top-0 bottom-0 w-1 bg-[#FF5722]" />}
                <View className={`w-9 h-9 rounded-full items-center justify-center mr-4 ${index === currentIndex ? 'bg-[#FF5722]' : 'bg-white/5'}`}>
                  {index === currentIndex ? <Play color="white" size={20} fill="white" /> : <Text className="text-white/30 font-black text-sm">{index + 1}</Text>}
                </View>
                <View className="flex-1">
                  <Text className={`font-black text-base ${index === currentIndex ? 'text-[#FF5722]' : 'text-white'}`} numberOfLines={1}>{item.title}</Text>
                  <Text className="text-white/20 text-[9px] uppercase font-black tracking-[3px] mt-1.5">Episode {index + 1}</Text>
                </View>
                {index === currentIndex && <View><View className="w-3 h-3 rounded-full bg-[#FF5722] animate-pulse" /></View>}
              </TouchableOpacity>
            ))}
            <View style={{ height: 150 }} />
          </ScrollView>
        </View>
      )}

      {/* BOTTOM INFO & PROGRESS */}
      <View 
        className="absolute bottom-0 left-0 right-0"
        style={{ paddingBottom: insets.bottom + 20, zIndex: 40, alignItems: 'center' }}
      >
        <View style={{ width: width - 48 }}>
          {/* ZEN PROGRESS BAR */}
          {!showEpisodes && countdown === null && !showSuccess && (
            <View className="mb-6">
              <View className="flex-row justify-between items-center mb-2 px-1">
                <Text className="text-white/40 text-[9px] font-black uppercase tracking-widest">{formatTime(status.positionMillis)}</Text>
                <Text className="text-white/40 text-[9px] font-black uppercase tracking-widest">{formatTime(status.durationMillis)}</Text>
              </View>
              <TouchableOpacity 
                activeOpacity={1}
                onPress={(event) => {
                  const { locationX } = event.nativeEvent;
                  const barWidth = width - 48;
                  const seekPercentage = Math.max(0, Math.min(1, locationX / barWidth));
                  const seekPosition = seekPercentage * status.durationMillis;
                  if (videoRef.current && status.isLoaded) videoRef.current.setPositionAsync(seekPosition);
                }}
                className="h-16 justify-center -my-8"
              >
                <View className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <View style={{ width: `${progress * 100}%` }} className="h-full bg-[#FF5722]" />
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* SYMMETRIC BOTTOM PILL */}
          <View className="flex-row items-center justify-between bg-black/40 px-2 py-2 rounded-[28px] border border-white/5">
            <View className="flex-1 py-1 ml-2">
              <Text className="text-white text-[11px] font-black tracking-widest uppercase" numberOfLines={1}>
                {currentVideo?.title || program.title}
              </Text>
              <View className="flex-row items-center mt-1">
                <View className="w-1 h-1 rounded-full bg-[#FF5722] mr-2" />
                <Text className="text-white/40 font-bold text-[8px] uppercase tracking-widest">
                  {playlist.length > 1 ? `EPISODE ${currentIndex + 1} / ${playlist.length}` : 'SINGLE SESSION'}
                </Text>
              </View>
            </View>
            
            {playlist.length > 1 && (
              <TouchableOpacity 
                onPress={() => setShowEpisodes(true)}
                className="bg-[#FF5722] w-10 h-10 rounded-full items-center justify-center shadow-xl shadow-[#FF5722]/30"
              >
                <ListMusic color="white" size={18} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}
