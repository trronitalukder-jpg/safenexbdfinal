import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { useThemeStore } from '../../store/useThemeStore';

export const EscrowBanner: React.FC = () => {
  const { colors } = useThemeStore();

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}>
      <View style={styles.iconCircle}>
        <ShieldCheck size={18} color="#10b981" />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.text }]}>১০০% নিরাপদ এসক্রো ট্রানজ্যাকশন</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          পণ্য বুঝে পেয়ে টাকা ছাড়ুন। টাকা থাকবে সুরক্ষিত Hold ব্যালেন্সে।
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
    marginVertical: 6,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 10.5,
    marginTop: 2,
    lineHeight: 14,
  },
});
