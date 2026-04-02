import { Stack } from 'expo-router';

export default function TeacherCurriculumLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Curriculum' }} />
      <Stack.Screen
        name="[subjectId]/index"
        options={{ title: 'Subject Topics' }}
      />
      <Stack.Screen
        name="[subjectId]/[topicId]"
        options={{ title: 'Topic Detail' }}
      />
      <Stack.Screen name="yearly" options={{ title: 'Yearly Curriculum' }} />
    </Stack>
  );
}
