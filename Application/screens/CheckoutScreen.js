import React, { useRef, useEffect } from 'react';

const AdBanner = ({ extraClass = '' }) => (
  <View className={`h-16 bg-gray-50 items-center justify-center border border-dashed border-gray-200 rounded-2xl my-4 ${extraClass}`}>
    <Text className="text-gray-300 text-[10px] font-black tracking-[3px] uppercase">Advertisement</Text>
  </View>
);
import { View, Text, TouchableOpacity, ScrollView, Image, Animated, Easing, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ShieldCheck, CreditCard, CheckCircle2, Crown, Lock, Clock, Flame, Zap } from 'lucide-react-native';
import { useIsFocused } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

function FadeInView({ delay = 0, children, style, ready = true, ...props }) {
  const isFocused = useIsFocused();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;
  const scale = useRef(new Animated.Value(0.97)).current;
  const animRef = useRef(null);

  useEffect(() => {
    if (isFocused && ready) {
      opacity.setValue(0);
      translateY.setValue(18);
      scale.setValue(0.97);
      animRef.current = Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 500, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 500, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, friction: 8, tension: 40, delay, useNativeDriver: true }),
      ]);
      animRef.current.start();
    } else {
      opacity.setValue(0);
      translateY.setValue(18);
      scale.setValue(0.97);
    }
    return () => { if (animRef.current) animRef.current.stop(); };
  }, [isFocused, ready, delay]);

  return (
    <Animated.View {...props} style={[{ opacity, transform: [{ translateY }, { scale }] }, style]}>
      {children}
    </Animated.View>
  );
}

export default function CheckoutScreen({ navigation, route }) {
  const { program, trainer } = route.params;
  const insets = useSafeAreaInsets();

  const benefits = [
    'Full Lifetime Access',
    'Interactive HD Video Library',
    'Custom Nutrition Protocol',
    'Performance Analytics',
    '24/7 Coach Support',
  ];

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header — matches TrainerDetail exactly */}
      <View className="px-6 py-4 flex-row items-center justify-between bg-white border-b border-gray-50 z-50 shadow-sm shadow-black/5">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          className="bg-gray-50 p-2 rounded-xl"
        >
          <ChevronLeft color="#000" size={24} />
        </TouchableOpacity>
        <Text className="text-gray-900 font-black text-lg">Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 100 }}
      >
        {/* Trainer + Program Hero */}
        <FadeInView delay={80} className="px-6 mt-6">
          <View className="bg-gray-900 rounded-[40px] p-8 overflow-hidden shadow-2xl shadow-black/20 border border-white/5">
            <View className="absolute -top-20 -right-20 w-64 h-64 bg-[#FF5722]/10 rounded-full" />

            <View className="flex-row justify-between items-start mb-8">
              <View className="bg-white/10 px-4 py-2 rounded-2xl flex-row items-center">
                <Crown color="#FF5722" size={13} fill="#FF5722" />
                <Text className="text-white font-black text-[10px] uppercase tracking-widest ml-2">Premium</Text>
              </View>
              <Zap color="#FF5722" size={22} />
            </View>

            <Text className="text-white text-3xl font-black mb-3 leading-10">{program.title}</Text>

            <View className="flex-row items-center space-x-6 mb-6">
              {program.duration_weeks && (
                <View className="flex-row items-center">
                  <Clock color="white" size={14} opacity={0.4} />
                  <Text className="text-white/40 font-black text-[10px] ml-2 uppercase tracking-widest">
                    {program.duration_weeks} Weeks
                  </Text>
                </View>
              )}
              {program.difficulty && (
                <>
                  <View className="w-1 h-1 bg-white/10 rounded-full" />
                  <View className="flex-row items-center">
                    <Flame color="#FF5722" size={14} />
                    <Text className="text-white/40 font-black text-[10px] ml-2 uppercase tracking-widest">
                      {program.difficulty}
                    </Text>
                  </View>
                </>
              )}
            </View>

            {/* Trainer row inside dark card */}
            <View className="flex-row items-center mt-2 border-t border-white/5 pt-6">
              <Image
                source={{ uri: trainer?.image || 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=200&q=80' }}
                className="w-12 h-12 rounded-2xl bg-white/10"
              />
              <View className="ml-4">
                <Text className="text-white/40 font-bold text-[9px] uppercase tracking-[3px]">Coach</Text>
                <Text className="text-white font-black text-base">{trainer?.name || 'Professional Coach'}</Text>
              </View>
              <View className="ml-auto bg-green-500/20 px-3 py-1 rounded-xl">
                <Text className="text-green-400 font-black text-[9px] uppercase tracking-wider">Verified</Text>
              </View>
            </View>
          </View>
        </FadeInView>

        {/* What's included */}
        <FadeInView delay={160} className="px-6 mt-6">
          <View className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm shadow-gray-200">
            <Text className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-5">Access Includes</Text>
            <View className="space-y-4">
              {benefits.map((benefit, i) => (
                <View key={i} className="flex-row items-center">
                  <View className="bg-orange-50 p-1.5 rounded-xl border border-orange-100 mr-4">
                    <CheckCircle2 color="#FF5722" size={14} />
                  </View>
                  <Text className="text-gray-800 font-bold text-sm flex-1">{benefit}</Text>
                </View>
              ))}
            </View>
          </View>
        </FadeInView>

        {/* Price + CTA */}
        <FadeInView delay={240} className="px-6 mt-6">
          <View className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm shadow-gray-200">
            <View className="flex-row items-center justify-between mb-6">
              <View>
                <Text className="text-gray-400 font-bold text-[10px] uppercase tracking-widest mb-1">Total Price</Text>
                <Text className="text-gray-900 text-4xl font-black tracking-tighter">
                  {program.price}
                  <Text className="text-lg text-gray-400 font-bold"> {program.currency || trainer?.currency || 'RSD'}</Text>
                </Text>
              </View>
              <View className="items-center">
                <ShieldCheck color="#22C55E" size={28} />
                <Text className="text-green-500 font-black text-[8px] uppercase tracking-widest mt-1">Secure</Text>
              </View>
            </View>

            <TouchableOpacity
              className="bg-[#FF5722] py-5 rounded-[24px] items-center justify-center flex-row shadow-xl shadow-orange-500/40 active:scale-95"
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                alert('Opening Secure Payment Portal...');
              }}
            >
              <CreditCard color="white" size={20} />
              <Text className="text-white font-black text-base uppercase tracking-widest ml-3">Pay Now</Text>
            </TouchableOpacity>

            <View className="mt-5 flex-row items-center justify-center opacity-30">
              <Lock color="#111" size={10} />
              <Text className="text-gray-900 font-bold text-[9px] uppercase tracking-widest ml-2">SSL Encrypted · 256-bit</Text>
            </View>
          </View>
        </FadeInView>

        {/* Ad Banner */}
        <FadeInView delay={320} className="px-6 mt-2">
          <AdBanner />
        </FadeInView>
      </ScrollView>
    </SafeAreaView>
  );
}
