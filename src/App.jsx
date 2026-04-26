```react

import React, { useState, useEffect, useRef } from 'react';

import { Play, BookOpen, ChevronLeft, MessageSquare, X, Info, RotateCcw, Layout, Dices, Save, FolderOpen, Trash2, Eye, Copy, Download, Upload, ClipboardCheck, Globe, History, AlertCircle } from 'lucide-react';

import { initializeApp } from 'firebase/app';

import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';

import { getFirestore, collection, doc, setDoc, getDoc, onSnapshot, updateDoc, deleteDoc } from 'firebase/firestore';



// ==========================================

// Asset URLs

// ==========================================

const ASSETS = {

KEY_VISUAL: "https://raw.githubusercontent.com/capybarat4w4sh1-ship-it/ucg/main/assets/ChatGPT%20Image%202026%E5%B9%B44%E6%9C%8825%E6%97%A5%2011_41_26.png",

CARD_SPRITE: "https://raw.githubusercontent.com/capybarat4w4sh1-ship-it/ucg/main/assets/cardspred.bmp",

BGM_MENU: "https://raw.githubusercontent.com/capybarat4w4sh1-ship-it/ucg/main/assets/bgm_menu.mp3",

BGM_BATTLE: "https://raw.githubusercontent.com/capybarat4w4sh1-ship-it/ucg/main/assets/bgm_battle.mp3",

BGM_RESULT: "https://raw.githubusercontent.com/capybarat4w4sh1-ship-it/ucg/main/assets/bgm_result.mp3",

SE_CLICK: "https://raw.githubusercontent.com/capybarat4w4sh1-ship-it/ucg/main/assets/se_click.mp3",

SE_FLIP: "https://raw.githubusercontent.com/capybarat4w4sh1-ship-it/ucg/main/assets/se_flip.mp3"

};



// ==========================================

// Audio Manager (Singleton)

// ==========================================

const AudioManager = {

bgm: null,

currentUrl: null,

init: function() {

if (!this.bgm) {

this.bgm = new Audio();

this.bgm.loop = true;

this.bgm.volume = 0.4;

}

},

playBGM: function(url) {

this.init();

if (this.currentUrl !== url) {

this.bgm.src = url;

this.currentUrl = url;

this.bgm.play().catch(e => console.warn("BGM autoplay blocked by browser", e));

} else if (this.bgm.paused) {

this.bgm.play().catch(e => console.warn("BGM autoplay blocked by browser", e));

}

},

playSE: function(url) {

const se = new Audio(url);

se.volume = 0.7;

se.play().catch(e => console.warn("SE playback blocked", e));

}

};



// ==========================================

// Firebase Setup

// ==========================================

let app, auth, db, appId;

try {

const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;

if(firebaseConfig) {

app = initializeApp(firebaseConfig);

auth = getAuth(app);

db = getFirestore(app);

appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

}

} catch(e) { console.error("Firebase init failed", e); }



// ==========================================

// Data Definition

// ==========================================

const RAW_CARD_DATA = [

{ id: 1, name: "絶対王者の風格", power: 12, timing: "結果時", text: "敗北した場合、その瞬間にゲームに負ける。" },

{ id: 2, name: "切り込み隊長", power: 9, timing: "-", text: "スキルなし。" },

{ id: 3, name: "鉄壁の守護者", power: 6, timing: "判定時", text: "敗北する時、手札1枚破棄で引き分けにする。" },

{ id: 4, name: "お調子者の変身術", power: "?", timing: "公開時", text: "相手の元のパワーをコピーする。" },

{ id: 5, name: "不屈の社畜", power: 5, timing: "公開時", text: "手札1枚破棄でパワーを10にする。" },

{ id: 6, name: "天真爛漫な疾走", power: 6, timing: "終了時", text: "勝利時、次のドロー枚数を+1する。" },

{ id: 7, name: "ミステリアスな微笑", power: 5, timing: "公開時", text: "お互いのカードを入れ替える。" },

{ id: 8, name: "癒やしの休息", power: 4, timing: "終了時", text: "敗北時、このカードを手札に戻す。" },

{ id: 9, name: "いたずらな子猫", power: 3, timing: "公開時", text: "相手の手札をすべて確認する。" },

{ id: 10, name: "大逆転の秘策", power: 1, timing: "判定時", text: "相手のパワーが10以上なら勝利する。" },

{ id: 11, name: "運命のダイス", power: "?", timing: "公開時", text: "山札が偶数ならP11、奇数ならP2。" },

{ id: 12, name: "暴走するバイク", power: 4, timing: "終了時", text: "手札を全て捨て、5枚引き直す。" },

{ id: 13, name: "二重人格の仮面", power: 2, timing: "公開時", text: "手札1枚破棄でパワーを11にする。" },

{ id: 14, name: "甘い誘惑のプリン", power: 4, timing: "結果時", text: "このカードの勝利時、獲得するポイントを1増やす。" },

{ id: 15, name: "静かなる弓矢", power: 5, timing: "公開時", text: "相手の手札をランダムに1枚捨てる。" },

{ id: 16, name: "鋼のメンテナンス", power: 5, timing: "結果時", text: "敗北時、捨て札からP10以上を回収。" },

{ id: 17, name: "不思議な領域", power: 5, timing: "判定時", text: "パワーが低い方が勝利する。" },

{ id: 18, name: "過酷な残業代", power: 3, timing: "常時", text: "捨て札5枚以上ならパワー10。" },

{ id: 19, name: "お洒落な衣装替え", power: 1, timing: "判定時", text: "判定時、このカードを手札から捨てる。自分カードのパワーを+3する。" },

{ id: 20, name: "沈黙の猫パンチ", power: 6, timing: "公開時", text: "相手のスキルを無効化する。" },

{ id: 21, name: "友情の連携攻撃", power: 5, timing: "常時", text: "手札のP5を1枚公開し、パワー10にする。" },

{ id: 22, name: "究極のフィーリング", power: "?", timing: "公開時", text: "山札一番上のパワーをコピーする。" },

{ id: 23, name: "はま寿司への執念", power: 7, timing: "結果時", text: "勝利時相手手札-1、敗北時自分手札-2。" },

{ id: 24, name: "2Lアイスの誘惑", power: 1, timing: "判定時", text: "この勝負を引き分けにする。" },

{ id: 25, name: "エステ籠りの成果", power: 0, timing: "公開時", text: "捨て札のスキルを1つコピーする。" },

{ id: 26, name: "裏のリーダー！？", power: 4, timing: "終了時", text: "次に出す自分カードのパワーを+6する。" },

{ id: 27, name: "猫なで声の誘い", power: 5, timing: "結果時", text: "敗北時、相手得点を無効化(相手P10以上)。" },

{ id: 28, name: "凛とした決意", power: 7, timing: "判定時", text: "相手のパワー変動を無視する。" },

{ id: 29, name: "ゆうがないちげき！", power: 6, timing: "判定時", text: "パワー差が4以上あれば勝利。" },

{ id: 30, name: "ぱにゃい！の奇跡", power: 5, timing: "公開時", text: "お互いドロー。ドローPが勝てばP10に。" },

];



const shuffle = (array) => [...array].sort(() => Math.random() - 0.5);

const getInitialDeck = () => shuffle(RAW_CARD_DATA.slice(0, 20)).map(c => ({...c, uid: Math.random()}));



const encodeDeck = (deck) => btoa(deck.map(c => c.id).join(','));

const decodeDeck = (code) => {

try {

const decoded = atob(code);

const ids = decoded.split(',').map(Number);

if (ids.length !== 20) return null;

return ids.map(id => ({ ...RAW_CARD_DATA.find(c => c.id === id), uid: Math.random() }));

} catch (e) { return null; }

};



// ==========================================

// Styles

// ==========================================

const styles = `

