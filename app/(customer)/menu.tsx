import { useMemo, useState } from 'react';
import {
  Dimensions, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { R, FS, Sp, cardShadow } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useCartStore } from '../../store/cartStore';

const SCREEN_W = Dimensions.get('window').width;
const ITEM_W = (SCREEN_W - Sp[5] * 2 - Sp[3]) / 2;

const CATEGORIES = [
  { id: 'all',           label: 'All' },
  { id: 'popular',       label: 'Popular' },
  { id: 'brewed',        label: 'Brewed Coffee' },
  { id: 'espresso',      label: 'Iced Espresso' },
  { id: 'frappuccino',   label: 'Frappuccino' },
  { id: 'refreshers',    label: 'Refreshers' },
  { id: 'chocolate',     label: 'Chocolate & More' },
  { id: 'teavana',       label: 'Teavana Tea' },
  { id: 'reserve',       label: 'Reserve' },
];

type MenuItem = { id: string; name: string; price: number; category: string };

const ALL_ITEMS: MenuItem[] = [
  { id: '1',  name: 'Cold Brew',                          price: 175, category: 'popular' },
  { id: '2',  name: 'Vanilla Sweet Cream Cold Brew',      price: 195, category: 'popular' },
  { id: '3',  name: 'Nitro Cold Brew',                    price: 185, category: 'popular' },
  { id: '4',  name: 'Caramel Frappuccino',                price: 205, category: 'popular' },
  { id: '5',  name: 'Pike Place Roast',                   price: 120, category: 'brewed' },
  { id: '6',  name: 'Dark Roast',                         price: 120, category: 'brewed' },
  { id: '7',  name: 'Blonde Roast',                       price: 120, category: 'brewed' },
  { id: '8',  name: 'Hazelnut Mocha',                     price: 185, category: 'espresso' },
  { id: '9',  name: 'Iced Caffè Americano',               price: 150, category: 'espresso' },
  { id: '10', name: 'Iced Flat White',                    price: 175, category: 'espresso' },
  { id: '11', name: 'Iced Caramel Macchiato',             price: 190, category: 'espresso' },
  { id: '12', name: 'Mocha Frappuccino',                  price: 205, category: 'frappuccino' },
  { id: '13', name: 'Java Chip Frappuccino',              price: 215, category: 'frappuccino' },
  { id: '14', name: 'Vanilla Frappuccino',                price: 195, category: 'frappuccino' },
  { id: '15', name: 'Strawberry Açaí Refresher',          price: 165, category: 'refreshers' },
  { id: '16', name: 'Mango Dragonfruit Refresher',        price: 165, category: 'refreshers' },
  { id: '17', name: 'Pink Drink',                         price: 175, category: 'refreshers' },
  { id: '18', name: 'Hot Chocolate',                      price: 140, category: 'chocolate' },
  { id: '19', name: 'White Hot Chocolate',                price: 150, category: 'chocolate' },
  { id: '20', name: 'Matcha Latte',                       price: 160, category: 'chocolate' },
  { id: '21', name: 'Jade Citrus Mint Tea',               price: 130, category: 'teavana' },
  { id: '22', name: 'Peach Tranquility Tea',              price: 130, category: 'teavana' },
  { id: '23', name: 'Honey Citrus Mint Tea',              price: 145, category: 'teavana' },
  { id: '24', name: 'Reserve Clover Brewed',              price: 220, category: 'reserve' },
  { id: '25', name: 'Reserve Cold Brew',                  price: 235, category: 'reserve' },
];

