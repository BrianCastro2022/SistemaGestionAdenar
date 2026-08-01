import { useInView } from '@/hooks/use-in-view';
import { useEffect, useState } from 'react';

interface CountUpProps {
    end: number;
    duration?: number;
    prefix?: string;
    suffix?: string;
}

export function CountUp({ end, duration = 1400, prefix = '', suffix = '' }: CountUpProps) {
    const { ref, isInView } = useInView<HTMLSpanElement>();
    const [value, setValue] = useState(0);

    useEffect(() => {
        if (!isInView) return;

        let frame: number;
        let start: number | null = null;

        const step = (timestamp: number) => {
            if (start === null) start = timestamp;
            const progress = Math.min((timestamp - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(eased * end));
            if (progress < 1) frame = requestAnimationFrame(step);
        };

        frame = requestAnimationFrame(step);
        return () => cancelAnimationFrame(frame);
    }, [isInView, end, duration]);

    return (
        <span ref={ref}>
            {prefix}
            {value}
            {suffix}
        </span>
    );
}