@keyframes toastIn { 0% { transform: translateY(-20px); opacity: 0; } 10% { transform: translateY(0); opacity: 1; } 90% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(-20px); opacity: 0; } }

@keyframes drawCard { 0% { transform: translate(100px, -200px) rotate(30deg); opacity: 0; } 100% { transform: translate(0, 0) rotate(0deg); opacity: 1; } }

.animate-toast { animation: toastIn 2.2s ease-in-out forwards; }

.animate-draw { animation: drawCard 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }

.no-scrollbar::-webkit-scrollbar { display: none; }

.perspective-1000 { perspective: 1000px; }

.backface-hidden { backface-visibility: hidden; }

.flip-card-inner { transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1); transform-style: preserve-3d; position: relative; width: 100%; height: 100%; }

.flipped { transform: rotateY(180deg); }

.card-sprite {

background-image: url('${ASSETS.CARD_SPRITE}');

background-size: 600% 500%;

image-rendering: pixelated;

}

@keyframes diceShake { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(10deg); } 75% { transform: rotate(-10deg); } }

.animate-dice-shake { animation: diceShake 0.1s infinite; }

`;



// ==========================================

// Components

// ==========================================

const CardView = ({ card, hidden = false, onClick, isGlowing = false, className = "", size = "normal" }) => {

const index = (card?.id || 1) - 1;

const col = index % 6;

const row = Math.floor(index / 6);

const posX = (col / (6 - 1)) * 100;

const posY = (row / (5 - 1)) * 100;



const containerClass = size === "small" ? "w-20 h-20" : "w-28 h-28";



if (!card && !hidden) return <div className={`${containerClass} border-2 border-dashed border-slate-800 rounded-lg ${className} flex items-center justify-center text-slate-800 font-black`}>?</div>;



return (

<div onClick={onClick} className={`${containerClass} perspective-1000 relative shrink-0 ${className}`}>

<div className={`flip-card-inner ${hidden ? 'flipped' : ''} ${isGlowing ? 'ring-4 ring-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.8)]' : 'shadow-xl'} rounded-lg`}>

<div

className="absolute inset-0 bg-slate-800 border-2 border-slate-700 rounded-lg card-sprite backface-hidden"

style={{ backgroundPosition: `${posX}% ${posY}%` }}

>

<div className="absolute bottom-1 right-1 bg-black/80 text-white px-1.5 py-0.5 rounded text-[0.6rem] font-bold">

P{card?.powerDisplay || card?.power}

</div>

</div>

<div className="absolute inset-0 bg-slate-700 border-2 border-slate-500 rounded-lg flex items-center justify-center backface-hidden [transform:rotateY(180deg)]">

<span className="font-black text-slate-500 text-xl italic tracking-tighter">UCG</span>

</div>

</div>

</div>

);

};



const CardDetailModal = ({ cardInfo, onAction, actionLabel, onCancel }) => {

if (!cardInfo || !cardInfo.card) return null;

const { card, isDiscard } = cardInfo;

return (

<div className="absolute inset-0 bg-black/90 z-[9000] flex items-center justify-center p-6 animate-in fade-in duration-200" onClick={onCancel}>

<div className="bg-slate-900 w-full max-w-xs rounded-3xl overflow-hidden border border-white/20 shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>

<div className="p-1 bg-gradient-to-r from-amber-500 to-orange-600"></div>

<div className="p-6 flex flex-col items-center">

<CardView card={card} className="scale-125 mb-8" />

<h3 className="text-xl font-black text-white mb-2 italic text-center leading-tight">{card.name}</h3>

<div className="w-full bg-black/40 rounded-xl p-4 mb-6 border border-white/5">

<div className="flex justify-between items-center mb-2">

<span className="text-[0.6rem] font-black text-amber-500 uppercase tracking-widest">[{card.timing}]</span>

<span className="text-lg font-black text-white">POWER {card.power}</span>

</div>

<p className="text-xs text-slate-300 leading-relaxed font-medium">{card.text}</p>

</div>

<div className="flex gap-4 w-full">

<button onClick={(e) => { e.stopPropagation(); AudioManager.playSE(ASSETS.SE_CLICK); onCancel(); }} className="flex-1 py-4 bg-slate-800 rounded-2xl font-black text-sm active:scale-95 transition-all text-slate-300">戻る</button>

{onAction && !isDiscard && (

<button

onClick={(e) => { e.stopPropagation(); AudioManager.playSE(ASSETS.SE_CLICK); onAction(); }}

className="flex-[2] py-4 bg-amber-500 text-slate-950 rounded-2xl font-black text-sm active:scale-95 transition-all shadow-[0_4px_0_#92400e]"

>

{actionLabel}

</button>

)}

</div>

</div>

</div>

</div>

);

};



const DiceOverlay = ({ dice }) => {

const [displayDice, setDisplayDice] = useState({ p: 1, c: 1 });

const [rolling, setRolling] = useState(true);



useEffect(() => {

let count = 0;

const interval = setInterval(() => {

AudioManager.playSE(ASSETS.SE_CLICK);

setDisplayDice({ p: Math.floor(Math.random()*6)+1, c: Math.floor(Math.random()*6)+1 });

if (++count > 20) { clearInterval(interval); setDisplayDice({ p: dice.p, c: dice.c }); setRolling(false); }

}, 60);

return () => clearInterval(interval);

}, [dice]);



return (

<div className="absolute inset-0 bg-black/60 backdrop-blur-md z-[5000] flex flex-col items-center justify-center">

<h2 className="text-amber-500 font-black text-3xl mb-8 italic tracking-tighter drop-shadow-lg">DICE JUDGE!</h2>

<div className="flex gap-12 items-center">

<div className="flex flex-col items-center gap-2">

<span className="text-blue-400 font-black text-[0.6rem] uppercase tracking-widest">Player 1</span>

<div className={`w-20 h-20 bg-white rounded-2xl shadow-2xl flex items-center justify-center text-slate-950 text-4xl font-black ${rolling ? 'animate-dice-shake scale-110' : 'ring-4 ring-blue-500'}`}>{displayDice.p}</div>

</div>

<div className="text-white font-black text-xl opacity-50">VS</div>

<div className="flex flex-col items-center gap-2">

<span className="text-red-400 font-black text-[0.6rem] uppercase tracking-widest">Player 2</span>

<div className={`w-20 h-20 bg-white rounded-2xl shadow-2xl flex items-center justify-center text-slate-950 text-4xl font-black ${rolling ? 'animate-dice-shake scale-110' : 'ring-4 ring-red-500'}`}>{displayDice.c}</div>

</div>

</div>

{!rolling && <div className={`mt-10 font-black text-xl px-6 py-2 rounded-full shadow-2xl ${displayDice.p > displayDice.c ? 'bg-blue-600 text-white' : 'bg-red-600 text-white animate-pulse'}`}>{displayDice.p > displayDice.c ? 'PLAYER 1 先攻' : 'PLAYER 2 先攻'}</div>}

</div>

);

};



// ==========================================

// Main App

// ==========================================

export default function App() {

const [view, setView] = useState('title');

const [bgmState, setBgmState] = useState('menu');

const [playerDeck, setPlayerDeck] = useState(getInitialDeck());

const [user, setUser] = useState(null);

const [roomInfo, setRoomInfo] = useState(null);



useEffect(() => {

if(!auth) return;

const initAuth = async () => {

try {

if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) await signInWithCustomToken(auth, __initial_auth_token);

else await signInAnonymously(auth);

} catch(e) { signInAnonymously(auth); }

};

initAuth();

const unsub = onAuthStateChanged(auth, setUser);

return () => unsub();

}, []);



useEffect(() => {

if (view === 'battle') {

setBgmState('battle');

} else {

setBgmState('menu');

}

}, [view]);



useEffect(() => {

const handleInteraction = () => {

if (bgmState === 'menu') AudioManager.playBGM(ASSETS.BGM_MENU);

else if (bgmState === 'battle') AudioManager.playBGM(ASSETS.BGM_BATTLE);

else if (bgmState === 'result') AudioManager.playBGM(ASSETS.BGM_RESULT);

};


handleInteraction();

document.addEventListener('click', handleInteraction, { once: true });

return () => document.removeEventListener('click', handleInteraction);

}, [bgmState]);



const handleSetView = (v) => {

AudioManager.playSE(ASSETS.SE_CLICK);

setView(v);

};



return (

<div className="w-full h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden flex flex-col relative select-none">

<style>{styles}</style>


{view === 'title' && <TitleScreen setView={handleSetView} />}

{view === 'deck' && <DeckBuilder setView={handleSetView} deck={playerDeck} setDeck={setPlayerDeck} />}

{view === 'rules' && <RuleGuide setView={handleSetView} />}

{view === 'lobby' && <OnlineLobby setView={handleSetView} user={user} playerDeck={playerDeck} setRoomInfo={setRoomInfo} />}

{view === 'battle' && <BattleScreen setView={handleSetView} baseDeck={playerDeck} isOnline={!!roomInfo} roomInfo={roomInfo} setBgmState={setBgmState} />}

</div>

);

}



const TitleScreen = ({ setView }) => (

<div className="flex-1 flex flex-col items-center bg-slate-950 overflow-y-auto no-scrollbar pt-10 pb-20">

<div className="w-full max-w-lg mb-8 relative flex items-center justify-center group animate-in zoom-in fade-in duration-1000 px-4">

<div className="absolute inset-0 bg-amber-500/20 blur-3xl rounded-full scale-75 group-hover:scale-90 transition-transform duration-1000"></div>

<img

src={ASSETS.KEY_VISUAL}

alt="Main Visual"

className="relative z-10 w-full h-auto object-contain drop-shadow-[0_20px_50px_rgba(245,158,11,0.4)]"

/>

</div>



<div className="flex flex-col w-64 space-y-4 animate-in slide-in-from-bottom duration-700 delay-300 pb-10">

<button

onClick={() => setView('battle')}

className="py-4 bg-amber-500 text-slate-950 font-black rounded-full shadow-[0_6px_0_#92400e] hover:bg-amber-400 active:translate-y-1 active:shadow-none transition-all text-xl italic border border-amber-300"

>

START BATTLE

</button>

<button

onClick={() => setView('lobby')}

className="py-4 bg-blue-600 text-white font-black rounded-full shadow-[0_6px_0_#1e3a8a] hover:bg-blue-500 active:translate-y-1 active:shadow-none transition-all text-xl flex items-center justify-center gap-2 border border-blue-400"

>

<Globe size={24}/> ONLINE

</button>

<div className="grid grid-cols-2 gap-4 mt-4">

<button

onClick={() => setView('deck')}

className="py-3 bg-slate-900 font-bold rounded-2xl border border-slate-700 flex flex-col items-center gap-1 active:scale-95 transition-transform"

>

<Layout size={18} className="text-slate-400"/> <span className="text-[0.6rem] tracking-widest">DECK</span>

</button>

<button

onClick={() => setView('rules')}

className="py-3 bg-slate-900 font-bold rounded-2xl border border-slate-700 flex flex-col items-center gap-1 active:scale-95 transition-transform"

>

<BookOpen size={18} className="text-slate-400"/> <span className="text-[0.6rem] tracking-widest">RULES</span>

</button>

</div>

</div>


<div className="mt-auto pb-4 text-white/20 text-[0.5rem] font-bold tracking-[0.3em] uppercase">© 2026 UCG PROJECT</div>

</div>

);



const OnlineLobby = ({ setView, user, playerDeck, setRoomInfo }) => {

const [joinId, setJoinId] = useState('');

const [statusMsg, setStatusMsg] = useState('');

const [waitingRoomId, setWaitingRoomId] = useState(null);



const createRoom = async () => {

AudioManager.playSE(ASSETS.SE_CLICK);

if(!user || !db) { setStatusMsg("通信環境を確認してください"); return; }

setStatusMsg("部屋を作成中...");

const newId = Math.floor(1000 + Math.random() * 9000).toString();

try {

await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', newId), {

status: 'waiting', hostId: user.uid, hostDeck: playerDeck, createdAt: new Date().toISOString()

});

setWaitingRoomId(newId);

setStatusMsg(`部屋を作成しました ID: ${newId}`);


const unsub = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', newId), (snap) => {

if (snap.exists() && snap.data().status === 'playing') {