function ItemCard({ item, colors, styles }: { item: MenuItem; colors: any; styles: any }) {
  const addItem = useCartStore((s) => s.addItem);
  return (
    <TouchableOpacity
      style={[styles.itemCard, cardShadow]}
      activeOpacity={0.85}
      onPress={() =>
        router.push({
          pathname: '/(customer)/item-detail' as any,
          params: { id: item.id, name: item.name, price: item.price.toString() },
        })
      }
    >
      <View style={styles.itemImg} />
      <View style={styles.itemBody}>
        <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.itemPrice}>₱{item.price}.00</Text>
      </View>
      <TouchableOpacity
        style={styles.addBtn}
        activeOpacity={0.8}
        onPress={() =>
          addItem({ id: item.id, name: item.name, price: item.price, size: 'Grande', milk: 'Whole Milk', addOns: [] })
        }
      >
        <Ionicons name="add" size={16} color={colors.textInverse} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function MenuScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const cartCount = useCartStore((s) => s.items.reduce((n, i) => n + i.qty, 0));

  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');

  const visibleItems = useMemo(() => {
    let items = ALL_ITEMS;
    if (activeCategory !== 'all') {
      items = items.filter((i) => i.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((i) => i.name.toLowerCase().includes(q));
    }
    return items;
  }, [activeCategory, search]);

  return (
    <View style={styles.root}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <SafeAreaView style={styles.headerArea} edges={['top']}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Menu</Text>
        </View>

        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color={colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search drinks…"
            placeholderTextColor={colors.textDisabled}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {CATEGORIES.map(cat => {
            const active = activeCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setActiveCategory(cat.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {visibleItems.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="cafe-outline" size={40} color={colors.textDisabled} />
            <Text style={styles.emptyText}>No drinks found</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {visibleItems.map(item => (
              <ItemCard key={item.id} item={item} colors={colors} styles={styles} />
            ))}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.cartFab}
        onPress={() => router.push('/(customer)/cart' as any)}
        activeOpacity={0.9}
      >
        <Ionicons name="cart-outline" size={18} color={colors.textInverse} />
        <Text style={styles.cartFabText}>
          {cartCount > 0 ? `Cart · ${cartCount}` : 'My Cart'}
        </Text>
      </TouchableOpacity>
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
      paddingTop: Sp[3],
      paddingBottom: Sp[3],
    },
    headerTitle: {
      fontSize: FS.headingLg,
      fontWeight: '800',
      color: colors.textPrimary,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Sp[2],
      backgroundColor: colors.bgSubtle,
      borderRadius: R.md,
      marginHorizontal: Sp[5],
      paddingHorizontal: Sp[3],
      paddingVertical: 10,
      marginBottom: Sp[3],
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      fontSize: FS.body,
      color: colors.textPrimary,
      padding: 0,
    },
    chipsRow: {
      gap: Sp[2],
      paddingHorizontal: Sp[5],
      paddingBottom: Sp[3],
    },
    chip: {
      paddingHorizontal: Sp[3],
      paddingVertical: 6,
      borderRadius: R.full,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.bgSurface,
    },
    chipActive: {
      borderColor: colors.brandPrimary,
      backgroundColor: colors.brandPrimary,
    },
    chipText: {
      fontSize: FS.label,
      fontWeight: '500',
      color: colors.textSecondary,
    },
    chipTextActive: { color: colors.textInverse, fontWeight: '600' },
    scroll: {
      paddingHorizontal: Sp[5],
      paddingBottom: 90,
      paddingTop: Sp[2],
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: Sp[3],
    },
    empty: {
      alignItems: 'center',
      paddingTop: Sp[12],
      gap: Sp[3],
    },
    emptyText: { fontSize: FS.body, color: colors.textSecondary },
    itemCard: {
      width: ITEM_W,
      backgroundColor: colors.bgSurface,
      borderRadius: R.lg,
      overflow: 'hidden',
    },
    itemImg: {
      height: 120,
      backgroundColor: colors.bgSubtle,
    },
    itemBody: { padding: Sp[3], paddingBottom: Sp[2] },
    itemName: {
      fontSize: FS.label,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: 3,
      lineHeight: 18,
    },
    itemPrice: {
      fontSize: FS.label,
      fontWeight: '700',
      color: colors.brandSecondary,
    },
    addBtn: {
      position: 'absolute',
      bottom: Sp[3],
      right: Sp[3],
      width: 26,
      height: 26,
      borderRadius: R.full,
      backgroundColor: colors.brandPrimary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cartFab: {
      position: 'absolute',
      bottom: 80,
      right: Sp[4],
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.brandPrimary,
      borderRadius: R.full,
      paddingHorizontal: Sp[4],
      paddingVertical: 10,
      shadowColor: colors.brandPrimary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 10,
      elevation: 6,
    },
    cartFabText: {
      color: colors.textInverse,
      fontSize: FS.label,
      fontWeight: '700',
    },
  });
}
