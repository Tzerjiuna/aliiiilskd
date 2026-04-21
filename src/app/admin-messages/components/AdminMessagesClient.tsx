'use client';
import React, { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import { sendMessage, getMessages, InternalMessage } from '@/lib/messageStore';
import { useLanguage } from '@/context/LanguageContext';
import { createClient } from '@/lib/supabase/client';

interface UserOption {
  id: string;
  name: string;
}

export default function AdminMessagesClient() {
  const { t } = useLanguage();
  const supabase = createClient();
  const [users, setUsers] = useState<UserOption[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);
  const [messageText, setMessageText] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sentMessages, setSentMessages] = useState<InternalMessage[]>(() => getMessages());
  const [showDropdown, setShowDropdown] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await supabase
        .from('user_profiles')
        .select('id, full_name')
        .order('full_name');
      if (data) {
        setUsers(data.map(u => ({ id: u.id, name: u.full_name })));
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(
    u =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.id.toLowerCase().includes(userSearch.toLowerCase())
  );

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setImagePreview(result);
      setImageBase64(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSend = () => {
    if (!selectedUser) return;
    if (!messageText.trim() && !imageBase64) return;
    setSending(true);
    setTimeout(() => {
      const msg = sendMessage({
        toUserId: selectedUser.id,
        toUserName: selectedUser.name,
        fromAdmin: '管理员',
        text: messageText.trim(),
        imageUrl: imageBase64 || undefined,
      });
      setSentMessages(getMessages());
      setMessageText('');
      setImagePreview(null);
      setImageBase64(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setSending(false);
    }, 600);
  };

  const userSentMessages = sentMessages.filter(
    m => selectedUser && m.toUserId === selectedUser.id
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center">
          <Icon name="ChatBubbleLeftRightIcon" size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">站内消息</h1>
          <p className="text-sm text-gray-500">向指定用户发送站内通知消息</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Send Message Panel */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Icon name="PaperAirplaneIcon" size={16} className="text-primary-500" />
            发送消息
          </h2>

          {/* User selector */}
          <div className="relative">
            <label className="block text-xs font-semibold text-gray-600 mb-1">收件用户</label>
            <div
              className="flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2.5 cursor-pointer hover:border-primary-400 transition-colors bg-white"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <Icon name="UserIcon" size={16} className="text-gray-400" />
              {selectedUser ? (
                <span className="text-sm text-gray-800 flex-1">
                  <span className="font-mono text-xs text-primary-600 mr-1">{selectedUser.id.slice(0, 8)}…</span>
                  {selectedUser.name}
                </span>
              ) : (
                <span className="text-sm text-gray-400 flex-1">选择用户...</span>
              )}
              <Icon name="ChevronDownIcon" size={14} className="text-gray-400" />
            </div>

            {showDropdown && (
              <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                <div className="p-2 border-b border-gray-100">
                  <input
                    type="text"
                    placeholder="搜索用户名或ID..."
                    value={userSearch}
                    onChange={e => setUserSearch(e.target.value)}
                    className="w-full text-sm px-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-primary-400"
                    onClick={e => e.stopPropagation()}
                  />
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filteredUsers.length === 0 ? (
                    <div className="px-3 py-4 text-sm text-gray-400 text-center">
                      {users.length === 0 ? '加载用户中...' : '未找到用户'}
                    </div>
                  ) : (
                    filteredUsers.map(u => (
                      <button
                        key={u.id}
                        className="w-full text-left px-3 py-2 hover:bg-primary-50 transition-colors flex items-center gap-2"
                        onClick={() => { setSelectedUser(u); setShowDropdown(false); setUserSearch(''); }}
                      >
                        <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-xs font-bold flex-shrink-0">
                          {u.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-800 truncate">{u.name}</div>
                          <div className="text-xs font-mono text-primary-500 truncate">{u.id}</div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Message text */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">消息内容</label>
            <textarea
              rows={4}
              placeholder="输入消息内容..."
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              className="w-full text-sm px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-primary-400 resize-none"
            />
          </div>

          {/* Image upload */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">附加图片（可选）</label>
            <div
              className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-primary-400 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="max-h-32 mx-auto rounded-lg object-contain" />
                  <button
                    className="absolute top-0 right-0 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                    onClick={e => {
                      e.stopPropagation();
                      setImagePreview(null);
                      setImageBase64(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  >
                    ×
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1 text-gray-400">
                  <Icon name="PhotoIcon" size={24} />
                  <span className="text-xs">点击上传图片</span>
                  <span className="text-[10px]">PNG, JPG 最大 5MB</span>
                </div>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </div>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={!selectedUser || (!messageText.trim() && !imageBase64) || sending}
            className="w-full py-2.5 rounded-xl bg-primary-500 text-white font-semibold text-sm hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {sending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                发送中...
              </>
            ) : (
              <>
                <Icon name="PaperAirplaneIcon" size={16} />
                发送消息
              </>
            )}
          </button>
        </div>

        {/* Sent messages history */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Icon name="ClockIcon" size={16} className="text-gold-600" />
              已发送记录
            </h2>
            {selectedUser && (
              <span className="text-xs bg-primary-50 text-primary-600 px-2 py-1 rounded-lg font-medium">
                {selectedUser.name}
              </span>
            )}
          </div>

          {!selectedUser ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Icon name="ChatBubbleLeftEllipsisIcon" size={40} className="mb-2 opacity-30" />
              <p className="text-sm">请先选择收件用户</p>
            </div>
          ) : userSentMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
              <Icon name="InboxIcon" size={40} className="mb-2 opacity-30" />
              <p className="text-sm">暂无发送记录</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {userSentMessages.map(msg => (
                <div key={msg.id} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-primary-600">{msg.fromAdmin}</span>
                    <span className="text-[10px] text-gray-400">{new Date(msg.sentAt).toLocaleString('zh-CN')}</span>
                  </div>
                  {msg.text && <p className="text-sm text-gray-700">{msg.text}</p>}
                  {msg.imageUrl && <img src={msg.imageUrl} alt="Sent image" className="mt-2 max-h-32 rounded-lg object-contain" />}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
