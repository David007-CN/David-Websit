import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, User, ShieldCheck, ChevronLeft } from 'lucide-react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  setDoc, 
  doc, 
  getDoc,
  updateDoc,
  increment,
  Timestamp
} from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged, User as FirebaseUser, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { db, auth } from './firebase';

interface Message {
  id: string;
  text: string;
  timestamp: any;
  isAdmin: boolean;
  senderId: string;
}

export const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const ADMIN_EMAIL = "pengdawei0336@gmail.com";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      if (u) {
        setUser(u);
        const isAdm = u.email === ADMIN_EMAIL;
        setIsAdmin(isAdm);
        if (isAdm) {
          setShowAdminPanel(true);
          setActiveSessionId(null); // Admin starts with list
        } else {
          setActiveSessionId(u.uid);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
        // Use localStorage for guest ID if not logged in
        let guestId = localStorage.getItem('chat_guest_id');
        if (!guestId) {
          guestId = 'guest_' + Math.random().toString(36).substring(2, 15);
          localStorage.setItem('chat_guest_id', guestId);
        }
        setActiveSessionId(guestId);
      }
    });
    return () => unsubscribe();
  }, []);

  // Admin: Listen to all active sessions
  useEffect(() => {
    if (isAdmin && showAdminPanel) {
      const q = query(collection(db, 'chat_sessions'), orderBy('lastTimestamp', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const s = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setSessions(s);
      });
      return () => unsubscribe();
    }
  }, [isAdmin, showAdminPanel]);

  // Listen to messages for the active session
  useEffect(() => {
    if (activeSessionId) {
      const q = query(
        collection(db, 'chat_sessions', activeSessionId, 'messages'),
        orderBy('timestamp', 'asc')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const m = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
        setMessages(m);
        // Reset unread count if admin is viewing
        if (isAdmin && activeSessionId) {
          updateDoc(doc(db, 'chat_sessions', activeSessionId), { unreadCount: 0 }).catch(() => {});
        }
      });
      return () => unsubscribe();
    }
  }, [activeSessionId, isAdmin]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !activeSessionId) return;

    const msgText = message.trim();
    setMessage('');

    try {
      const senderId = user ? user.uid : (localStorage.getItem('chat_guest_id') || activeSessionId);
      
      // 1. Add message to subcollection
      await addDoc(collection(db, 'chat_sessions', activeSessionId, 'messages'), {
        sessionId: activeSessionId,
        text: msgText,
        timestamp: serverTimestamp(),
        isAdmin: isAdmin,
        senderId: senderId
      });

      // 2. Update session metadata
      const sessionRef = doc(db, 'chat_sessions', activeSessionId);
      const sessionSnap = await getDoc(sessionRef);
      
      if (!sessionSnap.exists()) {
        await setDoc(sessionRef, {
          id: activeSessionId,
          lastMessage: msgText,
          lastTimestamp: serverTimestamp(),
          userName: user?.displayName || 'Guest',
          unreadCount: isAdmin ? 0 : 1,
          status: 'active'
        });
      } else {
        await updateDoc(sessionRef, {
          lastMessage: msgText,
          lastTimestamp: serverTimestamp(),
          unreadCount: isAdmin ? 0 : increment(1)
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleGoogleLogin = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Button clicked: Attempting Google Login...");
    
    if (!auth) {
      alert("Firebase Auth is not initialized. Please check your configuration.");
      return;
    }

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    
    try {
      const result = await signInWithPopup(auth, provider);
      console.log("Login successful:", result.user.email);
      alert("Login successful! Welcome " + result.user.email);
    } catch (error: any) {
      console.error("Login Error Details:", error);
      if (error.code === 'auth/popup-blocked') {
        alert("Popup blocked! Please allow popups for this site in your browser settings (usually in the address bar).");
      } else if (error.code === 'auth/unauthorized-domain') {
        alert("Domain unauthorized. Please ensure '" + window.location.hostname + "' is added to Authorized Domains in Firebase Console.");
      } else if (error.code === 'auth/operation-not-allowed') {
        alert("Google Sign-in is not enabled. Please enable it in Firebase Console > Authentication > Sign-in method.");
      } else {
        alert("Login failed: " + error.message + " (Code: " + error.code + ")");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      localStorage.removeItem('chat_guest_id'); // Clear guest ID on logout to reset
      console.log("Logged out");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 w-[350px] md:w-[400px] h-[500px] bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-brand-red flex items-center justify-between text-white">
              <div className="flex items-center gap-3">
                {isAdmin && activeSessionId && !showAdminPanel && (
                  <button 
                    onClick={() => setShowAdminPanel(true)}
                    className="p-1 hover:bg-white/10 rounded transition-colors mr-1"
                  >
                    <ChevronLeft size={20} />
                  </button>
                )}
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <MessageCircle size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    {isAdmin && activeSessionId && !showAdminPanel 
                      ? (sessions.find(s => s.id === activeSessionId)?.userName || 'Chatting...') 
                      : 'Live Support'}
                  </h3>
                  <p className="text-[10px] opacity-80">Typically replies in a few hours</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <button 
                    onClick={() => setShowAdminPanel(!showAdminPanel)}
                    className={`p-1 rounded transition-colors ${showAdminPanel ? 'bg-white/20' : 'hover:bg-white/10'}`}
                    title="Toggle Admin Panel"
                  >
                    <ShieldCheck size={18} />
                  </button>
                )}
                <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded transition-colors">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {isAdmin && showAdminPanel ? (
                // Admin Session List
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-white/40 font-bold">Active Conversations</div>
                  {sessions.length === 0 ? (
                    <div className="text-center py-10 text-white/30 text-sm italic">No active chats</div>
                  ) : (
                    sessions.map(s => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setActiveSessionId(s.id);
                          setShowAdminPanel(false);
                        }}
                        className={`w-full p-3 rounded-xl text-left transition-colors flex items-center gap-3 ${activeSessionId === s.id ? 'bg-white/10' : 'hover:bg-white/5'}`}
                      >
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40">
                          <User size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-bold text-white truncate">{s.userName || 'Guest'}</span>
                            {s.unreadCount > 0 && (
                              <span className="bg-brand-red text-[10px] px-1.5 py-0.5 rounded-full text-white font-bold">{s.unreadCount}</span>
                            )}
                          </div>
                          <p className="text-xs text-white/40 truncate">{s.lastMessage}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              ) : (
                // Message List
                <>
                  <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
                    {messages.length === 0 && (
                      <div className="text-center py-10">
                        <p className="text-white/40 text-sm">Hello! How can I help you today?</p>
                      </div>
                    )}
                    {messages.map((m) => (
                      <div key={m.id} className={`flex ${m.isAdmin ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                          m.isAdmin 
                            ? 'bg-white/10 text-white rounded-tl-none' 
                            : 'bg-brand-red text-white rounded-tr-none'
                        }`}>
                          {m.text}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Input */}
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-white/10 flex gap-2">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-red transition-colors"
                    />
                    <button
                      type="submit"
                      disabled={!message.trim()}
                      className="w-10 h-10 rounded-full bg-brand-red flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                    >
                      <Send size={18} />
                    </button>
                  </form>
                </>
              )}
            </div>

            {/* Footer / Auth */}
            <div className="p-2 bg-black/40 border-t border-white/5 text-center flex justify-center gap-4">
              {user?.email ? (
                <button 
                  onClick={handleLogout}
                  className="text-[10px] text-white/40 hover:text-white transition-colors"
                >
                  Logout ({user.email})
                </button>
              ) : (
                <button 
                  onClick={handleGoogleLogin}
                  className="text-[10px] text-white/40 hover:text-white transition-colors"
                >
                  Admin? Login to reply
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-brand-red shadow-2xl flex items-center justify-center text-white relative group"
      >
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
        
        {/* Unread Badge for Admin */}
        {isAdmin && sessions.some(s => s.unreadCount > 0) && !isOpen && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-brand-red text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-brand-red">
            !
          </span>
        )}
      </motion.button>
    </div>
  );
};
