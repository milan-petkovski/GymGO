import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
  Linking
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Mail, Lock, User, ArrowRight, ChevronLeft, AlertCircle, CheckCircle2, Eye, EyeOff, Check } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { supabase } from '../supabaseClient';
import { useOnboardingStore } from '../store/useOnboardingStore';

export default function AuthScreen() {
  const [view, setView] = useState('login'); // 'login', 'signup', 'forgot'
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const lastNameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const codeInputRef = useRef(null);
  const [resendTimer, setResendTimer] = useState(0);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendTimer]);

  const setBasicInfo = useOnboardingStore(state => state.setBasicInfo);

  // Field errors for per-field validation
  const [fieldErrors, setFieldErrors] = useState({});

  const insets = useSafeAreaInsets();

  // Custom Alert State (kept for server errors)
  const [alert, setAlert] = useState({ visible: false, message: '', type: 'error' });
  const alertAnim = useState(new Animated.Value(-100))[0];

  const showAlert = (message, type = 'error') => {
    setAlert({ visible: true, message, type });
    Animated.spring(alertAnim, {
      toValue: insets.top > 0 ? insets.top : 20,
      useNativeDriver: true,
    }).start();

    setTimeout(() => {
      Animated.timing(alertAnim, {
        toValue: -150,
        duration: 500,
        useNativeDriver: true,
      }).start(() => setAlert({ ...alert, visible: false }));
    }, 5000);
  };

  const clearFieldError = (field) => {
    setFieldErrors(prev => ({ ...prev, [field]: null }));
  };

  const validateForm = () => {
    const errors = {};

    if (view === 'signup') {
      if (!firstName.trim()) {
        errors.firstName = 'Please enter your name';
      }
      if (!lastName.trim()) {
        errors.lastName = 'Please enter your surname';
      }
      if (!agreedToTerms) {
        errors.terms = 'You must accept the terms';
      }
    }

    if (!email.trim()) {
      errors.email = 'Please enter your email address';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }

    if (view !== 'forgot') {
      if (!password) {
        errors.password = 'Please enter your password';
      } else if (password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  async function handleAuth() {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (view === 'login') {
      const { error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: trimmedPassword,
      });
      if (!error) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      if (error) {
        if (error.message.toLowerCase().includes('email not confirmed')) {
          setView('verify');
          showAlert('Please verify your email first', 'info');
          await supabase.auth.resend({ type: 'signup', email: trimmedEmail });
        } else {
          showAlert(error.message);
        }
      }
    } else if (view === 'signup') {
      const { data: { user, session }, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: trimmedPassword,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (signUpError) {
        showAlert(signUpError.message);
      } else if (session) {
        // Ako je email confirmation isključen u Supabase, odmah smo ulogovani
        setBasicInfo(firstName, lastName, trimmedEmail);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showAlert('Account created successfully!', 'success');
        // Navigacija će se desiti automatski jer se session promenio u App.js
      } else if (user) {
        // Ako je email confirmation uključen, idemo na verify
        setBasicInfo(firstName, lastName, trimmedEmail);
        setView('verify');
        showAlert('Verification link sent to your email', 'success');
      }
    }
    setLoading(false);
  }

  async function handleVerify() {
    if (verificationCode.length !== 6) {
      showAlert('Please enter a 6-digit code');
      return;
    }

    setLoading(true);
    const { data: { session }, error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: verificationCode.trim(),
      type: 'signup',
    });
 
    if (error) {
      showAlert(error.message);
    } else if (session) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showAlert('Email verified successfully!', 'success');
    }
    setLoading(false);
  }

  async function handleResendCode() {
    if (resendTimer > 0) return;
    setLoading(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim().toLowerCase(),
    });
    setLoading(false);
    if (error) showAlert(error.message);
    else {
      showAlert('Verification code resent!', 'success');
      setResendTimer(30);
    }
  }

  async function handleResetPassword() {
    if (!email.trim()) {
      setFieldErrors({ email: 'Please enter your email address' });
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFieldErrors({ email: 'Please enter a valid email address' });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
    setLoading(false);
    if (error) showAlert(error.message);
    else {
      showAlert('Reset link has been sent to your email!', 'success');
      setView('login');
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Custom Alert - only for server errors */}
      <Animated.View
        style={{ transform: [{ translateY: alertAnim }] }}
        className={`absolute top-0 left-6 right-6 p-4 rounded-2xl flex-row items-center z-50 shadow-lg ${alert.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}
      >
        {alert.type === 'success' ? <CheckCircle2 color="white" size={24} /> : <AlertCircle color="white" size={24} />}
        <Text className="text-white font-bold ml-3 flex-1">{alert.message}</Text>
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          className="p-6"
        >
          {/* Back Button for Forgot Password */}
          {view === 'forgot' && (
            <TouchableOpacity onPress={() => setView('login')} className="mb-4">
              <ChevronLeft color="#111" size={28} />
            </TouchableOpacity>
          )}

          {/* Logo & Header */}
          <View className="items-center mt-4 mb-12">
            <Image
              source={require('../assets/2.png')}
              style={{ width: 100, height: 100, resizeMode: 'contain' }}
            />
            <Text className="text-3xl font-black text-gray-900 mt-4 text-center w-full">
              {view === 'login' ? 'Welcome Back' :
                view === 'signup' ? 'Join us' :
                  view === 'verify' ? 'Verify Email' : 'Reset Password'}
            </Text>
            <Text className="text-gray-500 mt-2 font-medium text-center px-4">
              {view === 'login' ? 'Continue your fitness journey with us' :
                view === 'signup' ? 'Start your transformation today' :
                  view === 'verify' ? "Enter the code sent to your email" : 'Enter your email to get a password reset link'}
            </Text>
          </View>

          {/* Form */}
          <View className="space-y-4">
            {view === 'signup' && (
              <View className="flex-row space-x-4 mb-4">
                <View className="flex-1">
                  <Text className="text-sm font-bold text-gray-700 mb-2 ml-1">First Name</Text>
                  <View className={`flex-row items-center bg-gray-50 border ${fieldErrors.firstName ? 'border-rose-400' : 'border-gray-100'} rounded-2xl px-4 h-16`}>
                    <User size={20} color="#9CA3AF" />
                    <TextInput
                      className="flex-1 ml-3 text-gray-900 font-bold"
                      placeholder="Your name"
                      placeholderTextColor="#CBD5E1"
                      value={firstName}
                      onChangeText={(v) => { setFirstName(v); clearFieldError('firstName'); }}
                      returnKeyType="next"
                      blurOnSubmit={false}
                      onSubmitEditing={() => lastNameRef.current?.focus()}
                    />
                  </View>
                  {fieldErrors.firstName && (
                    <Text className="text-rose-500 text-sm font-medium ml-1 mt-1">{fieldErrors.firstName}</Text>
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-gray-700 mb-2 ml-1">Last Name</Text>
                  <View className={`flex-row items-center bg-gray-50 border ${fieldErrors.lastName ? 'border-rose-400' : 'border-gray-100'} rounded-2xl px-4 h-16`}>
                    <User size={20} color="#9CA3AF" />
                    <TextInput
                      className="flex-1 ml-3 text-gray-900 font-bold"
                      placeholder="Your surname"
                      placeholderTextColor="#CBD5E1"
                      value={lastName}
                      onChangeText={(v) => { setLastName(v); clearFieldError('lastName'); }}
                      ref={lastNameRef}
                      returnKeyType="next"
                      blurOnSubmit={false}
                      onSubmitEditing={() => emailRef.current?.focus()}
                    />
                  </View>
                  {fieldErrors.lastName && (
                    <Text className="text-rose-500 text-sm font-medium ml-1 mt-1">{fieldErrors.lastName}</Text>
                  )}
                </View>
              </View>
            )}

            {view !== 'verify' && (
              <View className="mb-4">
                <Text className="text-sm font-bold text-gray-700 mb-2 ml-1">Email Address</Text>
                <View className={`flex-row items-center bg-gray-50 border ${fieldErrors.email ? 'border-rose-400' : 'border-gray-100'} rounded-2xl px-4 h-16`}>
                  <Mail size={20} color="#9CA3AF" />
                  <TextInput
                    className="flex-1 ml-3 text-gray-900 font-bold"
                    placeholder="email@example.com"
                    placeholderTextColor="#CBD5E1"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    textContentType="emailAddress"
                    autoComplete="email"
                    importantForAutofill="yes"
                    value={email}
                    onChangeText={(v) => { setEmail(v); clearFieldError('email'); }}
                    ref={emailRef}
                    returnKeyType={view === 'forgot' ? 'done' : 'next'}
                    blurOnSubmit={view === 'forgot'}
                    onSubmitEditing={() => view === 'forgot' ? handleResetPassword() : passwordRef.current?.focus()}
                  />
                </View>
                {fieldErrors.email && (
                  <Text className="text-rose-500 text-sm font-medium ml-1 mt-1">{fieldErrors.email}</Text>
                )}
              </View>
            )}

            {view !== 'forgot' && view !== 'verify' && (
              <View className="mb-4">
                <Text className="text-sm font-bold text-gray-700 mb-2 ml-1">Password</Text>
                <View className={`flex-row items-center bg-gray-50 border ${fieldErrors.password ? 'border-rose-400' : 'border-gray-100'} rounded-2xl px-4 h-16`}>
                  <Lock size={20} color="#9CA3AF" />
                  <TextInput
                    className="flex-1 ml-3 text-gray-900 font-bold"
                    placeholder="••••••••"
                    placeholderTextColor="#CBD5E1"
                    secureTextEntry={!showPassword}
                    textContentType={view === 'signup' ? 'newPassword' : 'password'}
                    autoComplete={view === 'signup' ? 'password-new' : 'password'}
                    importantForAutofill="yes"
                    value={password}
                    onChangeText={(v) => { setPassword(v); clearFieldError('password'); }}
                    ref={passwordRef}
                    returnKeyType="done"
                    onSubmitEditing={() => handleAuth()}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="p-1">
                    {showPassword ? (
                      <EyeOff size={20} color="#9CA3AF" />
                    ) : (
                      <Eye size={20} color="#9CA3AF" />
                    )}
                  </TouchableOpacity>
                </View>
                {fieldErrors.password && (
                  <Text className="text-rose-500 text-sm font-medium ml-1 mt-1">{fieldErrors.password}</Text>
                )}

                {view === 'login' && (
                  <TouchableOpacity onPress={() => setView('forgot')} className="self-end mt-2 mb-6">
                    <Text className="text-[#FF5722] font-bold text-sm">Forgot Password?</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Terms and Privacy Checkbox - Only for Signup */}
            {view === 'signup' && (
              <View className="mb-6">
                <View className="flex-row items-center">
                  <TouchableOpacity
                    onPress={() => {
                      setAgreedToTerms(!agreedToTerms);
                      clearFieldError('terms');
                    }}
                    className={`w-6 h-6 rounded-lg border-2 items-center justify-center mr-3 ${agreedToTerms ? 'bg-[#FF5722] border-[#FF5722]' : fieldErrors.terms ? 'border-rose-400' : 'border-gray-300'}`}
                  >
                    {agreedToTerms && <Check size={16} color="white" strokeWidth={3} />}
                  </TouchableOpacity>
                  <Text className="text-gray-600 text-[13px] font-medium">
                    I agree to the{' '}
                    <Text
                      onPress={() => Linking.openURL('https://gogym.milanwebportal.com/privacy')}
                      className="text-[#FF5722] font-black"
                    >
                      Privacy Policy
                    </Text>
                    {' '}and{' '}
                    <Text
                      onPress={() => Linking.openURL('https://gogym.milanwebportal.com/termsofservice')}
                      className="text-[#FF5722] font-black"
                    >
                      Terms of Use
                    </Text>
                    .
                  </Text>
                </View>
                {fieldErrors.terms && (
                  <Text className="text-rose-500 text-sm font-medium ml-9 mt-1">{fieldErrors.terms}</Text>
                )}
              </View>
            )}

            {view === 'verify' && (
              <View>
                <Text className="text-gray-500 text-center mb-8 font-medium">
                  We've sent a 6-digit verification code to {'\n'}
                  <Text className="text-gray-900 font-bold">{email}</Text>
                </Text>

                <View className="mb-8">
                  <Text className="text-sm font-bold text-gray-700 mb-4 ml-1 text-center">Verification Code</Text>
                  <View className="flex-row justify-between items-center">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <TouchableOpacity
                        key={index}
                        activeOpacity={1}
                        onPress={() => codeInputRef.current?.focus()}
                        className={`w-12 h-16 rounded-2xl border-2 items-center justify-center bg-gray-50 
                          ${verificationCode.length === index ? 'border-[#FF5722] bg-white shadow-sm' :
                            verificationCode.length > index ? 'border-[#FF5722] bg-[#FF5722]/5' : 'border-gray-100'}`}
                      >
                        <Text className="text-2xl font-black text-gray-900">
                          {verificationCode[index] || ''}
                        </Text>
                        {verificationCode.length === index && (
                          <View className="absolute bottom-3 w-4 h-1 bg-[#FF5722] rounded-full" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Hidden TextInput for keyboard interaction */}
                  <TextInput
                    ref={codeInputRef}
                    className="absolute opacity-0 w-full h-full"
                    keyboardType="numeric"
                    maxLength={6}
                    value={verificationCode}
                    onChangeText={(v) => {
                      setVerificationCode(v);
                      if (v.length === 6) {
                        // Optional: auto-verify when 6 digits are reached
                      }
                    }}
                    autoFocus={view === 'verify'}
                  />
                </View>

                <TouchableOpacity
                  onPress={handleVerify}
                  disabled={loading}
                  className="bg-[#FF5722] py-5 rounded-[24px] items-center shadow-lg shadow-orange-500/30 mb-6"
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white font-black text-xl">Verify Email</Text>
                  )}
                </TouchableOpacity>

                <View className="flex-row justify-center items-center mb-8">
                  <Text className="text-gray-500 font-bold">Didn't receive code? </Text>
                  <TouchableOpacity onPress={handleResendCode} disabled={resendTimer > 0}>
                    <Text className={`font-black ${resendTimer > 0 ? 'text-gray-400' : 'text-[#FF5722]'}`}>
                      {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={() => setView('signup')}
                  className="items-center"
                >
                  <Text className="text-gray-500 font-bold">Wrong email? <Text className="text-[#FF5722]">Go back</Text></Text>
                </TouchableOpacity>
              </View>
            )}

            {view !== 'verify' && (
              <TouchableOpacity
                className="bg-[#FF5722] py-5 rounded-[24px] flex-row items-center justify-center shadow-lg shadow-orange-500/40 mt-6"
                onPress={view === 'forgot' ? () => handleResetPassword() : () => handleAuth()}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Text className="text-white text-xl font-black mr-2">
                      {view === 'login' ? 'Login' : view === 'signup' ? 'Create Account' : 'Send Link'}
                    </Text>
                    <ArrowRight color="white" size={24} />
                  </>
                )}
              </TouchableOpacity>
            )}

          </View>

          {/* Footer */}
          {view !== 'verify' && view !== 'forgot' && (
            <View className="items-center mt-12 mb-10">
              <View className="flex-row items-center bg-gray-50 px-6 py-3 rounded-full border border-gray-100">
                <Text className="text-gray-500 font-medium">
                  {view === 'login' ? "Do not have an account? " : view === 'signup' ? "Already have an account? " : ""}
                </Text>
                <TouchableOpacity onPress={() => {
                  setView(view === 'login' ? 'signup' : 'login');
                  setFieldErrors({});
                  setAgreedToTerms(false);
                }}>
                  <Text className="text-[#FF5722] font-bold">
                    {view === 'login' ? 'Sign Up' : view === 'signup' ? 'Login' : ''}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
