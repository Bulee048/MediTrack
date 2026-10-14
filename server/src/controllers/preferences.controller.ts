import { asyncHandler } from '../utils/asyncHandler.js';
import { PreferencesService } from '../services/preferences.service.js';
export const getPreferences = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { preferences: await PreferencesService.get(req.user!.id) } });
});
export const updatePreferences = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { preferences: await PreferencesService.update(req.user!.id, req.body) } });
});
