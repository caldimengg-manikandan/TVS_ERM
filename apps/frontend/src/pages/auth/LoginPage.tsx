import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, LogIn, AlertCircle, Loader2 } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%230f172a' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo & Brand */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl 
                       bg-primary shadow-xl shadow-primary/20 mb-5"
          >
            <span className="text-white text-3xl font-black">T</span>
          </motion.div>
          <h1 className="text-slate-900 text-2xl font-bold mb-1">TVS Enterprise</h1>
          <p className="text-slate-500 text-sm">Resource Management System</p>
        </div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white border border-border rounded-2xl p-8 shadow-xl shadow-slate-200/50"
        >
          <h2 className="text-slate-900 text-xl font-semibold mb-6">Sign In to Your Account</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" id="login-form">
            {/* Global Error */}
            {errors.root && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="flex items-center gap-2 bg-danger/10 border border-danger/20 
                           text-danger rounded-lg px-3 py-2.5 text-sm"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {errors.root.message}
              </motion.div>
            )}

            {/* Email */}
            <div>
              <label className="block text-slate-700 text-sm font-medium mb-1.5">
                Email Address
              </label>
              <input
                {...register('email')}
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="you@tvs.com"
                className="w-full bg-white border border-border rounded-lg px-4 py-2.5
                           text-slate-900 placeholder:text-slate-400 text-sm
                           focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                           transition-all duration-150"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-danger">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-slate-700 text-sm font-medium mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full bg-white border border-border rounded-lg px-4 py-2.5 pr-10
                             text-slate-900 placeholder:text-slate-400 text-sm
                             focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
                             transition-all duration-150"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-xs text-danger">{errors.password.message}</p>
              )}
            </div>

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  {...register('rememberMe')}
                  id="remember-me"
                  type="checkbox"
                  className="w-4 h-4 rounded border-border bg-white text-primary focus:ring-primary"
                />
                <span className="text-slate-600 text-sm">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-sm text-primary hover:text-primary/80 transition-colors">
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <button
              id="login-submit"
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/50
                         text-white font-semibold py-2.5 rounded-lg text-sm
                         flex items-center justify-center gap-2
                         transition-all duration-150 shadow-md shadow-primary/20 mt-2"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Signing in...</>
              ) : (
                <><LogIn className="w-4 h-4" />Sign In</>
              )}
            </button>
          </form>

        </motion.div>

        <p className="text-center text-slate-500 text-xs mt-6">
          © {new Date().getFullYear()} TVS Group. Enterprise Resource Management System v1.0
        </p>
      </motion.div>
    </div>
  );
};

export default LoginPage;
