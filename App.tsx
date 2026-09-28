import React from 'react';
import { ImageBackground, StatusBar, Text } from 'react-native';

type Theme={bg:string;card:string;surface:string;text:string;muted:string;accent:string;nav:string;line:string;good:string;warn:string};
const LIGHT:Theme={bg:'#6D35A5',card:'#6940A4',surface:'rgba(255,255,255,0.94)',text:'#24133B',muted:'#746580',accent:'#6840C7',nav:'#30115A',line:'#E9DDF5',good:'#10B981',warn:'#F59E0B'};
const DARK:Theme={bg:'#21102F',card:'#35184F',surface:'rgba(39,22,58,0.96)',text:'#FFFFFF',muted:'#C5B3D7',accent:'#B99BFF',nav:'#160A25',line:'#503A61',good:'#34D399',warn:'#FBBF24'};

const pad=(n:number)=>String(n).padStart(2,'0');
const isoDate=(d:Date)=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const parseDate=(s:string)=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const fmtDur=(sec:number)=>`${Math.floor(sec/3600)}h ${Math.floor((sec%3600)/60)}min`;
const fmtDate=(iso:string)=>{const d=new Date(iso);return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'})};

export default function App() {
  return (
    <ImageBackground source={require('./assets/studytrack-gradient.png')} resizeMode="cover" style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: LIGHT.bg }}>
      <Text style={{ fontSize: 32, fontWeight: '900', color: '#fff' }}>StudyTrack</Text>
      <Text style={{ color: '#E9D9F7', marginTop: 6 }}>Seu copiloto acadêmico</Text>
      <StatusBar barStyle="light-content" />
    </ImageBackground>
  );
}
