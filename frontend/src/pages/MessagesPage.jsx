import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { IoSendOutline, IoSearchOutline, IoCloseOutline, IoPeopleOutline, IoPersonAddOutline, IoTrashOutline } from 'react-icons/io5';
import Avatar from '../components/ui/Avatar';
import { formatDate, getImageUrl } from '../utils/helpers';
import useAuthStore from '../store/authStore';
import useSocketStore from '../store/socketStore';
import api from '../api/axios';

export default function MessagesPage() {
  const { user } = useAuthStore();
  const { socket, onlineUsers } = useSocketStore();
  const [searchParams] = useSearchParams();
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [otherTyping, setOtherTyping] = useState(false);

  // Create group modal
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [creating, setCreating] = useState(false);

  // Members panel
  const [showMembersPanel, setShowMembersPanel] = useState(false);
  const [groupMembers, setGroupMembers] = useState([]);
  const [addSearch, setAddSearch] = useState('');
  const [addResults, setAddResults] = useState([]);

  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);

  useEffect(() => {
    api.get('/chats').then(r => {
      setChats(r.data);
      const chatId = searchParams.get('chat');
      if (chatId) {
        const chat = r.data.find(c => c.id === parseInt(chatId));
        if (chat) openChat(chat);
      }
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!socket || !activeChat) return;
    socket.emit('join_chat', activeChat.id);
    socket.on('new_message', (msg) => {
      if (msg.chat_id === activeChat.id) setMessages(prev => [...prev, msg]);
    });
    socket.on('user_typing', (data) => {
      if (data.chatId === activeChat.id && data.userId !== user.id) setOtherTyping(true);
    });
    socket.on('user_stop_typing', () => setOtherTyping(false));
    return () => { socket.off('new_message'); socket.off('user_typing'); socket.off('user_stop_typing'); };
  }, [socket, activeChat]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Search for create group modal
  useEffect(() => {
    if (!userSearch.trim()) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get(`/users/search?q=${userSearch}`);
        setSearchResults(data.filter(u => u.id !== user.id));
      } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [userSearch]);

  // Search for add members panel
  useEffect(() => {
    if (!addSearch.trim()) { setAddResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get(`/users/search?q=${addSearch}`);
        const existingIds = groupMembers.map(m => m.id);
        setAddResults(data.filter(u => u.id !== user.id && !existingIds.includes(u.id)));
      } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, [addSearch, groupMembers]);

  const openChat = async (chat) => {
    setActiveChat(chat);
    setShowMembersPanel(false);
    const { data } = await api.get(`/chats/${chat.id}/messages`);
    setMessages(data);
  };

  const openMembersPanel = async (chat) => {
    setShowMembersPanel(true);
    const { data } = await api.get(`/chats/${chat.id}/members`);
    setGroupMembers(data);
  };

  const addMember = async (member) => {
    try {
      await api.post(`/chats/${activeChat.id}/members`, { memberIds: [member.id] });
      setGroupMembers(prev => [...prev, member]);
      setAddResults(prev => prev.filter(u => u.id !== member.id));
      setAddSearch('');
    } catch {}
  };

  const removeMember = async (memberId) => {
    try {
      await api.delete(`/chats/${activeChat.id}/members/${memberId}`);
      setGroupMembers(prev => prev.filter(m => m.id !== memberId));
    } catch {}
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;
    const content = newMessage;
    setNewMessage('');
    try {
      const { data } = await api.post(`/chats/${activeChat.id}/messages`, { content });
      setMessages(prev => [...prev, data]);
      socket?.emit('send_message', { ...data, chatId: activeChat.id });
      setChats(prev => prev.map(c => c.id === activeChat.id ? { ...c, last_message: content } : c));
    } catch {}
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!socket || !activeChat) return;
    socket.emit('typing', { chatId: activeChat.id, userId: user.id });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => socket.emit('stop_typing', { chatId: activeChat.id, userId: user.id }), 1500);
  };

  const toggleMember = (u) => {
    setSelectedMembers(prev =>
      prev.find(m => m.id === u.id) ? prev.filter(m => m.id !== u.id) : [...prev, u]
    );
  };

  const createGroup = async () => {
    if (!groupName.trim() || selectedMembers.length < 2) return;
    setCreating(true);
    try {
      const { data } = await api.post('/chats/group', {
        name: groupName.trim(),
        memberIds: selectedMembers.map(m => m.id)
      });
      const res = await api.get('/chats');
      setChats(res.data);
      const newChat = res.data.find(c => c.id === data.id);
      if (newChat) openChat(newChat);
      setShowGroupModal(false);
      setGroupName('');
      setSelectedMembers([]);
      setUserSearch('');
    } catch {}
    finally { setCreating(false); }
  };

  const getChatName = (chat) => chat.type === 'group' ? chat.name : chat.other_user?.full_name;

  return (
    <div className="flex h-[calc(100vh-65px)]">

      {/* ── Create group modal ── */}
      <AnimatePresence>
        {showGroupModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowGroupModal(false)}
          >
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="glass border border-white/10 rounded-2xl p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-white">Create Group Chat</h3>
                <button onClick={() => setShowGroupModal(false)} className="text-white/40 hover:text-white"><IoCloseOutline size={22} /></button>
              </div>
              <input value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="Group name..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500 mb-4" />
              <input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Search and add members..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500 mb-3" />
              {searchResults.length > 0 && (
                <div className="border border-white/10 rounded-xl overflow-hidden mb-3 max-h-40 overflow-y-auto">
                  {searchResults.map(u => (
                    <button key={u.id} onClick={() => toggleMember(u)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left ${selectedMembers.find(m => m.id === u.id) ? 'bg-purple-500/10' : ''}`}>
                      <Avatar src={u.profile_photo} name={u.full_name} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">{u.full_name}</p>
                        <p className="text-xs text-white/40">@{u.username}</p>
                      </div>
                      {selectedMembers.find(m => m.id === u.id) && <span className="text-purple-400 text-xs">✓</span>}
                    </button>
                  ))}
                </div>
              )}
              {selectedMembers.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedMembers.map(m => (
                    <span key={m.id} className="flex items-center gap-1.5 bg-purple-500/20 border border-purple-500/30 text-purple-300 text-xs px-3 py-1.5 rounded-full">
                      {m.full_name}
                      <button onClick={() => toggleMember(m)} className="hover:text-white"><IoCloseOutline size={12} /></button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-xs text-white/30 mb-4">{selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected (minimum 2)</p>
              <button onClick={createGroup} disabled={!groupName.trim() || selectedMembers.length < 2 || creating}
                className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">
                {creating ? 'Creating...' : 'Create Group'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Chat list ── */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-white/5 flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-white">Messages</h2>
            <button onClick={() => setShowGroupModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 text-purple-400 text-xs font-medium rounded-lg hover:bg-purple-500/30 transition-colors">
              <IoPeopleOutline size={14} /> New Group
            </button>
          </div>
          <div className="relative">
            <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={15} />
            <input placeholder="Search conversations..." className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1,2,3].map(i => <div key={i} className="flex gap-3 animate-pulse"><div className="w-11 h-11 rounded-full bg-white/10" /><div className="flex-1"><div className="h-3 bg-white/10 rounded w-24 mb-2" /><div className="h-3 bg-white/10 rounded w-40" /></div></div>)}
            </div>
          ) : chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <div className="text-4xl mb-3">💬</div>
              <p className="text-white/40 text-sm">No conversations yet</p>
              <p className="text-white/20 text-xs mt-1">Visit a profile to start chatting</p>
            </div>
          ) : chats.map(chat => (
            <button key={chat.id} onClick={() => openChat(chat)}
              className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 transition-colors text-left ${activeChat?.id === chat.id ? 'bg-purple-500/10 border-r-2 border-purple-500' : ''}`}>
              <div className="relative">
                {chat.type === 'group' ? (
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                    <IoPeopleOutline size={18} className="text-white" />
                  </div>
                ) : (
                  <Avatar src={chat.other_user?.profile_photo} name={chat.other_user?.full_name} size="md" />
                )}
                {chat.type === 'direct' && onlineUsers.includes(String(chat.other_user?.id)) && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-dark-900" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white truncate">{getChatName(chat)}</p>
                  {chat.last_message_time && <p className="text-[10px] text-white/30 flex-shrink-0">{formatDate(chat.last_message_time)}</p>}
                </div>
                <p className="text-xs text-white/40 truncate">{chat.last_message || 'Start a conversation'}</p>
              </div>
              {chat.unread_count > 0 && (
                <span className="w-5 h-5 bg-purple-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center flex-shrink-0">{chat.unread_count}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Chat window ── */}
      <div className={`flex-1 flex ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
        {!activeChat ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-xl font-bold text-white mb-2">Select a conversation</h3>
            <p className="text-white/40 text-sm">Choose a chat from the left to start messaging</p>
          </div>
        ) : (
          <>
            {/* Main chat column */}
            <div className="flex-1 flex flex-col min-w-0">
              {/* Header */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5 bg-dark-800/50">
                <button onClick={() => setActiveChat(null)} className="md:hidden p-1.5 rounded-lg hover:bg-white/5 text-white/60">←</button>
                {activeChat.type === 'group' ? (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0">
                    <IoPeopleOutline size={18} className="text-white" />
                  </div>
                ) : (
                  <Avatar src={activeChat.other_user?.profile_photo} name={activeChat.other_user?.full_name} size="md" online={onlineUsers.includes(String(activeChat.other_user?.id))} />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-white truncate">{getChatName(activeChat)}</p>
                  <p className="text-xs text-white/40">
                    {activeChat.type === 'group'
                      ? `${groupMembers.length || ''} members`
                      : otherTyping ? <span className="text-purple-400">typing...</span>
                      : onlineUsers.includes(String(activeChat.other_user?.id)) ? 'Online' : 'Offline'}
                  </p>
                </div>
                {/* Members button — only for group chats */}
                {activeChat.type === 'group' && (
                  <button
                    onClick={() => showMembersPanel ? setShowMembersPanel(false) : openMembersPanel(activeChat)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${showMembersPanel ? 'bg-purple-500/30 text-purple-300' : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'}`}
                  >
                    <IoPeopleOutline size={15} /> Members
                  </button>
                )}
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map(msg => {
                  const isMe = msg.sender_id === user.id;
                  return (
                    <motion.div key={msg.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                      className={`flex items-end gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                      {!isMe && <Avatar src={msg.sender_photo} name={msg.sender_name} size="xs" />}
                      <div className={`max-w-xs lg:max-w-md flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
                        {activeChat.type === 'group' && !isMe && (
                          <p className="text-[10px] text-purple-400 px-1">{msg.sender_name}</p>
                        )}
                        {msg.image && <img src={getImageUrl(msg.image)} alt="img" className="max-w-xs rounded-xl" />}
                        {msg.content && (
                          <div className={`px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-br-sm' : 'bg-white/10 text-white rounded-bl-sm'}`}>
                            {msg.content}
                          </div>
                        )}
                        <p className="text-[10px] text-white/30">{formatDate(msg.created_at)}</p>
                      </div>
                    </motion.div>
                  );
                })}
                {otherTyping && activeChat.type === 'direct' && (
                  <div className="flex items-end gap-2">
                    <Avatar src={activeChat.other_user?.profile_photo} name={activeChat.other_user?.full_name} size="xs" />
                    <div className="bg-white/10 rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1">
                      {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={sendMessage} className="flex items-center gap-3 px-4 py-3 border-t border-white/5 bg-dark-800/50">
                <input value={newMessage} onChange={handleTyping} placeholder="Type a message..."
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500" />
                <button type="submit" disabled={!newMessage.trim()}
                  className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl text-white hover:from-purple-500 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                  <IoSendOutline size={18} />
                </button>
              </form>
            </div>

            {/* ── Members panel (slides in on right) ── */}
            <AnimatePresence>
              {showMembersPanel && activeChat.type === 'group' && (
                <motion.div
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 280, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-l border-white/5 bg-dark-800/50 flex flex-col overflow-hidden flex-shrink-0"
                >
                  <div className="p-4 border-b border-white/5 flex items-center justify-between">
                    <h4 className="font-bold text-white text-sm">Members ({groupMembers.length})</h4>
                    <button onClick={() => setShowMembersPanel(false)} className="text-white/40 hover:text-white">
                      <IoCloseOutline size={18} />
                    </button>
                  </div>

                  {/* Add member search */}
                  <div className="p-3 border-b border-white/5">
                    <div className="relative">
                      <IoPersonAddOutline className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={14} />
                      <input
                        value={addSearch}
                        onChange={e => setAddSearch(e.target.value)}
                        placeholder="Add members..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    {addResults.length > 0 && (
                      <div className="mt-2 border border-white/10 rounded-xl overflow-hidden max-h-36 overflow-y-auto">
                        {addResults.map(u => (
                          <button key={u.id} onClick={() => addMember(u)}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors text-left">
                            <Avatar src={u.profile_photo} name={u.full_name} size="xs" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-white truncate">{u.full_name}</p>
                              <p className="text-[10px] text-white/40">@{u.username}</p>
                            </div>
                            <span className="text-purple-400 text-[10px] flex-shrink-0">+ Add</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Member list */}
                  <div className="flex-1 overflow-y-auto p-2">
                    {groupMembers.map(m => (
                      <div key={m.id} className="flex items-center gap-2 px-2 py-2.5 rounded-xl hover:bg-white/5 group">
                        <Avatar src={m.profile_photo} name={m.full_name} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white truncate">{m.full_name}</p>
                          <p className="text-[10px] text-white/40">@{m.username}</p>
                        </div>
                        {m.id !== user.id && (
                          <button onClick={() => removeMember(m.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-300 transition-all">
                            <IoTrashOutline size={14} />
                          </button>
                        )}
                        {m.id === user.id && <span className="text-[10px] text-purple-400">You</span>}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}
