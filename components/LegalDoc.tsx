import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { FS, Sp } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

type Block =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'bullet'; label?: string; text: string };

type Doc = { title: string; meta?: string; intro?: string; blocks: Block[] };

const DOCS: Record<string, Doc> = {
  about: {
    title: 'About StarBrew Cafe',
    intro: 'Welcome to StarBrew Cafe!',
    blocks: [
      {
        type: 'paragraph',
        text:
          'Our mission is to revolutionize your daily coffee run. We understand that your time is valuable, and waiting in unpredictable lines can disrupt your busy schedule. StarBrew Cafe was built to bridge the gap between craving your favorite beverage and getting it into your hands as efficiently as possible.',
      },
      {
        type: 'paragraph',
        text:
          'Powered by a seamless mobile ordering platform, our application features an advanced in-store queue management system and dynamic Estimated Time of Arrival (ETA) tracking. Whether you are grabbing a quick espresso before class or a customized Frappuccino on your break, StarBrew Cafe ensures your order is perfectly timed and ready right when you arrive. Less waiting, more brewing.',
      },
    ],
  },
  terms: {
    title: 'Terms & Conditions',
    meta: 'Last Updated: June 23, 2026',
    blocks: [
      { type: 'heading', text: '1. Acceptance of Terms' },
      {
        type: 'paragraph',
        text:
          'By accessing and using the StarBrew Cafe application, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please refrain from using the application.',
      },
      { type: 'heading', text: '2. User Accounts' },
      {
        type: 'paragraph',
        text:
          'To use our mobile ordering and queueing features, users must register for an account. You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account.',
      },
      { type: 'heading', text: '3. Orders and Dynamic Queueing' },
      {
        type: 'bullet',
        label: 'Order Placement',
        text: 'All orders placed through the application are subject to availability.',
      },
      {
        type: 'bullet',
        label: 'Dynamic ETAs',
        text:
          'The Estimated Time of Arrival provided by the application is calculated based on current in-store queue volume and preparation times. While we strive for accuracy, ETAs are estimates and not absolute guarantees.',
      },
      {
        type: 'bullet',
        label: 'Cancellations',
        text: 'Orders cannot be canceled once they have entered the preparation phase in our system.',
      },
      { type: 'heading', text: '4. Academic Project Disclaimer' },
      {
        type: 'paragraph',
        text:
          'Please note that this version of StarBrew Cafe is a functional prototype developed for academic and demonstration purposes. No real monetary transactions are processed, and no actual beverages are brewed.',
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    meta: 'Last Updated: June 23, 2026',
    blocks: [
      { type: 'heading', text: '1. Information We Collect' },
      {
        type: 'paragraph',
        text: 'To provide you with a seamless ordering experience, we collect the following types of information:',
      },
      {
        type: 'bullet',
        label: 'Personal Data',
        text: 'Name, email address, and account passwords (securely hashed) when you register.',
      },
      {
        type: 'bullet',
        label: 'Usage Data',
        text: 'Information on your order history, favorite items, and app interactions.',
      },
      {
        type: 'bullet',
        label: 'Location Data',
        text:
          'We may request location access to calculate accurate dynamic ETAs and optimize your queue position as you approach the store.',
      },
      { type: 'heading', text: '2. How We Use Your Information' },
      { type: 'paragraph', text: 'We use the collected data strictly to:' },
      { type: 'bullet', text: 'Process and manage your mobile orders.' },
      { type: 'bullet', text: 'Calculate accurate preparation times and queue positioning.' },
      { type: 'bullet', text: 'Improve the overall user experience and application performance.' },
      { type: 'heading', text: '3. Data Security' },
      {
        type: 'paragraph',
        text:
          'We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, or deletion.',
      },
      { type: 'heading', text: '4. Sharing of Information' },
      {
        type: 'paragraph',
        text:
          'We do not sell, trade, or rent your personal information to third parties. Data is used exclusively within the StarBrew Cafe ecosystem to facilitate your orders.',
      },
    ],
  },
};

export default function LegalDoc() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { doc: docParam } = useLocalSearchParams<{ doc?: string }>();
  const doc = DOCS[docParam ?? ''] ?? DOCS.about;

  return (
    <View style={styles.root}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <SafeAreaView edges={['top']} style={styles.headerArea}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{doc.title}</Text>
          <View style={{ width: 32 }} />
        </View>
      </SafeAreaView>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {doc.meta && <Text style={styles.meta}>{doc.meta}</Text>}
        {doc.intro && <Text style={styles.intro}>{doc.intro}</Text>}

        {doc.blocks.map((block, idx) => {
          if (block.type === 'heading') {
            return <Text key={idx} style={styles.heading}>{block.text}</Text>;
          }
          if (block.type === 'bullet') {
            return (
              <View key={idx} style={styles.bulletRow}>
                <Text style={styles.bulletDot}>{'•'}</Text>
                <Text style={styles.bulletText}>
                  {block.label && <Text style={styles.bulletLabel}>{block.label}: </Text>}
                  {block.text}
                </Text>
              </View>
            );
          }
          return <Text key={idx} style={styles.paragraph}>{block.text}</Text>;
        })}
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bgBase },
    headerArea: { backgroundColor: colors.bgBase },
    headerRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: Sp[5], paddingVertical: Sp[2],
    },
    backBtn: { padding: Sp[1] },
    headerTitle: { flex: 1, textAlign: 'center', fontSize: FS.headingMd, fontWeight: '700', color: colors.textPrimary },
    scroll: { paddingHorizontal: Sp[5], paddingTop: Sp[2], paddingBottom: Sp[8] },
    meta: { fontSize: FS.caption, color: colors.textSecondary, marginBottom: Sp[4] },
    intro: {
      fontSize: FS.headingMd, fontWeight: '700', color: colors.textPrimary, marginBottom: Sp[3],
    },
    heading: {
      fontSize: FS.headingSm, fontWeight: '700', color: colors.textPrimary,
      marginTop: Sp[5], marginBottom: Sp[2],
    },
    paragraph: {
      fontSize: FS.body, color: colors.textSecondary, lineHeight: 21, marginBottom: Sp[2],
      textAlign: 'justify',
    },
    bulletRow: { flexDirection: 'row', gap: Sp[2], marginBottom: Sp[2], paddingLeft: Sp[1] },
    bulletDot: { fontSize: FS.body, color: colors.brandPrimary, lineHeight: 21 },
    bulletText: {
      flex: 1, fontSize: FS.body, color: colors.textSecondary, lineHeight: 21,
      textAlign: 'justify',
    },
    bulletLabel: { fontWeight: '700', color: colors.textPrimary },
  });
}
