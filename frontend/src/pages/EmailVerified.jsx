import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const MESSAGES = {
  success: {
    icon: <CheckCircle className="h-16 w-16 text-emerald-400" />,
    title: 'Email Verified!',
    body: 'Your account has been activated. You can now sign in with your email and password.',
    color: 'text-emerald-400',
    border: 'border-emerald-500/30',
    bg: 'bg-emerald-500/10',
  },
  expired: {
    icon: <AlertCircle className="h-16 w-16 text-amber-400" />,
    title: 'Link Expired',
    body: 'Your verification link has expired (links are valid for 24 hours). Please sign up again to get a fresh link.',
    color: 'text-amber-400',
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/10',
  },
  invalid: {
    icon: <XCircle className="h-16 w-16 text-red-400" />,
    title: 'Invalid Link',
    body: 'This verification link is invalid or has already been used. Please sign up again if needed.',
    color: 'text-red-400',
    border: 'border-red-500/30',
    bg: 'bg-red-500/10',
  },
  error: {
    icon: <XCircle className="h-16 w-16 text-red-400" />,
    title: 'Something went wrong',
    body: 'An error occurred while verifying your email. Please try again or contact support.',
    color: 'text-red-400',
    border: 'border-red-500/30',
    bg: 'bg-red-500/10',
  },
};

export default function EmailVerified() {
  const [params] = useSearchParams();
  const success = params.get('success') === 'true';
  const reason = params.get('reason') || (success ? 'success' : 'error');

  const msgKey = success ? 'success' : reason;
  const msg = MESSAGES[msgKey] || MESSAGES.error;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-primary-500/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-indigo-500/10 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      <div className="w-full max-w-md relative z-10 text-center">
        <div className={`glass-card p-10 border ${msg.border}`}>
          <div className={`inline-flex h-24 w-24 items-center justify-center rounded-full ${msg.bg} border ${msg.border} mb-6 mx-auto`}>
            {msg.icon}
          </div>

          <h1 className={`text-2xl font-bold mb-3 ${msg.color}`}>{msg.title}</h1>
          <p className="text-slate-400 mb-8 leading-relaxed">{msg.body}</p>

          <div className="flex flex-col gap-3">
            {success ? (
              <Link
                to="/login"
                className="w-full flex justify-center items-center py-3 px-4 rounded-xl text-sm font-semibold text-white bg-primary-600 hover:bg-primary-500 transition-all shadow-lg shadow-primary-500/25"
              >
                Go to Sign In
              </Link>
            ) : (
              <>
                <Link
                  to="/signup"
                  className="w-full flex justify-center items-center py-3 px-4 rounded-xl text-sm font-semibold text-white bg-primary-600 hover:bg-primary-500 transition-all shadow-lg shadow-primary-500/25"
                >
                  Sign Up Again
                </Link>
                <Link
                  to="/login"
                  className="text-sm text-slate-400 hover:text-slate-200 transition-colors underline underline-offset-4"
                >
                  Back to Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
