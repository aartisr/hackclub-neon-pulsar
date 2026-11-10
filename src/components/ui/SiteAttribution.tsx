import { cn } from '../../lib/ui/cn';

export function SiteAttribution({ className }: { className?: string }) {
  return (
    <footer className={cn('mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-mono-code text-white/50', className)}>
      <div>
        Engineered by{' '}
        <a href="https://pcssiirobotics.org" target="_blank" rel="noopener noreferrer" className="font-bold text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors">
          PCSS II Robotics Team
        </a>
      </div>
      <div>
        Author:{' '}
        <a href="https://ai-aarti.com" target="_blank" rel="noopener noreferrer" className="font-bold text-magenta-400 hover:text-magenta-300 underline underline-offset-2 transition-colors">
          Aarti S Ravikumar
        </a>
      </div>
    </footer>
  );
}
