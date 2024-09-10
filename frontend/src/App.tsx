import './App.css';
import { Player } from './Player';
import VideoStream from './VideStream';

function App() {
  return (
    <div className="App">
      <VideoStream />
      <Player />
    </div>
  );
}

export default App;
