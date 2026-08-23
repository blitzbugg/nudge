/**
 * Nudge Biometric Lock Service
 *
 * Abstraction for biometric authentication.
 * Isolates the native boundary - in Expo Go this will gracefully fallback.
 * Full biometric support requires a development build.
 */

import * as LocalAuthentication from 'expo-local-authentication';

let biometricEnabled = false;

export function setBiometricEnabled(value: boolean) {
  biometricEnabled = value;
}

export function isBiometricEnabled() {
  return biometricEnabled;
}

export type BiometricType = 'fingerprint' | 'face' | 'iris' | 'none';

/** Check if biometric hardware is available */
export async function isAvailable(): Promise<boolean> {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return compatible && enrolled;
  } catch {
    return false;
  }
}

/** Get the type of biometric available */
export async function getBiometricType(): Promise<BiometricType> {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'face';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'fingerprint';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'iris';
    }
    return 'none';
  } catch {
    return 'none';
  }
}

/** Prompt for biometric authentication */
export async function authenticate(reason?: string): Promise<boolean> {
  if (!biometricEnabled) return true;
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason || 'Authenticate to unlock Nudge',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
    });
    return result.success;
  } catch {
    return false;
  }
}
