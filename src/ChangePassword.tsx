import React, { useState } from 'react';

const isWebCryptoAvailable = typeof crypto !== 'undefined' && !!(crypto as any).subtle;

const hashString = async (str: string) => {
  if (isWebCryptoAvailable) {
    const buf = await (crypto as any).subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  return str; // fallback for non-HTTPS local network
};

const getStoredHash = async () => {
  if (isWebCryptoAvailable) {
    const stored = localStorage.getItem('admin_password_hash');
    if (stored) return stored;
    return await hashString('admin');
  } else {
    const plain = localStorage.getItem('admin_password_plain');
    return plain || 'admin';
  }
};

export default function ChangePassword({ onClose }: { onClose?: () => void }) {
  const [current, setCurrent] = useState('');
  const [n1, setN1] = useState('');
  const [n2, setN2] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    setMessage(null);
    if (!n1 || n1.length < 4) {
      setMessage('新密碼至少 4 個字元');
      return;
    }
    if (n1 !== n2) {
      setMessage('兩次輸入的新密碼不相符');
      return;
    }

    const stored = await getStoredHash();
    const curVal = isWebCryptoAvailable ? await hashString(current) : current;
    if (curVal !== stored) {
      setMessage('目前密碼錯誤');
      return;
    }

    if (isWebCryptoAvailable) {
      const newHash = await hashString(n1);
      localStorage.setItem('admin_password_hash', newHash);
    } else {
      // In non-secure contexts (local network HTTP), persist plaintext as fallback
      localStorage.setItem('admin_password_plain', n1);
    }
    setMessage('管理員密碼已更新');
    setCurrent(''); setN1(''); setN2('');
    setTimeout(() => {
      onClose && onClose();
    }, 700);
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-400">請輸入目前密碼與新的管理員密碼。預設密碼為 "admin"。</p>
      <div>
        <label className="text-xs text-slate-400">目前密碼</label>
        <input type="password" value={current} onChange={e => setCurrent(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 mt-2" />
      </div>
      <div>
        <label className="text-xs text-slate-400">新密碼</label>
        <input type="password" value={n1} onChange={e => setN1(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 mt-2" />
      </div>
      <div>
        <label className="text-xs text-slate-400">確認新密碼</label>
        <input type="password" value={n2} onChange={e => setN2(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl p-3 mt-2" />
      </div>

      {message && <div className="text-sm text-center text-slate-300 bg-black/20 p-3 rounded">{message}</div>}

      <div className="flex gap-3">
        <button onClick={handleSubmit} className="flex-1 py-3 bg-purple-600 rounded-xl text-white font-black">更新密碼</button>
        <button onClick={() => onClose && onClose()} className="flex-1 py-3 bg-white/5 rounded-xl text-slate-300 font-bold">取消</button>
      </div>
    </div>
  );
}
