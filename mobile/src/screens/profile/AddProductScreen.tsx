import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  ArrowLeft,
  Package,
  Layers,
  DollarSign,
  Image as ImageIcon,
  FileText,
  CheckCircle2,
} from 'lucide-react-native';
import { apiClient } from '../../api/client';
import { useThemeStore } from '../../store/useThemeStore';

interface Category {
  id: string;
  name: string;
  slug: string;
}

export const AddProductScreen = () => {
  const navigation = useNavigation<any>();
  const { colors } = useThemeStore();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Form
  const [title, setTitle] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [productType, setProductType] = useState<'DIGITAL' | 'PHYSICAL'>('DIGITAL');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');

  // Digital Meta
  const [digitalFileName, setDigitalFileName] = useState('');
  const [digitalFileUrl, setDigitalFileUrl] = useState('');

  // Physical Meta
  const [stock, setStock] = useState('10');
  const [deliveryInfo, setDeliveryInfo] = useState('');

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoadingCategories(true);
      const res = await apiClient.get<Category[]>('/categories');
      const data = Array.isArray(res.data) ? res.data : [];
      setCategories(data);
      if (data.length > 0) {
        setSelectedCategoryId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('অসম্পূর্ণ ফর্ম', 'প্রোডাক্ট বা সার্ভিসের টাইটেল লিখুন।');
      return;
    }

    if (!selectedCategoryId) {
      Alert.alert('ক্যাটেগরি নির্বাচন করুন', 'একটি ক্যাটেগরি নির্বাচন করুন।');
      return;
    }

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      Alert.alert('ভুল মূল্য', 'সঠিক মূল্য উল্লেখ করুন।');
      return;
    }

    if (!description.trim()) {
      Alert.alert('বিবরণ দিন', 'প্রোডাক্টের বিবরণ লিখুন।');
      return;
    }

    const payload: any = {
      title: title.trim(),
      categoryId: selectedCategoryId,
      productType,
      price: numPrice,
      descriptionHtml: `<p>${description.trim().replace(/\n/g, '<br/>')}</p>`,
      images: imageUrl.trim()
        ? [{ imageUrl: imageUrl.trim(), isMain: true, sortOrder: 0 }]
        : [
            {
              imageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop',
              isMain: true,
              sortOrder: 0,
            },
          ],
    };

    if (productType === 'DIGITAL') {
      if (digitalFileUrl.trim()) {
        payload.digitalFile = {
          fileName: digitalFileName.trim() || 'digital-asset.zip',
          fileUrl: digitalFileUrl.trim(),
        };
      }
    } else {
      payload.physicalMeta = {
        stock: parseInt(stock, 10) || 1,
        deliveryInfo: deliveryInfo.trim() || undefined,
      };
    }

    setSubmitting(true);
    try {
      await apiClient.post('/products', payload);
      Alert.alert('সফল!', 'আপনার প্রোডাক্টটি সফলভাবে পোস্ট করা হয়েছে।', [
        {
          text: 'ঠিক আছে',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'বিজ্ঞাপন পোস্ট করা সম্ভব হয়নি।';
      Alert.alert('ত্রুটি', msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ArrowLeft size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>নতুন বিজ্ঞাপন দিন</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Product Type Switcher */}
        <Text style={[styles.label, { color: colors.text }]}>প্রোডাক্টের ধরণ</Text>
        <View style={styles.typeRow}>
          <TouchableOpacity
            style={[
              styles.typeOption,
              { backgroundColor: colors.surface, borderColor: colors.border },
              productType === 'DIGITAL' && { borderColor: colors.primary, backgroundColor: colors.primary + '15' },
            ]}
            onPress={() => setProductType('DIGITAL')}
          >
            <Package size={18} color={productType === 'DIGITAL' ? colors.primary : colors.textMuted} />
            <Text style={[styles.typeOptionText, { color: productType === 'DIGITAL' ? colors.primary : colors.text }]}>
              ডিজিটাল প্রোডাক্ট / সার্ভিস
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeOption,
              { backgroundColor: colors.surface, borderColor: colors.border },
              productType === 'PHYSICAL' && { borderColor: colors.primary, backgroundColor: colors.primary + '15' },
            ]}
            onPress={() => setProductType('PHYSICAL')}
          >
            <Layers size={18} color={productType === 'PHYSICAL' ? colors.primary : colors.textMuted} />
            <Text style={[styles.typeOptionText, { color: productType === 'PHYSICAL' ? colors.primary : colors.text }]}>
              ফিজিক্যাল প্রোডাক্ট
            </Text>
          </TouchableOpacity>
        </View>

        {/* Title */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>বিজ্ঞাপনের শিরোনাম (Title) *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            placeholder="যেমন: Facebook Page 50k Followers অথবা T-shirt"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* Category Selector */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>ক্যাটেগরি নির্বাচন করুন *</Text>
          {loadingCategories ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
              {categories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
                    ]}
                    onPress={() => setSelectedCategoryId(cat.id)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        { color: isSelected ? '#FFFFFF' : colors.text },
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Price */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>মূল্য (টাকা) *</Text>
          <View style={[styles.priceInputBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.currencyPrefix, { color: colors.primary }]}>৳</Text>
            <TextInput
              style={[styles.priceInput, { color: colors.text }]}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={price}
              onChangeText={setPrice}
            />
          </View>
        </View>

        {/* Image URL */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>ছবির লিংক (Image URL)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
            placeholder="https://example.com/image.jpg (ঐচ্ছিক)"
            placeholderTextColor={colors.textMuted}
            value={imageUrl}
            onChangeText={setImageUrl}
          />
        </View>

        {/* Type-Specific fields */}
        {productType === 'DIGITAL' ? (
          <View style={[styles.specificBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.specificTitle, { color: colors.primary }]}>ডিজিটাল ফাইল বা লিংক সেটিংস</Text>
            <View style={styles.inputGroup}>
              <Text style={[styles.subLabel, { color: colors.textMuted }]}>ফাইলের নাম বা প্যাকেজ নাম</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="যেমন: source_code.zip"
                placeholderTextColor={colors.textMuted}
                value={digitalFileName}
                onChangeText={setDigitalFileName}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.subLabel, { color: colors.textMuted }]}>ডাউনলোড লিংক / ড্রাইভ লিংক</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="https://drive.google.com/..."
                placeholderTextColor={colors.textMuted}
                value={digitalFileUrl}
                onChangeText={setDigitalFileUrl}
              />
            </View>
          </View>
        ) : (
          <View style={[styles.specificBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.specificTitle, { color: colors.primary }]}>ফিজিক্যাল ডেলিভারি সেটিংস</Text>
            <View style={styles.inputGroup}>
              <Text style={[styles.subLabel, { color: colors.textMuted }]}>স্টক সংখ্যা</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="10"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={stock}
                onChangeText={setStock}
              />
            </View>
            <View style={styles.inputGroup}>
              <Text style={[styles.subLabel, { color: colors.textMuted }]}>ডেলিভারি তথ্য</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="যেমন: সারা বাংলাদেশে ৩ দিনের মধ্যে হোম ডেলিভারি"
                placeholderTextColor={colors.textMuted}
                value={deliveryInfo}
                onChangeText={setDeliveryInfo}
              />
            </View>
          </View>
        )}

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={[styles.label, { color: colors.text }]}>বিস্তারিত বিবরণ (Description) *</Text>
          <TextInput
            style={[
              styles.textArea,
              { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
            ]}
            placeholder="প্রোডাক্ট সম্পর্কে সমস্ত বিস্তারিত বর্ণনা এখানে লিখুন..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: colors.primary },
            submitting && { opacity: 0.6 },
          ]}
          disabled={submitting}
          onPress={handleSubmit}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>বিজ্ঞাপন পোস্ট করুন</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  typeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  typeOptionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 14,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  priceInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 48,
  },
  currencyPrefix: {
    fontSize: 20,
    fontWeight: '800',
    marginRight: 8,
  },
  priceInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
  },
  categoryScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  specificBox: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  specificTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 12,
  },
  subLabel: {
    fontSize: 12,
    marginBottom: 6,
  },
  textArea: {
    minHeight: 110,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
  },
  submitButton: {
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
