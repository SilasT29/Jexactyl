const STORAGE_KEY = 'privacy_mode';

const readBoolean = (value: string | null): boolean => {
    if (value === null) {
        return false;
    }

    return value === 'true' || value === '1';
};

export const isPrivacyModeEnabled = (): boolean => {
    if (typeof window === 'undefined') {
        return false;
    }

    return readBoolean(localStorage.getItem(STORAGE_KEY));
};

export const setPrivacyModeEnabled = (enabled: boolean): void => {
    if (typeof window === 'undefined') {
        return;
    }

    localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
    // Dispatch a storage event for same-tab listeners.
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, newValue: enabled ? 'true' : 'false' }));
};

export const maskEmail = (email: string): string => {
    const [localPart, domain] = email.split('@');

    if (!domain || localPart === undefined) {
        return email.length > 1 ? `${email.charAt(0)}***` : email;
    }

    const maskedLocal = localPart.length > 0 ? `${localPart.charAt(0)}***` : '***';
    const [domainName, ...tlds] = domain.split('.');
    const maskedDomain = domainName && domainName.length > 0 ? `${domainName.charAt(0)}***` : '***';
    const tldPart = tlds.length > 0 ? `.${tlds.join('.')}` : '';

    return `${maskedLocal}@${maskedDomain}${tldPart}`;
};

export const maskIP = (ip: string): string => {
    const parts = ip.split('.');

    if (parts.length !== 4 || parts.some(part => Number.isNaN(Number(part)))) {
        return ip.length > 1 ? `${ip.charAt(0)}***` : ip;
    }

    return `${parts[0]}.***.***.${parts[3]}`;
};

export const maybeText = (text: string): string => {
    return isPrivacyModeEnabled() ? '***' : text;
};
