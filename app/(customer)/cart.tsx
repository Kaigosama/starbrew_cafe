import { useMemo } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { R, FS, Sp, cardShadow } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useCartStore } from '../../store/cartStore';
import { ADD_ON_PRICE } from '../../lib/pricing';

export default function CartScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { items, updateQty, clear } = useCartStore();

  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const fee = 15;
  const total = subtotal + fee;

  return (
    <View style={styles.root}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <SafeAreaView style={styles.headerArea} edges={['top']}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Cart</Text>
          <TouchableOpacity onPress={clear} activeOpacity={0.7}>
            <Text style={styles.manageText}>Clear</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="cart-outline" size={48} color={colors.textDisabled} />
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptyText}>Add items from the menu to get started</Text>
          <TouchableOpacity
            style={styles.browseBtn}
            onPress={() => router.push('/(customer)/menu' as any)}
            activeOpacity={0.85}
          >
            <Text style={styles.browseBtnText}>Browse Menu</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView
            contentContainerStyle={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionLabel}>Order Summary</Text>

            <View style={[styles.itemsCard, cardShadow]}>
              {items.map((item, idx) => (
                <View key={item.id}>
                  <View style={styles.itemRow}>
                    <TouchableOpacity
                      style={styles.itemTapArea}
                      activeOpacity={0.7}
                      onPress={() => {
                        // Best-effort initial price for the flash before item-detail
                        // re-fetches the canonical base_price + modifiers from Supabase.
                        const addOnsTotal = item.addOns.length * ADD_ON_PRICE;
                        const approxBasePrice = item.price - addOnsTotal;
                        router.push({
                          pathname: '/(customer)/item-detail' as any,
                          params: {
                            id: String(item.menuItemId),
                            name: item.name,
                            price: String(approxBasePrice),
                            cartItemId: item.id,
                            qty: String(item.qty),
                            size: item.size,
                            milk: item.milk,
                            addOns: item.addOns.join(','),
                            imageUrl: item.imageUrl ?? '',
                            temperature: item.temperature ?? '',
                          },
                        });
                      }}
                    >
                      {item.imageUrl ? (
                        <Image source={{ uri: item.imageUrl }} style={styles.itemImg} resizeMode="cover" />
                      ) : (
                        <View style={styles.itemImg} />
                      )}
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                        {item.size && (
                          <Text style={styles.itemMeta}>
                            {item.temperature ? `${item.temperature} · ` : ''}{item.size}{item.milk ? ` · ${item.milk}` : ''}
                          </Text>
                        )}
                        {item.addOns.length > 0 && (
                          <Text style={styles.itemAddOns}>{item.addOns.join(', ')}</Text>
                        )}
                        <Text style={styles.itemPrice}>₱{item.price}.00</Text>
                      </View>
                    </TouchableOpacity>
                    <View style={styles.qtyStepper}>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => updateQty(item.id, -1)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="remove" size={14} color={colors.brandPrimary} />
                      </TouchableOpacity>
                      <Text style={styles.qtyNum}>{item.qty}</Text>
                      <TouchableOpacity
                        style={styles.qtyBtn}
                        onPress={() => updateQty(item.id, 1)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="add" size={14} color={colors.brandPrimary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  {idx < items.length - 1 && <View style={styles.divider} />}
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.addMoreRow}
              onPress={() => router.push('/(customer)/menu' as any)}
              activeOpacity={0.7}
            >
              <Ionicons name="add-circle-outline" size={16} color={colors.brandPrimary} />
              <Text style={styles.addMoreText}>Add more items</Text>
            </TouchableOpacity>

            <View style={[styles.summaryCard, cardShadow]}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>₱{subtotal}.00</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Service fee</Text>
                <Text style={styles.summaryValue}>₱{fee}.00</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>₱{total}.00</Text>
              </View>
            </View>
          </ScrollView>

          <SafeAreaView edges={['bottom']} style={styles.footerArea}>
            <TouchableOpacity
              style={styles.checkoutBtn}
              onPress={() => router.push('/(customer)/checkout' as any)}
              activeOpacity={0.85}
            >
              <Text style={styles.checkoutBtnText}>Place Order · ₱{total}.00</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </>
      )}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bgBase },
    headerArea: { backgroundColor: colors.bgBase },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Sp[5],
      paddingVertical: Sp[3],
    },
    backBtn: { padding: Sp[1] },
    headerTitle: {
      fontSize: FS.headingMd,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    manageText: {
      fontSize: FS.label,
      fontWeight: '600',
      color: colors.brandSecondary,
    },
    empty: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: Sp[8],
      gap: Sp[3],
    },
    emptyTitle: {
      fontSize: FS.headingMd,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    emptyText: {
      fontSize: FS.body,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    browseBtn: {
      backgroundColor: colors.brandPrimary,
      borderRadius: R.md,
      paddingHorizontal: Sp[6],
      paddingVertical: 12,
      marginTop: Sp[2],
    },
    browseBtnText: {
      color: colors.textInverse,
      fontSize: FS.body,
      fontWeight: '700',
    },
    scroll: {
      paddingHorizontal: Sp[5],
      paddingTop: Sp[2],
      paddingBottom: Sp[4],
    },
    sectionLabel: {
      fontSize: FS.overline,
      fontWeight: '700',
      color: colors.textSecondary,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      marginBottom: Sp[3],
    },
    itemsCard: {
      backgroundColor: colors.bgSurface,
      borderRadius: R.lg,
      paddingHorizontal: Sp[4],
      marginBottom: Sp[3],
    },
    itemRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: Sp[4],
      gap: Sp[3],
    },
    itemTapArea: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Sp[3],
    },
    itemImg: {
      width: 52,
      height: 52,
      borderRadius: R.md,
      backgroundColor: colors.bgSubtle,
      flexShrink: 0,
    },
    itemInfo: { flex: 1 },
    itemName: {
      fontSize: FS.body,
      fontWeight: '500',
      color: colors.textPrimary,
      marginBottom: 2,
      lineHeight: 19,
    },
    itemMeta: {
      fontSize: FS.caption,
      color: colors.textSecondary,
      marginBottom: 1,
    },
    itemAddOns: {
      fontSize: FS.caption,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    itemPrice: {
      fontSize: FS.label,
      fontWeight: '700',
      color: colors.brandSecondary,
    },
    qtyStepper: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Sp[2],
    },
    qtyBtn: {
      width: 26,
      height: 26,
      borderRadius: R.sm,
      borderWidth: 1.5,
      borderColor: colors.brandMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    qtyNum: {
      fontSize: FS.body,
      fontWeight: '700',
      color: colors.textPrimary,
      minWidth: 16,
      textAlign: 'center',
    },
    divider: { height: 1, backgroundColor: colors.bgSubtle },
    addMoreRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Sp[2],
      paddingVertical: Sp[3],
      marginBottom: Sp[4],
    },
    addMoreText: {
      fontSize: FS.body,
      color: colors.brandPrimary,
      fontWeight: '600',
    },
    summaryCard: {
      backgroundColor: colors.bgSurface,
      borderRadius: R.lg,
      padding: Sp[4],
    },
    summaryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Sp[2],
    },
    summaryLabel: { fontSize: FS.body, color: colors.textSecondary },
    summaryValue: { fontSize: FS.body, color: colors.textPrimary, fontWeight: '500' },
    totalLabel: { fontSize: FS.bodyLg, fontWeight: '700', color: colors.textPrimary },
    totalValue: { fontSize: FS.bodyLg, fontWeight: '800', color: colors.brandPrimary },
    footerArea: { paddingHorizontal: Sp[5], paddingBottom: Sp[4], paddingTop: Sp[2] },
    checkoutBtn: {
      backgroundColor: colors.brandPrimary,
      borderRadius: R.md,
      paddingVertical: 15,
      alignItems: 'center',
    },
    checkoutBtnText: {
      color: colors.textInverse,
      fontSize: FS.bodyLg,
      fontWeight: '700',
    },
  });
}
