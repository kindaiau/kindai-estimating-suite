import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
export function VerifyAccountEmail() {
  const [code, setCode] = useState('');
  const utils = trpc.useUtils();
  const request = trpc.emailVerification.request.useMutation();
  const confirm = trpc.emailVerification.confirm.useMutation({ onSuccess: () => utils.auth.me.invalidate() });
  return <section className="mx-auto max-w-xl p-4" aria-label="Verify account email">
    <p>Verify your account email to use your lifetime free drawing-sheet scan.</p>
    <Button onClick={() => request.mutate()} disabled={request.isPending}>Email verification code</Button>
    {request.isSuccess && <p role="status">Check your account email for an eight-digit code.</p>}
    <form onSubmit={event => { event.preventDefault(); confirm.mutate({ code }); }}>
      <label htmlFor="verification-code">Verification code</label>
      <input id="verification-code" className="border p-3" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={event => setCode(event.target.value)} maxLength={8} />
      <Button disabled={confirm.isPending || !/^\d{8}$/.test(code)}>Verify email</Button>
    </form>
    {(request.error || confirm.error) && <p role="alert">{(request.error || confirm.error)?.message}</p>}
  </section>;
}
