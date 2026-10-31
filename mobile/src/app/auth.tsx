import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useAuth } from '../lib/auth'
import { ApiError } from '../lib/api'
import { PressableScale } from '../components/PressableScale'
import { COLORS } from '../config'

export default function AuthScreen() {
  const params = useLocalSearchParams<{ redirect?: string }>()
  const { login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'tenant' | 'landlord'>('tenant')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    setError('')
    setBusy(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register({ firstName, lastName, email, password, role, phone: phone.trim() || undefined })
      }
      router.replace(params.redirect ? (params.redirect as never) : '/')
    } catch (caught) {
      setError(caught instanceof ApiError || caught instanceof Error ? caught.message : 'Identifiants incorrects.')
    } finally {
      setBusy(false)
    }
  }

  const canSubmit = mode === 'login'
    ? email.length > 3 && password.length >= 8
    : firstName.length > 1 && lastName.length > 1 && email.length > 3 && password.length >= 8

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Animated.View entering={FadeInDown.springify().damping(16)} style={styles.header}>
          <View style={styles.logo}>
            <Ionicons name="home" size={26} color={COLORS.white} />
          </View>
          <Text style={styles.title}>MyHome</Text>
          <Text style={styles.subtitle}>
            {mode === 'login' ? 'Connectez-vous pour candidater, réserver et discuter.' : 'Créez votre compte en quelques secondes.'}
          </Text>
        </Animated.View>

        <View style={styles.form}>
          <View style={styles.tabs}>
            <PressableScale style={[styles.tab, mode === 'login' && styles.tabActive]} onPress={() => setMode('login')} scaleTo={0.97}>
              <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>Connexion</Text>
            </PressableScale>
            <PressableScale style={[styles.tab, mode === 'register' && styles.tabActive]} onPress={() => setMode('register')} scaleTo={0.97}>
              <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>Inscription</Text>
            </PressableScale>
          </View>

              {mode === 'register' && (
            <>
              <TextInput style={styles.input} placeholder="Prénom" value={firstName} onChangeText={setFirstName} autoCapitalize="words" />
              <TextInput style={styles.input} placeholder="Nom" value={lastName} onChangeText={setLastName} autoCapitalize="words" />
              <TextInput
                style={styles.input}
                placeholder="Téléphone (+229…)"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />
              <View style={styles.roleRow}>
                <PressableScale style={[styles.roleChip, role === 'tenant' && styles.roleChipActive]} onPress={() => setRole('tenant')} scaleTo={0.95}>
                  <Text style={[styles.roleChipText, role === 'tenant' && styles.roleChipTextActive]}>Je cherche un logement</Text>
                </PressableScale>
                <PressableScale style={[styles.roleChip, role === 'landlord' && styles.roleChipActive]} onPress={() => setRole('landlord')} scaleTo={0.95}>
                  <Text style={[styles.roleChipText, role === 'landlord' && styles.roleChipTextActive]}>Je suis bailleur</Text>
                </PressableScale>
              </View>
            </>
          )}

          <TextInput
            style={styles.input}
            placeholder="Adresse e-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            style={styles.input}
            placeholder="Mot de passe (8 caractères minimum)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {Boolean(error) && <Text style={styles.error}>{error}</Text>}

          <PressableScale
            style={[styles.submit, (busy || !canSubmit) && styles.submitDisabled]}
            disabled={busy || !canSubmit}
            onPress={() => void submit()}
          >
            <Text style={styles.submitText}>{busy ? 'Patientez…' : mode === 'login' ? 'Se connecter' : "Créer mon compte"}</Text>
          </PressableScale>

          <Pressable style={styles.back} onPress={() => router.back()}>
            <Text style={styles.backText}>Continuer sans compte</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 28 },
  logo: {
    width: 56, height: 56, borderRadius: 16, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  title: { fontSize: 26, fontWeight: '800', color: COLORS.slate900 },
  subtitle: { fontSize: 14, color: COLORS.slate500, marginTop: 4, textAlign: 'center' },
  form: { backgroundColor: COLORS.white, borderRadius: 20, padding: 18, gap: 12 },
  tabs: { flexDirection: 'row', backgroundColor: COLORS.slate100, borderRadius: 12, padding: 4 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 9 },
  tabActive: { backgroundColor: COLORS.white, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  tabText: { fontSize: 14, fontWeight: '600', color: COLORS.slate500 },
  tabTextActive: { color: COLORS.primary },
  input: {
    borderWidth: 1, borderColor: COLORS.slate200, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: COLORS.slate900,
    backgroundColor: COLORS.white,
  },
  roleRow: { flexDirection: 'row', gap: 8 },
  roleChip: { flex: 1, borderWidth: 1, borderColor: COLORS.slate200, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  roleChipActive: { borderColor: COLORS.primary, backgroundColor: '#e0f2fe' },
  roleChipText: { fontSize: 12, fontWeight: '600', color: COLORS.slate500 },
  roleChipTextActive: { color: COLORS.primaryDark },
  submit: {
    backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 14,
    alignItems: 'center', marginTop: 4,
  },
  submitDisabled: { opacity: 0.55 },
  submitText: { color: COLORS.white, fontSize: 15, fontWeight: '700' },
  error: { color: COLORS.danger, fontSize: 13, fontWeight: '500' },
  back: { alignItems: 'center', paddingVertical: 6 },
  backText: { color: COLORS.slate500, fontSize: 13 },
})
