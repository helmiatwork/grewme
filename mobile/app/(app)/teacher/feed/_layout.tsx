import { Stack } from 'expo-router';

export default function FeedLayout() {
  return (
    <Stack screenOptions={{ headerShown: true, headerBackTitle: 'Back' }}>
      <Stack.Screen name="index" options={{ title: 'Feed' }} />
      <Stack.Screen name="[id]" options={{ title: 'Post' }} />
      <Stack.Screen name="new" options={{ title: 'New Post' }} />
    </Stack>
  );
}
