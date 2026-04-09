/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Filter, 
  Gift as GiftIcon, 
  ClipboardList, 
  Gamepad2, 
  Trophy, 
  Archive,
  Plus,
  ArrowRight,
  Loader2,
  X,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  db 
} from './firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';
import { Gift, Tab, Category } from './types';

export default function App() {
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('Market');
  const [activeCategory, setActiveCategory] = useState<Category>('Gifts');
  const [searchQuery, setSearchQuery] = useState('');
  const [isBotModalOpen, setIsBotModalOpen] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'gifts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const giftsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Gift[];
      setGifts(giftsData);
    }, (error) => {
      console.error("Firestore Error:", error);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-sans pb-24 selection:bg-[#ffd700] selection:text-black">
      {/* Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#ffd700]/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#ffd700]/5 blur-[120px] rounded-full" />
      </div>

      {/* Top Banner Simulation */}
      <motion.div 
        initial={{ y: -50 }}
        animate={{ y: 0 }}
        className="bg-[#ffd700] text-black p-3 flex items-center justify-between sticky top-0 z-40 shadow-lg"
      >
        <div className="flex items-center gap-3">
          <motion.div 
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4 }}
            className="w-8 h-8 bg-black rounded-full flex items-center justify-center overflow-hidden border-2 border-black"
          >
             <img src="https://picsum.photos/seed/frog/100/100" className="w-full h-full object-cover" alt="frog" />
          </motion.div>
          <div>
            <p className="text-xs font-black uppercase tracking-tighter leading-none">Web is coming</p>
            <p className="text-[10px] font-medium opacity-80">New version. CS skins</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <X className="w-4 h-4 cursor-pointer hover:scale-110 transition-transform" />
        </div>
      </motion.div>

      {/* Header Tabs */}
      <div className="sticky top-[52px] bg-[#0a0a0a]/80 backdrop-blur-xl z-30 pt-6 px-4 border-b border-white/5">
        <div className="flex gap-8 overflow-x-auto no-scrollbar pb-3">
          {(['Gifts', 'Stickers', 'Stars & Prem', 'Collections'] as Category[]).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap text-sm font-black uppercase tracking-widest transition-all relative ${
                activeCategory === cat ? 'text-[#ffd700]' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {cat}
              {activeCategory === cat && (
                <motion.div 
                  layoutId="activeCategory"
                  className="absolute -bottom-3 left-0 right-0 h-1 bg-[#ffd700] rounded-t-full shadow-[0_-4px_10px_rgba(255,215,0,0.5)]" 
                />
              )}
            </button>
          ))}
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-3 py-6">
          <div className="flex-1 bg-white/5 rounded-2xl flex items-center px-4 py-3 gap-3 border border-white/10 focus-within:border-[#ffd700]/50 focus-within:bg-white/10 transition-all duration-300 group">
            <Search className="w-4 h-4 text-gray-500 group-focus-within:text-[#ffd700] transition-colors" />
            <input 
              type="text" 
              placeholder="Search by NFT name or number" 
              className="bg-transparent border-none outline-none text-sm w-full placeholder:text-gray-600"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-3 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors relative"
          >
            <ShoppingCart className="w-5 h-5 text-white" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#ffd700] rounded-full shadow-[0_0_8px_rgba(255,215,0,0.8)]" />
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-5 py-3 bg-white/5 rounded-2xl border border-white/10 text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-colors"
          >
            Feed
          </motion.button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-6">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2.5 bg-[#ffd700] rounded-xl text-black shadow-lg shadow-[#ffd700]/20"
          >
            <Filter className="w-4 h-4" />
          </motion.button>
          {['NFT', 'Model', 'Backdrop', 'Symbol', 'Price'].map((f) => (
            <motion.button 
              key={f} 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-white/10 transition-colors"
            >
              {f} <span className="text-[8px] opacity-30">▼</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="px-4 pt-6 grid grid-cols-2 gap-5">
        <AnimatePresence mode="popLayout">
          {gifts
            .filter(g => g.name.toLowerCase().includes(searchQuery.toLowerCase()) || g.number?.includes(searchQuery))
            .map((gift, index) => (
            <motion.div 
              key={gift.id}
              layout
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white/5 rounded-[2.5rem] overflow-hidden border border-white/10 group hover:border-[#ffd700]/30 hover:bg-white/10 transition-all duration-500 relative"
            >
              <div className="aspect-square relative p-6 flex items-center justify-center">
                <div className="absolute top-4 left-4 z-10 bg-[#ffd700] p-1.5 rounded-xl text-black shadow-lg shadow-[#ffd700]/20">
                  <Plus className="w-3 h-3" />
                </div>
                
                {/* Image Glow */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#ffd700]/0 to-[#ffd700]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <img 
                  src={gift.imageUrl} 
                  alt={gift.name} 
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-700 ease-out z-0"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="p-5 pt-0">
                <h3 className="font-black text-xs uppercase tracking-tight truncate group-hover:text-[#ffd700] transition-colors">{gift.name}</h3>
                <p className="text-gray-500 text-[9px] font-bold tracking-widest mb-4">{gift.number}</p>
                <div className="flex items-center gap-2">
                  <a 
                    href={gift.marketplaceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-[#ffd700] text-black py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1 active:scale-95 transition-all shadow-lg shadow-[#ffd700]/10 hover:shadow-[#ffd700]/20"
                  >
                    <span className="text-xs">∇</span> {gift.price}
                  </a>
                  <button className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-[#ffd700] hover:text-black hover:border-transparent transition-all duration-300">
                    <ShoppingCart className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Empty State */}
        {gifts.length === 0 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-2 py-32 text-center space-y-6"
          >
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10">
              <Archive className="w-10 h-10 text-gray-700" />
            </div>
            <div className="space-y-2">
              <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">No gifts found</p>
              <p className="text-gray-600 text-xs">Try adding one via the bot!</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/90 backdrop-blur-2xl border-t border-white/5 px-8 py-4 flex justify-between items-center z-40">
        {(['Market', 'Orders', 'Play Hub', 'Giveaways', 'Storage'] as Tab[]).map((tab) => {
          const Icon = {
            'Market': GiftIcon,
            'Orders': ClipboardList,
            'Play Hub': Gamepad2,
            'Giveaways': Trophy,
            'Storage': Archive
          }[tab];
          
          const isActive = activeTab === tab;
          
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="relative group"
            >
              <div className={`flex flex-col items-center gap-1.5 transition-all duration-300 ${
                isActive ? 'text-[#ffd700] scale-110' : 'text-gray-600 hover:text-gray-400'
              }`}>
                <Icon className={`w-6 h-6 ${isActive ? 'drop-shadow-[0_0_8px_rgba(255,215,0,0.5)]' : ''}`} />
                <span className="text-[9px] font-black uppercase tracking-tighter">{tab}</span>
              </div>
              {isActive && (
                <motion.div 
                  layoutId="navIndicator"
                  className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#ffd700] rounded-b-full shadow-[0_4px_10px_rgba(255,215,0,0.5)]"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Floating Action Button (Bot Simulation Trigger) */}
      <motion.button
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsBotModalOpen(true)}
        className="fixed bottom-28 right-6 w-16 h-16 bg-[#ffd700] rounded-full shadow-[0_10px_40px_rgba(255,215,0,0.4)] flex items-center justify-center z-50 group overflow-hidden"
      >
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        <MessageSquare className="w-7 h-7 text-black relative z-10" />
      </motion.button>

      {/* Bot Modal */}
      <AnimatePresence>
        {isBotModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBotModalOpen(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ y: "100%", scale: 0.9 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: "100%", scale: 0.9 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-[#141414] rounded-t-[3rem] sm:rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl shadow-black"
            >
              <div className="p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#ffd700] rounded-2xl flex items-center justify-center shadow-lg shadow-[#ffd700]/20">
                      <MessageSquare className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <h2 className="font-black uppercase tracking-widest text-sm">Telegram Bot</h2>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Hubungkan dengan @elclawwbot</p>
                    </div>
                  </div>
                  <button onClick={() => setIsBotModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                    <X className="w-6 h-6 text-gray-500" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="p-6 bg-black rounded-[2rem] border border-white/10 space-y-4">
                    <div className="flex items-center justify-center py-4">
                      <div className="w-20 h-20 bg-[#0088cc] rounded-full flex items-center justify-center shadow-lg shadow-[#0088cc]/20">
                        <MessageSquare className="w-10 h-10 text-white" />
                      </div>
                    </div>
                    <div className="text-center space-y-2">
                      <h3 className="font-black uppercase tracking-tight">Gunakan Telegram Bot</h3>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        Kirim link marketplace ke bot Telegram kami untuk menambahkan item secara otomatis ke sini.
                      </p>
                    </div>
                    <a 
                      href="https://t.me/elclawwbot" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-4 bg-[#0088cc] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-[#0088cc]/10 active:scale-95 transition-all"
                    >
                      Buka Telegram Bot <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                    <p className="text-[11px] text-gray-400 leading-relaxed font-medium">
                      Bot akan memproses link <span className="text-[#ffd700] font-black">mrkt</span> dan item akan langsung muncul di tab Market secara real-time.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
