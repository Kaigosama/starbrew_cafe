import { LogBox } from 'react-native';

// expo-notifications logs these the instant it's imported under Expo Go —
// expo-router imports every layout file (including the customer one) to
// build its route tree at startup, so this fires regardless of which screen
// is active. LogBox.ignoreLogs only hides the in-app overlay; the same
// console.warn/console.error calls still get forwarded to the Metro/dev-tools
// log (via React Native's console.level -> HMRClient.log), so we patch the
// console methods themselves to drop these two known messages outright.
// Must run before `expo-router/entry` below, hence the plain require() — a
// static import here would get hoisted above this line.
const IGNORED_PATTERNS = [
  '`expo-notifications` functionality is not fully supported in Expo Go',
  'Android Push notifications (remote notifications) functionality provided by expo-notifications was removed from Expo Go',
];

function matchesIgnored(args) {
  return typeof args[0] === 'string' && IGNORED_PATTERNS.some((p) => args[0].includes(p));
}

const originalWarn = console.warn;
const originalError = console.error;

console.warn = (...args) => {
  if (matchesIgnored(args)) return;
  originalWarn(...args);
};
console.error = (...args) => {
  if (matchesIgnored(args)) return;
  originalError(...args);
};

LogBox.ignoreLogs(IGNORED_PATTERNS);

require('expo-router/entry');
