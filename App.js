import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [auth, setAuth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [studyItems, setStudyItems] = useState([]);
  const [newSubject, setNewSubject] = useState('');
  const [newHours, setNewHours] = useState(1);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  
  useEffect(() => {
    // Listen for messages from Knack parent window
    window.addEventListener('message', handleMessage);
    
    // Signal to parent that we're ready for auth info
    if (window.parent !== window) {
      console.log('App loaded - sending ready message to parent');
      window.parent.postMessage({ type: 'STUDY_PLANNER_READY' }, '*');
    } else {
      // For standalone testing
      setLoading(false);
    }
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);
  
  const handleMessage = (event) => {
    console.log('Message received:', event.data);
    
    if (event.data && event.data.type === 'KNACK_USER_INFO') {
      setAuth(event.data.data);
      setLoading(false);
      
      // Confirm receipt of auth info
      if (window.parent !== window) {
        window.parent.postMessage({ type: 'AUTH_CONFIRMED' }, '*');
      }
      
      // Load user data if they sent any
      if (event.data.data && event.data.data.userData) {
        const userData = event.data.data.userData;
        if (userData.studyItems) {
          setStudyItems(userData.studyItems);
        }
      }
    }
  };
  
  const addStudyItem = () => {
    if (!newSubject) {
      setStatusMessage('Please enter a subject');
      return;
    }
    
    const newItem = {
      id: Date.now().toString(),
      subject: newSubject,
      hours: newHours,
      completed: false
    };
    
    const updatedItems = [...studyItems, newItem];
    setStudyItems(updatedItems);
    setNewSubject('');
    setNewHours(1);
    setStatusMessage('Item added');
  };
  
  const removeItem = (id) => {
    setStudyItems(studyItems.filter(item => item.id !== id));
    setStatusMessage('Item removed');
  };
  
  const toggleComplete = (id) => {
    setStudyItems(studyItems.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };
  
  const saveData = () => {
    setSaving(true);
    setStatusMessage('Saving...');
    
    // Send data to parent window for saving
    if (window.parent !== window && auth) {
      window.parent.postMessage({
        type: 'SAVE_STUDY_DATA',
        data: { studyItems }
      }, '*');
      
      // Simulate response
      setTimeout(() => {
        setSaving(false);
        setStatusMessage('Saved successfully!');
      }, 1000);
    } else {
      // For standalone testing
      console.log('Would save:', { studyItems });
      setTimeout(() => {
        setSaving(false);
        setStatusMessage('Saved successfully! (Test mode)');
      }, 1000);
    }
  };
  
  if (loading) {
    return (
      <div className="app loading">
        <h2>Study Planner</h2>
        <p>Loading...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="app error">
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }
  
  return (
    <div className="app">
      <header>
        <h2>Study Planner</h2>
        {auth && <p>User: {auth.email || 'Test Mode'}</p>}
      </header>
      
      <div className="add-form">
        <h3>Add Study Task</h3>
        <div className="form-row">
          <input
            type="text"
            placeholder="Subject"
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
          />
          <input
            type="number"
            min="0.5"
            step="0.5"
            value={newHours}
            onChange={(e) => setNewHours(parseFloat(e.target.value))}
          />
          <button onClick={addStudyItem}>Add</button>
        </div>
      </div>
      
      <div className="study-list">
        <h3>Your Study Plan</h3>
        {studyItems.length === 0 ? (
          <p className="empty-list">No items yet. Add your first study task above.</p>
        ) : (
          <ul>
            {studyItems.map(item => (
              <li key={item.id} className={item.completed ? 'completed' : ''}>
                <label>
                  <input
                    type="checkbox"
                    checked={item.completed}
                    onChange={() => toggleComplete(item.id)}
                  />
                  <span className="subject">{item.subject}</span>
                  <span className="hours">{item.hours} hour{item.hours !== 1 ? 's' : ''}</span>
                </label>
                <button className="remove" onClick={() => removeItem(item.id)}>✕</button>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {studyItems.length > 0 && (
        <div className="actions">
          <button 
            className="save-button" 
            onClick={saveData}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Study Plan'}
          </button>
        </div>
      )}
      
      {statusMessage && (
        <div className="status-message">
          {statusMessage}
        </div>
      )}
    </div>
  );
}

export default App;
