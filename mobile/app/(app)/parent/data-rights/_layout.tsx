import { Stack } from 'expo-router';

export default function DataRightsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Data Rights' }} />
    </Stack>
  );
}
