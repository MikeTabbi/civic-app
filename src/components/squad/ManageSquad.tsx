import { useState } from 'react';

import { Button, Card, Notice, T, TextField } from '@/components/ui';
import { confirm } from '@/lib/confirm';
import { leaveSquad, resetInviteCode, updateSquad, type Squad } from '@/lib/squads';
import { useSquads } from '@/state/SquadProvider';
import { GoalEndPicker } from './SquadForms';

/** Owner: rename, change goal, reset the code. Everyone: leave. Member removal lives on the member list. */
export function ManageSquad({ squad }: { squad: Squad }) {
  const { refresh } = useSquads();
  const owner = squad.role === 'owner';
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(squad.name);
  const [goal, setGoal] = useState(squad.goal ?? '');
  const [ends, setEnds] = useState(squad.goalEnds);
  const [busy, setBusy] = useState<'save' | 'reset' | 'leave' | null>(null);
  const [message, setMessage] = useState<{ tone: 'good' | 'warn'; text: string } | null>(null);

  const run = async (kind: 'save' | 'reset' | 'leave', fn: () => Promise<{ ok: boolean; message?: string }>, done: string) => {
    setBusy(kind);
    setMessage(null);
    const res = await fn();
    setBusy(null);
    if (!res.ok) {
      setMessage({ tone: 'warn', text: res.message ?? 'Something went wrong.' });
      return false;
    }
    setMessage({ tone: 'good', text: done });
    await refresh();
    return true;
  };

  const startEdit = () => {
    setName(squad.name);
    setGoal(squad.goal ?? '');
    setEnds(squad.goalEnds);
    setEditing(true);
  };

  const save = () =>
    run('save', () => updateSquad(squad.id, name.trim(), goal.trim() || null, ends), 'Saved.').then((ok) => ok && setEditing(false));

  const reset = async () => {
    const ok = await confirm('Reset invite code?', 'The old code and link stop working right away. Members already in the squad stay.', 'Reset code');
    if (ok) run('reset', () => resetInviteCode(squad.id), 'New code ready. Share it again to invite people.');
  };

  const leave = async () => {
    const note = owner
      ? squad.members > 1
        ? 'Whoever has been in the squad longest becomes the owner.'
        : "You're the only member, so the squad will be deleted."
      : 'You can rejoin later with a code.';
    const ok = await confirm(`Leave ${squad.name}?`, note, 'Leave', true);
    if (ok) run('leave', () => leaveSquad(squad.id), 'You left the squad.');
  };

  return (
    <Card>
      <T variant="heading">{owner ? 'Manage squad' : 'Squad settings'}</T>
      {owner && editing ? (
        <>
          <TextField label="Squad name" value={name} onChangeText={setName} maxLength={40} />
          <TextField label="Goal (optional)" value={goal} onChangeText={setGoal} placeholder="Everyone has a voting plan" maxLength={120} />
          <GoalEndPicker value={ends} onChange={setEnds} />
          <Button label="Save" onPress={save} loading={busy === 'save'} disabled={!name.trim()} />
          <Button label="Cancel" kind="quiet" onPress={() => setEditing(false)} />
        </>
      ) : owner ? (
        <>
          <Button label="Edit name and goal" kind="quiet" icon="create-outline" onPress={startEdit} />
          <Button label="Reset invite code" kind="quiet" icon="refresh" onPress={reset} loading={busy === 'reset'} />
        </>
      ) : null}
      {message ? <Notice tone={message.tone}><T variant="caption">{message.text}</T></Notice> : null}
      <Button label="Leave squad" kind="quiet" icon="exit-outline" onPress={leave} loading={busy === 'leave'} />
    </Card>
  );
}
