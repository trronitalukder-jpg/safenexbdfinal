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
import { ShieldCheck, Lock, Mail, ArrowRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../../store/useThemeStore';
import { useAuthStore } from '../../store/useAuthStore';
import { api } from '../../api/client';

export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors } = useThemeStore();
  const { setAuth } = useAuthStore();
  const insets = useSafeAreaInsets();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    const trimmedId = identifier.trim();
    if (!trimmedId || !password) {
      setError('দয়া করে আপনার ফোন/ইমেইল এবং পাসওয়ার্ড লিখুন');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res: any = await api.post('/auth/login', {
        identifier: trimmedId,
        password,
      });

      const user = res?.user || res?.data?.user;
      const token = res?.accessToken || res?.token || res?.data?.accessToken;
      const refreshToken = res?.refreshToken || res?.data?.refreshToken;

      if (user && token) {
        await setAuth(user, token, refreshToken);
        navigation.replace('MainTabs');
      } else {
        setError('লগইন ব্যর্থ হয়েছে। তথ্য যাচাই করুন।');
      }
    } catch (err: any) {
      console.warn('Login error:', err);
      setError(err.message || 'মোবাইল নম্বর বা পাসওয়ার্ড সঠিক নয়');
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
        {/* Brand Header */}
        <View style={styles.headerBox}>
          <View style={styles.logoIcon}>
            <ShieldCheck size={36} color="#ffffff" />
          </View>
          <Text style={[styles.brandName, { color: colors.text }]}>
            Safnex<Text style={{ color: colors.primary }}>BD</Text>
          </Text>
          <Text style={[styles.brandTagline, { color: colors.textSecondary }]}>
            ১০০% নিরাপদ এসক্রো মার্কেটপ্লেস ও ওয়ালেট
          </Text>
        </View>

        {/* Form Card */}
        <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>লগইন করুন</Text>
          <Text style={[styles.cardSubtitle, { color: colors.textMuted }]}>
            আপনার নিবন্ধিত ফোন নম্বর অথবা ইমেইল দিয়ে প্রবেশ করুন
          </Text>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Identifier Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>ফোন নম্বর বা ইমেইল</Text>
            <View style={[styles.inputBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <Mail size={18} color={colors.textMuted} />
              <TextInput
                value={identifier}
                onChangeText={setIdentifier}
                placeholder="017XXXXXXXX বা user@example.com"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                style={[styles.input, { color: colors.text }]}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>পাসওয়ার্ড</Text>
            <View style={[styles.inputBox, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
              <Lock size={18} color={colors.textMuted} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="আপনার গোপন পাসওয়ার্ড"
                placeholderTextColor={colors.textMuted}
                secureTextEntry
                style={[styles.input, { color: colors.text }]}
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleLogin}
            disabled={loading}
            style={[styles.submitBtn, { backgroundColor: '#0284c7' }]}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Text style={styles.submitBtnText}>লগইন করুন</Text>
                <ArrowRight size={18} color="#ffffff" />
              </>
            )}
          </TouchableOpacity>

          {/* Register Link */}
          <View style={styles.switchRow}>
            <Text style={[styles.switchText, { color: colors.textSecondary }]}>নতুন অ্যাকাউন্ট খুলতে চান?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={[styles.registerLink, { color: colors.primary }]}> সাইন-আপ করুন</Text>
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
    justifyContent: 'center',
    padding: 20,
  },
  headerBox: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    elevation: 4,
  },
  brandName: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 12,
    marginTop: 4,
  },
  formCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 16,
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
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    gap: 10,
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
    marginTop: 6,
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
    marginTop: 18,
  },
  switchText: {
    fontSize: 12,
  },
  registerLink: {
    fontSize: 12,
    fontWeight: '800',
  },
});
