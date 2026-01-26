import { useState, useEffect, useCallback, useRef } from 'react';

interface TabViolation {
    type: 'tab_switch' | 'focus_loss' | 'visibility_hidden';
    timestamp: Date;
    duration?: number; // How long they were away (ms)
}

interface UseTabDetectionOptions {
    enabled?: boolean;
    maxWarnings?: number;
    onViolation?: (violation: TabViolation, totalViolations: number) => void;
    onMaxViolationsReached?: () => void;
}

interface UseTabDetectionReturn {
    violations: TabViolation[];
    violationCount: number;
    isPageVisible: boolean;
    isWindowFocused: boolean;
    warningMessage: string | null;
    clearWarning: () => void;
}

export const useTabDetection = (options: UseTabDetectionOptions = {}): UseTabDetectionReturn => {
    const {
        enabled = true,
        maxWarnings = 5,
        onViolation,
        onMaxViolationsReached
    } = options;

    const [violations, setViolations] = useState<TabViolation[]>([]);
    const [isPageVisible, setIsPageVisible] = useState(!document.hidden);
    const [isWindowFocused, setIsWindowFocused] = useState(document.hasFocus());
    const [warningMessage, setWarningMessage] = useState<string | null>(null);

    const hiddenTimestamp = useRef<number | null>(null);
    const lastViolationTime = useRef<number>(0);
    const violationCountRef = useRef<number>(0);

    // Debounce time - ignore multiple events within this window (2 seconds)
    const DEBOUNCE_MS = 2000;
    // Minimum time away before counting as violation (1 second)
    const MIN_AWAY_TIME_MS = 1000;

    const addViolation = useCallback((type: TabViolation['type'], duration?: number) => {
        if (!enabled) return;

        // Debounce: ignore if violation was recorded recently
        const now = Date.now();
        if (now - lastViolationTime.current < DEBOUNCE_MS) {
            return;
        }
        lastViolationTime.current = now;

        const violation: TabViolation = {
            type,
            timestamp: new Date(),
            duration
        };

        violationCountRef.current += 1;
        const count = violationCountRef.current;

        setViolations(prev => [...prev, violation]);

        // Show warning
        const message = `Warning: Tab switch detected! (${count}/${maxWarnings})`;
        setWarningMessage(message);

        // Auto-clear warning after 5 seconds
        setTimeout(() => setWarningMessage(null), 5000);

        // Callback to send to server
        if (onViolation) {
            onViolation(violation, count);
        }

        // Check max violations
        if (count >= maxWarnings && onMaxViolationsReached) {
            onMaxViolationsReached();
        }
    }, [enabled, maxWarnings, onViolation, onMaxViolationsReached]);

    // Only track visibility change (most reliable for tab switches)
    // This fires when user actually switches to another tab/window
    useEffect(() => {
        if (!enabled) return;

        const handleVisibilityChange = () => {
            const isVisible = !document.hidden;
            setIsPageVisible(isVisible);

            if (!isVisible) {
                // Page hidden - record timestamp
                hiddenTimestamp.current = Date.now();
            } else if (hiddenTimestamp.current) {
                // Page visible again - calculate duration
                const duration = Date.now() - hiddenTimestamp.current;
                // Only count if away for more than MIN_AWAY_TIME_MS
                if (duration > MIN_AWAY_TIME_MS) {
                    addViolation('tab_switch', duration);
                }
                hiddenTimestamp.current = null;
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [enabled, addViolation]);

    // Track focus state but DON'T count as separate violation
    // (visibility change already covers this)
    useEffect(() => {
        if (!enabled) return;

        const handleFocus = () => setIsWindowFocused(true);
        const handleBlur = () => setIsWindowFocused(false);

        window.addEventListener('focus', handleFocus);
        window.addEventListener('blur', handleBlur);

        return () => {
            window.removeEventListener('focus', handleFocus);
            window.removeEventListener('blur', handleBlur);
        };
    }, [enabled]);

    const clearWarning = useCallback(() => {
        setWarningMessage(null);
    }, []);

    return {
        violations,
        violationCount: violationCountRef.current,
        isPageVisible,
        isWindowFocused,
        warningMessage,
        clearWarning
    };
};

export default useTabDetection;
