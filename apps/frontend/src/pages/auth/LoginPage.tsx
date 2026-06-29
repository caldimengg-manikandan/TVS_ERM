import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, LogIn, AlertCircle, Loader2, Shield } from 'lucide-react';
import { z } from 'zod';
import { authApi } from '../../services/api';
import { loginStart, loginSuccess, loginFailure } from '../../store/slices/authSlice';
import { toast } from 'sonner';

const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().default(false),
});

type LoginForm = z.infer<typeof LoginSchema>;

const LoginPage: React.FC = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<LoginForm>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  const onSubmit = async (data: LoginForm) => {
    dispatch(loginStart());
    try {
      const response = await authApi.login(data as { email: string; password: string; rememberMe: boolean });
      const { user, tokens } = response.data.data;
      dispatch(loginSuccess({
        user,
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
      }));
      toast.success(`Welcome back, ${user.firstName}!`);
      navigate('/dashboard');
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed. Please check your credentials.';
      dispatch(loginFailure(message));
      setError('root', { message });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-primary to-slate-800 
                    flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl 
                       bg-accent shadow-xl shadow-accent/30 mb-5"
          >
            <span className="text-white text-3xl font-black">T</span>
          </motion.div>
          <h1 className="text-white text-2xl font-bold mb-1">TVS Enterprise</h1>
          <p className="text-slate-400 text-sm">Resource Management System</p>
        </div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl"
        >
          <h2 className="text-white text-xl font-semibold mb-6">Sign In to Your Account</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" id="login-form">
            {/* Global Error */}
            {errors.root && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center gap-2 bg-danger/20 border border-danger/40 
                           text-red-200 rounded-lg px-3 py-2.5 text-sm"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {errors.root.message}
              </motion.div>
            )}

            {/* Email */}
            <div>
              <label className="block text-slate-200 text-sm font-medium mb-1.5">
                Email Address
              </label>
              <input
                {...register('email')}
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="you@tvs.com"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5
                           text-white placeholder:text-slate-500 text-sm
                           focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50
                           transition-all duration-150"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-300">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-slate-200 text-sm font-medium mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2.5 pr-10
                             text-white placeholder:text-slate-500 text-sm
                             focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50
                             transition-all duration-150"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-red-300">{errors.password.message}</p>
              )}
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  {...register('rememberMe')}
                  id="remember-me"
                  type="checkbox"
                  className="w-4 h-4 rounded border-white/20 bg-white/10 text-accent"
                />
                <span className="text-slate-300 text-sm">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-accent hover:text-blue-300 transition-colors">
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-accent hover:bg-accent/90 disabled:bg-accent/50
                         text-white font-semibold py-2.5 rounded-lg text-sm
                         flex items-center justify-center gap-2
                         transition-all duration-150 shadow-lg shadow-accent/30"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Signing in...</>
              ) : (
                <><LogIn className="w-4 h-4" />Sign In</>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 border-t border-white/10 pt-5">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-3">
              <Shield className="w-3.5 h-3.5" />
              <span className="font-medium">Demo Credentials</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Admin', email: 'admin@tvs.com', pw: 'TVS@Admin2024!' },
                { label: 'Project Mgr', email: 'pm@tvs.com', pw: 'TVS@PM2024!' },
                { label: 'Team Lead', email: 'teamlead@tvs.com', pw: 'TVS@TL2024!' },
                { label: 'Employee', email: 'employee@tvs.com', pw: 'TVS@Emp2024!' },
              ].map(cred => (
                <button
                  key={cred.label}
                  type="button"
                  onClick={() => {
                    const emailField = document.getElementById('login-email') as HTMLInputElement;
                    const pwField = document.getElementById('login-password') as HTMLInputElement;
                    if (emailField) emailField.value = cred.email;
                    if (pwField) pwField.value = cred.pw;
                  }}
                  className="text-left bg-white/5 hover:bg-white/10 border border-white/10 
                             rounded-lg px-3 py-2 transition-all duration-150"
                >
                  <div className="text-slate-200 text-xs font-medium">{cred.label}</div>
                  <div className="text-slate-500 text-2xs truncate">{cred.email}</div>
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        <p className="text-center text-slate-600 text-xs mt-6">
          © {new Date().getFullYear()} TVS Group. Enterprise Resource Management System v1.0
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
