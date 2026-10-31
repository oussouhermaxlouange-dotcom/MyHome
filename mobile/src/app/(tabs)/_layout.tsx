import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '../../config'

const TABS = [
  { name: 'index', title: 'Annonces', label: 'Accueil', icon: 'home' },
  { name: 'favoris', title: 'Mes favoris', label: 'Favoris', icon: 'heart' },
  { name: 'messages', title: 'Messagerie', label: 'Messages', icon: 'chatbubbles' },
  { name: 'dossier', title: 'Mon dossier', label: 'Dossier', icon: 'folder-open' },
  { name: 'profil', title: 'Mon profil', label: 'Profil', icon: 'person' },
] as const

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShadowVisible: false,
        headerStyle: { backgroundColor: COLORS.white },
        headerTitleStyle: { fontWeight: '800', color: COLORS.slate900 },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.slate400,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen key={tab.name} name={tab.name} options={{
          title: tab.title,
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={(focused ? tab.icon : tab.icon + '-outline') as never} size={22} color={String(color)} />
          ),
        }} />
      ))}
    </Tabs>
  )
}
