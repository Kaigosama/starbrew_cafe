import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { R, FS, Sp, cardShadow } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import { useCartStore } from '../../store/cartStore';
import { supabase } from '../../lib/supabase';

const SCREEN_W = Dimensions.get('window').width;
const ITEM_W = (SCREEN_W - Sp[5] * 2 - Sp[3]) / 2;

type MenuItem = { id: string; name: string; price: number; category_id: string };
type Category = { id: string; name: string };

const ALL_CHIP = { id: 'all', name: 'All' };

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

  const [allItems, setAllItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const [catRes, itemRes] = await Promise.all([
        supabase.from('categories').select('id, name').order('name'),
        supabase.from('menu_items').select('id, name, base_price, category_id').eq('is_available', true).order('name'),
      ]);
      if (catRes.error) console.error('categories fetch error:', catRes.error.message);
      if (itemRes.error) console.error('menu_items fetch error:', itemRes.error.message);
      if (catRes.data) {
        setCategories(catRes.data.map(c => ({ id: String(c.id), name: c.name })));
      }
      if (itemRes.data) {
        setAllItems(itemRes.data.map(d => ({
          id: String(d.id),
          name: d.name,
          price: d.base_price,
          category_id: String(d.category_id),
        })));
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  const visibleItems = useMemo(() => {
    let items = allItems;
    if (activeCategory !== 'all') {
      items = items.filter((i) => i.category_id === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((i) => i.name.toLowerCase().includes(q));
    }
    return items;
  }, [allItems, activeCategory, search]);

  const chips = [ALL_CHIP, ...categories];

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
          {chips.map(cat => {
            const active = activeCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setActiveCategory(cat.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.brandPrimary} size="large" />
          </View>
        ) : visibleItems.length === 0 ? (
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
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: Sp[5], paddingTop: Sp[3], paddingBottom: Sp[3],
    },
    headerTitle: { fontSize: FS.headingLg, fontWeight: '800', color: colors.textPrimary },
    searchBar: {
      flexDirection: 'row', alignItems: 'center', gap: Sp[2],
      backgroundColor: colors.bgSubtle, borderRadius: R.md,
      marginHorizontal: Sp[5], paddingHorizontal: Sp[3], paddingVertical: 10,
      marginBottom: Sp[3], borderWidth: 1, borderColor: colors.border,
    },
    searchInput: { flex: 1, fontSize: FS.body, color: colors.textPrimary, padding: 0 },
    chipsRow: { gap: Sp[2], paddingHorizontal: Sp[5], paddingBottom: Sp[3] },
    chip: {
      paddingHorizontal: Sp[3], paddingVertical: 6, borderRadius: R.full,
      borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.bgSurface,
    },
    chipActive: { borderColor: colors.brandPrimary, backgroundColor: colors.brandPrimary },
    chipText: { fontSize: FS.label, fontWeight: '500', color: colors.textSecondary },
    chipTextActive: { color: colors.textInverse, fontWeight: '600' },
    scroll: { paddingHorizontal: Sp[5], paddingBottom: 90, paddingTop: Sp[2] },
    centered: { alignItems: 'center', paddingTop: Sp[12] },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Sp[3] },
    empty: { alignItems: 'center', paddingTop: Sp[12], gap: Sp[3] },
    emptyText: { fontSize: FS.body, color: colors.textSecondary },
    itemCard: {
      width: ITEM_W, backgroundColor: colors.bgSurface, borderRadius: R.lg, overflow: 'hidden',
    },
    itemImg: { height: 120, backgroundColor: colors.bgSubtle },
    itemBody: { padding: Sp[3], paddingBottom: Sp[2] },
    itemName: {
      fontSize: FS.label, fontWeight: '600', color: colors.textPrimary, marginBottom: 3, lineHeight: 18,
    },
    itemPrice: { fontSize: FS.label, fontWeight: '700', color: colors.brandSecondary },
    addBtn: {
      position: 'absolute', bottom: Sp[3], right: Sp[3], width: 26, height: 26,
      borderRadius: R.full, backgroundColor: colors.brandPrimary, alignItems: 'center', justifyContent: 'center',
    },
    cartFab: {
      position: 'absolute', bottom: 80, right: Sp[4],
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: colors.brandPrimary, borderRadius: R.full,
      paddingHorizontal: Sp[4], paddingVertical: 10,
      shadowColor: colors.brandPrimary, shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35, shadowRadius: 10, elevation: 6,
    },
    cartFabText: { color: colors.textInverse, fontSize: FS.label, fontWeight: '700' },
  });
}
