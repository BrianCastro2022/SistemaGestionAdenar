import { cn } from '@/lib/utils';
import { ImgHTMLAttributes } from 'react';

export default function AppLogoIcon({ className, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
    return <img src="/images/icono-full.png" alt="ADENAR" className={cn('object-contain', className)} {...props} />;
}
