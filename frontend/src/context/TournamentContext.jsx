import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api';

const TournamentContext = createContext(null);

export function TournamentProvider({ children }) {
  const [tournaments, setTournaments] = useState([]);
  const [selectedId, setSelectedIdRaw] = useState(null);

  const refreshTournaments = useCallback(() => {
    return api.get('/api/v1/public/tournaments')
      .then(r => { setTournaments(r.data); return r.data; })
      .catch(() => []);
  }, []);

  useEffect(() => {
    refreshTournaments().then(list => {
      if (list.length > 0) setSelectedIdRaw(list[0].id);
    });
  }, [refreshTournaments]);

  function setSelectedId(id) {
    setSelectedIdRaw(id);
    refreshTournaments();
  }

  const selectedTournament = tournaments.find(t => t.id === selectedId) || null;

  return (
    <TournamentContext.Provider value={{ tournaments, selectedId, setSelectedId, selectedTournament, refreshTournaments }}>
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournament() {
  return useContext(TournamentContext);
}
