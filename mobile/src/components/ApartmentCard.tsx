import { Image, Pressable, StyleSheet, Text, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Link } from 'expo-router'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { formatPrice, STATUS_LABELS, TYPE_LABELS, type ApiApartment } from '../lib/api'
import { COLORS } from '../config'

interface Props {
  apartment: ApiApartment
  /** Index dans la liste : décale l'animation d'entrée (effet stagger). */
  index?: number
  width?: number | 'auto'
}

export function ApartmentCard({ apartment, index = 0, width }: Props) {
  const photo = apartment.photos?.[0]
  const isAvailable = apartment.status === 'available'
  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 8) * 85)
        .duration(420)
        .springify()
        .damping(17)}
      style={width ? { width } : undefined}
    >
      {/*
        Link.AppleZoom : transition zoom partagée (iOS 18+) de la photo de la
        carte vers la bannière de la fiche détail ; dégradation gracieuse
        (navigation standard) sur Android / iOS plus ancien.
      */}
      <Link href={`/annonce/${apartment.id}`} asChild>
        <Pressable style={styles.card} accessibilityRole="button">
          <Link.AppleZoom>
            <View style={styles.imageWrap}>
              {photo ? (
                <Image source={{ uri: photo }} style={styles.image} resizeMode="cover" />
              ) : (
                <View style={[styles.image, styles.imagePlaceholder]}>
                  <Ionicons name="home-outline" size={34} color={COLORS.slate400} />
                </View>
              )}
              <View style={styles.typeTag}>
                <Text style={styles.typeTagText}>{TYPE_LABELS[apartment.type] ?? apartment.type}</Text>
              </View>
              {!isAvailable && (
                <View style={[styles.typeTag, styles.statusTag]}>
                  <Text style={styles.typeTagText}>{STATUS_LABELS[apartment.status] ?? apartment.status}</Text>
                </View>
              )}
            </View>
          </Link.AppleZoom>
          <View style={styles.body}>
            <Text style={styles.title} numberOfLines={1}>{apartment.title}</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={COLORS.primary} />
              <Text style={styles.location} numberOfLines={1}>
                {apartment.address.street}, {apartment.address.city}
              </Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="grid-outline" size={13} color={COLORS.slate500} />
              <Text style={styles.meta}>{apartment.surface} m²</Text>
              <Ionicons name="bed-outline" size={13} color={COLORS.slate500} />
              <Text style={styles.meta}>{apartment.rooms} pièces</Text>
              {apartment.hasVirtualTour && <Ionicons name="cube-outline" size={13} color={COLORS.primary} />}
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.price}>{formatPrice(apartment.price)}</Text>
              {Boolean(apartment.charges) && <Text style={styles.charges}>+ {apartment.charges} FCFA charges</Text>}
            </View>
          </View>
        </Pressable>
      </Link>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  imageWrap: { position: 'relative' },
  image: { width: '100%', height: 140 },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.slate100 },
  typeTag: {
    position: 'absolute',
    left: 8,
    top: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusTag: { left: 8, top: 38, backgroundColor: COLORS.slate900 },
  typeTagText: { color: COLORS.white, fontSize: 11, fontWeight: '700' },
  body: { padding: 12, gap: 6 },
  title: { fontSize: 15, fontWeight: '700', color: COLORS.slate900 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  location: { flex: 1, fontSize: 12, color: COLORS.slate600 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { fontSize: 12, color: COLORS.slate500, marginRight: 10 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 2 },
  price: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  charges: { fontSize: 11, color: COLORS.slate400 },
})
