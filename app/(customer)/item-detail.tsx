import { useEffect, useMemo, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { R, FS, Sp, cardShadow } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useCartStore } from '../../store/cartStore';
import { supabase } from '../../lib/supabase';
import { ADD_ON_PRICE, formatModifier } from '../../lib/pricing';

const SIZES = ['Short', 'Tall', 'Grande', 'Venti'] as const;
type Size = typeof SIZES[number];

const MILK_OPTIONS = ['Whole Milk', 'Oat Milk', 'Almond Milk', 'Soy Milk'];
const ADD_ONS = ['Extra Shot', 'Vanilla Syrup', 'Caramel Drizzle', 'Whipped Cream'];

function normalizeMilkKey(v: string) {
  return v.replace(/\s*milk\s*$/i, '').trim().toLowerCase();
}

export default function ItemDetailScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const addItem = useCartStore((s) => s.addItem);
  const removeItem = useCartStore((s) => s.removeItem);

  const { id, name, price, cartItemId, qty: qtyParam, size: sizeParam, milk: milkParam, addOns: addOnsParam, imageUrl: imageUrlParam, temperature: temperatureParam } =
    useLocalSearchParams<{
      id?: string; name?: string; price?: string;
      cartItemId?: string; qty?: string; size?: string; milk?: string; addOns?: string; imageUrl?: string; temperature?: string;
    }>();
  const itemId = id ?? '0';
  const itemName = name ?? 'Cold Brew';
  const isEditing = !!cartItemId;

  const [basePrice, setBasePrice] = useState(parseInt(price ?? '175', 10));
  const [size, setSize] = useState<Size>((sizeParam as Size) || 'Grande');
  const [milk, setMilk] = useState(milkParam || 'Whole Milk');
  const [addOns, setAddOns] = useState<string[]>(addOnsParam ? addOnsParam.split(',').filter(Boolean) : []);
  const [qty, setQty] = useState(qtyParam ? parseInt(qtyParam, 10) : 1);
  const [isFood, setIsFood] = useState(false);
  const [sizeModifiers, setSizeModifiers] = useState<Record<string, number>>({});
  const [milkModifiers, setMilkModifiers] = useState<Record<string, number>>({});
  const [servesHot, setServesHot] = useState(false);
  const [servesCold, setServesCold] = useState(false);
  const [imageUrlHot, setImageUrlHot] = useState<string | null>(imageUrlParam || null);
  const [imageUrlCold, setImageUrlCold] = useState<string | null>(null);
  const [descriptionHot, setDescriptionHot] = useState<string | null>(null);
  const [descriptionCold, setDescriptionCold] = useState<string | null>(null);
  const [hasMilkOptions, setHasMilkOptions] = useState(true);
  const [temperature, setTemperature] = useState<'Hot' | 'Cold' | null>(
    (temperatureParam as 'Hot' | 'Cold') || null
  );

  useEffect(() => {
    supabase
      .from('menu_items')
      .select('base_price, categories(name), serves_hot, serves_cold, image_url, image_url_cold, description, description_cold, has_milk_options')
      .eq('id', itemId)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error('item category fetch error:', error.message);
          return;
        }
        const categoryName = (data?.categories as { name: string } | null)?.name;
        setIsFood(categoryName?.toLowerCase() === 'food');
        setServesHot(!!data?.serves_hot);
        setServesCold(!!data?.serves_cold);
        setImageUrlHot(data?.image_url ?? imageUrlParam ?? null);
        setImageUrlCold(data?.image_url_cold ?? null);
        setDescriptionHot(data?.description ?? null);
        setDescriptionCold(data?.description_cold ?? null);
        setHasMilkOptions(data?.has_milk_options !== false);
        if (data?.base_price != null) setBasePrice(data.base_price);
        if (!temperatureParam) {
          setTemperature(data?.serves_hot ? 'Hot' : data?.serves_cold ? 'Cold' : null);
        }
      });

    supabase
      .from('customization_options')
      .select('option_group, option_value, price_modifier')
      .eq('menu_item_id', itemId)
      .then(({ data, error }) => {
        if (error) {
          console.error('customization_options fetch error:', error.message);
          return;
        }
        const sizeMap: Record<string, number> = {};
        const milkMap: Record<string, number> = {};
        (data ?? []).forEach((row) => {
          const modifier = Number(row.price_modifier) || 0;
          if (row.option_group === 'Size') sizeMap[row.option_value] = modifier;
          // DB rows store the short form ("Whole", "Oat"); the picker uses
          // full labels ("Whole Milk", "Oat Milk") — key on the normalized
          // form so either convention matches.
          else if (row.option_group === 'Milk') milkMap[normalizeMilkKey(row.option_value)] = modifier;
        });
        setSizeModifiers(sizeMap);
        setMilkModifiers(milkMap);
      });
  }, [itemId]);

  const showTemperaturePicker = !isFood && servesHot && servesCold;
  const imageUrl = temperature === 'Cold' && imageUrlCold ? imageUrlCold : imageUrlHot;
  const description =
    (temperature === 'Cold' && descriptionCold ? descriptionCold : descriptionHot)
    ?? 'Handcrafted just for you.';

  function toggleAddOn(opt: string) {
    setAddOns(prev =>
      prev.includes(opt) ? prev.filter(a => a !== opt) : [...prev, opt]
    );
  }

  const addOnsTotal = isFood ? 0 : addOns.length * ADD_ON_PRICE;
  const sizeAdj = isFood ? 0 : (sizeModifiers[size] ?? 0);
  const milkAdj = isFood || !hasMilkOptions ? 0 : (milkModifiers[normalizeMilkKey(milk)] ?? 0);
  const unitPrice = basePrice + addOnsTotal + sizeAdj + milkAdj;
  const total = unitPrice * qty;

  function handleAddToCart() {
    if (isEditing) {
      removeItem(cartItemId as string);
    }
    for (let i = 0; i < qty; i++) {
      addItem({
        id: itemId,
        menuItemId: Number(itemId),
        name: itemName,
        price: unitPrice,
        size: isFood ? '' : size,
        milk: isFood || !hasMilkOptions ? '' : milk,
        addOns: isFood ? [] : addOns,
        imageUrl,
        temperature: isFood ? null : temperature,
      });
    }
    if (isEditing) {
      router.back();
    } else {
      router.push('/(customer)/cart' as any);
    }
  }

  return (
    <View style={styles.root}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <SafeAreaView edges={['top']}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/(customer)/cart' as any)}
            activeOpacity={0.7}
          >
            <Ionicons name="cart-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.imgPlaceholder} resizeMode="cover" />
        ) : (
          <View style={styles.imgPlaceholder}>
            <Ionicons name={isFood ? 'restaurant-outline' : 'cafe-outline'} size={56} color={colors.brandMuted} />
          </View>
        )}

        <View style={styles.nameRow}>
          <Text style={styles.itemName}>{itemName}</Text>
          <Text style={styles.itemPrice}>₱{basePrice}.00</Text>
        </View>
        <Text style={styles.itemDesc}>{description}</Text>

        {!isFood && showTemperaturePicker && (
          <>
            <Text style={styles.optionLabel}>Temperature</Text>
            <View style={styles.sizeRow}>
              {(['Hot', 'Cold'] as const).map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.sizeBtn, temperature === t && styles.sizeBtnActive]}
                  onPress={() => setTemperature(t)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.sizeBtnText, temperature === t && styles.sizeBtnTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {!isFood && (
          <>
            <Text style={styles.optionLabel}>Size</Text>
            <View style={styles.sizeRow}>
              {SIZES.map(s => {
                const deltaLabel = formatModifier(sizeModifiers[s] ?? 0);
                return (
                  <TouchableOpacity
                    key={s}
                    style={[styles.sizeBtn, size === s && styles.sizeBtnActive]}
                    onPress={() => setSize(s)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.sizeBtnText, size === s && styles.sizeBtnTextActive]}>{s}</Text>
                    {deltaLabel !== '' && (
                      <Text style={[styles.sizeBtnDelta, size === s && styles.sizeBtnTextActive]}>
                        {deltaLabel}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {hasMilkOptions && (
              <>
                <Text style={styles.optionLabel}>Milk</Text>
                <View style={[styles.optionCard, cardShadow]}>
                  {MILK_OPTIONS.map((opt, idx) => {
                    const modLabel = formatModifier(milkModifiers[normalizeMilkKey(opt)] ?? 0);
                    return (
                      <View key={opt}>
                        <TouchableOpacity
                          style={styles.radioRow}
                          onPress={() => setMilk(opt)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.radioLabelCol}>
                            <Text style={styles.radioLabel}>{opt}</Text>
                            {modLabel !== '' && <Text style={styles.radioModifier}>{modLabel}</Text>}
                          </View>
                          <View style={[styles.radioCircle, milk === opt && styles.radioCircleActive]}>
                            {milk === opt && <View style={styles.radioDot} />}
                          </View>
                        </TouchableOpacity>
                        {idx < MILK_OPTIONS.length - 1 && <View style={styles.divider} />}
                      </View>
                    );
                  })}
                </View>
              </>
            )}

            <Text style={styles.optionLabel}>
              Add-ons <Text style={styles.optionSub}>(+₱20 each)</Text>
            </Text>
            <View style={[styles.optionCard, cardShadow]}>
              {ADD_ONS.map((opt, idx) => {
                const checked = addOns.includes(opt);
                return (
                  <View key={opt}>
                    <TouchableOpacity
                      style={styles.radioRow}
                      onPress={() => toggleAddOn(opt)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.radioLabel}>{opt}</Text>
                      <View style={[styles.checkbox, checked && styles.checkboxActive]}>
                        {checked && <Ionicons name="checkmark" size={12} color={colors.textInverse} />}
                      </View>
                    </TouchableOpacity>
                    {idx < ADD_ONS.length - 1 && <View style={styles.divider} />}
                  </View>
                );
              })}
            </View>
          </>
        )}

        <View style={styles.qtyRow}>
          <Text style={styles.optionLabel}>Quantity</Text>
          <View style={styles.stepper}>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => setQty(q => Math.max(1, q - 1))}
              activeOpacity={0.7}
            >
              <Ionicons name="remove" size={16} color={colors.brandPrimary} />
            </TouchableOpacity>
            <Text style={styles.stepNum}>{qty}</Text>
            <TouchableOpacity
              style={styles.stepBtn}
              onPress={() => setQty(q => q + 1)}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={16} color={colors.brandPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.footerArea}>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={handleAddToCart}
          activeOpacity={0.85}
        >
          <Text style={styles.addBtnText}>{isEditing ? 'Update Cart' : 'Add to Cart'} · ₱{total}.00</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bgBase },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Sp[5],
      paddingVertical: Sp[2],
    },
    backBtn: { padding: Sp[1] },
    scroll: { paddingBottom: Sp[4] },

    imgPlaceholder: {
      height: 240,
      backgroundColor: colors.bgSubtle,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Sp[5],
    },

    nameRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      paddingHorizontal: Sp[5],
      marginBottom: Sp[2],
    },
    itemName: {
      flex: 1,
      fontSize: FS.headingLg,
      fontWeight: '700',
      color: colors.textPrimary,
      marginRight: Sp[3],
    },
    itemPrice: {
      fontSize: FS.headingLg,
      fontWeight: '800',
      color: colors.brandPrimary,
      flexShrink: 0,
    },
    itemDesc: {
      fontSize: FS.body,
      color: colors.textSecondary,
      lineHeight: 21,
      paddingHorizontal: Sp[5],
      marginBottom: Sp[5],
    },

    optionLabel: {
      fontSize: FS.headingSm,
      fontWeight: '700',
      color: colors.textPrimary,
      paddingHorizontal: Sp[5],
      marginBottom: Sp[3],
      marginTop: Sp[2],
    },
    optionSub: {
      fontSize: FS.label,
      color: colors.textSecondary,
      fontWeight: '400',
    },

    sizeRow: {
      flexDirection: 'row',
      paddingHorizontal: Sp[5],
      gap: Sp[2],
      marginBottom: Sp[2],
    },
    sizeBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: R.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: 'center',
      backgroundColor: colors.bgSurface,
    },
    sizeBtnActive: { borderColor: colors.brandPrimary, backgroundColor: colors.bgSubtle },
    sizeBtnText: { fontSize: FS.label, fontWeight: '600', color: colors.textSecondary },
    sizeBtnDelta: { fontSize: FS.caption, fontWeight: '600', color: colors.textDisabled, marginTop: 2 },
    sizeBtnTextActive: { color: colors.brandPrimary },

    optionCard: {
      backgroundColor: colors.bgSurface,
      borderRadius: R.lg,
      marginHorizontal: Sp[5],
      paddingHorizontal: Sp[4],
      marginBottom: Sp[2],
    },
    radioRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Sp[3] + 1,
    },
    radioLabelCol: { flex: 1 },
    radioLabel: { fontSize: FS.body, color: colors.textPrimary, fontWeight: '400' },
    radioModifier: { fontSize: FS.caption, color: colors.textSecondary, marginTop: 2 },
    radioCircle: {
      width: 20,
      height: 20,
      borderRadius: R.full,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioCircleActive: { borderColor: colors.brandPrimary },
    radioDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.brandPrimary,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: R.sm,
      borderWidth: 2,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxActive: {
      backgroundColor: colors.brandPrimary,
      borderColor: colors.brandPrimary,
    },
    divider: { height: 1, backgroundColor: colors.bgSubtle },

    qtyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Sp[5],
      marginTop: Sp[3],
    },
    stepper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Sp[4],
    },
    stepBtn: {
      width: 34,
      height: 34,
      borderRadius: R.md,
      borderWidth: 1.5,
      borderColor: colors.brandMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepNum: {
      fontSize: FS.headingMd,
      fontWeight: '700',
      color: colors.textPrimary,
      minWidth: 20,
      textAlign: 'center',
    },

    footerArea: {
      paddingHorizontal: Sp[5],
      paddingBottom: Sp[4],
      paddingTop: Sp[2],
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.bgBase,
    },
    addBtn: {
      backgroundColor: colors.brandPrimary,
      borderRadius: R.md,
      paddingVertical: 15,
      alignItems: 'center',
    },
    addBtnText: {
      color: colors.textInverse,
      fontSize: FS.bodyLg,
      fontWeight: '700',
    },
  });
}
