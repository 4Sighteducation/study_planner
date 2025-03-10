import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [auth, setAuth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  
  useEffect(() => {
    // Listen for messages from Knack parent window
    window.addEventListener('message', handleMessage);
    
    // Signal to parent that we're ready for auth info
    if (window.parent !== window) {
      console.log('App loaded - sending ready message to parent');
      window.parent.postMessage({ type: 'APP_READY' }, '*');
    } else {
      // For standalone testing
      setLoading(false);
    }
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);
  
  const handleMessage = (event) => {
    console.log('Message received from parent:', event.data);
    
    if (event.data && event.data.type === 'KNACK_USER_INFO') {
      setAuth(event.data.data);
      
      // If user data was included, load it
      if (event.data.data && event.data.data.userData) {
        setTasks(event.data.data.userData.tasks || []);
      }
      
      setLoading(false);
      
      // Confirm receipt of auth info
      window.parent.postMessage({ type: 'AUTH_CONFIRMED' }, '*');
    } else if (event.data && event.data.type === 'LOAD_SAVED_DATA') {
      if (event.data.data && event.data.data.tasks) {
        setTasks(event.data.data.tasks);
        setStatusMessage('Loaded saved data');
        setTimeout(() => setStatusMessage(''), 2000);
      }
    }
  };
  
  const addTask = () => {
    if (!newTask.trim()) {
      setStatusMessage('Please enter a task');
      return;
    }
    
    const updatedTasks = [...tasks, {
      id: Date.now().toString(),
      text: newTask.trim(),
      completed: false,
      date: new Date().toISOString()
    }];
    
    setTasks(updatedTasks);
    setNewTask('');
    setStatusMessage('Task added');
    
    // Save to parent Knack app
    saveData(updatedTasks);
  };
  
  const toggleTask = (id) => {
    const updatedTasks = tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    
    setTasks(updatedTasks);
    saveData(updatedTasks);
  };
  
  const deleteTask = (id) => {
    const updatedTasks = tasks.filter(task => task.id !== id);
    setTasks(updatedTasks);
    saveData(updatedTasks);
    setStatusMessage('Task deleted');
  };
  
  const saveData = (taskData) => {
    setSaving(true);
    
    // Send data to parent window for saving
    if (window.parent !== window && auth) {
      window.parent.postMessage({
        type: 'SAVE_DATA',
        data: { tasks: taskData }
      }, '*');
      
      setTimeout(() => {
        setSaving(false);
        setStatusMessage('Saved successfully!');
        setTimeout(() => setStatusMessage(''), 2000);
      }, 500);
    } else {
      // For standalone testing
      console.log('Would save:', { tasks: taskData });
      setTimeout(() => {
        setSaving(false);
        setStatusMessage('Saved successfully! (Test mode)');
        setTimeout(() => setStatusMessage(''), 2000);
      }, 500);
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
        <h2>Study Task Planner</h2>
        {auth && <p>User: {auth.email || 'Test Mode'}</p>}
      </header>
      
      <div className="add-form">
        <div className="form-row">
          <input
            type="text"
            placeholder="Add a new study task"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTask()}
          />
          <button onClick={addTask}>Add</button>
        </div>
      </div>
      
      <div className="task-list">
        <h3>Your Study Tasks</h3>
        {tasks.length === 0 ? (
          <p className="empty-list">No tasks yet. Add your first study task above.</p>
        ) : (
          <ul>
            {tasks.map(task => (
              <li key={task.id} className={task.completed ? 'completed' : ''}>
                <label>
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                  />
                  <span className="task-text">{task.text}</span>
                </label>
                <button className="delete-btn" onClick={() => deleteTask(task.id)}>✕</button>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      {statusMessage && (
        <div className="status-message">
          {statusMessage}
        </div>
      )}
      
      {saving && (
        <div className="saving-indicator">
          Saving...
        </div>
      )}
    </div>
  );
}

export default App;
