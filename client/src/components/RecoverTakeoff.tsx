import { useState } from 'react';
import { useLocation } from 'wouter';
import { z } from 'zod';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { OrchestrationProgress } from './OrchestrationProgress';
const payloadSchema = z.object({
  requestId: z.string(), estimateId: z.number(), trade: z.string(),
  mode: z.enum(['vision', 'text']).optional(), imageUrl: z.string().optional(), imageUrls: z.array(z.string()).optional(),
  labourRate: z.number().default(95), useTradePrice: z.boolean().default(true),
  planDescription: z.string().optional(), additionalContext: z.string().optional(), projectDetails: z.string().optional(), scopeDocUrl: z.string().optional(),
});
export function RecoverTakeoff() {
  const jobs = trpc.ai.recentJobs.useQuery(undefined, { refetchInterval: 15000 });
  const [active, setActive] = useState<z.infer<typeof payloadSchema> | null>(null);
  const [error, setError] = useState('');
  const [, navigate] = useLocation();
  const vision = trpc.ai.visionTakeoff.useMutation();
  const multi = trpc.ai.visionTakeoffMultiPage.useMutation();
  const text = trpc.ai.analyzePlan.useMutation();
  async function retry(raw: unknown) {
    setError('');
    try {
      const p = payloadSchema.parse(typeof raw === 'string' ? JSON.parse(raw) : raw);
      if (p.mode) { setActive(p); return; }
      if (p.imageUrl) await vision.mutateAsync({ ...p, imageUrl: p.imageUrl });
      else if (p.imageUrls) await multi.mutateAsync({ ...p, imageUrls: p.imageUrls });
      else await text.mutateAsync({ ...p, planDescription: p.planDescription ?? '' });
      navigate(`/estimates/${p.estimateId}`);
    } catch (error) { setError(error instanceof Error ? error.message : 'Recovery failed'); }
    void jobs.refetch();
  }
  if (!jobs.data?.length) return null;
  return <section className="mx-auto max-w-3xl p-4" aria-label="Recent scans">
    <h2 className="font-semibold">Recent scans</h2>
    <p>Interrupted scans can be retried after 30 minutes using their original submission. Your free scan reservation stays with that submission. Three attempts maximum.</p>
    {jobs.data.map(job => <div key={job.id} className="flex flex-wrap gap-3 items-center py-2">
      <span>Estimate {job.estimateId}: {job.status}, attempt {job.attempts}</span>
      {job.status === 'completed' ? <a href={`/estimates/${job.estimateId}`}>Review saved takeoff</a> :
        <Button disabled={!!active || vision.isPending || multi.isPending || text.isPending || job.attempts >= 3 || !job.payload || (job.status === 'running' && new Date(job.leaseExpiresAt) > new Date())} onClick={() => void retry(job.payload)}>Retry original scan</Button>}
    </div>)}
    {active?.mode && <OrchestrationProgress {...active} mode={active.mode} onComplete={() => navigate(`/estimates/${active.estimateId}`)} onError={message => { setError(message); setActive(null); void jobs.refetch(); }} />}
    {error && <p role="alert">{error}</p>}
  </section>;
}
