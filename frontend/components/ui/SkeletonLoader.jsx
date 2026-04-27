import React from 'react';
import { motion } from 'framer-motion';

const Skeleton = ({ className }) => (
    <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />
);

export const ConceptSkeleton = () => (
    <div className="space-y-4 w-full">
        {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 rounded-2xl border border-gray-100 bg-white space-y-3">
                <Skeleton className="h-6 w-3/4 bg-gray-100" />
                <Skeleton className="h-4 w-full bg-gray-50" />
                <Skeleton className="h-4 w-5/6 bg-gray-50" />
            </div>
        ))}
    </div>
);

export const ItinerarySkeleton = () => (
    <div className="w-full space-y-12 pl-4">
        {[1, 2, 3].map((i) => (
            <div key={i} className="relative pl-8 border-l-2 border-dashed border-gray-100">
                <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-gray-200 border-4 border-white" />
                <div className="space-y-3">
                    <Skeleton className="h-4 w-24 bg-gray-100" />
                    <Skeleton className="h-8 w-64 bg-gray-100" />
                    <Skeleton className="h-20 w-full bg-gray-50" />
                    <div className="flex gap-2">
                        <Skeleton className="h-8 w-24 bg-gray-50" />
                        <Skeleton className="h-8 w-24 bg-gray-50" />
                    </div>
                </div>
            </div>
        ))}
    </div>
);

export const MapOverlaySkeleton = () => (
    <div className="p-4 bg-white/80 backdrop-blur-md rounded-2xl border border-white shadow-xl min-w-[240px] space-y-3">
        <div className="flex items-center gap-3">
            <Skeleton className="w-6 h-6 rounded-full bg-gray-200" />
            <Skeleton className="h-4 w-20 bg-gray-100" />
        </div>
        <Skeleton className="h-6 w-32 bg-gray-100" />
        <Skeleton className="h-3 w-40 bg-gray-50" />
        <div className="flex gap-2 mt-4">
            <Skeleton className="h-8 w-20 bg-gray-100" />
            <Skeleton className="h-8 w-20 bg-gray-100" />
        </div>
    </div>
);
