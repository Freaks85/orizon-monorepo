"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ArrowLeft, AlertCircle, Eye, EyeOff, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email: formData.email,
                password: formData.password
            });

            if (signInError) throw signInError;

            router.push('/dashboard');
        } catch (err: any) {
            console.error(err);
            if (err.message && err.message.includes('Email not confirmed')) {
                setError('Veuillez confirmer votre email avant de vous connecter.');
            } else if (err.message && err.message.includes('Invalid login credentials')) {
                setError('Email ou mot de passe incorrect.');
            } else {
                setError(err.message || 'Une erreur est survenue.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-rich-black min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none"></div>

            <div className="w-full max-w-md relative z-10">
                <Link href="/" className="inline-flex items-center text-slate-500 hover:text-neon-green mb-8 text-xs font-bold uppercase tracking-widest transition-colors">
                    <ArrowLeft className="h-4 w-4 mr-2" /> Retour
                </Link>

                <div className="bg-black border border-white/10 p-8 md:p-12 shadow-2xl shadow-neon-green/5">
                    <div className="flex justify-center mb-8">
                        <div className="border border-neon-green/30 p-2">
                            <ShieldCheck className="h-8 w-8 text-neon-green" />
                        </div>
                    </div>

                    <h1 className="font-display text-3xl text-center text-white uppercase mb-2">Identification</h1>
                    <p className="text-center text-slate-500 text-xs font-mono uppercase tracking-widest mb-8">Accès Sécurisé Command Center</p>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 mb-6 rounded-sm text-xs font-mono flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Email</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-neon-green transition-colors font-mono text-sm"
                                placeholder="chef@restaurant.com"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between mb-2">
                                <label htmlFor="password" className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Mot de passe</label>
                                <a href="#" className="text-xs text-neon-green hover:text-white transition-colors">Oublié ?</a>
                            </div>
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 pr-12 focus:outline-none focus:border-neon-green transition-colors font-mono text-sm"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onMouseDown={() => setShowPassword(true)}
                                    onMouseUp={() => setShowPassword(false)}
                                    onMouseLeave={() => setShowPassword(false)}
                                    onTouchStart={() => setShowPassword(true)}
                                    onTouchEnd={() => setShowPassword(false)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-neon-green transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <div
                            className="flex items-center cursor-pointer group"
                            onClick={() => setRememberMe(!rememberMe)}
                        >
                            <div className={`w-5 h-5 border flex items-center justify-center transition-all ${
                                rememberMe
                                    ? 'bg-neon-green border-neon-green'
                                    : 'bg-white/5 border-white/10 group-hover:border-neon-green/50'
                            }`}>
                                {rememberMe && <Check className="h-3.5 w-3.5 text-black stroke-[3]" />}
                            </div>
                            <span className="ml-3 text-sm text-slate-400 group-hover:text-slate-300 transition-colors select-none">
                                Se souvenir de moi
                            </span>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-neon-green text-black font-bold uppercase tracking-widest py-4 hover:bg-white transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Connexion...' : 'Connexion'}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-slate-500 text-sm">
                            Pas encore de compte ?{' '}
                            <Link href="/signup" className="text-neon-green hover:text-white font-bold transition-colors">
                                Initialiser l'accès
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
