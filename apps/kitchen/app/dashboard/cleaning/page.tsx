"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { SprayCan, Check, AlertTriangle, Search, Clock, ChevronRight } from 'lucide-react';
import { useEmployee } from '@/contexts/employee-context';
import { useRestaurant } from '@/contexts/restaurant-context';
import { useAlertWorkflow } from '@/contexts/alert-workflow-context';

interface CleaningArea {
    id: string;
    name: string;
    is_active: boolean;
}

interface CleaningPost {
    id: string;
    area_id: string;
    name: string;
    cleaning_frequency: 'daily' | 'weekly' | 'monthly' | 'on_demand';
    is_active: boolean;
}

interface CleaningRecord {
    id: string;
    post_id: string;
    is_clean: boolean;
    created_at: string;
}

const FREQUENCY_LABELS: Record<string, string> = {
    daily: 'Quotidien',
    weekly: 'Hebdomadaire',
    monthly: 'Mensuel',
    on_demand: 'Sur demande'
};

const FREQUENCY_COLORS: Record<string, string> = {
    daily: 'bg-blue-500/20 text-blue-400',
    weekly: 'bg-purple-500/20 text-purple-400',
    monthly: 'bg-orange-500/20 text-orange-400',
    on_demand: 'bg-slate-500/20 text-slate-400'
};

