import { useLocation, Link } from 'react-router-dom';
import { Mail, RefreshCw } from 'lucide-react';

export default function EmailVerificationPending() {
  const location = useLocation();
  const email = location.state?.email || 'your email';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-primary-500/10 blur-[120px] rounded-full mix-blend-screen" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-indigo-500/10 blur-[120px] rounded-full mix-blend-screen" />
      </div>

      <div className="w-full max-w-md relative z-10 text-center">
        <div className="glass-card p-10">
          {/* Icon */}
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-tr from-primary-600/30 to-indigo-500/30 border border-primary-500/30 mb-6 mx-auto">
            <Mail className="h-10 w-10 text-primary-400" />
          </div>

          <h1 className="text-2xl font-bold text-white mb-3">Check your inbox</h1>
          <p className="text-slate-400 mb-2">
            We've sent a verification link to:
          </p>
          <p className="text-primary-400 font-semibold text-lg mb-6 break-all">{email}</p>

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 text-left mb-8 space-y-2">
            <p className="text-slate-300 text-sm font-medium">What to do next:</p>
            <ol className="text-slate-400 text-sm space-y-1.5 list-decimal list-inside">
              <li>Open your email inbox</li>
              <li>Find the email from <span className="text-slate-300">Office Activity Tracker</span></li>
              <li>Click the <span className="text-primary-400">Verify Email Address</span> button</li>
              <li>You'll be taken back here to sign in</li>
            </ol>
          </div>

          <p className="text-slate-500 text-xs mb-6 flex items-center justify-center gap-1.5">
            <RefreshCw className="h-3 w-3" />
            The link will expire in 24 hours
          </p>

          <Link
            to="/login"
            className="text-sm text-slate-400 hover:text-slate-200 transition-colors underline underline-offset-4"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
