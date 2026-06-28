import { Tabs } from 'expo-router';
import TabBar from '../../components/TabBar';
import QuickAdd from '../../components/QuickAdd';
import NavMenu from '../../components/NavMenu';
import { useUIStore } from '../../store/useUIStore';

export default function TabLayout() {
  const { quickAddOpen, closeQuickAdd } = useUIStore();

  return (
    <>
      <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="index"     options={{ title: 'Accueil'   }} />
        <Tabs.Screen name="cards"     options={{ title: 'Comptes'   }} />
        <Tabs.Screen name="goals"     options={{ title: 'Objectifs' }} />
        <Tabs.Screen name="portfolio" options={{ title: 'Bourse'    }} />
      </Tabs>

      <NavMenu />
      <QuickAdd visible={quickAddOpen} onClose={closeQuickAdd} />
    </>
  );
}
