import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CheckCircle, XCircle, AlertCircle, Loader } from 'lucide-react';

export default function EmailVerified() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading | success | error

  useEffect(() => {
    const success = params.get('success') === 'true';
    const token = params.get('token');
    const userRaw = params.get('user');

    if (success && token && userRaw) {
      try {
        const user = JSON.parse(decodeURIComponent(userRaw));
        // Store credentials — user is now logged in
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        setStatus('success');
        // Redirect to dashboard after a short celebratory pause
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 2000);
      } catch (e) {
        setStatus('error');
      }
    } else if (success) {
      // Already verified, maybe token missing — just go to login
      setStatus('already');
    } else {
      setStatus(params.get('reason') || 'error');
    }
  }, []);

  const content = {
    loading: {
      icon: <Loader className="h-14 w-14 text-primary-400 animate-spin" />,
      title: 'Verifying...',
      body: 'Please wait while we confirm your email.',
      iconBg: 'bg-primary-500/10 border-primary-500/30',
      titleColor: 'text-white',
    },
    success: {
      icon: <CheckCircle className="h-14 w-14 text-emerald-400" />,
      title: '🎉 Email Verified!',
      body: 'Your account is active. Logging you in now...',
      iconBg: 'bg-emerald-500/10 border-emerald-500/30',
      titleColor: 'text-emerald-400',
      extra: (
        <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
          <Loader className="h-4 w-4 animate-spin" />
          Redirecting to your dashboard...
        </div>
      ),
    },
    already: {
      icon: <CheckCircle className="h-14 w-14 text-emerald-400" />,
      title: 'Already Verified',
      body: 'Your email is already verified. Sign in with your credentials.',
      iconBg: 'bg-emerald-500/10 border-emerald-500/30',
      titleColor: 'text-emerald-400',
      cta: { to: '/login', label: 'Go to Sign In' },
    },
    expired: {
      icon: <AlertCircle className="h-14 w-14 text-amber-400" />,
      title: 'Link Expired',
      body: 'This link has expired (valid for 24 hours). Please sign up again to get a new link.',
      iconBg: 'bg-amber-500/10 border-amber-500/30',
      titleColor: 'text-amber-400',
      cta: { to: '/signup', label: 'Sign Up Again' },
    },
    invalid: {
      icon: <XCircle className="h-14 w-14 text-red-400" />,
      title: 'Invalid Link',
      body: 'This verification link is invalid or has already been used.',
      iconBg: 'bg-red-500/10 border-red-500/30',
      titleColor: 'text-red-400',
      cta: { to: '/signup', label: 'Sign Up Again' },
    },
    error: {
      icon: <XCircle className="h-14 w-14 text-red-400" />,
      title: 'Something went wrong',
      body: 'An error occurred while verifying your email. Please try again.',
      iconBg: 'bg-red-500/10 border-red-500/30',
      titleColor: 'text-red-400',
      cta: { to: '/signup', label: 'Try Again' },
    },
  };

  const msg = content[status] || content.error;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-primary-500/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-indigo-500/10 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      <div className="w-full max-w-md relative z-10 text-center">
        <div className="glass-card p-10">
          <div className={`inline-flex h-24 w-24 items-center justify-center rounded-full border ${msg.iconBg} mb-6 mx-auto`}>
            {msg.icon}
          </div>

          <h1 className={`text-2xl font-bold mb-3 ${msg.titleColor}`}>{msg.title}</h1>
          <p className="text-slate-400 mb-6 leading-relaxed">{msg.body}</p>

          {msg.extra && <div className="mb-6">{msg.extra}</div>}

          {msg.cta && (
            <div className="flex flex-col gap-3">
              <Link
                to={msg.cta.to}
                className="w-full flex justify-center items-center py-3 px-4 rounded-xl text-sm font-semibold text-white bg-primary-600 hover:bg-primary-500 transition-all shadow-lg shadow-primary-500/25"
              >
                {msg.cta.label}
              </Link>
              <Link
                to="/login"
                className="text-sm text-slate-400 hover:text-slate-200 transition-colors underline underline-offset-4"
              >
                Back to Sign In
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
