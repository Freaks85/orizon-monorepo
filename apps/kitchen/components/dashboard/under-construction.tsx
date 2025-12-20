import React from 'react';
import { Construction } from 'lucide-react';

export default function UnderConstruction({ title }: { title: string }) {
    return (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center p-8 bg-[#0a0a0a] border border-white/10 rounded-sm">
            <div className="h-16 w-16 bg-[#00ff9d]/5 border border-[#00ff9d]/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <Construction className="h-8 w-8 text-[#00ff9d]" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white uppercase tracking-wider mb-2">{title}</h1>
            <p className="font-mono text-sm text-slate-500 max-w-md">
                Ce module est en cours d'activation. L'interface de commande sera bientôt disponible.
            </p>
        </div>
    );
}
