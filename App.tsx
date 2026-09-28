import React from 'react';
import { StatusBar, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 28, fontWeight: '800' }}>StudyTrack</Text>
      <StatusBar barStyle="dark-content" />
    </View>
  );
}
