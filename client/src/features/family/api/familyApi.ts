import { apiClient } from '@/config/api';
import { type FamilyMember, INITIAL_FAMILY_MEMBERS } from '../types';

const FAMILY_KEY = 'meditrack_family_members';

function getStoredMembers(): FamilyMember[] {
  const stored = localStorage.getItem(FAMILY_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // parse error, fallback
    }
  }
  localStorage.setItem(FAMILY_KEY, JSON.stringify(INITIAL_FAMILY_MEMBERS));
  return INITIAL_FAMILY_MEMBERS;
}

function saveMembers(members: FamilyMember[]) {
  localStorage.setItem(FAMILY_KEY, JSON.stringify(members));
}

export const familyApi = {
  getFamilyMembers: async (): Promise<FamilyMember[]> => {
    // Attempt real API call if available
    try {
      const res = await apiClient.get<{ success: boolean; data: FamilyMember[] }>('/family-members');
      if (res.data?.data) {
        saveMembers(res.data.data);
        return res.data.data;
      }
    } catch {
      // Backend route in development, use isolated persistent mock
    }
    return getStoredMembers();
  },

  addFamilyMember: async (
    member: Omit<FamilyMember, 'id' | 'ownerId'>
  ): Promise<FamilyMember> => {
    const newMember: FamilyMember = {
      ...member,
      id: `fam_${Date.now()}`,
      ownerId: 'usr_pat_01',
    };

    try {
      const res = await apiClient.post<{ success: boolean; data: FamilyMember }>(
        '/family-members',
        member
      );
      if (res.data?.data) {
        const savedApiMember = res.data.data;
        const current = getStoredMembers();
        const updated = [...current, savedApiMember];
        saveMembers(updated);
        return savedApiMember;
      }
    } catch {
      // Backend route in development
    }

    const current = getStoredMembers();
    const updated = [...current, newMember];
    saveMembers(updated);
    return newMember;
  },

  deleteFamilyMember: async (id: string): Promise<boolean> => {
    try {
      await apiClient.delete(`/family-members/${id}`);
    } catch {
      // Backend route in development
    }

    const current = getStoredMembers();
    const updated = current.filter((m) => m.id !== id);
    saveMembers(updated);
    return true;
  },
};
