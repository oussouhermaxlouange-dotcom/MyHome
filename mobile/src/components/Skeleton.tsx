import { useEffect, useMemo } from 'react'
import { StyleProp, StyleSheet, useWindowDimensions, View, ViewStyle } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming,
} from 'react-native-reanimated'

const BLOCK_COLOR = '#e2e8f0'

/**
 * Effet "shimmer" : un balayage lumineux horizontal répété en boucle.
 * Superposé aux blocs gris des skeleton loaders.
 */
export function Shimmer({ style }: { style?: StyleProp<ViewStyle> }) {
  const { width: screenWidth } = useWindowDimensions()
  const sweepWidth = useMemo(() => Math.max(screenWidth, 320), [screenWidth])
  const progress = useSharedValue(-1)

  useEffect(() => {
    progress.value = withRepeat(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.quad) }), -1, true)
  }, [progress])

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * sweepWidth }],
  }))

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }, sweepStyle]}>
      <LinearGradient
        colors={['transparent', 'rgba(255,255,255,0.65)', 'transparent']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{ width: sweepWidth * 0.4, height: '100%' }}
      />
    </Animated.View>
  )
}

function Block({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ backgroundColor: BLOCK_COLOR, overflow: 'hidden' }, style]}>
      <Shimmer />
    </View>
  )
}

/** Skeleton d'une carte de logement (liste Entretien). */
export function SkeletonApartmentCard() {
  return (
    <View style={loaderStyles.card}>
      <Block style={loaderStyles.image} />
      <View style={loaderStyles.body}>
        <Block style={loaderStyles.titleLine} />
        <Block style={loaderStyles.metaLine} />
        <Block style={loaderStyles.wideLine} />
        <Block style={loaderStyles.priceLine} />
      </View>
    </View>
  )
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <View style={loaderStyles.list}>
      {Array.from({ length: count }, (_, index) => (
        <SkeletonApartmentCard key={index} />
      ))}
    </View>
  )
}

/** Skeleton d'une ligne de liste (conversations, candidatures). */
export function SkeletonRow({ showStatusChip = false }: { showStatusChip?: boolean }) {
  return (
    <View style={loaderStyles.row}>
      <Block style={loaderStyles.avatar} />
      <View style={loaderStyles.rowBody}>
        <Block style={loaderStyles.rowLine1} />
        <Block style={loaderStyles.rowLine2} />
      </View>
      {showStatusChip && <Block style={loaderStyles.chip} />}
    </View>
  )
}

const loaderStyles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
  },
  image: { width: '100%', height: 140, backgroundColor: BLOCK_COLOR },
  body: { padding: 12, gap: 8 },
  titleLine: { width: '70%', height: 15, borderRadius: 6 },
  metaLine: { width: '50%', height: 11, borderRadius: 5 },
  wideLine: { width: '88%', height: 11, borderRadius: 5 },
  priceLine: { width: '40%', height: 17, borderRadius: 6 },
  list: { padding: 12, gap: 12 },
  row: {
    backgroundColor: '#ffffff', borderRadius: 16, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: BLOCK_COLOR },
  rowBody: { flex: 1, gap: 8 },
  rowLine1: { width: '65%', height: 13, borderRadius: 6 },
  rowLine2: { width: '90%', height: 10, borderRadius: 5 },
  chip: { width: 74, height: 22, borderRadius: 999, backgroundColor: BLOCK_COLOR },
})
