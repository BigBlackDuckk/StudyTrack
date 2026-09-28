import React from 'react';
import { StatusBar, Text, View } from 'react-native';

type Theme={bg:string;card:string;surface:string;text:string;muted:string;accent:string;nav:string;line:string;good:string;warn:string};
const LIGHT:Theme={bg:'#6D35A5',card:'#6940A4',surface:'rgba(255,255,255,0.94)',text:'#24133B',muted:'#746580',accent:'#6840C7',nav:'#30115A',line:'#E9DDF5',good:'#10B981',warn:'#F59E0B'};
const DARK:Theme={bg:'#21102F',card:'#35184F',surface:'rgba(39,22,58,0.96)',text:'#FFFFFF',muted:'#C5B3D7',accent:'#B99BFF',nav:'#160A25',line:'#503A61',good:'#34D399',warn:'#FBBF24'};

export default function App() {
  const t = LIGHT;
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: t.bg }}>
      <Text style={{ fontSize: 30, fontWeight: '900', color: '#fff' }}>StudyTrack</Text>
      <Text style={{ color: t.line, marginTop: 6 }}>Seu copiloto acadêmico</Text>
      <StatusBar barStyle="light-content" />
    </View>
  );
}
