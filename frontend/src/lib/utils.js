/**
 * File: utils.js
 * Project: CrisisMap – Multi-Disaster Tracker
 *
 * Purpose:
 * --------
 * Provides helper utility functions for the CrisisMap frontend.
 *
 * Responsibilities:
 * - Encapsulates common logic that can be reused across components.
 * - Keeps the main components (App, Map, UI elements) cleaner.
 * - Improves maintainability and consistency.
 *
 * Notes:
 * - Functions here should remain stateless and reusable.
 * - Imported where lightweight helpers are needed (formatting, validation, etc.).
 */


import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
