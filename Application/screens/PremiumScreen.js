import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Animated, Linking, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Crown, Sparkles, Zap, Target, ShieldCheck, ArrowUpRight, Headset, Droplet } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

export default function PremiumScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [selectedPlan, setSelectedPlan] = React.useState('annual');

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View className="flex-1 bg-[#0A0A0A]">
      {/* ULTRA MODERN AMBIENT GLOWS */}
      <View style={{ backgroundColor: '#FF5722' }} className="absolute -top-40 -right-40 w-[450px] h-[450px] rounded-full blur-[110px] opacity-[0.15]" />
      <View style={{ backgroundColor: '#3B82F6' }} className="absolute bottom-20 -left-40 w-[350px] h-[350px] rounded-full blur-[100px] opacity-[0.1]" />

      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="px-6 py-2 flex-row items-center justify-between z-50">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="bg-white/5 p-3 rounded-2xl border border-white/10"
          >
            <ChevronLeft color="#FFF" size={24} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-6">
          {/* HERO SECTION - GLASS CROWN */}
          <View className="items-center mt-0 mb-10">
            <View className="relative">
              <View className="absolute inset-0 bg-orange-500 blur-[40px] opacity-20 scale-150" />
              <View className="bg-white/5 p-8 rounded-[42px] border border-white/15 shadow-2xl">
                <Crown color="#FF5722" size={56} fill="#FF5722" />
              </View>
            </View>
            
            <View className="mt-6 items-center">
              <Text className="text-gray-400 font-black text-[10px] uppercase tracking-[7px] mb-3 opacity-60">Elite Membership</Text>
              <Text className="text-6xl font-black text-white tracking-tighter leading-[54px]">Premium</Text>
            </View>
          </View>

          {/* FEATURE GRID - HIGH END */}
          <View className="space-y-4 mb-14">
            {[
              { title: 'AI Voice Coach', desc: 'Real-time guidance for form & tempo', icon: <Sparkles color="#FF5722" size={22} />, bg: 'bg-orange-500/10' },
              { title: 'Premium Dark Mode', desc: 'The ultimate sleek interface', icon: <Zap color="#3B82F6" size={22} />, bg: 'bg-blue-500/10' },
              { title: 'Pro Analytics', desc: 'Volume trends & performance insights', icon: <Target color="#22C55E" size={22} />, bg: 'bg-green-500/10' },
              { title: 'Personalized Plans', desc: 'Workouts adapted to your progress', icon: <ShieldCheck color="#EF4444" size={22} />, bg: 'bg-red-500/10' },
              { title: 'Exclusive Workouts', desc: 'World-class elite trainer routines', icon: <Crown color="#A855F7" size={22} />, bg: 'bg-purple-500/10' },
              { title: 'Advanced Recovery', desc: 'Guided stretches & mobility flows', icon: <Droplet color="#06B6D4" size={22} />, bg: 'bg-cyan-500/10' },
              { title: 'Cloud Sync', desc: 'Instant backup of all your progress', icon: <Zap color="#F59E0B" size={22} />, bg: 'bg-amber-500/10' },
              { title: 'Priority Support', desc: '24/7 dedicated elite assistance', icon: <Headset color="#EC4899" size={22} />, bg: 'bg-pink-500/10' }
            ].map((feat, i) => (
              <View key={i} className="flex-row items-center bg-white/[0.04] p-5 rounded-[32px] border border-white/5">
                <View className={`${feat.bg} p-4 rounded-[22px] border border-white/10`}>{feat.icon}</View>
                <View className="ml-5 flex-1">
                  <Text className="text-white font-black text-[17px] tracking-tight mb-0.5">{feat.title}</Text>
                  <Text className="text-gray-500 font-bold text-[11px] uppercase tracking-wider opacity-80">{feat.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* PRICING - "2 MONTHS FREE" PSYCHOLOGY */}
          <View className="space-y-4 mb-10">
            <TouchableOpacity 
              onPress={() => handleSelectPlan('annual')}
              className={`rounded-[40px] p-7 border ${selectedPlan === 'annual' ? 'bg-white/[0.12] border-orange-500' : 'bg-white/[0.04] border-white/5'} relative overflow-hidden active:scale-[0.98] transition-all`}
            >
              <View className="absolute top-0 right-0 bg-[#FF5722] px-6 py-2 rounded-bl-3xl border-l border-b border-white/20">
                <Text className="text-white font-black text-[9px] uppercase tracking-widest">Best Value</Text>
              </View>
              
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-white font-black text-2xl tracking-tighter">Annual Elite</Text>
                  <View className="flex-row items-center mt-1">
                    <Text className="text-orange-500 font-black text-xs uppercase tracking-widest">Get 2 Months Free</Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text className="text-white font-black text-3xl">$5.99</Text>
                  <Text className="text-gray-500 font-bold text-[10px] uppercase tracking-widest">per month</Text>
                </View>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => handleSelectPlan('monthly')}
              className={`rounded-[40px] p-7 border ${selectedPlan === 'monthly' ? 'bg-white/[0.12] border-orange-500' : 'bg-white/[0.04] border-white/5'} flex-row items-center justify-between active:scale-[0.98] transition-all`}
            >
              <View>
                <Text className="text-white font-black text-xl tracking-tighter">Monthly Access</Text>
                <Text className="text-gray-500 font-bold text-xs mt-1">Standard subscription</Text>
              </View>
              <View className="items-end">
                <Text className="text-white font-black text-2xl">$9.99</Text>
                <Text className="text-gray-500 font-bold text-[10px] uppercase tracking-widest">per month</Text>
              </View>
            </TouchableOpacity>
          </View>
          
          <View className="h-10" />
        </ScrollView>

        {/* ACTION FOOTER */}
        <View className="px-6 pt-8 border-t border-white/5" style={{ paddingBottom: Math.max(insets.bottom + 20, 48) }}>
          <View className="bg-orange-500/10 self-center px-4 py-1.5 rounded-full border border-orange-500/20 mb-5">
            <Text className="text-orange-500 font-black text-[9px] uppercase tracking-[3px]">Trial: 7 Days Free</Text>
          </View>

          <TouchableOpacity 
            className="bg-[#FF5722] py-6 rounded-[36px] items-center shadow-2xl shadow-orange-500/50 flex-row justify-center mb-6 active:scale-[0.97]" 
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Linking.openURL('https://gogym.milanwebportal.com/premium');
            }}
          >
            <Text className="text-white text-xl font-black mr-4 uppercase tracking-[4px]">Start Free Trial</Text>
            <ArrowUpRight color="white" size={26} strokeWidth={3} />
          </TouchableOpacity>
          
          <View className="flex-row items-center justify-center space-x-10 opacity-30">
            <TouchableOpacity><Text className="text-white text-[10px] font-black uppercase tracking-widest">Restore</Text></TouchableOpacity>
            <TouchableOpacity><Text className="text-white text-[10px] font-black uppercase tracking-widest">Terms</Text></TouchableOpacity>
            <TouchableOpacity><Text className="text-white text-[10px] font-black uppercase tracking-widest">Privacy</Text></TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
