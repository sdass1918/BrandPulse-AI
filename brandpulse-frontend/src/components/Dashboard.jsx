import React, { useState, useEffect } from 'react';
import SearchBar from './SearchBar';
import Results from './Results';
import { functions, databases, realtimeClient, Query } from '../appwrite';

// IMPORTANT: Replace with your actual Database and Collection IDs
const DATABASE_ID = '68dfbc1a001abd9452a1'; 
const COLLECTION_ID = 'feedback'; // The name we gave our collection

function Dashboard({ user, onLogout }) {
  const [feedbackItems, setFeedbackItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuery, setCurrentQuery] = useState('');

  // Fetch initial data
  const fetchInitialData = async (query) => {
      if (!query) return;
      try {
          const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTION_ID,
            [Query.equal("userQuery", query)] // Filter by the current search query
          );
          setFeedbackItems(response.documents);
      } catch (error) {
          console.error("Failed to fetch initial data:", error);
      }
  };
  
  // Realtime subscription effect
  useEffect(() => {
    const subscriptionString = `databases.${DATABASE_ID}.collections.${COLLECTION_ID}.documents`;
    
    const unsubscribe = realtimeClient.subscribe(subscriptionString, (response) => {
      // Check if the new item matches the current search query
      if (response.payload.userQuery === currentQuery) {
          // Add the new item to the top of the list
          setFeedbackItems(prevItems => [response.payload, ...prevItems]);
      }
    });

    // Cleanup function to unsubscribe when the component unmounts
    return () => {
      unsubscribe();
    };
  }, [currentQuery]); // Re-subscribe if the query changes (optional, but good practice)

  const handleSearch = async (query) => {
    setIsLoading(true);
    setFeedbackItems([]); // Clear previous results
    setCurrentQuery(query);
    
    // Fetch existing results for this query first
    await fetchInitialData(query);

    try {
      // Execute the function and wait for it to complete
      const execution = await functions.createExecution({
        functionId: '68dfd00a0037c42f55fb', // Your function name/ID
        body: JSON.stringify({ query: query }),
        async: true, // Wait for the function to complete
      });
      
      console.log("Function execution completed:", execution);
      
      // After function completes, fetch the updated results
      await fetchInitialData(query);
      
    } catch (error) {
      console.error("Failed to execute function:", error);
      alert("Error starting analysis. Check console for details.");
    } finally {
      // Only stop loading after everything is done
      setIsLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <header>
        <h2>Welcome, {user.name}!</h2>
        <button onClick={onLogout} className="logout-button">Logout</button>
      </header>
      <main>
        <h1>BrandPulse AI Dashboard</h1>
        <p>Enter a brand or product name to analyze recent feedback from Reddit.</p>
        <SearchBar onSearch={handleSearch} isLoading={isLoading} />
        <Results feedbackItems={feedbackItems} isLoading={isLoading} />
      </main>
    </div>
  );
}

export default Dashboard;