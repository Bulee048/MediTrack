/**
 * Database — administrator-only browser for what the app has stored.
 *
 * Lets an administrator confirm that what they typed actually reached MongoDB
 * without opening a terminal: pick a collection on the left, read the documents
 * on the right, search them, or empty a collection that was only a test.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Database,
  Download,
  HardDrive,
  RefreshCw,
  Search,
  Trash2,
  TriangleAlert,
  WifiOff,
} from 'lucide-react';
import { StaffPageHeader } from '@/components/StaffShell';
import { Badge, Button, Card, CardBody, EmptyState, Input, LoadingScreen, Modal } from '@/components/ui';
import { api } from '@/lib/api';
import { useToast } from '@/lib/store';
import { cn } from '@/lib/utils';

interface CollectionInfo {
  name: string;
  label: string;
  count: number;
}

interface CollectionsResponse {
  data: CollectionInfo[];
  mode: 'mongo' | 'memory';
  persistent: boolean;
  database: string;
  uri: string;
}

const PAGE_SIZE = 25;

/** Columns worth showing as a table; everything else falls back to JSON. */
const NICE_COLUMNS = [
  'patientName',
  'name',
  'token',
  'status',
  'staffId',
  'staffRole',
  'phone',
  'email',
  'specialty',
  'department',
  'departmentName',
  'date',
  'time',
  'amount',
  'checkedInAt',
  'createdAt',
];

type Row = Record<string, unknown>;

