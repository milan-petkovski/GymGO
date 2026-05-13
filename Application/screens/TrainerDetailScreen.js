import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Animated, Easing, ActivityIndicator, Modal, TextInput, Alert, Linking } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { supabase } from '../supabaseClient';
import { 
  ChevronLeft, 
  Star, 
  Play, 
  Lock, 
  CheckCircle2, 
  Clock, 
  Flame,
  ChevronRight,
  ShieldCheck,
  Award, 
  BookOpen, 
  Globe, 
  Briefcase, 
  MessageSquare,
  X,
  MapPin,
  Phone,
  AlertCircle,
  Crown,
  Zap
} from 'lucide-react-native';

const StarFull = Star;

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

export default function TrainerDetailScreen({ navigation, route }) {
  const { trainer } = route.params;
  const insets = useSafeAreaInsets();
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userPurchases, setUserPurchases] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [trainerDetails, setTrainerDetails] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchTrainerContent();
  }, []);

  const fetchTrainerContent = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      const { data: tpData } = await supabase
        .from('trainer_profiles')
        .select('*, profiles:user_id(*), training_programs(*), gyms(*)')
        .eq('id', trainer.id)
        .single();

      if (tpData) {
        setTrainerDetails(tpData);
        if (tpData.training_programs) setPrograms(tpData.training_programs);
      }

      // Fetch user purchases for these programs
      if (user) {
        const { data: pData } = await supabase
          .from('user_purchases') // Assuming this table exists
          .select('program_id')
          .eq('user_id', user.id);
        
        if (pData) setUserPurchases(pData.map(p => p.program_id));
      }

    } catch (error) {
      console.error('Error fetching trainer content:', error);
    } finally {
      setLoading(false);
    }
  };

  const [statusModal, setStatusModal] = useState({ visible: false, type: 'success', title: '', message: '' });

  const showStatus = (type, title, message) => {
    setStatusModal({ visible: true, type, title, message });
    if (type === 'success') {
      setTimeout(() => {
        setStatusModal(prev => ({ ...prev, visible: false }));
      }, 3000);
    }
  };

  const submitReview = async () => {
    if (!currentUser) {
      showStatus('error', 'Error', 'You must be logged in to leave a review.');
      return;
    }

    if (currentUser.id === trainerDetails?.user_id) {
      showStatus('error', 'Error', 'Trainers cannot review themselves.');
      return;
    }

    try {
      setIsSubmitting(true);
      
      const { error: insertError } = await supabase
        .from('trainer_reviews')
        .insert({
          trainer_id: trainer.id,
          user_id: currentUser.id,
          rating: newRating,
          comment: newComment
        });

      if (insertError) throw insertError;

      const { data: reviews, error: fetchError } = await supabase
        .from('trainer_reviews')
        .select('rating')
        .eq('trainer_id', trainer.id);

      if (fetchError) throw fetchError;

      const totalReviews = reviews.length;
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews;

      const { error: updateError } = await supabase
        .from('trainer_profiles')
        .update({
          rating_avg: avgRating.toFixed(1),
          total_reviews: totalReviews
        })
        .eq('id', trainer.id);

      if (updateError) throw updateError;

      showStatus('success', 'Success!', 'Review submitted successfully.');
      setShowReviewModal(false);
      setNewComment('');
      fetchTrainerContent();
    } catch (error) {
      console.error('Error submitting review:', error);
      showStatus('error', 'Failed', 'Make sure trainer_reviews table exists.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenProgram = (program) => {
    const isPurchased = userPurchases.includes(program.id) || !program.is_premium;
    if (isPurchased) {
      navigation.navigate('VideoPlayer', { program });
    } else {
      navigation.navigate('Checkout', { program, trainer });
    }
  };


  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className="px-6 py-4 flex-row items-center justify-between bg-white border-b border-gray-50 z-50 shadow-sm shadow-black/5">
        <TouchableOpacity onPress={() => navigation.goBack()} className="bg-gray-50 p-2 rounded-xl">
          <ChevronLeft color="#000" size={24} />
        </TouchableOpacity>
        <Text className="text-gray-900 font-black text-lg">Trainer Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <FadeInView delay={100} className="px-6 items-center mt-6">
          <View className="relative">
            <Image source={{ uri: trainer.image }} className="w-32 h-32 rounded-[40px] border-4 border-white shadow-2xl" />
            {trainerDetails?.profiles?.is_verified && (
              <View className="absolute -bottom-2 -right-2 bg-blue-500 p-2 rounded-2xl border-4 border-white">
                <ShieldCheck color="white" size={20} />
              </View>
            )}
          </View>
          <Text className="text-3xl font-black text-gray-900 mt-6">{trainer?.name}</Text>
          
          <View className="flex-row flex-wrap justify-center mt-4 px-4">
            {(trainerDetails?.specializations || [trainer?.specialty]).map((spec, i) => (
              <View key={i} className="bg-orange-50 px-4 py-2 rounded-2xl m-1 border border-orange-100">
                <Text className="text-[#FF5722] font-black text-[10px] uppercase tracking-[1px]">{spec}</Text>
              </View>
            ))}
          </View>
          
          <View className="flex-row items-center mt-6 bg-gray-50 px-6 py-4 rounded-[28px] border border-gray-100">
            <View className="flex-row items-center">
              <Star color="#FBBF24" size={18} fill="#FBBF24" />
              <Text className="text-gray-900 font-black text-base ml-2">{trainer?.rating}</Text>
            </View>
            <View className="w-[1px] h-6 bg-gray-200 mx-6" />
            <Text className="text-gray-400 font-bold text-[11px] uppercase tracking-widest">{trainer?.reviews} Reviews</Text>
          </View>

          {trainerDetails?.gyms && (
            <View className="mt-4 flex-row items-center">
              <MapPin color="#9CA3AF" size={14} />
              <Text className="text-gray-400 font-bold text-[10px] ml-2 uppercase tracking-widest">
                Works at {trainerDetails?.gyms?.name}
              </Text>
            </View>
          )}
        </FadeInView>

        <View className="px-6 mt-8">
          <View className="flex-row justify-between mb-4">
            {trainerDetails?.years_of_experience !== null && trainerDetails?.years_of_experience !== undefined && (
              <View style={{ width: '48%' }}>
                <View className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm shadow-gray-200" style={{ minHeight: 110 }}>
                  <View className="bg-blue-500/10 p-3 rounded-2xl self-start mb-3">
                    <Briefcase color="#3B82F6" size={18} />
                  </View>
                  <Text className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-1">Experience</Text>
                  <Text className="text-gray-900 font-black text-base">{trainerDetails?.years_of_experience} Years</Text>
                </View>
              </View>
            )}

            {trainerDetails?.profiles?.city && (
              <View style={{ width: '48%' }}>
                <View className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm shadow-gray-200" style={{ minHeight: 110 }}>
                  <View className="bg-red-500/10 p-3 rounded-2xl self-start mb-3">
                    <MapPin color="#EF4444" size={18} />
                  </View>
                  <Text className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-1">Location</Text>
                  <Text className="text-gray-900 font-black text-base">{trainerDetails?.profiles?.city}</Text>
                </View>
              </View>
            )}
          </View>

          {trainerDetails?.languages && trainerDetails?.languages?.length > 0 && (
            <View className="w-full mb-4">
              <View className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm shadow-gray-200">
                <View className="flex-row items-center">
                  <View className="bg-green-500/10 p-3 rounded-2xl mr-4">
                    <Globe color="#22C55E" size={20} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-1">Languages</Text>
                    <Text className="text-gray-900 font-black text-base">
                      {trainerDetails?.languages?.join(', ')}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {trainerDetails?.certifications && (
            <View className="w-full mb-4">
              <View className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm shadow-gray-200">
                <View className="flex-row items-center">
                  <View className="bg-orange-500/10 p-3 rounded-2xl mr-4">
                    <Award color="#FF5722" size={20} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-1">Certification</Text>
                    <Text className="text-gray-900 font-black text-base">
                      {(() => {
                        try {
                          const certs = typeof trainerDetails?.certifications === 'string' 
                            ? JSON.parse(trainerDetails?.certifications) 
                            : trainerDetails?.certifications;
                          return Array.isArray(certs) ? (certs[0]?.name || certs[0]) : (certs?.name || certs);
                        } catch (e) { return trainerDetails?.certifications; }
                      })()}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {trainerDetails?.working_hours && (
            <View className="w-full mb-4">
              <View className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm shadow-gray-200">
                <View className="flex-row items-center">
                  <View className="bg-amber-500/10 p-3 rounded-2xl mr-4">
                    <Clock color="#F59E0B" size={20} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-1">Working Hours</Text>
                    <View className="mt-3">
                      {(() => {
                        if (typeof trainerDetails?.working_hours !== 'object') return <Text className="text-gray-900 font-black text-base">{trainerDetails?.working_hours}</Text>;
                        const dayOrder = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
                        const dayNames = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' };
                        return dayOrder.map(day => {
                          const time = trainerDetails?.working_hours[day];
                          if (!time) return null;
                          return (
                            <View key={day} className="flex-row justify-between items-center py-1.5 border-b border-gray-50 last:border-0">
                              <Text className="text-gray-400 font-bold text-[11px]">{dayNames[day]}</Text>
                              <Text className={`font-black text-sm ${time === 'closed' ? 'text-red-400' : 'text-gray-900'}`}>{time === 'closed' ? 'Closed' : time}</Text>
                            </View>
                          );
                        }).filter(Boolean);
                      })()}
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        {trainerDetails?.is_available_for_online && (
          <FadeInView delay={250} className="px-6 mt-4">
            <View className="bg-cyan-500/5 p-5 rounded-[28px] border border-cyan-500/10 flex-row items-center">
              <View className="bg-cyan-500/10 p-3 rounded-2xl mr-4">
                <Globe color="#06B6D4" size={20} />
              </View>
              <View>
                <Text className="text-cyan-600 font-black text-[9px] uppercase tracking-[2px] mb-1">Availability</Text>
                <Text className="text-gray-900 font-black text-base">Online Coaching Available</Text>
              </View>
            </View>
          </FadeInView>
        )}

        {trainerDetails?.biography && (
          <FadeInView delay={300} className="px-6 mt-8">
            <Text className="text-2xl font-black text-gray-900 mb-4">Biography</Text>
            <Text className="text-gray-500 font-medium leading-7 text-base">
              {trainerDetails?.biography}
            </Text>
          </FadeInView>
        )}

        <View className="px-6 mt-10 mb-20">
          <Text className="text-2xl font-black text-gray-900 mb-6">Programs & Services</Text>
          
          {loading ? (
            <ActivityIndicator color="#FF5722" />
          ) : (
            programs?.length > 0 ? (
              programs.map((program, idx) => {
                const isPurchased = userPurchases?.includes(program?.id) || !program?.is_premium;
                return (
                  <FadeInView key={program?.id} delay={idx * 150}>
                    <View className="bg-gray-900 rounded-[40px] p-8 mb-6 overflow-hidden shadow-2xl shadow-black/20 border border-white/5">
                      <View className="absolute -top-20 -right-20 w-64 h-64 bg-[#FF5722]/10 rounded-full blur-3xl" />
                      
                      <View className="flex-row justify-between items-start mb-8">
                        <View className="bg-white/10 px-4 py-2 rounded-2xl flex-row items-center">
                          <Crown color="#FF5722" size={14} fill="#FF5722" />
                          <Text className="text-white font-black text-[10px] uppercase tracking-widest ml-2">Premium</Text>
                        </View>
                        <Zap color="#FF5722" size={24} />
                      </View>

                      <Text className="text-white text-3xl font-black mb-4 leading-10">{program?.title}</Text>
                      
                      <View className="flex-row items-center space-x-6 mb-8">
                        <View className="flex-row items-center">
                          <Clock color="white" size={16} opacity={0.4} />
                          <Text className="text-white/40 font-black text-[10px] ml-2 uppercase tracking-widest">{program?.duration_weeks} Weeks</Text>
                        </View>
                        <View className="w-1 h-1 bg-white/10 rounded-full mx-2" />
                        <View className="flex-row items-center">
                          <Flame color="#FF5722" size={16} />
                          <Text className="text-white/40 font-black text-[10px] ml-2 uppercase tracking-widest">{program?.difficulty}</Text>
                        </View>
                      </View>

                      <TouchableOpacity 
                        onPress={() => handleOpenProgram(program)}
                        className={`py-5 rounded-[24px] items-center justify-center flex-row ${isPurchased ? 'bg-white' : 'bg-[#FF5722]'}`}
                      >
                        {isPurchased ? (
                          <>
                            <Play color="black" size={18} fill="black" />
                            <Text className="text-black font-black uppercase tracking-widest ml-2 text-sm">Start Training</Text>
                          </>
                        ) : (
                          <>
                            <Lock color="white" size={18} />
                            <Text className="text-white font-black uppercase tracking-widest ml-2 text-sm">Unlock for {program?.price} {program?.currency || trainerDetails?.currency || 'RSD'}</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </FadeInView>
                );
              })
            ) : (
              <View className="bg-gray-50 rounded-[40px] p-10 items-center border border-dashed border-gray-200">
                <Lock color="#D1D5DB" size={48} />
                <Text className="text-gray-400 font-black mt-4 text-center uppercase tracking-widest text-[10px]">No programs yet</Text>
              </View>
            )
          )}
        </View>
      </ScrollView>

      <View 
        style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        className="px-6 pt-6 border-t border-gray-100 flex-row bg-white items-center shadow-2xl shadow-black/5"
      >
        <View className="flex-1">
          <Text className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-1">Session Rate</Text>
          <Text className="text-gray-900 font-black text-2xl">
            {trainerDetails?.hourly_rate} <Text className="text-sm text-gray-400 font-bold">{trainerDetails?.currency || 'RSD'}</Text>
          </Text>
        </View>
        <Animated.View>
          <TouchableOpacity 
            onPress={() => Linking.openURL(`tel:${trainerDetails?.profiles?.phone}`)}
            className="bg-[#FF5722] px-10 h-16 rounded-[24px] items-center justify-center shadow-xl shadow-orange-500/40"
          >
            <Text className="text-white font-black text-base uppercase tracking-widest">Book Now</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>

      <Modal visible={showReviewModal} animationType="slide" transparent>
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-white rounded-t-[40px] p-8 pb-10 h-[60%] shadow-2xl">
            <View className="flex-row justify-between items-center mb-8">
              <Text className="text-2xl font-black text-gray-900">Leave a Review</Text>
              <TouchableOpacity onPress={() => setShowReviewModal(false)} className="bg-gray-100 p-2 rounded-full">
                <X color="#6B7280" size={20} />
              </TouchableOpacity>
            </View>

            <Text className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-4">Rate your experience</Text>
            <View className="flex-row mb-8">
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setNewRating(star)} className="mr-3">
                  <StarFull 
                    color={star <= newRating ? "#FBBF24" : "#E5E7EB"} 
                    fill={star <= newRating ? "#FBBF24" : "transparent"} 
                    size={32} 
                  />
                </TouchableOpacity>
              ))}
            </View>

            <Text className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-4">Your comment</Text>
            <TextInput
              multiline
              placeholder="Tell us about your training session..."
              className="bg-gray-50 rounded-2xl p-5 h-32 font-medium text-gray-900 border border-gray-100"
              value={newComment}
              onChangeText={setNewComment}
              placeholderTextColor="#9CA3AF"
            />

            <TouchableOpacity 
              onPress={submitReview}
              disabled={isSubmitting}
              className={`mt-8 py-5 rounded-3xl items-center shadow-lg ${isSubmitting ? 'bg-gray-400' : 'bg-[#FF5722] shadow-orange-500/40'}`}
            >
              {isSubmitting ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-black text-base uppercase tracking-widest">SUBMIT REVIEW</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* STATUS MODAL (Custom Alert) */}
      <Modal visible={statusModal.visible} transparent animationType="fade">
        <View className="flex-1 bg-black/40 justify-center items-center px-10">
          <Animated.View className="bg-white w-full rounded-[40px] p-8 items-center shadow-2xl">
            <View className={`p-5 rounded-full mb-6 ${statusModal.type === 'success' ? 'bg-green-50' : 'bg-red-50'}`}>
              {statusModal.type === 'success' ? (
                <CheckCircle2 color="#22C55E" size={48} />
              ) : (
                <AlertCircle color="#EF4444" size={48} />
              )}
            </View>
            <Text className="text-2xl font-black text-gray-900 mb-2">{statusModal.title}</Text>
            <Text className="text-gray-500 font-medium text-center leading-6 mb-8">{statusModal.message}</Text>
            <TouchableOpacity 
              onPress={() => setStatusModal(prev => ({ ...prev, visible: false }))}
              className={`w-full py-5 rounded-3xl items-center ${statusModal.type === 'success' ? 'bg-green-500 shadow-green-500/40' : 'bg-red-500 shadow-red-500/40'} shadow-lg`}
            >
              <Text className="text-white font-black text-base uppercase tracking-widest">Continue</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
