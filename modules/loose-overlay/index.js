import { Platform } from 'react-native';
import { requireNativeModule } from 'expo-modules-core';

// ---- Android: the real floating circle (native Kotlin module) ----
let Native = null;
let lastError = '';
if (Platform.OS === 'android') {
  try { Native = requireNativeModule('LooseOverlay'); } catch (e) { lastError = 'Native module not found: ' + (e && e.message ? e.message : e); }
}
// Every native call is wrapped so a native error shows on screen instead of closing the app.
const safe = (fn, fallback) => {
  try { return fn(); } catch (e) { lastError = (e && e.message) ? e.message : String(e); return fallback; }
};

// ---- Browser preview: no floating circle on the web, so just remember the settings ----
const isWeb = Platform.OS === 'web';
const get = (k, d) => { try { const v = window.localStorage.getItem('loose_' + k); return v === null ? d : v; } catch (e) { return d; } };
const set = (k, v) => { try { window.localStorage.setItem('loose_' + k, v); } catch (e) { /* ignore */ } };

const web = {
  supported: true,
  error: () => '',
  canDrawOverlays: () => true,
  requestOverlayPermission: () => {},
  start: () => { if (!get('key', '')) return false; set('enabled', '1'); return true; },
  stop: () => set('enabled', '0'),
  isEnabled: () => get('enabled', '0') === '1',
  isRunning: () => get('enabled', '0') === '1',
  saveConfig: (endpoint, key) => { set('endpoint', endpoint); set('key', key); },
  getConfig: () => ({ endpoint: get('endpoint', ''), key: get('key', '') }),
  clearConfig: () => { set('endpoint', ''); set('key', ''); set('enabled', '0'); },
};

const android = {
  supported: !!Native,
  error: () => lastError,
  canDrawOverlays: () => safe(() => Native.canDrawOverlays(), false),
  requestOverlayPermission: () => safe(() => Native.requestOverlayPermission(), undefined),
  /** Starts the floating circle. Returns false if permission or a saved key is missing. */
  start: () => safe(() => Native.start(), false),
  stop: () => safe(() => Native.stop(), undefined),
  isEnabled: () => safe(() => Native.isEnabled(), false),
  isRunning: () => safe(() => Native.isRunning(), false),
  /** Only ONE config (server + key) is ever stored; saving replaces it. */
  saveConfig: (endpoint, key) => safe(() => Native.saveConfig(endpoint, key), undefined),
  getConfig: () => safe(() => Native.getConfig(), { endpoint: '', key: '' }),
  clearConfig: () => safe(() => Native.clearConfig(), undefined),
};

export default isWeb ? web : android;