export default function DatabaseBrowser() {
  const toast = useToast();
  const [meta, setMeta] = useState<CollectionsResponse | null>(null);
  const [selected, setSelected] = useState<string>('');
  const [rows, setRows] = useState<Row[]>([]);
  const [page, setPage] = useState(0);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingRows, setLoadingRows] = useState(false);
  const [error, setError] = useState('');
  const [emptying, setEmptying] = useState<CollectionInfo | null>(null);
  const [busy, setBusy] = useState(false);

  const loadMeta = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.staff.database();
      setMeta(res);
      setError('');
      setSelected((current) => current || res.data[0]?.name || '');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMeta();
  }, [loadMeta]);

  const loadRows = useCallback(async () => {
    if (!selected) return;
    setLoadingRows(true);
    try {
      const res = await api.staff.databaseCollection(selected, page * PAGE_SIZE, PAGE_SIZE);
      setRows(res.data);
      setError('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingRows(false);
    }
  }, [selected, page]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const info = useMemo(() => meta?.data.find((c) => c.name === selected), [meta, selected]);

  /** Client-side filter across the current page — enough to spot a record. */
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q));
  }, [rows, query]);

  const columns = useMemo(() => {
    const found = NICE_COLUMNS.filter((c) => rows.some((r) => r[c] !== undefined)).slice(0, 5);
    return found.length > 0 ? found : Object.keys(rows[0] ?? {}).slice(0, 5);
  }, [rows]);

  const total = info?.count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const confirmEmpty = async () => {
    if (!emptying) return;
    setBusy(true);
    try {
      const res = await api.staff.clearCollection(emptying.name);
      toast.push({ tone: 'success', title: res.message });
      setEmptying(null);
      setPage(0);
      await Promise.all([loadMeta(), loadRows()]);
    } catch (err) {
      toast.push({ tone: 'error', title: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const download = () => {
    const blob = new Blob([JSON.stringify(visible, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `medqueue-${selected}-page${page + 1}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <LoadingScreen label="Connecting to the database…" />;

  if (error && !meta) {
    return (
      <Card>
        <CardBody>
          <EmptyState icon={<WifiOff size={30} />} title="Cannot read the database" description={error} />
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      <StaffPageHeader
        title="Database"
        description="Everything the app has stored, so you can confirm your entries really were saved."
        actions={
          <>
            <Button variant="outline" onClick={() => void loadMeta()}>
              <RefreshCw size={16} className={loadingRows ? 'animate-spin' : ''} /> Refresh
            </Button>
            <Button variant="outline" disabled={visible.length === 0} onClick={download}>
              <Download size={16} /> Export page
            </Button>
          </>
        }
      />

      {/* ----------------------------- connection ---------------------------- */}
      <Card className="mb-5">
        <CardBody className="flex flex-wrap items-center gap-x-6 gap-y-3 py-4">
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                'grid h-9 w-9 place-items-center rounded-xl',
                meta?.persistent ? 'bg-success-soft text-success' : 'bg-warn-soft text-warn-600',
              )}
            >
              <HardDrive size={17} />
            </span>
            <div>
              <p className={cn('text-[13.5px] font-bold', meta?.persistent ? 'text-success' : 'text-warn-700')}>
                {meta?.persistent ? 'MongoDB connected' : 'Running without a database — nothing is being saved'}
              </p>
              <p className="text-[11.5px] text-ink-muted">
                database <span className="font-bold text-ink-soft">{meta?.database}</span>
              </p>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-wide text-ink-faint">Connection</p>
            <p className="truncate font-mono text-[12px] text-ink-muted">{meta?.uri}</p>
          </div>

          <Badge tone="neutral">{meta?.mode}</Badge>
        </CardBody>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[250px_1fr]">
        {/* ------------------------------ sidebar ----------------------------- */}
        <Card className="h-fit">
          <CardBody>
            <p className="mb-2.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-ink-faint">
              Collections
            </p>
            <div className="max-h-[540px] space-y-0.5 overflow-y-auto">
              {meta?.data.map((c) => (
                <button
                  key={c.name}
                  onClick={() => {
                    setSelected(c.name);
                    setPage(0);
                    setQuery('');
                  }}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left transition',
                    selected === c.name ? 'bg-brand-50 text-brand-700' : 'text-ink-soft hover:bg-canvas',
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-bold">{c.label}</span>
                    <span className="block truncate font-mono text-[10.5px] text-ink-faint">{c.name}</span>
                  </span>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2 py-0.5 text-[11px] font-extrabold tabular-nums',
                      selected === c.name ? 'bg-brand-600 text-white' : 'bg-canvas text-ink-muted',
                    )}
                  >
                    {c.count}
                  </span>
                </button>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* ------------------------------ documents ---------------------------- */}
        <Card className="min-w-0">
          <CardBody>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-[14px] font-extrabold text-ink">{info?.label ?? 'Documents'}</h3>
                <p className="mt-0.5 text-[12px] text-ink-muted">
                  {total.toLocaleString()} document{total === 1 ? '' : 's'}
                  {total > PAGE_SIZE && (
                    <>
                      {' '}
                      · page {page + 1} of {pages}
                    </>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search this page…"
                  className="h-9 w-[190px] rounded-full pl-9"
                  icon={<Search size={15} />}
                />
                {info && info.count > 0 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-danger-600"
                    onClick={() => setEmptying(info)}
                  >
                    <Trash2 size={14} /> Empty
                  </Button>
                )}
              </div>
            </div>

            {loadingRows ? (
              <div className="mt-6 flex items-center justify-center gap-2 py-10 text-[13px] text-ink-muted">
                <RefreshCw size={16} className="animate-spin" /> Loading documents…
              </div>
            ) : visible.length === 0 ? (
              <EmptyState
                icon={<Database size={28} />}
                title={query ? 'Nothing matches your search' : 'This collection is empty'}
                description={
                  query
                    ? 'Try a different word, or clear the search to see the whole page.'
                    : 'Nothing has been written here yet.'
                }
              />
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr>
                      {columns.map((c) => (
                        <th
                          key={c}
                          className="whitespace-nowrap border-b border-line pb-2 pr-4 text-[11px] font-extrabold uppercase tracking-wide text-ink-faint"
                        >
                          {c}
                        </th>
                      ))}
                      <th className="border-b border-line pb-2 text-[11px] font-extrabold uppercase tracking-wide text-ink-faint">
                        All fields
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((r) => (
                      <tr key={String(r.id)} className="border-b border-line/70 align-top last:border-0">
                        {columns.map((c) => (
                          <td key={c} className="py-2.5 pr-4 text-[12.5px] text-ink-soft">
                            {format(r[c])}
                          </td>
                        ))}
                        <td className="py-2.5">
                          <details className="group">
                            <summary className="cursor-pointer list-none text-[12px] font-bold text-brand-600 hover:underline">
                              view JSON
                            </summary>
                            <pre className="mt-2 max-h-72 max-w-xl overflow-auto rounded-xl bg-canvas p-3 text-[11px] leading-relaxed text-ink-soft">
                              {JSON.stringify(r, null, 2)}
                            </pre>
                          </details>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {pages > 1 && (
              <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                  <ChevronLeft size={15} /> Previous
                </Button>
                <span className="text-[12px] font-semibold text-ink-muted">
                  {page + 1} / {pages}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page + 1 >= pages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next <ChevronRight size={15} />
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* ----------------------------- empty modal ---------------------------- */}
      <Modal
        open={emptying !== null}
        onClose={() => setEmptying(null)}
        title="Empty this collection"
        subtitle={emptying ? `Delete every document in ${emptying.label}.` : undefined}
        footer={
          <>
            <Button variant="outline" onClick={() => setEmptying(null)}>
              Cancel
            </Button>
            <Button variant="danger" loading={busy} onClick={() => void confirmEmpty()}>
              Delete {emptying?.count} document{emptying?.count === 1 ? '' : 's'}
            </Button>
          </>
        }
      >
        <p className="text-[13px] leading-relaxed text-ink-soft">
          This cannot be undone. It is meant for cleaning up test data you created while trying the app.
        </p>
        {emptying && ['doctors', 'departments', 'hospitals'].includes(emptying.name) && (
          <p className="mt-3 flex items-start gap-2 rounded-xl bg-warn-soft px-3.5 py-3 text-[12px] leading-relaxed text-warn-700">
            <TriangleAlert size={15} className="mt-0.5 shrink-0" />
            <span>
              <span className="font-bold">{emptying.label}</span> holds the hospital catalogue. Emptying it will leave the
              app with nothing for patients to book. Run <span className="font-bold">npm run db:reset</span> to bring the
              demo hospital back.
            </span>
          </p>
        )}
      </Modal>
    </>
  );
}

/** Renders a cell: booleans and nulls read better than their raw text. */
function format(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'yes' : 'no';
  if (Array.isArray(value)) return value.length ? value.join(', ') : '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
