import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Category } from '../../constants/categories';
import { useTheme } from '../../theme/ThemeProvider';

/** Rounded tinted chip holding the category's Ionicons glyph. */
export function CategoryIcon({ category, size = 44 }: { category: Category; size?: number }) {
  const t = useTheme();
  return (
    <View
      style={{
        width: size, height: size, borderRadius: size * 0.32,
        backgroundColor: category.color + (t.scheme === 'dark' ? '26' : '1F'),
        justifyContent: 'center', alignItems: 'center',
      }}
    >
      <Ionicons name={category.icon} size={size * 0.5} color={category.color} />
    </View>
  );
}
