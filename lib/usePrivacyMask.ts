import { useUIStore } from '../store/useUIStore';
import { HIDDEN_AMOUNT, fmtMAD, fmtSigned } from './format';

/**
 * Returns masking helpers driven by the global hideAmounts toggle.
 * Use `mask(fmtMAD(x))` or `maskSigned(x)` in any screen.
 */
export function usePrivacyMask() {
  const hide = useUIStore(s => s.hideAmounts);
  return {
    hide,
    mask: (formatted: string) => hide ? HIDDEN_AMOUNT : formatted,
    maskMAD: (n: number, digits = 0) => hide ? HIDDEN_AMOUNT : fmtMAD(n, digits),
    maskSigned: (n: number, digits = 0) => hide ? HIDDEN_AMOUNT : fmtSigned(n, digits),
  };
}
