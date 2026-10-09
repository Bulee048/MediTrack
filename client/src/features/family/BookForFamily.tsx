import { useBookingPatient } from './context/BookingPatientContext';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CirclePlus, Pencil, Trash2, UserCheck, Users } from 'lucide-react';
import { toast } from 'sonner';
import { FeaturePageContent } from '@/components/FeaturePageContent';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { AlertDialog } from '@/components/ui/alert-dialog';
import { familyApi } from './api/familyApi';
import type { FamilyMember } from './types';
import { RELATIONS } from './types';
import { age, initials } from '@/lib/formatters';
import { cn } from '@/lib/utils';

const AVATAR_TONES = [
  'bg-brand-100 text-brand-700',
  'bg-danger-soft text-danger-600',
  'bg-info-soft text-info',
  'bg-warn-soft text-warn',
  'bg-violet-soft text-violet',
];

export default function BookForFamily() {
  const navigate = useNavigate();
  const { selectPatient } = useBookingPatient();
  const [editingId, setEditingId] = useState<string | null>(null);

  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<FamilyMember | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [form, setForm] = useState({
    name: '',
    relation: '',
    dob: '',
    gender: 'Other',
    phone: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    familyApi.getFamilyMembers().then(setMembers).catch((e) => setError((e as Error).message)).finally(() => setLoading(false));
  }, []);

  const pick = (m: FamilyMember) => {
    setSelectedId(m.id);
    setAdding(false);
  };

  const bookForSelf = () => {
    setSelectedId(null);
    setAdding(false);
  };

  const saveNew = async () => {
    const e: Record<string, string> = {};
    if (form.name.trim().length < 2) e.name = 'Enter the full name';
    if (!form.relation) e.relation = 'Select a relation';
    if (!form.dob) e.dob = 'Enter date of birth';
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setSaving(true);
    try {
      const input = {
        name: form.name.trim(),
        relation: form.relation,
        dob: form.dob,
        gender: (form.gender || 'Other') as FamilyMember['gender'],
        phone: form.phone || undefined,
      };
      const created = editingId ? await familyApi.updateFamilyMember(editingId, input) : await familyApi.addFamilyMember(input);
      setMembers((prev) => editingId ? prev.map(m => m.id === editingId ? created : m) : [...prev, created]);
      setSelectedId(created.id);
      setAdding(false); setEditingId(null);
      setForm({ name: '', relation: '', dob: '', gender: 'Other', phone: '', notes: '' });
      toast.success(editingId ? 'Family member updated' : 'Family member added', {
        description: `${created.name} is saved and selected for booking.`,
      });
    } catch (err) {
      toast.error((err as Error).message || 'Could not save family member');
    } finally {
      setSaving(false);
    }
  };

  const requestDelete = (e: React.MouseEvent, member: FamilyMember) => {
    e.stopPropagation();
    setMemberToDelete(member);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!memberToDelete) return;
    try {
      await familyApi.deleteFamilyMember(memberToDelete.id);
      setMembers((prev) => prev.filter((m) => m.id !== memberToDelete.id));
      if (selectedId === memberToDelete.id) {
        setSelectedId(null);
      }
      toast.success('Family member removed', {
        description: `${memberToDelete.name} has been removed from your list.`,
      });
    } catch (err) {
      toast.error((err as Error).message || 'Failed to remove family member');
    } finally {
      setMemberToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  const continueBook = () => {
    const selected = members.find(m => m.id === selectedId);
    selectPatient(selected ? { id: selected.id, name: selected.name } : null);
    navigate('/app/doctors');
  };

  return (
    <FeaturePageContent title="Book for Someone Else" back>
      {loading && <p role="status">Loading family members…</p>}
      {error && <p role="alert" className="mb-4 rounded-xl bg-danger-soft p-4 text-sm">{error}</p>}
      {/* Banner highlighting family booking ease */}
      <div className="flex items-start gap-3 rounded-2xl bg-brand-50 p-4 border border-brand-200">
        <Users className="h-5 w-5 text-brand-700 shrink-0 mt-0.5" />
        <p className="text-[13px] leading-relaxed text-brand-900 font-medium">
          Select a family member to book their OPD appointment, or register a new member below.
        </p>
      </div>

      <p className="mt-6 label">Saved Family Members</p>
      <div className="mt-3 space-y-3">
        {/* Book for Myself Card */}
        <button
          type="button"
          onClick={bookForSelf}
          className={cn(
            'flex w-full items-center gap-3.5 rounded-2xl border-2 bg-white p-4 text-left transition min-h-0',
            selectedId === null && !adding
              ? 'border-brand-600 shadow-card bg-brand-50/20'
              : 'border-line hover:border-brand-200'
          )}
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-50 text-[13px] font-extrabold text-brand-700 border border-brand-200">
            ME
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14.5px] font-extrabold text-ink">Myself</span>
            <span className="block text-[12px] text-ink-muted">Use my own patient profile</span>
          </span>
          <Radio checked={selectedId === null && !adding} />
        </button>

        {/* Saved Members */}
        {members.map((m, i) => (
          <div
            key={m.id}
            className={cn(
              'group flex w-full items-center gap-3.5 rounded-2xl border-2 bg-white p-4 text-left transition cursor-pointer min-h-0',
              selectedId === m.id
                ? 'border-brand-600 shadow-card bg-brand-50/20'
                : 'border-line hover:border-brand-200'
            )}
          >
            <button type="button" onClick={() => pick(m)} aria-label={`Select ${m.name} for booking`}
              aria-pressed={selectedId === m.id} className="flex min-w-0 flex-1 items-center gap-2 text-left">
            <span
              className={cn(
                'grid h-11 w-11 shrink-0 place-items-center rounded-full text-[13px] font-extrabold',
                AVATAR_TONES[i % AVATAR_TONES.length]
              )}
            >
              {initials(m.name)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[14.5px] font-extrabold text-ink truncate">{m.name}</span>
              <span className="block text-[12px] text-ink-muted">
                {m.relation} · {m.dob ? `${age(m.dob)} Yrs` : 'DOB not provided'} {m.gender ? `(${m.gender})` : ''}
              </span>
            </span>

            </button>
            <button type="button" aria-label={`Edit ${m.name}`} className="shrink-0 rounded-lg p-2 text-brand-700"
              onClick={() => { setEditingId(m.id); setAdding(true); setForm({ name: m.name, relation: m.relation, dob: m.dob, gender: m.gender, phone: m.phone ?? '', notes: '' }); }}>
              <Pencil size={16} />
            </button>
            {/* Remove member button with confirmation trigger */}
            <button
              type="button"
              onClick={(e) => requestDelete(e, m)}
              title="Remove family member"
              aria-label={`Remove ${m.name}`}
              className="p-1.5 text-slate-400 hover:text-danger-600 hover:bg-danger-soft rounded-lg transition min-h-0"
            >
              <Trash2 size={16} />
            </button>

          </div>
        ))}
      </div>

      {/* Clearly visible Add Family Member button */}
      <button
        type="button"
        onClick={() => {
          setEditingId(null); setForm({ name: '', relation: '', dob: '', gender: 'Other', phone: '', notes: '' });
          setAdding(!adding);
          setSelectedId(null);
        }}
        className="mt-4 flex items-center gap-2 text-[13.5px] font-bold text-brand-600 hover:text-brand-700 min-h-0"
      >
        <CirclePlus size={18} />
        <span>{adding ? 'Close Add Form' : 'Add Family Member'}</span>
      </button>

      {/* Add Family Member Form */}
      {adding && (
        <div className="mt-4 rounded-2xl border border-line bg-white p-5 shadow-card animate-in fade-in">
          <p className="mb-4 text-[14px] font-extrabold text-ink">{editingId ? 'Edit Family Member Details' : 'New Family Member Details'}</p>

          <div>
            <label htmlFor="family-full-name" className="mb-1.5 block text-[13px] font-semibold text-ink">Full Name</label>
            <Input id="family-full-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Enter family member's full name"
              className={errors.name ? 'border-danger' : ''}
            />
            {errors.name && <p className="mt-1 text-xs text-danger-600">{errors.name}</p>}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="family-relation" className="mb-1.5 block text-[13px] font-semibold text-ink">Relation</label>
              <Select id="family-relation"
                value={form.relation}
                onChange={(e) => setForm({ ...form, relation: e.target.value })}
                className={errors.relation ? 'border-danger' : ''}
              >
                <option value="">Select Relation</option>
                {RELATIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </Select>
              {errors.relation && <p className="mt-1 text-xs text-danger-600">{errors.relation}</p>}
            </div>

            <div>
              <label htmlFor="family-date-of-birth" className="mb-1.5 block text-[13px] font-semibold text-ink">Date of Birth</label>
              <Input id="family-date-of-birth"
                type="date"
                value={form.dob}
                onChange={(e) => setForm({ ...form, dob: e.target.value })}
                className={errors.dob ? 'border-danger' : ''}
              />
              {errors.dob && <p className="mt-1 text-xs text-danger-600">{errors.dob}</p>}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="family-gender" className="mb-1.5 block text-[13px] font-semibold text-ink">Gender</label>
              <Select id="family-gender"
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </Select>
            </div>
            <div>
              <label htmlFor="family-phone-optional" className="mb-1.5 block text-[13px] font-semibold text-ink">Phone (Optional)</label>
              <Input id="family-phone-optional"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+94 7X XXX XXXX"
              />
            </div>
          </div>

          <Button
            size="lg"
            className="mt-5 w-full bg-brand-600 text-white hover:bg-brand-700 font-bold"
            disabled={saving}
            onClick={saveNew}
          >
            {saving ? 'Saving...' : 'Save Family Member'}
          </Button>
        </div>
      )}

      {/* Continue to Book */}
      <div className="mt-7">
        <Button
          size="lg"
          className="w-full bg-brand-600 text-white hover:bg-brand-700 font-bold"
          disabled={loading || Boolean(error) || adding}
          onClick={continueBook}
        >
          <UserCheck size={18} className="mr-2" />
          Continue to Book
        </Button>
      </div>

      {/* Confirmation AlertDialog for removing a family member */}
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Remove Family Member"
        description={`Are you sure you want to remove ${memberToDelete?.name || 'this member'} (${memberToDelete?.relation || 'relative'}) from your saved family members? This cannot be undone.`}
        confirmText="Yes, Remove Member"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={confirmDelete}
      />
    </FeaturePageContent>
  );
}

function Radio({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        'grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition',
        checked ? 'border-brand-600' : 'border-slate-300'
      )}
    >
      {checked && <span className="h-2.5 w-2.5 rounded-full bg-brand-600" />}
    </span>
  );
}
