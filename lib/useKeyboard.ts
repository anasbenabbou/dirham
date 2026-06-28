import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/** Current on-screen keyboard height (0 when hidden). Drives manual avoidance. */
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    // Use the "Will" events on iOS (smoother) and "Did" on Android.
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvt, e => setHeight(e.endCoordinates?.height ?? 0));
    const hide = Keyboard.addListener(hideEvt, () => setHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);
  return height;
}
