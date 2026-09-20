import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { ShieldCheck, User, Mail, Phone, Lock, ArrowRight, ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../api/client';

export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors } = useThemeStore();
  const { setAuth } = useAuthStore();
  const insets = useSafeAreaInsets();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim() || !password) {
      setError('অনুগ্রহ করে সকল বাধ্যতামূলক তথ্য পূরণ করুন');
      return;
    }

    if (password !== confirmPassword) {
      setError('পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না');
      return;
    }

    if (password.length < 6) {
      setError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        password,
        confirmPassword,
      };

      const res: any = await api.post('/auth/register', payload);
      const user = res?.user || res?.data?.user;
      const token = res?.accessToken || res?.token || res?.data?.accessToken;
      const refreshToken = res?.refreshToken || res?.data?.refreshToken;

      if (user && token) {
        await setAuth(user, token, refreshToken);
        navigation.replace('MainTabs');
      } else {
        // Registered, navigate to login
        alert('নিবন্ধন সফল হয়েছে! অনুগ্রহ করে লগইন করুন।');
        navigation.navigate('Login');
      }
    } catch (err: any) {
      console.warn('Registration error:', err);
      setError(err.message || 'নিবন্ধনে সমস্যা হয়েছে। তথ্য যাচাই করে আবার চেষ্টা করুন।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 24) + 16,
            paddingBottom: Math.max(insets.bottom, 16) + 24,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[styles.backBtn, { backgroundColor: colors.surfaceSecondary }]}
        >
          <ArrowLeft size={20} color={colors.text} />
        </TouchableOpacity>

        {/* Brand Header */}
        <View style={styles.headerBox}>
          <Text style={[styles.brandName, { color: colors.text }]}>অ্যাকাউন্ট তৈরি করুন</Text>
          <Text style={[styles.brandTagline, { color: colors.textSecondary }]}>
            SafnexBD তে যোগ দিয়ে ১০০% নিরাপদ এসক্রো সুবিধা উপভোগ করুন
          </Text>
        </View>

        {/* Form Card */}
        <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Name Row */}
          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>নামের প্রথম অংশ *</Text>
              <View style={[styles.inputBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                <User size={16} color={colors.textMuted} />
                <TextInput
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="যেমন: মোঃ"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.input, { color: colors.text }]}
                />
              </View>
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>শেষ অংশ *</Text>
              <View style={[styles.inputBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
                <TextInput
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="যেমন: রহিম"
                  placeholderTextColor={colors.textMuted}
                  style={[styles.input, { color: colors.text }]}
                />
              </View>
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>ইমেইল অ্যাড্রেস *</Text>
            <View style={[styles.inputBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <Mail size={16} color={colors.textMuted} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="user@example.com"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                keyboardType="email-address"
                style={[styles.input, { color: colors.text }]}
              />
            </View>
          </View>

          {/* Phone */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>মোবাইল নম্বর *</Text>
            <View style={[styles.inputBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <Phone size={16} color={colors.textMuted} />
              <TextInput
                value={phone}
                onChangeText={setPhone}
                placeholder="017XXXXXXXX"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
                style={[styles.input, { color: colors.text }]}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>পাসওয়ার্ড *</Text>
            <View style={[styles.inputBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <Lock size={16} color={colors.textMuted} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="কমপক্ষে ৬ অক্ষর"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                style={[styles.input, { color: colors.text }]}
              />
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>কনফার্ম পাসওয়ার্ড *</Text>
            <View style={[styles.inputBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <Lock size={16} color={colors.textMuted} />
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="পুনরায় পাসওয়ার্ড লিখুন"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                style={[styles.input, { color: colors.text }]}
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleRegister}
            disabled={loading}
            style={[styles.submitBtn, { backgroundColor: '#0284c7' }]}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Text style={styles.submitBtnText}>নিবন্ধন সম্পন্ন করুন</Text>
                <ArrowRight size={18} color="#ffffff" />
              </>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.switchRow}>
            <Text style={[styles.switchText, { color: colors.textSecondary }]}>ইতিমধ্যে অ্যাকাউন্ট আছে?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.loginLink, { color: colors.primary }]}> লগইন করুন</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    paddingTop: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  headerBox: {
    marginBottom: 20,
  },
  brandName: {
    fontSize: 24,
    fontWeight: '900',
  },
  brandTagline: {
    fontSize: 12,
    marginTop: 4,
  },
  formCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '600',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 10,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 11.5,
    fontWeight: '700',
    marginBottom: 5,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 12,
    marginTop: 10,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  switchText: {
    fontSize: 12,
  },
  loginLink: {
    fontSize: 12,
    fontWeight: '800',
  },
});
