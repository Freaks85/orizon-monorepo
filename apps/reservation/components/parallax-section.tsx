"use client";

import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, ReactNode } from 'react';

interface ParallaxWrapperProps {
    children: ReactNode;
    className?: string;
    speed?: number; // How much the content moves (default 100)
}

// Wrapper that makes content inside float up as you scroll
export function ParallaxWrapper({
    children,
    className = "",
    speed = 100
}: ParallaxWrapperProps) {
    const ref = useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"]
    });

    // Content moves UP as we scroll down
    const y = useTransform(scrollYProgress, [0, 1], [speed, -speed]);

    return (
        <div ref={ref} className={className}>
            <motion.div style={{ y }}>
                {children}
            </motion.div>
        </div>
    );
}
