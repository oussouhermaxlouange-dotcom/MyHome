import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { AuthProvider } from '../lib/auth'

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#ffffff' },
          headerTitleStyle: { fontWeight: '800' },
          contentStyle: { backgroundColor: '#f8fafc' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ title: 'Mon compte MyHome', presentation: 'modal' }} />
        <Stack.Screen name="annonce/[id]" options={{ title: 'Annonce' }} />
        <Stack.Screen name="conversation/[id]" options={{ title: 'Conversation' }} />
        <Stack.Screen name="candidatures" options={{ title: 'Mes candidatures' }} />
      </Stack>
    </AuthProvider>
  )
}
