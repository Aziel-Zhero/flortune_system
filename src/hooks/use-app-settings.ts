"use client";
import { useAppSettings as useAppSettingsContext } from '@/contexts/app-settings-context';

export const useAppSettings = () => {
    return useAppSettingsContext();
};
