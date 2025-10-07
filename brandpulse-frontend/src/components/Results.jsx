import React, { useMemo } from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

// Single feedback item component
// function FeedbackItem({ item }) {
//     const sentimentClass = item.sentiment.toLowerCase();
//     return (
//         <div className={`feedback-item ${sentimentClass}`}>
//             <div className="item-header">
//                 <span className={`sentiment-badge ${sentimentClass}`}>{item.sentiment}</span>
//                 <strong className="topic-badge">{item.topic}</strong>
//             </div>
//             <p className="item-content">{item.content}</p>
//             <a href={item.link} target="_blank" rel="noopener noreferrer">View on Reddit</a>
//         </div>
//     );
// }

// This whole function goes inside src/components/Results.jsx

function FeedbackItem({ item }) {
    // If item.sentiment exists, make it lowercase. If not, default to 'neutral'.
    const sentimentClass = item.sentiment?.toLowerCase() || 'neutral';
    
    // Provide a fallback for the sentiment text as well
    const sentimentText = item.sentiment || 'Unknown';

    return (
        <div className={`feedback-item ${sentimentClass}`}>
            <div className="item-header">
                <span className={`sentiment-badge ${sentimentClass}`}>{sentimentText}</span>
                <strong className="topic-badge">{item.topic || 'General'}</strong>
            </div>
            <p className="item-content">{item.content}</p>
            <a href={item.link} target="_blank" rel="noopener noreferrer">View on Reddit</a>
        </div>
    );
}


// Main Results component with chart and list
function Results({ feedbackItems, isLoading }) {
  const sentimentData = useMemo(() => {
    const counts = { Positive: 0, Negative: 0, Neutral: 0 };
    feedbackItems.forEach(item => {
      if (counts[item.sentiment] !== undefined) {
        counts[item.sentiment]++;
      }
    });
    return {
      labels: ['Positive', 'Negative', 'Neutral'],
      datasets: [
        {
          label: 'Sentiment Analysis',
          data: [counts.Positive, counts.Negative, counts.Neutral],
          backgroundColor: ['#4caf50', '#f44336', '#9e9e9e'],
          borderColor: ['#ffffff', '#ffffff', '#ffffff'],
          borderWidth: 2,
        },
      ],
    };
  }, [feedbackItems]);

  if (isLoading && feedbackItems.length === 0) {
      return <div className="loading-indicator">Analyzing... Please wait.</div>;
  }

  if (feedbackItems.length === 0) {
    return <div className="no-results">No results yet. Start a new analysis!</div>;
  }

  return (
    <div className="results-container">
      <div className="chart-container">
        <h3>Sentiment Overview</h3>
        <Pie data={sentimentData} />
      </div>
      <div className="feedback-list">
         <h3>Live Feedback Feed</h3>
         {feedbackItems.map((item, index) => (
             <FeedbackItem key={item.$id || index} item={item} />
         ))}
      </div>
    </div>
  );
}

export default Results;