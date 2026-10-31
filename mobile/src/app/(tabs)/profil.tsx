import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useAuth } from '../../lib/auth'
import { PressableScale } from '../../components/PressableScale'
import { COLORS, ROLE_LABELS } from '../../config'

export default function ProfilScreen() {
  const { user, token, logout } = useAuth()
  const router = useRouter()

  if (!user || !token) {
    return (
      <View style={styles.center}>
        <View style={styles.guestLogo}>
          <Ionicons name="person" size={30} color={COLORS.white} />
        </View>
        <Text style={styles.title}>Vous explorez en visiteur</Text>
        <Text style={styles.subtitle}>
          Connectez-vous pour candidater, réserver des visites, gérer votre dossier et discuter avec les bailleurs.
        </Text>
        <PressableScale style={styles.primaryButton} onPress={() => router.push('/auth')}>
          <Text style={styles.primaryButtonText}>Se connecter / S&rsquo;inscrire</Text>
        </PressableScale>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user.firstName.charAt(0).toUpperCase()}{user.lastName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.title}>{user.firstName} {user.lastName}</Text>
        <View style={styles.roleChip}>
          <Text style={styles.roleChipText}>{ROLE_LABELS[user.role] ?? user.role}</Text>
        </View>
      </View>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Compte</Text>
        <View style={styles.row}>
          <Ionicons name="mail-outline" size={17} color={COLORS.slate500} />
          <Text style={styles.rowText}>{user.email}</Text>
        </View>
        {Boolean(user.phone) && (
          <View style={styles.row}>
            <Ionicons name="call-outline" size={17} color={COLORS.slate500} />
            <Text style={styles.rowText}>{user.phone}</Text>
          </View>
        )}
        <View style={styles.row}>
          <Ionicons name="shield-checkmark-outline" size={17} color={user.isVerified ? COLORS.success : COLORS.warning} />
          <Text style={styles.rowText}>{user.isVerified ? 'Compte vérifié' : 'Vérification en cours'}</Text>
        </View>
      </View>

      {user.role === 'tenant' && (
        <Pressable style={styles.linkCard} onPress={() => router.push('/candidatures')}>
          <Ionicons name="documents-outline" size={20} color={COLORS.primary} />
          <Text style={styles.linkText}>Mes candidatures</Text>
          <Ionicons name="chevron-forward" size={18} color={COLORS.slate400} />
        </Pressable>
      )}

      {user.role === 'tenant' && typeof user.fileCompletionPercent === 'number' && (
        <View style={styles.card}>
          <View style={styles.completionRow}>
            <Text style={styles.sectionTitle}>Dossier locataire</Text>
            <Text style={styles.completionValue}>{user.fileCompletionPercent}%</Text>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${user.fileCompletionPercent}%` }]} />
          </View>
        </View>
      )}

      {user.role !== 'tenant' && (
        <View style={styles.card}>
          <Text style={styles.info}>
            {user.role === 'landlord'
              ? 'La gestion des annonces et candidatures se fait depuis le tableau de bord web.'
              : "La modération se fait depuis l'espace admin web."}
          </Text>
        </View>
      )}

      <PressableScale
        style={styles.logout}
        onPress={() => { void logout(); router.replace('/') }}
      >
        <Ionicons name="log-out-outline" size={19} color={COLORS.danger} />
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </PressableScale>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 28 },
  guestLogo: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  subtitle: { fontSize: 14, color: COLORS.slate500, textAlign: 'center', marginBottom: 12 },
  primaryButton: {
    backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24,
  },
  primaryButtonText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  scroll: { padding: 12, gap: 12, paddingBottom: 24 },
  card: { backgroundColor: COLORS.white, borderRadius: 16, padding: 16 },
  avatar: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#e0f2fe',
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  avatarText: { fontSize: 20, fontWeight: '800', color: COLORS.primaryDark },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.slate900 },
  roleChip: {
    alignSelf: 'flex-start', backgroundColor: '#e0f2fe', borderRadius: 999,
    paddingHorizontal: 10, paddingVertical: 4, marginTop: 6,
  },
  roleChipText: { fontSize: 12, fontWeight: '700', color: COLORS.primaryDark },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.slate900, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  rowText: { fontSize: 14, color: COLORS.slate600, flex: 1 },
  linkCard: {
    backgroundColor: COLORS.white, borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  linkText: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.slate900 },
  completionRow: { flexDirection: 'row', justifyContent: 'space-between' },
  completionValue: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  progressTrack: { height: 8, borderRadius: 4, backgroundColor: COLORS.slate100, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: COLORS.primary },
  info: { fontSize: 13, color: COLORS.slate500, lineHeight: 19 },
  logout: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: COLORS.white, borderRadius: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: '#fee2e2',
  },
  logoutText: { color: COLORS.danger, fontWeight: '700', fontSize: 15 },
})
