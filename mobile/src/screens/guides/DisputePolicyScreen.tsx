import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {
  ShieldAlert,
  ShieldCheck,
  Scale,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../../store/useThemeStore';
import { Header } from '../../components/common/Header';
import { api } from '../../api/client';

export const DisputePolicyScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors } = useThemeStore();
  const insets = useSafeAreaInsets();

  const [policyData, setPolicyData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPolicy = async () => {
      try {
        const res: any = await api.get('/cms/pages/dispute-policy');
        const data = res?.data !== undefined ? res.data : res;
        setPolicyData(data);
      } catch (err) {
        console.warn('Dispute policy fetch fallback:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPolicy();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header showBack title="বিরোধ নিষ্পত্তি নীতিমালা" />

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + insets.bottom }]}>
        <View style={styles.topSection}>
          <View style={[styles.badgePill, { backgroundColor: '#fee2e2' }]}>
            <Scale size={14} color="#dc2626" />
            <Text style={styles.badgePillText}>ন্যায্য এসক্রো সুরক্ষা</Text>
          </View>
          <Text style={[styles.heading, { color: colors.text }]}>
            {policyData?.title || 'SafnexBD Dispute Policy'}
          </Text>
          <Text style={[styles.subHeading, { color: colors.textSecondary }]}>
            ক্রেতা ও বিক্রেতার আর্থিক নিরাপত্তা রক্ষার্থে আমাদের নিরপেক্ষ বিরোধ নিষ্পত্তি প্রটোকল।
          </Text>
        </View>

        {/* 24-Hour Dispute Window Box */}
        <View style={[styles.windowCard, { backgroundColor: colors.surface, borderColor: '#fde68a' }]}>
          <Clock size={20} color="#d97706" style={{ marginTop: 2 }} />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[styles.windowTitle, { color: colors.text }]}>সর্বোচ্চ ২৪ ঘণ্টার বিরোধ উইন্ডো</Text>
            <Text style={[styles.windowDesc, { color: colors.textSecondary }]}>
              পণ্য ডেলিভারির নোটিফিকেশন পাওয়ার পর ক্রেতার কাছে সর্বোচ্চ ২৪ ঘণ্টা সময় থাকবে পণ্য পরীক্ষা করার জন্য। ত্রুটি থাকলে এই সময়ের মধ্যে Dispute ওপেন করতে হবে।
            </Text>
          </View>
        </View>

        {/* Core Rules Cards */}
        <View style={styles.rulesList}>
          <View style={[styles.ruleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.ruleHeader}>
              <View style={[styles.ruleIconBox, { backgroundColor: '#eff6ff' }]}>
                <ShieldCheck size={16} color="#2563eb" />
              </View>
              <Text style={[styles.ruleTitle, { color: colors.text }]}>১. কখন বিরোধ দায়ের করা যাবে?</Text>
            </View>
            <Text style={[styles.ruleText, { color: colors.textSecondary }]}>
              • ভুল বা প্রতিশ্রুত বিবরণ বহির্ভূত পণ্য পেলে{'\n'}
              • ডিজিটাল অ্যাকাউন্টের ক্ষেত্রে পাসওয়ার্ড বা লগইন কাজ না করলে{'\n'}
              • নির্ধারিত সময়ে পণ্য বা সার্ভিস ডেলিভারি দিতে ব্যর্থ হলে{'\n'}
              • পেমেন্ট প্রাপ্তির পর সেলার যোগাযোগ বন্ধ করে দিলে
            </Text>
          </View>

          <View style={[styles.ruleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.ruleHeader}>
              <View style={[styles.ruleIconBox, { backgroundColor: '#fef2f2' }]}>
                <AlertCircle size={16} color="#dc2626" />
              </View>
              <Text style={[styles.ruleTitle, { color: colors.text }]}>২. প্রমাণাদি উপস্থাপন (Evidence)</Text>
            </View>
            <Text style={[styles.ruleText, { color: colors.textSecondary }]}>
              বিরোধ নিষ্পত্তির জন্য স্ক্রিনশট, ভিডিও রেকর্ডিং বা আনবক্সিং প্রমাণ দাখিল করতে হবে। অ্যাডমিন সম্পূর্ণ চ্যাট হিস্ট্রি এবং প্রুফ যাচাই করে ২৪ ঘণ্টার মধ্যে চূড়ান্ত সিদ্ধান্ত দেন।
            </Text>
          </View>

          <View style={[styles.ruleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.ruleHeader}>
              <View style={[styles.ruleIconBox, { backgroundColor: '#ecfdf5' }]}>
                <CheckCircle2 size={16} color="#059669" />
              </View>
              <Text style={[styles.ruleTitle, { color: colors.text }]}>৩. রিফান্ড ও অর্থ ছাড়ের নিশ্চয়তা</Text>
            </View>
            <Text style={[styles.ruleText, { color: colors.textSecondary }]}>
              অভিযোগ সত্য প্রমাণিত হলে ক্রেতার ওয়ালেটে সম্পূর্ণ অর্থ রিফান্ড করা হয়। অন্যথায় সেলারের কাছে সুরক্ষিত হোল্ড ব্যালেন্স রিলিজ করে দেওয়া হয়। কোনো পক্ষের ক্ষতি হওয়ার সুযোগ নেই।
            </Text>
          </View>
        </View>

        {/* Action button to check disputes */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('MyDisputes')}
          style={[styles.disputeActionBtn, { backgroundColor: '#dc2626' }]}
        >
          <ShieldAlert size={16} color="#ffffff" />
          <Text style={styles.disputeActionBtnText}>আমার ডিসপ্যুট হিস্ট্রি দেখুন</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  topSection: {
    gap: 8,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#dc2626',
  },
  heading: {
    fontSize: 22,
    fontWeight: '900',
  },
  subHeading: {
    fontSize: 13,
    lineHeight: 18,
  },
  windowCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  windowTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  windowDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  rulesList: {
    gap: 12,
  },
  ruleCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  ruleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ruleIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  ruleText: {
    fontSize: 12,
    lineHeight: 19,
  },
  disputeActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
    marginTop: 4,
  },
  disputeActionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});

