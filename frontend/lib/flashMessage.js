const FLASH_KEY = 'datespark_flash';

/** Persist a one-shot message for the next Dashboard load. */
export function setFlashMessage(message) {
    if (typeof message === 'string' && message.trim()) {
        try {
            sessionStorage.setItem(FLASH_KEY, message.trim());
        } catch {
            /* ignore quota / private mode */
        }
    }
}

/** Read and remove the flash message (call once on destination mount). */
export function consumeFlashMessage() {
    try {
        const v = sessionStorage.getItem(FLASH_KEY);
        if (v) sessionStorage.removeItem(FLASH_KEY);
        return v || null;
    } catch {
        return null;
    }
}
