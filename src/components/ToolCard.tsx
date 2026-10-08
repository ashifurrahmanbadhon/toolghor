'use client';

import React from 'react';
import Link from 'next/link';
import { ToolItem } from '@/data/registry';
import { useApp } from '@/context/AppContext';
import * as Icons from 'lucide-react';

interface ToolCardProps {
  tool: ToolItem;
}

export default function ToolCard({ tool }: ToolCardProps) {
  const { lang } = useApp();

  // Dynamically resolve icon from lucide-react or fallback
  const IconComponent = (Icons as unknown as Record<string, React.ElementType>)[tool.icon] || Icons.Wrench;

  const title = lang === 'bn' ? tool.bn : tool.en;
  const desc = lang === 'bn' ? tool.desc : tool.descEn;

  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="group relative flex flex-col p-5 rounded-2xl bg-white dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 shadow-sm hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
    >
      {/* Background subtle glow on hover */}
      <div className="absolute top-0 right-0 -mr-8 -mt-8 w-24 h-24 rounded-full bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors pointer-events-none" />

      {/* Top Header inside Card */}
      <div className="flex items-start justify-between gap-3 mb-3.5">
        <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-sm">
          <IconComponent className="w-5 h-5" />
        </div>

        {tool.badge && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            {tool.badge}
          </span>
        )}
      </div>

      {/* Title & Description */}
      <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-1 mb-1.5">
        {title}
      </h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed flex-1">
        {desc}
      </p>

      {/* Bottom CTA Arrow */}
      <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-0.5 transition-transform">
        <span>{lang === 'bn' ? 'ব্যবহার করুন' : 'Open Tool'}</span>
        <Icons.ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
}
