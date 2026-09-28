import React from 'react';
import { ImageBackground, Modal, Pressable, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type IconProps={name:string;size?:number;color?:string};
function Ionicons({name,size=22,color='#000'}:IconProps){const m:Record<string,string>={'home-outline':'⌂','calendar-outline':'□','time-outline':'◷','ribbon-outline':'◇','person-outline':'◯','book-outline':'▤','add':'+','trash-outline':'♧','checkmark':'✓','chevron-back':'‹','chevron-forward':'›','create-outline':'✎','close':'×','image-outline':'▧','document-text-outline':'▤','bar-chart-outline':'▥','play':'▶','pause':'Ⅱ','stop':'■','search':'⌕','arrow-forward':'→','log-out-outline':'↪','cloud-outline':'☁','sparkles':'✦'};return <Text style={{fontSize:size,lineHeight:size,color,fontWeight:'800'}}>{m[name]||'•'}</Text>}

type Theme={bg:string;card:string;surface:string;text:string;muted:string;accent:string;nav:string;line:string;good:string;warn:string};
const LIGHT:Theme={bg:'#6D35A5',card:'#6940A4',surface:'rgba(255,255,255,0.94)',text:'#24133B',muted:'#746580',accent:'#6840C7',nav:'#30115A',line:'#E9DDF5',good:'#10B981',warn:'#F59E0B'};
const DARK:Theme={bg:'#21102F',card:'#35184F',surface:'rgba(39,22,58,0.96)',text:'#FFFFFF',muted:'#C5B3D7',accent:'#B99BFF',nav:'#160A25',line:'#503A61',good:'#34D399',warn:'#FBBF24'};

const pad=(n:number)=>String(n).padStart(2,'0');
const isoDate=(d:Date)=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const parseDate=(s:string)=>{const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const fmtDur=(sec:number)=>`${Math.floor(sec/3600)}h ${Math.floor((sec%3600)/60)}min`;
const fmtDate=(iso:string)=>{const d=new Date(iso);return d.toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'})};

function Button({t,label,onPress,kind='primary',small=false}:{t:Theme;label:string;onPress:()=>void;kind?:'primary'|'secondary'|'danger'|'ghost';small?:boolean}){return <TouchableOpacity onPress={onPress} activeOpacity={.8} style={[styles.button,{backgroundColor:kind==='primary'?t.accent:kind==='danger'?'#DC2626':kind==='secondary'?t.line:'transparent',paddingVertical:small?8:12,paddingHorizontal:small?11:15,borderColor:kind==='ghost'?t.line:'transparent',borderWidth:kind==='ghost'?1:0}]}><Text style={{color:kind==='primary'||kind==='danger'?'#fff':t.text,fontWeight:'800',fontSize:small?12:14}}>{label}</Text></TouchableOpacity>}
function Card({t,children,onPress}:{t:Theme;children:React.ReactNode;onPress?:()=>void}){const C=onPress?TouchableOpacity:View;return <C onPress={onPress} activeOpacity={.8} style={[styles.card,{backgroundColor:t.surface,borderColor:t.line}]}>{children}</C>}
function Header({t,title,sub,onBack}:{t:Theme;title:string;sub?:string;onBack?:()=>void}){return <View style={styles.header}><View style={{flexDirection:'row',alignItems:'center',flex:1}}>{onBack&&<TouchableOpacity onPress={onBack} style={{marginRight:10}}><Ionicons name="chevron-back" size={28} color={t.text}/></TouchableOpacity>}<View><Text style={[styles.h1,{color:t.text}]}>{title}</Text>{sub&&<Text style={{color:t.muted,marginTop:3}}>{sub}</Text>}</View></View></View>}
function ModalBox({visible,onClose,t,title,children}:{visible:boolean;onClose:()=>void;t:Theme;title:string;children:React.ReactNode}){return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}><Pressable style={styles.overlay} onPress={onClose}><Pressable style={[styles.modal,{backgroundColor:t.surface}]}><View style={styles.modalHead}><Text style={[styles.h2,{color:t.text,marginLeft:0}]}>{title}</Text><TouchableOpacity onPress={onClose}><Ionicons name="close" color={t.text} size={26}/></TouchableOpacity></View>{children}</Pressable></Pressable></Modal>}

export default function App() {
  return (
    <ImageBackground source={require('./assets/studytrack-gradient.png')} resizeMode="cover" style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: LIGHT.bg }}>
      <Text style={{ fontSize: 32, fontWeight: '900', color: '#fff' }}>StudyTrack</Text>
      <Text style={{ color: '#E9D9F7', marginTop: 6 }}>Seu copiloto acadêmico</Text>
      <StatusBar barStyle="light-content" />
    </ImageBackground>
  );
}

const styles=StyleSheet.create({h1:{fontSize:25,fontWeight:'900'},h2:{fontSize:18,fontWeight:'900',marginLeft:24},header:{paddingHorizontal:24,marginBottom:18},card:{marginHorizontal:24,marginBottom:12,borderRadius:16,padding:15,borderWidth:1,shadowColor:'#000',shadowOpacity:.08,shadowRadius:6,shadowOffset:{width:0,height:2},elevation:2},button:{borderRadius:12,alignItems:'center',justifyContent:'center',marginTop:8},overlay:{flex:1,backgroundColor:'rgba(0,0,0,.55)',justifyContent:'flex-end'},modal:{borderTopLeftRadius:24,borderTopRightRadius:24,padding:20,maxHeight:'92%'},modalHead:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:10}});
