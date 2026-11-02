// The engine settles petitions at the end of a turn. Queue state is derived
// from the existing schedule, so saves need no second set of approval records.
export function memorialAssignments(s) {
  const assigned = new Map();
  for (const [slot, action] of Object.entries(s?.schedule || {})) {
    if (!action || !['上朝', '批折'].includes(action.kind)) continue;
    for (const id of action.memorials || [])
      assigned.set(id, {slot, action, decision:action.decisions?.[id] || action.decision || 'approve'});
  }
  return assigned;
}
export function availableMemorials(s, editingSlot = null) {
  const assigned = memorialAssignments(s);
  return (s?.memorials || []).filter(m => !assigned.has(m.id) || assigned.get(m.id).slot === editingSlot);
}
export function memorialCounts(s) {
  const pending = availableMemorials(s).length;
  return {pending, queued:(s?.memorials.length || 0) - pending, total:s?.memorials.length || 0};
}
export function memorialDecisionLabel(m, decision) {
  if (decision === 'hold') return '留中候旨';
  if (decision === 'discuss') return '发部再议';
  if (decision === 'remark') return '只作朱批';
  return m.options.find(o => o.id === decision)?.label ||
    m.options[decision === 'reject' ? 1 : 0]?.label || '待定';
}
export function memorialReceivedLabel(m, currentTurn) {
  const match=String(m.id).match(/^(?:routine|m-ev)-(\d+)-/);
  if(!match)return '';
  const turn=Number(match[1]);
  return turn===currentTurn?'本旬新呈':'第 '+(turn+1)+' 旬呈入';
}
