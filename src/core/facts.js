// Machine-readable hard outcomes, paired with the human-readable settlement table.
export function turnFacts(before, after, schedule, slotResults) {
  const facts = [];
  for (const [slot, action] of Object.entries(schedule)) {
    if (action?.kind === "下旨") {
      const label = slotResults[slot]
        .join(" ")
        .match(/雷厉风行|照办|敷衍|阳奉阴违|封驳/)?.[0];
      if (label)
        facts.push({ kind: "execution", slot, topic: action.edictType, label });
    }
  }
  const birthMothers = new Set();
  for (const c of after.harem.children)
    if (!before.harem.children.some((old) => old.id === c.id)) {
      const mother = after.harem.consorts.find((m) => m.id === c.mother);
      birthMothers.add(c.mother);
      facts.push({
        kind: "birth",
        actors: [c.name, mother?.name].filter(Boolean),
      });
    }
  for (const c of after.harem.consorts) {
    const old = before.harem.consorts.find((o) => o.id === c.id);
    if (c.preg && !old?.preg)
      facts.push({ kind: "pregnancy", actors: [c.name] });
    if (old?.preg && !c.preg && !birthMothers.has(c.id))
      facts.push({ kind: "miscarriage", actors: [c.name] });
  }
  for (const o of after.court.officials) {
    const old = before.court.officials.find((x) => x.id === o.id);
    if (old?.alive && !o.alive) facts.push({ kind: "death", actors: [o.name] });
    if (old && old.post !== o.post) {
      const post = after.court.posts.find((p) => p.id === o.post);
      facts.push({
        kind: "appointment",
        actors: [o.name],
        post: post?.title || "",
        operation: (() => {
          const action = Object.values(schedule).find(
            (a) =>
              a?.kind === "任命" &&
              before.court.posts.find((p) => p.id === a.post)?.holder === o.id,
          );
          return (
            { remove: "罢免", demote: "贬谪", retire: "致仕", jail: "下狱" }[
              action?.operation
            ] || (o.post ? "任命" : "罢免")
          );
        })(),
      });
    }
  }
  for (const c of after.harem.consorts) {
    const old = before.harem.consorts.find((o) => o.id === c.id);
    if (!old || old.rank !== c.rank)
      facts.push({
        kind: "appointment",
        actors: [c.name],
        post: c.rank,
        operation: old
          ? [
              "皇后",
              "皇贵妃",
              "贵妃",
              "妃",
              "嫔",
              "贵人",
              "常在",
              "答应",
            ].indexOf(c.rank) <
            [
              "皇后",
              "皇贵妃",
              "贵妃",
              "妃",
              "嫔",
              "贵人",
              "常在",
              "答应",
            ].indexOf(old.rank)
            ? "晋位"
            : "降位"
          : "入宫",
      });
  }
  if (after.harem.heir !== before.harem.heir && after.harem.heir)
    facts.push({
      kind: "appointment",
      actors: [
        after.harem.children.find((c) => c.id === after.harem.heir)?.name,
      ],
      post: "太子",
      operation: "册立",
    });
  if (after.ending?.type === "驾崩")
    facts.push({ kind: "death", actors: [after.emperor.name, "皇帝", "陛下"] });
  for (const w of after.campaigns) {
    const old = before.campaigns.find((o) => o.id === w.id),
      country = after.foreign.find((f) => f.id === w.country)?.name;
    if (!old) facts.push({ kind: "war", actors: [country], outcome: "宣战" });
    if (w.done && !old?.done)
      facts.push({ kind: "war", actors: [country], outcome: w.result });
    if(w.settlement?.status==='signed'&&old?.settlement?.status!=='signed')
      facts.push({kind:'war',actors:[country],outcome:'议约：'+w.settlement.label});
  }
  for (const t of after.threads)
    if (t.type === "边警" && !before.threads.some((o) => o.id === t.id))
      facts.push({ kind: "war", actors: t.actors, outcome: "入寇" });
  if (after.ending?.type === "亡国")
    facts.push({ kind: "war", actors: ["京师", "京城"], outcome: "失守" });
  return facts;
}
