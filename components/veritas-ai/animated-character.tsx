import { cn } from '@/lib/utils';

export function AnimatedCharacter({ className, animationDirection = 'normal' }: { className?: string, animationDirection?: 'normal' | 'reverse' }) {
  const animationName = `blob-spin-${animationDirection === 'normal' ? 'normal' : 'reverse'}`;
  const style = {
    animation: `${animationName} 20s linear infinite`,
  };

  return (
    <>
      <style>
        {`
          @keyframes blob-spin-normal {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes blob-spin-reverse {
            0% { transform: rotate(360deg); }
            100% { transform: rotate(0deg); }
          }
        `}
      </style>
      <div className={cn("relative", className)} style={style}>
        <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent rounded-full filter blur-3xl opacity-50 animate-pulse"></div>
        <svg
          className="relative w-full h-full"
          viewBox="0 0 200 200"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: 'hsl(var(--accent))', stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          <path
            fill="url(#gradient)"
            d="M45.8,-56.3C58.9,-47,69,-31,73.5,-13.7C78,3.6,76.9,22.2,68.2,37.3C59.5,52.4,43.2,64,25.9,71.5C8.7,79,-9.6,82.3,-26.3,77.9C-43,73.5,-58.1,61.3,-67.2,46.1C-76.4,30.9,-79.6,12.7,-76.3,-4.2C-73,-21.1,-63.2,-36.7,-50.2,-46.8C-37.2,-56.9,-21,-61.5,-4.4,-59.4C12.1,-57.2,22.7,-48.3,33.4,-40.4C40.1,-35.6,45.8,-56.3,45.8,-56.3"
            transform="translate(100 100) scale(1.2)"
          />
        </svg>
      </div>
    </>
  );
}
