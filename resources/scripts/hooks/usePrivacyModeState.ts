import { useEffect, useState } from 'react';
import { isPrivacyModeEnabled, setPrivacyModeEnabled } from '@/hooks/usePrivacyMode';

interface PrivacyModeState {
    enabled: boolean;
    setEnabled: (enabled: boolean) => void;
}

export const usePrivacyModeState = (): PrivacyModeState => {
    const [enabled, setEnabledState] = useState(() => isPrivacyModeEnabled());

    useEffect(() => {
        const handleStorage = (event: StorageEvent) => {
            if (event.key === 'privacy_mode') {
                setEnabledState(isPrivacyModeEnabled());
            }
        };

        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    const setEnabled = (value: boolean) => {
        setPrivacyModeEnabled(value);
        setEnabledState(value);
    };

    return { enabled, setEnabled };
};

export default usePrivacyModeState;
