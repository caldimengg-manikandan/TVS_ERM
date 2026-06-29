import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home } from 'lucide-react';

const ForgotPasswordPage: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary to-slate-800 flex items-center justify-center p-4">
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 w-full max-w-md text-center">
      <h1 className="text-white text-2xl font-bold mb-2">Forgot Password</h1>
      <p className="text-slate-400 text-sm mb-6">Password reset functionality coming soon. Contact your admin for assistance.</p>
      <Link to="/login" className="inline-flex items-center gap-2 text-accent hover:text-blue-300 text-sm transition-colors">
        <Home className="w-4 h-4" /> Back to Login
      </Link>
    </div>
  </div>
);

export default ForgotPasswordPage;
