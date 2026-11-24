const TWA_PACKAGE_REFERRER = 'android-app://com.iktis.rentmanager';

/**
 * PWABuilder's Trusted Web Activity supplies the Android package as the
 * document referrer. Keep this package-specific so regular browsers and
 * installed standalone PWAs continue to use the existing web experience.
 */
export function isTrustedWebActivity() {
  if (typeof document === 'undefined') return false;
  return document.referrer.startsWith(TWA_PACKAGE_REFERRER);
}
