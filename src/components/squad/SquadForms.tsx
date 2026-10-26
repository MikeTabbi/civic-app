import { useState } from 'react';

import { Button, Card, Chip, Notice, Row, T, TextField } from '@/components/ui';
import { generalElection2026 as E } from '@/data/delaware';
import { createSquad, joinSquad } from '@/lib/squads';
import { formatDay } from '@/lib/votingPlan';
import { useSquads } from '@/state/SquadProvider';

const today = () => new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD, local

/** Goal end dates people actually aim for, plus whatever the squad already has. */
export function GoalEndPicker({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  const options = [
    { date: E.absenteeApplicationDue, label: 'Absentee deadline' },
    { date: E.earlyVotingEnd, label: 'Early voting ends' },
    { date: E.date, label: 'Election Day' },
  ].filter((o) => o.date >= today());
  if (value && !options.some((o) => o.date === value)) options.unshift({ date: value, label: 'Current' });
  return (
    <>
      <T variant="label">Goal ends</T>
      <Row gap={8} style={{ flexWrap: 'wrap' }}>
        {options.map((o) => (
          <Chip key={o.date} label={`${o.label}, ${formatDay(o.date)}`} active={value === o.date} onPress={() => onChange(o.date)} />
        ))}
        <Chip label="No end date" active={!value} onPress={() => onChange(null)} />
      </Row>
    </>
  );
}

export function CreateSquadCard({ onDone }: { onDone: () => void }) {
  const { refresh, setActive } = useSquads();
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [ends, setEnds] = useState<string | null>(E.date >= today() ? E.date : null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trimmed = name.trim();

  const create = async () => {
    setBusy(true);
    setError(null);
    const res = await createSquad(trimmed, goal.trim() || null, ends);
    setBusy(false);
    if (!res.ok) return setError(res.message);
    setActive(res.data);
    await refresh();
    onDone();
  };

  return (
    <Card>
      <T variant="heading">Create a squad</T>
      <TextField label="Squad name" value={name} onChangeText={setName} placeholder="Floor 3 voters" maxLength={40} />
      <TextField
        label="Goal (optional)"
        value={goal}
        onChangeText={setGoal}
        placeholder="Everyone has a voting plan"
        maxLength={120}
      />
      <GoalEndPicker value={ends} onChange={setEnds} />
      {error ? <Notice tone="warn"><T variant="caption">{error}</T></Notice> : null}
      <Button label="Create squad" onPress={create} loading={busy} disabled={!trimmed} />
    </Card>
  );
}

export function JoinSquadCard({ onDone }: { onDone: () => void }) {
  const { refresh, setActive, pendingCode, setPendingCode } = useSquads();
  const [code, setCode] = useState(pendingCode ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const clean = code.replace(/[^A-Za-z0-9]/g, '').toUpperCase();

  const join = async () => {
    setBusy(true);
    setError(null);
    const res = await joinSquad(clean);
    setBusy(false);
    if (!res.ok) return setError(res.message);
    setPendingCode(null);
    setActive(res.data);
    await refresh();
    onDone();
  };

  return (
    <Card>
      <T variant="heading">Join with a code</T>
      <TextField
        label="Invite code"
        value={code}
        onChangeText={setCode}
        placeholder="ABCDE-FGHJK"
        autoCapitalize="characters"
        autoCorrect={false}
        error={error}
        hint="Ask a squad member for their code or link."
      />
      <Button label="Join squad" kind="dark" onPress={join} loading={busy} disabled={clean.length < 8} />
    </Card>
  );
}
