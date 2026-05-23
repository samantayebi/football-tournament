import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const TournamentContext = createContext(null);

export function TournamentProvider({ children }) {
  const [tournaments, setTournaments] = useState([]);
  const [selectedId, setSelectedId]   = useState(null);

  useEffect(() => {
    api.get('/api/v1/public/tournaments')
      .then(r => {
        const list = r.data;
        setTournaments(list);
        if (list.length > 0) setSelectedId(list[0].id);
      })
      .catch(() => {});
  }, []);

  const selectedTournament = tournaments.find(t => t.id === selectedId) || null;

  return (
    <TournamentContext.Provider value={{ tournaments, selectedId, setSelectedId, selectedTournament }}>
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournament() {
  return useContext(TournamentContext);
}
