import { apiClient } from '@/config/api';
import type { FamilyMember } from '../types';
interface FamilyDocument { _id: string; owner: string; name: string; relationship: string; dateOfBirth?: string; gender?: FamilyMember['gender']; phone?: string }
const map = (m: FamilyDocument): FamilyMember => ({ id: m._id, ownerId: m.owner, name: m.name, relation: m.relationship, dob: m.dateOfBirth?.slice(0, 10) ?? '', gender: m.gender ?? '', phone: m.phone });
const payload = (m: Partial<FamilyMember>) => ({ name: m.name, relationship: m.relation, dateOfBirth: m.dob, gender: m.gender, phone: m.phone || undefined });
export const familyApi = {
  getFamilyMembers: async (): Promise<FamilyMember[]> => {
    const { data } = await apiClient.get<{ data: { familyMembers: FamilyDocument[] } }>('/family-members');
    return data.data.familyMembers.map(map);
  },
  addFamilyMember: async (member: Omit<FamilyMember, 'id' | 'ownerId'>): Promise<FamilyMember> => {
    const { data } = await apiClient.post<{ data: { familyMember: FamilyDocument } }>('/family-members', payload(member));
    return map(data.data.familyMember);
  },
  updateFamilyMember: async (id: string, member: Partial<FamilyMember>): Promise<FamilyMember> => {
    const { data } = await apiClient.patch<{ data: { familyMember: FamilyDocument } }>(`/family-members/${encodeURIComponent(id)}`, payload(member));
    return map(data.data.familyMember);
  },
  deleteFamilyMember: async (id: string): Promise<boolean> => {
    await apiClient.delete(`/family-members/${encodeURIComponent(id)}`); return true;
  },
};
