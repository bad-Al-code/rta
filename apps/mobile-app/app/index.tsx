import { Box } from '@/components/atoms/Box';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Text } from '@/components/atoms/Text';
import { createStyleSheet } from '@/theme/theme';

export default function LandingScreen() {
  return (
    <Box style={styles.container} backgroundColor="background" padding="l">
      <Text variant="h1">Welcome!</Text>
      <Box marginTop="m">
        <Text variant="small">
          This is the landing screen for our awesome analytics application.
        </Text>
      </Box>
      <Box marginTop="s">
        <Text variant="caption">Built with a custom component library.</Text>
      </Box>
      <Button size="s" title="Button" variant="destructive" />
      <Button size="xs" title="Button" variant="destructive" />
      <Button title="Button" variant="ghost" />
      <Button disabled title="Button" variant="primary" />
      <Button isLoading title="Button" variant="secondary" />

      <Input hasError />
    </Box>
  );
}

const styles = createStyleSheet({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
