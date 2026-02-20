import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Lobby } from './pages/Lobby';
import { GamePlay } from './pages/GamePlay';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/:gameId" element={<Lobby />} />
        <Route path="/:gameId/:roomId" element={<GamePlay />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
