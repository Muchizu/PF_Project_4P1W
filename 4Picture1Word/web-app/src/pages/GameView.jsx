import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function GameView() {
  const { packId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  
  const [puzzle, setPuzzle] = useState(null);
  const [guess, setGuess] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);

  const fetchPuzzle = async () => {
    setLoading(true);
    setFeedback(null);
    setGuess('');
    try {
      const res = await fetch(`http://localhost:5200/puzzles/next?packId=${packId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 404) {
        setFinished(true);
        return;
      }
      const data = await res.json();
      setPuzzle(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPuzzle();
  }, [packId, token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!guess.trim()) return;
    
    try {
      const res = await fetch(`http://localhost:5200/game/submit`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ puzzleId: puzzle.id, guess })
      });
      const data = await res.json();
      setFeedback(data.correct);
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="container flex-center"><h3>Loading Puzzle...</h3></div>;
  if (finished) return (
    <div className="container flex-center" style={{ minHeight: '60vh' }}>
      <div className="panel text-center">
        <h2>Pack Completed! 🎉</h2>
        <p className="mb-4">You have solved all puzzles in this pack.</p>
        <button onClick={() => navigate('/')}>Choose Another Pack</button>
      </div>
    </div>
  );

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <div className="flex-center mb-4"><h2 style={{ margin: 0 }}>4 Pics 1 Word</h2></div>
      
      <div className="panel">
        <div className="puzzle-grid">
          {puzzle?.images.map((url, i) => (
            <img key={i} src={`http://localhost:5200${url}`} alt={`Hint ${i+1}`} className="puzzle-image" />
          ))}
        </div>

        {puzzle?.hint && <p className="text-center mb-4" style={{ color: 'var(--text-muted)' }}>Hint: {puzzle.hint}</p>}

        <form onSubmit={handleSubmit} className="flex-center" style={{ flexDirection: 'column', gap: '1rem' }}>
          <input 
            type="text" 
            placeholder="Type your guess here..." 
            value={guess} 
            onChange={e => setGuess(e.target.value.toUpperCase())}
            style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '4px', maxWidth: '400px' }}
            disabled={feedback === true}
          />
          
          {feedback === null && <button type="submit" style={{ minWidth: '200px' }}>SUBMIT</button>}
          {feedback === false && (
            <div className="flex gap-4">
              <span className="error-text" style={{ alignSelf: 'center', fontSize: '1.2rem' }}>❌ Incorrect</span>
              <button type="submit">Try Again</button>
            </div>
          )}
          {feedback === true && (
            <div className="flex gap-4" style={{ flexDirection: 'column', alignItems: 'center' }}>
              <span className="success-text" style={{ fontSize: '1.5rem' }}>✅ Correct!</span>
              <button onClick={fetchPuzzle} style={{ backgroundColor: 'var(--success)' }}>Next Puzzle ➔</button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
