import React from 'react';

type AuthMode = 'login' | 'register';

interface AuthProps {
  authMode: AuthMode;
  setAuthMode: (mode: AuthMode) => void;
  authMessage: string | null;
  authError: string | null;
  handleLogin: (e: React.FormEvent<HTMLFormElement>) => void;
  handleRegister: (e: React.FormEvent<HTMLFormElement>) => void;
  handleSendOtp: () => void;
  otpSent: boolean;
  otpCooldown: number;
  onClose: () => void;
}

export const Auth: React.FC<AuthProps> = ({
  authMode,
  setAuthMode,
  authMessage,
  authError,
  handleLogin,
  handleRegister,
  handleSendOtp,
  otpSent,
  otpCooldown,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100]">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-[90vw] max-w-xs relative animate-pop">
        <button className="absolute top-2 right-2 text-xl font-bold text-gray-500 hover:text-gray-700" onClick={onClose}>&times;</button>
        <div className="mb-4 flex gap-2 justify-center">
          <button onClick={() => setAuthMode('login')} className={`px-3 py-1 rounded-full font-bold text-sm ${authMode === 'login' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Đăng nhập</button>
          <button onClick={() => setAuthMode('register')} className={`px-3 py-1 rounded-full font-bold text-sm ${authMode === 'register' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'}`}>Đăng ký</button>
        </div>
        {authMessage && <div className="text-green-600 text-xs mb-2 text-center">{authMessage}</div>}
        {authError && <div className="text-red-500 text-xs text-center mb-2">{authError}</div>}

        {authMode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-3">
            <input name="username" required placeholder="Tên đăng nhập" className="w-full border rounded px-3 py-2" />
            <input name="password" type="password" required placeholder="Mật khẩu" className="w-full border rounded px-3 py-2" />
            <button type="submit" className="w-full bg-purple-600 text-white font-bold rounded py-2 hover:bg-purple-700 transition">Đăng nhập</button>
            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300"></div></div>
              <div className="relative flex justify-center text-sm"><span className="bg-white px-2 text-gray-500">Hoặc</span></div>
            </div>
            <a
              href="/api/auth/google"
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 transform hover:scale-[1.02] shadow-sm hover:shadow-md"
            >
              <svg className="w-5 h-5" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.42-4.55H24v8.51h12.8c-.57 5.4-4.5 9.4-9.8 9.4-6.1 0-11.05-4.95-11.05-11.05s4.95-11.05 11.05-11.05c3.45 0 6.33 1.4 8.29 3.25l6.02-6.02C36.33 3.33 30.65 0 24 0 10.75 0 0 10.75 0 24s10.75 24 24 24c13.01 0 23.4-10.08 23.4-23.45 0-.5-.04-.98-.1-1.45z"></path></svg>
              <span className="text-sm font-medium text-gray-700">Đăng nhập với Google</span>
            </a>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3">
            <input id="reg-username" name="username" required placeholder="Tên đăng nhập" className="w-full border rounded px-3 py-2" />
            <div className="flex items-center gap-2">
              <input id="reg-email" name="email" type="email" required placeholder="Email" className="w-full border rounded px-3 py-2" />
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={otpCooldown > 0}
                className="text-xs text-white font-bold rounded px-2 py-1 whitespace-nowrap bg-purple-500 hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {otpCooldown > 0 ? `Gửi lại (${otpCooldown}s)` : 'Gửi mã'}
              </button>
            </div>
            {otpSent && (
              <input name="otp" required placeholder="Mã OTP 6 số" className="w-full border rounded px-3 py-2" maxLength={6} />
            )}
            <input name="password" type="password" required placeholder="Mật khẩu" className="w-full border rounded px-3 py-2" />
            <button type="submit" className="w-full bg-purple-600 text-white font-bold rounded py-2 hover:bg-purple-700 transition">Đăng ký</button>
            <div className="relative my-3">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300"></div></div>
                <div className="relative flex justify-center text-sm"><span className="bg-white px-2 text-gray-500">Hoặc</span></div>
            </div>
            <a 
                href="/api/auth/google" 
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 transform hover:scale-[1.02] shadow-sm hover:shadow-md"
            >
                <svg className="w-5 h-5" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.42-4.55H24v8.51h12.8c-.57 5.4-4.5 9.4-9.8 9.4-6.1 0-11.05-4.95-11.05-11.05s4.95-11.05 11.05-11.05c3.45 0 6.33 1.4 8.29 3.25l6.02-6.02C36.33 3.33 30.65 0 24 0 10.75 0 0 10.75 0 24s10.75 24 24 24c13.01 0 23.4-10.08 23.4-23.45 0-.5-.04-.98-.1-1.45z"></path></svg>
                <span className="text-sm font-medium text-gray-700">Đăng ký với Google</span>
            </a>
          </form>
        )}
      </div>
    </div>
  );
}; 