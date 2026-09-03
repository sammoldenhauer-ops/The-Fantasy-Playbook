"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";

type Player = { id: string; name: string; team: string; position: string };

export function LineupForm({
  players,
  scoringFormat,
  selectedIds,
  leagueSize,
}: {
  players: Player[];
  scoringFormat: string;
  selectedIds: string[];
  leagueSize: number;
}) {
  const [selected, setSelected] = useState(selectedIds);

  function togglePlayer(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  }

  return (
    <form method="get" className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium">
          League size
          <select name="leagueSize" defaultValue={leagueSize} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
            {[8, 10, 12, 14, 16].map((size) => <option key={size} value={size}>{size} teams</option>)}
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Scoring format
          <select name="scoringFormat" defaultValue={scoringFormat} className="h-9 rounded-md border border-input bg-background px-3 text-sm">
            <option value="ppr">PPR</option>
            <option value="half_ppr">Half-PPR</option>
            <option value="standard">Standard</option>
          </select>
        </label>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {players.map((player) => (
          <label key={player.id} className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm hover:bg-muted/50">
            <input type="checkbox" name="player" value={player.id} checked={selected.includes(player.id)} onChange={() => togglePlayer(player.id)} />
            <span className="flex-1 font-medium">{player.name}</span>
            <span className="text-muted-foreground">{player.team} · {player.position}</span>
          </label>
        ))}
      </div>
      {players.length === 0 && <p className="text-sm text-muted-foreground">Import player projections to start building a roster.</p>}
      <Button type="submit">Analyze roster</Button>
    </form>
  );
}
