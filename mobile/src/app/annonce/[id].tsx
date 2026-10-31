import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Link, useLocalSearchParams } from 'expo-router'
import Animated, { FadeInDown } from 'react-native-reanimated'
import {
  apiRequest, formatPrice, STATUS_LABELS, ENERGY_COLORS, type ApiApartment, type ApiVisitSlot,
} from '../../lib/api'
import { useAuth } from '../../lib/auth'
import { PressableScale } from '../../components/PressableScale'
import { COLORS } from '../../config'

export default function ApartmentDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>()
  const id = String(params.id)
  const { user, token, requireAuth } = useAuth()
  const [apartment, setApartment] = useState<ApiApartment | null>(null)
  const [slots, setSlots] = useState<ApiVisitSlot[]>([])
  const [favorited, setFavorited] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [contactMessage, setContactMessage] = useState('')
  const [showApplication, setShowApplication] = useState(false)
  const [income, setIncome] = useState('')
  const [guarantorIncome, setGuarantorIncome] = useState('')
  const [situation, setSituation] = useState('Salarié')
  const [applicationMessage, setApplicationMessage] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [detail, visitSlots] = await Promise.all([
        apiRequest<ApiApartment>('/api/apartments/' + id, { token }),
        apiRequest<ApiVisitSlot[]>('/api/apartments/' + id + '/slots').catch(() => []),
      ])
      setApartment(detail)
      setSlots(Array.isArray(visitSlots) ? visitSlots : [])
    } catch {
      Alert.alert('Erreur', 'Annonce introuvable ou indisponible.')
    } finally {
      setLoading(false)
    }
  }, [id, token])

  useEffect(() => {
    const timer = setTimeout(() => { void load() }, 0)
    return () => clearTimeout(timer)
  }, [load])

  useEffect(() => {
    let cancelled = false
    if (!token || user?.role !== 'tenant') return
    apiRequest<string[]>('/api/me/favorites', { token })
      .then((ids) => { if (!cancelled) setFavorited(Array.isArray(ids) && ids.includes(id)) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [token, user?.role, id])

  const isTenant = token && user?.role === 'tenant'
  const isLandlordAccount = token && user?.role !== 'tenant'

  const toggleFavorite = async () => {
    if (!requireAuth('/annonce/' + id)) return
    setBusyAction('favorite')
    try {
      const result = await apiRequest<{ favorited: boolean }>('/api/apartments/' + id + '/favorite', { method: 'PUT', token })
      setFavorited(result.favorited)
      void Haptics.notificationAsync(result.favorited
        ? Haptics.NotificationFeedbackType.Success
        : Haptics.NotificationFeedbackType.Warning)
    } catch (error) {
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Action impossible.')
    } finally {
      setBusyAction(null)
    }
  }

  const bookSlot = async (slotId: string) => {
    if (!requireAuth('/annonce/' + id)) return
    setBusyAction('slot-' + slotId)
    try {
      await apiRequest('/api/apartments/' + id + '/slots/' + slotId + '/book', { method: 'POST', token })
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      Alert.alert('Visite réservée', 'Votre créneau de visite est confirmé.')
      await load()
    } catch (error) {
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Réservation impossible.')
    } finally {
      setBusyAction(null)
    }
  }

  const sendMessage = async () => {
    if (!requireAuth('/annonce/' + id)) return
    const content = contactMessage.trim()
    if (!content) return
    setBusyAction('message')
    try {
      await apiRequest('/api/apartments/' + id + '/messages', { method: 'POST', token, body: { content } })
      Alert.alert('Message envoyé', "La conversation est visible dans l'onglet Messages.")
      setContactMessage('')
    } catch (error) {
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Envoi impossible.')
    } finally {
      setBusyAction(null)
    }
  }

  const submitApplication = async () => {
    if (!requireAuth('/annonce/' + id)) return
    const monthlyIncome = Number(income)
    if (!Number.isFinite(monthlyIncome) || monthlyIncome <= 0) {
      Alert.alert('Revenus requis', 'Indiquez vos revenus mensuels nets.')
      return
    }
    setBusyAction('application')
    try {
      await apiRequest('/api/apartments/' + id + '/applications', {
        method: 'POST',
        token,
        body: {
          monthlyIncome,
          guarantorIncome: guarantorIncome ? Number(guarantorIncome) : undefined,
          situation,
          message: applicationMessage.trim() || undefined,
        },
      })
      Alert.alert('Candidature envoyée', 'Le bailleur étudiera votre dossier et vous répondra.')
      setShowApplication(false)
      setIncome(''); setGuarantorIncome(''); setApplicationMessage('')
    } catch (error) {
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Candidature impossible.')
    } finally {
      setBusyAction(null)
    }
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>
  }

  if (!apartment) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={40} color={COLORS.slate400} />
        <Text style={styles.emptyTitle}>Annonce introuvable</Text>
      </View>
    )
  }

  const availableSlots = slots.filter((slot) => slot.isAvailable && !slot.isBooked)
  const bookedSlots = slots.filter((slot) => slot.isBooked)

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Cible de la transition zoom partagée depuis la carte (iOS 18+) */}
      <Link.AppleZoomTarget>
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} style={styles.gallery}>
          {apartment.photos.length > 0 ? apartment.photos.map((photo) => (
            <Image key={photo} source={{ uri: photo }} style={styles.photo} resizeMode="cover" />
          )) : (
            <View style={[styles.photo, styles.photoPlaceholder]}>
              <Ionicons name="images-outline" size={40} color={COLORS.slate400} />
            </View>
          )}
        </ScrollView>
      </Link.AppleZoomTarget>

      <Animated.View entering={FadeInDown.duration(360)} style={styles.card}>
        {apartment.isFeatured && (
          <View style={[styles.chip, { backgroundColor: '#fef9c3' }]}>
            <Text style={[styles.chipText, { color: COLORS.warning }]}>★ Mise en avant</Text>
          </View>
        )}
        <Text style={styles.title}>{apartment.title}</Text>
        <PressableScale
          style={styles.favoriteRow}
          onPress={() => void toggleFavorite()}
          disabled={busyAction === 'favorite'}
          accessibilityLabel={favorited ? 'Retirer des favoris' : 'Ajouter à mes favoris'}
        >
          <Ionicons
            name={favorited ? 'heart' : 'heart-outline'}
            size={22}
            color={favorited ? COLORS.danger : COLORS.slate500}
          />
          <Text style={styles.favoriteText}>
            {favorited ? 'Retirer des favoris' : 'Ajouter à mes favoris'}
          </Text>
        </PressableScale>
        <View style={styles.metaRow}>
          <Ionicons name="location" size={15} color={COLORS.primary} />
          <Text style={styles.meta}>{apartment.address.street}, {apartment.address.city}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="grid-outline" size={14} color={COLORS.slate500} />
          <Text style={styles.meta}>{apartment.surface} m² · {apartment.rooms} pièces · {apartment.bedrooms} chambres</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatPrice(apartment.price)}</Text>
          <Text style={styles.charges}>
            {Boolean(apartment.charges) ? `+ ${apartment.charges} FCFA charges` : 'Charges incluses'}
          </Text>
          <View style={[styles.energyBadge, { backgroundColor: ENERGY_COLORS[apartment.energyScore] ?? COLORS.warning }]}>
            <Text style={styles.energyText}>{apartment.energyScore}</Text>
          </View>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(80).duration(360)} style={styles.card}>
        <Text style={styles.sectionTitle}>Description</Text>
        <Text style={styles.paragraph}>{apartment.description}</Text>
        {apartment.amenities.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Équipements</Text>
            <View style={styles.amenityRows}>
              {apartment.amenities.map((amenity) => (
                <View key={amenity} style={styles.amenity}>
                  <Ionicons name="checkmark" size={14} color={COLORS.success} />
                  <Text style={styles.amenityText}>{amenity}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(160).duration(360)} style={styles.card}>
        <Text style={styles.sectionTitle}>Bailleur</Text>
        <View style={styles.landlordRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {apartment.landlord.firstName.charAt(0)}{apartment.landlord.lastName.charAt(0)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.landlordName}>{apartment.landlord.firstName} {apartment.landlord.lastName}</Text>
            <Text style={styles.landlordMeta}>
              {apartment.landlord.isVerified ? 'Compte vérifié · ' : ''}Taux de réponse : {apartment.landlord.responseRate ?? 95}%
            </Text>
          </View>
          <Ionicons name="shield-checkmark" size={20} color={COLORS.primary} />
        </View>
      </Animated.View>

      {isTenant && (
        <Animated.View entering={FadeInDown.delay(240).duration(360)} style={styles.card}>
          <Text style={styles.sectionTitle}>Visites disponibles</Text>
          {bookedSlots.map((slot) => (
            <View key={'booked-' + slot.id} style={[styles.slotRow, styles.slotBooked]}>
              <Text style={styles.slotText}>{slot.date} · {slot.startTime} - {slot.endTime}</Text>
              <Text style={styles.slotBookedText}>Réservé</Text>
            </View>
          ))}
          {availableSlots.length === 0 && bookedSlots.length === 0 && (
            <Text style={styles.paragraph}>Aucun créneau de visite n&rsquo;est proposé pour l&rsquo;instant.</Text>
          )}
          {availableSlots.map((slot) => (
            <View key={slot.id} style={styles.slotRow}>
              <Text style={styles.slotText}>{slot.date} · {slot.startTime} - {slot.endTime}</Text>
              <PressableScale
                style={styles.slotButton}
                disabled={busyAction === 'slot-' + slot.id}
                onPress={() => void bookSlot(slot.id)}
              >
                <Text style={styles.slotButtonText}>Réserver</Text>
              </PressableScale>
            </View>
          ))}
        </Animated.View>
      )}

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Contacter le bailleur</Text>
        {isLandlordAccount ? (
          <Text style={styles.paragraph}>Connectez-vous avec un compte locataire pour échanger sur cette annonce.</Text>
        ) : !token ? (
          <Text style={styles.paragraph}>Créez un compte locataire pour réserver une visite, envoyer un message ou candidater en un clic.</Text>
        ) : (
          <>
            <TextInput
              style={styles.textArea}
              multiline
              placeholder="Bonjour, le logement est-il toujours disponible ?"
              value={contactMessage}
              onChangeText={setContactMessage}
              maxLength={4000}
            />
            <PressableScale
              style={styles.primaryButton}
              disabled={busyAction === 'message' || !contactMessage.trim()}
              onPress={() => void sendMessage()}
            >
              <Text style={styles.primaryButtonText}>Envoyer le message</Text>
            </PressableScale>
          </>
        )}
      </View>

      {isTenant && apartment.status === 'available' && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Candidature en 1 clic</Text>
          <Text style={styles.paragraph}>
            Votre dossier locataire (revenus, complétude) est automatiquement transmis.
          </Text>
          {!showApplication ? (
            <PressableScale style={styles.primaryButton} onPress={() => setShowApplication(true)}>
              <Text style={styles.primaryButtonText}>Candidater</Text>
            </PressableScale>
          ) : (
            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Revenus mensuels nets (FCFA)"
                keyboardType="numeric"
                value={income}
                onChangeText={setIncome}
              />
              <TextInput
                style={styles.input}
                placeholder="Revenus du garant (optionnel)"
                keyboardType="numeric"
                value={guarantorIncome}
                onChangeText={setGuarantorIncome}
              />
              <TextInput
                style={styles.input}
                placeholder="Situation (Salarié, Étudiant…)"
                value={situation}
                onChangeText={setSituation}
              />
              <TextInput
                style={styles.textArea}
                multiline
                placeholder="Message d'accompagnement (optionnel)"
                value={applicationMessage}
                onChangeText={setApplicationMessage}
              />
              <PressableScale
                style={styles.primaryButton}
                disabled={busyAction === 'application'}
                onPress={() => void submitApplication()}
              >
                <Text style={styles.primaryButtonText}>
                  {busyAction === 'application' ? 'Envoi…' : 'Envoyer ma candidature'}
                </Text>
              </PressableScale>
            </View>
          )}
        </View>
      )}

      {token && (
        <Text style={styles.statusNote}>
          Statut de l&rsquo;annonce : {STATUS_LABELS[apartment.status] ?? apartment.status}
        </Text>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingBottom: 32 },
  gallery: { height: 230 },
  photo: { width: 360, height: 230 },
  photoPlaceholder: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.slate100 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 24 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: COLORS.slate900 },
  card: {
    backgroundColor: COLORS.white, borderRadius: 18, padding: 16,
    marginHorizontal: 12, marginTop: 12, gap: 8,
  },
  chip: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  chipText: { fontSize: 12, fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '800', color: COLORS.slate900 },
  favoriteRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: COLORS.slate100, borderRadius: 10,
    paddingVertical: 9, paddingHorizontal: 12, alignSelf: 'flex-start',
  },
  favoriteText: { fontSize: 13, fontWeight: '600', color: COLORS.slate600 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  meta: { fontSize: 13, color: COLORS.slate600, flexShrink: 1 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 },
  price: { fontSize: 22, fontWeight: '800', color: COLORS.primary },
  charges: { fontSize: 12, color: COLORS.slate400, flex: 1 },
  energyBadge: {
    minWidth: 32, paddingVertical: 4, borderRadius: 8, alignItems: 'center',
  },
  energyText: { color: COLORS.white, fontWeight: '800', fontSize: 13 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: COLORS.slate900 },
  paragraph: { fontSize: 14, color: COLORS.slate600, lineHeight: 20 },
  amenityRows: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  amenity: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: COLORS.slate100, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5,
  },
  amenityText: { fontSize: 12, color: COLORS.slate600 },
  landlordRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: '#e0f2fe',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '800', color: COLORS.primaryDark },
  landlordName: { fontSize: 15, fontWeight: '700', color: COLORS.slate900 },
  landlordMeta: { fontSize: 12, color: COLORS.slate500 },
  slotRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.slate100, borderRadius: 10, padding: 10, marginTop: 4,
  },
  slotBooked: { opacity: 0.6 },
  slotText: { fontSize: 13, color: COLORS.slate900, fontWeight: '500' },
  slotBookedText: { fontSize: 12, color: COLORS.slate500, fontWeight: '600' },
  slotButton: { backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  slotButtonText: { color: COLORS.white, fontSize: 12, fontWeight: '700' },
  textArea: {
    borderWidth: 1, borderColor: COLORS.slate200, borderRadius: 12,
    padding: 12, fontSize: 14, color: COLORS.slate900, minHeight: 70,
    textAlignVertical: 'top',
  },
  form: { gap: 10 },
  input: {
    borderWidth: 1, borderColor: COLORS.slate200, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: COLORS.slate900,
  },
  primaryButton: {
    backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 13,
    alignItems: 'center',
  },
  primaryButtonText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  statusNote: { textAlign: 'center', color: COLORS.slate400, fontSize: 12, marginTop: 16 },
})
