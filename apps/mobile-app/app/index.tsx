import { Box } from '@/components/atoms/Box';
import { Button } from '@/components/atoms/Button';
import { Text } from '@/components/atoms/Text';
import { Scene3D } from '@/components/molecules/Scene3D';
import { useTheme } from '@/hooks/use-theme';
import { createStyleSheet } from '@/theme/theme';
import { useRouter } from 'expo-router';
import { MotiText, MotiView } from 'moti';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LandingScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Box style={styles.container} backgroundColor="background" padding="l">
        <Box style={styles.sceneContainer}>
          <Scene3D />
        </Box>

        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500 }}
          style={styles.contentContainer}
        >
          <MotiText
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 200 }}
          >
            <Text variant="title">Analytics Reimagined</Text>
          </MotiText>

          <MotiText
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 400 }}
          >
            <Text variant="body" style={styles.subtitle}>
              Understand your users like never before.
            </Text>
          </MotiText>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 500, delay: 600 }}
          style={styles.buttonContainer}
        >
          <Button
            title="Log In"
            variant="secondary"
            onPress={() => router.push('/login')}
          />
          <Button
            title="Sign Up"
            variant="primary"
            onPress={() => router.push('/signup')}
          />
        </MotiView>
      </Box>
    </SafeAreaView>
  );
}

const styles = createStyleSheet({
  container: {
    flex: 1,
  },
  sceneContainer: {
    flex: 3,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    marginTop: 8,
    textAlign: 'center',
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
});
