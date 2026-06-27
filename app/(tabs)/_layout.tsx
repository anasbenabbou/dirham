import { Tabs } from 'expo-router';
import { Colors } from '../../constants/colors';
import TabBar from '../../components/TabBar';
import QuickAdd from '../../components/QuickAdd';
import { useUIStore } from '../../store/useUIStore';

export default function TabLayout() {
  const { quickAddOpen, closeQuickAdd } = useUIStore();

  return (
    <>
      <Tabs
        tabBar={(props) => <TabBar {...props} />}
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.card,
            shadowColor: 'transparent',
            elevation: 0,
            borderBottomWidth: 1,
            borderBottomColor: Colors.border,
          } as any,
          headerTintColor: Colors.text,
          headerTitleStyle: { fontWeight: '700', fontSize: 17, color: Colors.text },
        }}
      >
        <Tabs.Screen name="index"        options={{ title: 'Tableau de bord' }} />
        <Tabs.Screen name="cards"        options={{ title: 'Mes comptes'     }} />
        <Tabs.Screen name="goals"        options={{ title: 'Mes objectifs'   }} />
        <Tabs.Screen name="portfolio"    options={{ title: 'Portefeuille BVC'}} />

        {/* Still navigable, just not in the tab bar */}
        <Tabs.Screen name="transactions" options={{ title: 'Transactions', href: null }} />
        <Tabs.Screen name="budget"       options={{ title: 'Budget 50/30/20', href: null }} />
      </Tabs>

      <QuickAdd visible={quickAddOpen} onClose={closeQuickAdd} />
    </>
  );
}
