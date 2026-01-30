"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarRange, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                if (error.message.includes('Email not confirmed')) {
                    setError('Veuillez confirmer votre email avant de vous connecter.');
                } else {
                    setError('Email ou mot de passe incorrect.');
                }
                return;
            }

            router.push('/dashboard/cahier');
        } catch (err) {
            setError('Une erreur est survenue. Veuillez réessayer.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <div className="border border-[#ff6b00]/30 p-2 bg-[#ff6b00]/5 rounded-xl">
                            <CalendarRange className="h-8 w-8 text-[#ff6b00]" />
                        </div>
                    </div>
                    <h1 className="font-display text-2xl font-bold tracking-widest text-white uppercase">
                        Orizons<span className="text-[#ff6b00]">Reservation</span>
                    </h1>
                    <p className="text-slate-500 text-sm font-mono mt-2">
                        Connectez-vous à votre espace
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg"
                        >
                            <p className="text-red-400 text-sm font-mono">{error}</p>
                        </motion.div>
                    )}

                    <div>
                        <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                            Email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/50 focus:border-[#ff6b00]/50 font-mono text-sm"
                                placeholder="votre@email.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">
                            Mot de passe
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-12 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#ff6b00]/50 focus:border-[#ff6b00]/50 font-mono text-sm"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#ff6b00] text-black font-bold text-xs uppercase tracking-widest py-4 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                        ) : (
                            'Se connecter'
                        )}
                    </button>
                </form>

                {/* Footer */}
                <p className="text-center text-slate-500 text-sm font-mono mt-6">
                    Pas encore de compte ?{' '}
                    <Link href="/signup" className="text-[#ff6b00] hover:underline">
                        Créer un compte
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}