export default function CleaningPage() {
    const searchParams = useSearchParams();
    const { activeEmployee } = useEmployee();
    const { restaurant } = useRestaurant();
    const { isWorkflowActive, currentAlert, getTargetForPage, markCurrentAsResolved, workflowKey, isTransitioning } = useAlertWorkflow();

    const [areas, setAreas] = useState<CleaningArea[]>([]);
    const [posts, setPosts] = useState<CleaningPost[]>([]);
    const [records, setRecords] = useState<CleaningRecord[]>([]);
    const [loading, setLoading] = useState(true);

    const [selectedArea, setSelectedArea] = useState<string | null>(null);
    const [selectedPost, setSelectedPost] = useState<CleaningPost | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Form state
    const [isClean, setIsClean] = useState<boolean | null>(null);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Track which workflow key we've handled
    const [handledWorkflowKey, setHandledWorkflowKey] = useState<number | null>(null);

    // Check if a post needs cleaning based on its frequency
    const checkIfCleaningNeeded = useCallback((post: CleaningPost, currentRecords: CleaningRecord[]): boolean => {
        if (post.cleaning_frequency === 'on_demand') return false;

        const postRecords = currentRecords.filter(r => r.post_id === post.id);
        if (postRecords.length === 0) return true;

        const lastRecord = postRecords[0]; // Already sorted by created_at desc
        const lastRecordDate = new Date(lastRecord.created_at);
        const now = new Date();

        switch (post.cleaning_frequency) {
            case 'daily':
                return lastRecordDate.toDateString() !== now.toDateString();
            case 'weekly':
                const weekAgo = new Date(now);
                weekAgo.setDate(weekAgo.getDate() - 7);
                return lastRecordDate < weekAgo;
            case 'monthly':
                const monthAgo = new Date(now);
                monthAgo.setDate(monthAgo.getDate() - 30);
                return lastRecordDate < monthAgo;
            default:
                return false;
        }
    }, []);

    useEffect(() => {
        if (restaurant?.id) {
            fetchData();
        }
    }, [restaurant?.id]);

    // Handle workflow target selection - triggers when workflowKey changes
    useEffect(() => {
        // Wait for data to load and avoid handling same workflow key twice
        if (loading || posts.length === 0 || isTransitioning) return;
        if (handledWorkflowKey === workflowKey) return;

        // Get target from workflow context
        const workflowTarget = getTargetForPage('cleaning');

        // Also check URL params
        const postIdFromUrl = searchParams.get('post');
        const targetPostId = postIdFromUrl || workflowTarget?.targetId;
        const targetAreaId = workflowTarget?.areaId;

        if (targetPostId) {
            const targetPost = posts.find(p => p.id === targetPostId);
            if (targetPost) {
                // Check if this post still needs cleaning
                const stillNeedsCleaning = checkIfCleaningNeeded(targetPost, records);

                if (!stillNeedsCleaning && isWorkflowActive) {
                    // Post already done, skip to next alert automatically
                    setHandledWorkflowKey(workflowKey);
                    setTimeout(() => markCurrentAsResolved(), 100);
                    return;
                }

                // Select the area first
                setSelectedArea(targetPost.area_id);
                // Then select the post with pre-selection "Propre" in workflow mode
                setTimeout(() => {
                    setSelectedPost(targetPost);
                    // Pre-select "Propre" (true) when in workflow mode for faster validation
                    setIsClean(isWorkflowActive ? true : null);
                    setComment('');

                    // Scroll to post if needed
                    const postElement = document.getElementById(`post-${targetPost.id}`);
                    if (postElement) {
                        postElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }, 150);

                setHandledWorkflowKey(workflowKey);
            }
        } else if (targetAreaId && areas.length > 0) {
            const targetArea = areas.find(a => a.id === targetAreaId);
            if (targetArea) {
                setSelectedArea(targetArea.id);
                setHandledWorkflowKey(workflowKey);
            }
        }
    }, [loading, posts, areas, records, searchParams, getTargetForPage, isWorkflowActive, markCurrentAsResolved, checkIfCleaningNeeded, workflowKey, handledWorkflowKey, isTransitioning]);

    const fetchData = async () => {
        if (!restaurant?.id) return;
        setLoading(true);

        try {
            // Fetch areas
            const { data: areasData } = await supabase
                .from('cleaning_areas')
                .select('*')
                .eq('restaurant_id', restaurant.id)
                .eq('is_active', true)
                .order('name');

            // Fetch posts
            const { data: postsData } = await supabase
                .from('cleaning_posts')
                .select('*')
                .eq('restaurant_id', restaurant.id)
                .eq('is_active', true)
                .order('name');

            // Fetch today's records for daily, last 7 days for weekly, last 30 for monthly
            const today = new Date();
            const thirtyDaysAgo = new Date(today);
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const { data: recordsData } = await supabase
                .from('cleaning_records')
                .select('id, post_id, is_clean, created_at')
                .eq('restaurant_id', restaurant.id)
                .gte('created_at', thirtyDaysAgo.toISOString())
                .order('created_at', { ascending: false });

            setAreas(areasData || []);
            setPosts(postsData || []);
            setRecords(recordsData || []);

            // Auto-select first area if available and no workflow target
            if (areasData && areasData.length > 0 && !selectedArea) {
                setSelectedArea(areasData[0].id);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Wrapper for the callback to use current records
    const isCleaningNeeded = (post: CleaningPost): boolean => {
        return checkIfCleaningNeeded(post, records);
    };

    // Check if post is done today
    const isDoneToday = (post: CleaningPost): boolean => {
        const today = new Date().toDateString();
        return records.some(r =>
            r.post_id === post.id &&
            new Date(r.created_at).toDateString() === today
        );
    };

    // Count pending posts per area
    const getPendingCount = (areaId: string): number => {
        return posts
            .filter(p => p.area_id === areaId)
            .filter(p => isCleaningNeeded(p))
            .length;
    };

    // Get filtered posts for selected area
    const filteredPosts = posts
        .filter(p => p.area_id === selectedArea)
        .filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

    // Handle submit
    const handleSubmit = async () => {
        if (!selectedPost || isClean === null || !restaurant?.id || isTransitioning) return;

        setSubmitting(true);
        try {
            const { data: newRecord, error } = await supabase.from('cleaning_records').insert({
                restaurant_id: restaurant.id,
                employee_id: activeEmployee?.id || null,
                area_id: selectedPost.area_id,
                post_id: selectedPost.id,
                action_type: 'cleaning_and_disinfection',
                is_clean: isClean,
                comment: comment || null
            }).select('id, post_id, is_clean, created_at').single();

            if (error) throw error;

            // Instant update: add new record to local state immediately
            if (newRecord) {
                setRecords(prev => [newRecord, ...prev]);
            }

            // If in workflow mode, mark alert as resolved and move to next
            if (isWorkflowActive && currentAlert?.type === 'cleaning') {
                // Reset form first
                setSelectedPost(null);
                setIsClean(null);
                setComment('');
                // Then trigger next alert
                setTimeout(() => markCurrentAsResolved(), 50);
            } else {
                // Reset form
                setSelectedPost(null);
                setIsClean(null);
                setComment('');
            }
        } catch (error) {
            console.error('Error saving record:', error);
            alert('Erreur lors de l\'enregistrement');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-slate-500 font-mono animate-pulse">Chargement...</div>
            </div>
        );
    }

    if (areas.length === 0) {
        return (
            <div className="max-w-4xl mx-auto">
                <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-3">
                    <SprayCan className="h-6 w-6 sm:h-8 sm:w-8 text-[#00ff9d]" />
                    Nettoyage
                </h1>
                <div className="bg-[#0a0a0a] border border-white/10 p-8 sm:p-12 rounded-sm text-center">
                    <SprayCan className="h-12 w-12 text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-500 font-mono text-sm mb-2">Aucune zone de nettoyage configurée</p>
                    <p className="text-slate-600 font-mono text-xs">Configurez vos zones dans l'onglet "Gérer"</p>
                </div>
            </div>
        );
    }

    // Check if we're targeting a specific post from workflow
    const isTargetPost = (postId: string) => {
        if (!isWorkflowActive) return false;
        const target = getTargetForPage('cleaning');
        return target?.targetId === postId;
    };

    return (
        <div className="max-w-6xl mx-auto">
            {/* Workflow indicator */}
            {isWorkflowActive && currentAlert?.type === 'cleaning' && (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-sm p-4 mb-6 flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0" />
                    <div className="flex-1">
                        <p className="text-sm font-bold text-orange-500">{currentAlert.title}</p>
                        <p className="text-xs text-slate-400">{currentAlert.message}</p>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-white uppercase tracking-wider flex items-center gap-3">
                        <SprayCan className="h-6 w-6 sm:h-8 sm:w-8 text-[#00ff9d]" />
                        Nettoyage
                    </h1>
                    <p className="text-slate-500 text-xs font-mono mt-1">Enregistrez vos opérations de nettoyage HACCP</p>
                </div>
            </div>

            {/* Zone Selector */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
                {areas.map(area => {
                    const pendingCount = getPendingCount(area.id);
                    return (
                        <button
                            key={area.id}
                            onClick={() => {
                                setSelectedArea(area.id);
                                setSelectedPost(null);
                            }}
                            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-sm font-bold uppercase text-xs tracking-widest transition-all ${
                                selectedArea === area.id
                                    ? 'bg-[#00ff9d] text-black shadow-[0_0_20px_rgba(0,255,157,0.3)]'
                                    : 'bg-[#0a0a0a] border border-white/10 text-slate-400 hover:text-white'
                            }`}
                        >
                            {area.name}
                            {pendingCount > 0 && (
                                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                    selectedArea === area.id
                                        ? 'bg-black/20 text-black'
                                        : 'bg-red-500 text-white'
                                }`}>
                                    {pendingCount}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Posts List */}
                <div className="bg-[#0a0a0a] border border-white/10 p-4 sm:p-6 rounded-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest">Postes</h3>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Rechercher..."
                                className="pl-9 pr-3 py-1.5 bg-white/5 border border-white/10 text-white text-xs font-mono rounded-sm focus:outline-none focus:border-[#00ff9d] w-40"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {filteredPosts.length === 0 ? (
                            <p className="col-span-full text-slate-500 text-xs font-mono text-center py-8">
                                Aucun poste dans cette zone
                            </p>
                        ) : filteredPosts.map(post => {
                            const needsCleaning = isCleaningNeeded(post);
                            const doneToday = isDoneToday(post);
                            const isSelected = selectedPost?.id === post.id;
                            const isTarget = isTargetPost(post.id);

                            return (
                                <button
                                    key={post.id}
                                    id={`post-${post.id}`}
                                    onClick={() => {
                                        setSelectedPost(post);
                                        setIsClean(null);
                                        setComment('');
                                    }}
                                    className={`relative p-3 rounded-sm text-left transition-all ${
                                        isSelected
                                            ? 'bg-[#00ff9d]/20 border-2 border-[#00ff9d]'
                                            : isTarget
                                                ? 'bg-orange-500/20 border-2 border-orange-500 animate-pulse'
                                                : doneToday
                                                    ? 'bg-green-500/10 border border-green-500/30 hover:border-green-500/50'
                                                    : needsCleaning
                                                        ? 'bg-red-500/10 border border-red-500/30 hover:border-red-500/50'
                                                        : 'bg-white/5 border border-white/10 hover:border-white/20'
                                    }`}
                                >
                                    {/* Status Icon */}
                                    <div className={`absolute top-2 right-2 h-5 w-5 rounded-full flex items-center justify-center ${
                                        doneToday
                                            ? 'bg-green-500 text-black'
                                            : needsCleaning
                                                ? 'bg-red-500 text-white'
                                                : 'bg-slate-600 text-white'
                                    }`}>
                                        {doneToday ? (
                                            <Check className="h-3 w-3" />
                                        ) : needsCleaning ? (
                                            <AlertTriangle className="h-3 w-3" />
                                        ) : (
                                            <Clock className="h-3 w-3" />
                                        )}
                                    </div>

                                    <p className="text-white text-sm font-medium pr-6 mb-2">{post.name}</p>
                                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-sm ${FREQUENCY_COLORS[post.cleaning_frequency]}`}>
                                        {FREQUENCY_LABELS[post.cleaning_frequency]}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Recording Form */}
                <div className="bg-[#0a0a0a] border border-white/10 p-4 sm:p-6 rounded-sm">
                    {selectedPost ? (
                        <>
                            <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 flex items-center gap-2">
                                <ChevronRight className="h-4 w-4 text-[#00ff9d]" />
                                {selectedPost.name}
                            </h3>

                            <div className="space-y-6">
                                {/* Cleanliness Status */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                                        État du poste
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setIsClean(true)}
                                            className={`flex items-center justify-center gap-2 p-4 rounded-sm font-bold uppercase text-sm transition-all ${
                                                isClean === true
                                                    ? 'bg-green-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.4)]'
                                                    : 'bg-green-500/10 text-green-500 border border-green-500/30 hover:border-green-500'
                                            }`}
                                        >
                                            <Check className="h-5 w-5" />
                                            Propre
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setIsClean(false)}
                                            className={`flex items-center justify-center gap-2 p-4 rounded-sm font-bold uppercase text-sm transition-all ${
                                                isClean === false
                                                    ? 'bg-orange-500 text-black shadow-[0_0_20px_rgba(249,115,22,0.4)]'
                                                    : 'bg-orange-500/10 text-orange-500 border border-orange-500/30 hover:border-orange-500'
                                            }`}
                                        >
                                            <AlertTriangle className="h-5 w-5" />
                                            À nettoyer
                                        </button>
                                    </div>
                                </div>

                                {/* Comment */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
                                        Commentaire (optionnel)
                                    </label>
                                    <textarea
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        rows={3}
                                        className="w-full bg-white/5 border border-white/10 text-white px-3 py-2 text-sm font-mono rounded-sm focus:outline-none focus:border-[#00ff9d] resize-none"
                                        placeholder="Observations, remarques..."
                                    />
                                </div>

                                {/* Submit */}
                                <button
                                    onClick={handleSubmit}
                                    disabled={isClean === null || submitting}
                                    className="w-full flex items-center justify-center gap-2 bg-[#00ff9d] hover:bg-white text-black px-4 py-3 rounded-sm transition-colors text-sm font-bold uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <SprayCan className="h-4 w-4" />
                                    {submitting ? 'Enregistrement...' : isWorkflowActive ? 'Valider et continuer' : 'Enregistrer le nettoyage'}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <SprayCan className="h-12 w-12 text-slate-600 mb-4" />
                            <p className="text-slate-500 font-mono text-sm mb-1">Sélectionnez un poste</p>
                            <p className="text-slate-600 font-mono text-xs">pour enregistrer le nettoyage</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
