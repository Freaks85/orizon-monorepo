"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function SignupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        restaurantName: '',
        email: '',
        password: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error: signUpError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        first_name: formData.firstName,
                        last_name: formData.lastName,
                        restaurant_name: formData.restaurantName,
                        role: 'manager' // Default role
                    } // Profile trigger will handle inserting into 'profiles' table using this meta_data
                }
            });

            if (signUpError) throw signUpError;

            // Redirect to dashboard
            router.push('/dashboard');

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Une erreur est survenue.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-rich-black min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Grid */}
            <div className="absolute inset-0 bg-grid-pattern opacity-20 pointer-events-none"></div>

            <div className="w-full max-w-4xl relative z-10 grid md:grid-cols-2 gap-0 border border-white/10 shadow-2xl shadow-neon-green/5 bg-black">

                {/* Left Side - Form */}
                <div className="p-8 md:p-12 border-r border-white/10">
                    <Link href="/" className="inline-flex items-center text-slate-500 hover:text-neon-green mb-8 text-xs font-bold uppercase tracking-widest transition-colors">
                        <ArrowLeft className="h-4 w-4 mr-2" /> Retour
                    </Link>

                    <h1 className="font-display text-3xl text-white uppercase mb-2">Initialisation</h1>
                    <p className="text-slate-500 text-xs font-mono uppercase tracking-widest mb-8">Création de compte • Essai 7 Jours</p>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 mb-6 rounded-sm text-xs font-mono flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSignup} className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Prénom</label>
                                <input
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleChange}
                                    type="text"
                                    required
                                    className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-neon-green transition-colors font-mono text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Nom</label>
                                <input
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleChange}
                                    type="text"
                                    required
                                    className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-neon-green transition-colors font-mono text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Nom du Restaurant</label>
                            <input
                                name="restaurantName"
                                value={formData.restaurantName}
                                onChange={handleChange}
                                type="text"
                                required
                                className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-neon-green transition-colors font-mono text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Email</label>
                            <input
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                type="email"
                                required
                                className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-neon-green transition-colors font-mono text-sm"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Mot de passe</label>
                            <input
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                type="password"
                                required
                                minLength={6}
                                className="w-full bg-white/5 border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-neon-green transition-colors font-mono text-sm"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-neon-green text-black font-bold uppercase tracking-widest py-4 hover:bg-white transition-colors text-sm mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Initialisation...' : "Démarrer l'essai gratuit"}
                        </button>

                        <p className="text-xs text-slate-600 text-center mt-4">
                            En cliquant, vous acceptez nos <a href="#" className="underline hover:text-white">CGU</a>. Pas de carte bancaire requise.
                        </p>
                    </form>
                </div>

                {/* Right Side - Benefits */}
                <div className="p-8 md:p-12 bg-white/5 flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4">
                        <ShieldCheck className="h-12 w-12 text-neon-green opacity-20" />
                    </div>

                    <h2 className="font-display text-2xl text-white uppercase mb-8">Pourquoi OrizonKitchen ?</h2>

                    <ul className="space-y-6">
                        {[
                            "7 Jours d'accès complet gratuit",
                            "Aucune carte bancaire requise",
                            "Configuration en 2 minutes",
                            "Support technique inclus",
                            "Conformité immédiate"
                        ].map((item, i) => (
                            <li key={i} className="flex items-center gap-4 text-slate-300 font-mono text-sm uppercase tracking-wider">
                                <div className="h-5 w-5 rounded-full bg-neon-green/20 flex items-center justify-center flex-shrink-0">
                                    <Check className="h-3 w-3 text-neon-green" />
                                </div>
                                {item}
                            </li>
                        ))}
                    </ul>

                    <div className="mt-12 p-6 border border-neon-green/20 bg-neon-green/5">
                        <p className="text-neon-green font-display text-lg uppercase mb-2">"Une révolution."</p>
                        <p className="text-slate-400 text-sm italic">
                            "Depuis que nous utilisons OrizonKitchen, les contrôles sanitaires sont devenus une simple formalité. L'équipe est plus sereine."
                        </p>
                        <p className="text-slate-500 text-xs font-bold uppercase mt-4">— Chef Philippe Etchebest (Fictif)</p>
                    </div>
                </div>

            </div>
        </div>
    );
}
