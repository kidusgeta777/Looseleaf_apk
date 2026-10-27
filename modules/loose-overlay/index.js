import { Platform } from 'react-native';
import { requireNativeModule } from 'expo-modules-core';

// ---- Android: the real floating circle (native Kotlin module) ----
const Native = Platform.OS === 'android' ? requireNativeModule('LooseOverlay') : null;

// ---- Browser preview: no floating circle on the web, so just remember the settings ----
const isWeb = Platform.OS === 'web';
const get = (k, d) => { try { const v = window.localStorage.getItem('loose_' + k); return v === null ? d : v; } catch (e) { return d; } };
const set = (k, v) => { try { window.localStorage.setItem('loose_' + k, v); } catch (e) { /* ignore */ } };

const web = {
  supported: true,
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
  canDrawOverlays: () => (Native ? Native.canDrawOverlays() : false),
  requestOverlayPermission: () => Native && Native.requestOverlayPermission(),
  /** Starts the floating circle. Returns false if permission or a saved key is missing. */
  start: () => (Native ? Native.start() : false),
  stop: () => Native && Native.stop(),
  isEnabled: () => (Native ? Native.isEnabled() : false),
  isRunning: () => (Native ? Native.isRunning() : false),
  /** Only ONE config (server + key) is ever stored; saving replaces it. */
  saveConfig: (endpoint, key) => Native && Native.saveConfig(endpoint, key),
  getConfig: () => (Native ? Native.getConfig() : { endpoint: '', key: '' }),
  clearConfig: () => Native && Native.clearConfig(),
};

export default isWeb ? web : android;
