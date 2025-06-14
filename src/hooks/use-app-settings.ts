
"use client";
import { useAppSettingsContextHook } from '@/contexts/app-settings-context';

// This hook provides an abstraction layer over the direct context hook.
export const useAppSettings = () => {
    return useAppSettingsContextHook();
};
