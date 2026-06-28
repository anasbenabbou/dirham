import * as ImagePicker from 'expo-image-picker';

/** Opens the library and returns the picked image URI, or null if cancelled/denied. */
export async function pickReceipt(): Promise<string | null> {
  try {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return null;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.6,
      allowsEditing: false,
    });
    if (res.canceled || !res.assets?.length) return null;
    return res.assets[0].uri;
  } catch {
    return null;
  }
}

/** Opens the camera and returns the captured image URI, or null. */
export async function captureReceipt(): Promise<string | null> {
  try {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return null;
    const res = await ImagePicker.launchCameraAsync({ quality: 0.6 });
    if (res.canceled || !res.assets?.length) return null;
    return res.assets[0].uri;
  } catch {
    return null;
  }
}
