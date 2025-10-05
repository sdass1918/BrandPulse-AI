import { Client, Users, Databases, ID } from 'node-appwrite';
import { GoogleGenAI } from "@google/genai";
import snoowrap from "snoowrap";


const apiKey = process.env.GEMINI_API_KEY;

const ai = new GoogleGenAI(apiKey);


// This Appwrite function will be executed every time your function is triggered
export default async ({ req, res, log, error }) => {
  // You can use the Appwrite SDK to interact with other services
  // For this example, we're using the Users service
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_FUNCTION_API_ENDPOINT)
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
  const users = new Users(client);
  const databases = new Databases(client);

  const r = new snoowrap({
    userAgent: "BrandPulseAI Hackathon Bot",
    clientId: process.env.REDDIT_CLIENT_ID,
    clientSecret: process.env.REDDIT_CLIENT_SECRET,
    username: process.env.REDDIT_USERNAME,
    password: process.env.REDDIT_PASSWORD,
  });

  // 2. Get the search query from the user
  // Debug: Let's see what we're actually receiving
  log('req.body:', req.body);
  log('req.payload:', req.payload);
  log('typeof req.body:', typeof req.body);
  log('typeof req.payload:', typeof req.payload);
  
  let userQuery;
  try {
    // In Appwrite functions, data sent via body is usually in req.body as parsed object
    if (req.body && typeof req.body === 'object' && req.body.query) {
      userQuery = req.body.query;
    } else if (req.body && typeof req.body === 'string') {
      userQuery = JSON.parse(req.body).query;
    } else if (typeof req.payload === 'string') {
      userQuery = JSON.parse(req.payload).query;
    } else if (req.payload && req.payload.query) {
      userQuery = req.payload.query;
    }
  } catch (parseError) {
    error('Failed to parse request data:', parseError);
    return res.json({ error: "Invalid request format" }, 400);
  }
  
  log('Extracted userQuery:', userQuery);
  
  if (!userQuery) {
    return res.json({ error: "Query is required" }, 400);
  }

  const ignoreWords = ['and', 'the', 'for', 'vs', 'pro', 'max', 'ultra', 'phone', 'plus'];

  // 2. Process the user's query
  const subredditKeywords = userQuery
    .toLowerCase()                  // -> "samsung s23 ultra"
    .split(' ')                     // -> ["samsung", "s23", "ultra"]
    .filter(word => !ignoreWords.includes(word) && word.length > 1); // -> ["samsung", "s23"]

  // 3. Create the final search string
  const relevantSubreddits = [...new Set(subredditKeywords)].join('+');
  log('Relevant subreddits:', relevantSubreddits);
  
   const comments = await r.search({
    query: userQuery,
    subreddit: relevantSubreddits,
    sort: 'relevance',
    time: 'month',
    limit: 3, // Limit to 3 for the hackathon to stay within API limits
  });

  // CORRECT - Logs the object interactively
log('Comments received from Reddit:', comments);

  for (const comment of comments) {
    const prompt = `
You are an expert Brand Analyst AI. Your task is to analyze the following Reddit comment concerning the query "${userQuery}" with extreme precision.

First, think step-by-step:
1.  Read the comment carefully. Is it relevant to "${userQuery}"? If it's spam or completely off-topic, note that.
2.  Identify the core subject or specific features being discussed (e.g., "battery life", "camera quality", "customer service", "price"). This will be the "topic".
3.  Evaluate the user's language. Are they expressing satisfaction, frustration, or just stating a fact? Note any strong positive or negative keywords.
4.  Formulate a concise, one-sentence summary of the user's main point.
5.  Based on your analysis, determine the overall sentiment. If the comment contains both strong positive and negative points, classify it as "Mixed". If it's a question or a neutral statement of fact, classify it as "Neutral".

After your analysis, provide your response ONLY as a valid JSON object. Do not include any text or explanations outside of the JSON structure.

The JSON object must have these exact keys:
-   "is_relevant": (boolean) true if the comment is about the query, false otherwise.
-   "sentiment": (string) Must be one of four values: "Positive", "Negative", "Neutral", or "Mixed".
-   "topic": (string) The primary subject or feature discussed in the comment.
-   "summary": (string) Your one-sentence summary of the comment.

Here is the comment to analyze:
---
"${comment.body}"
---
`;

    try {
      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
      });
      log('AI result:', result);
      
      // Extract text from the response structure
      let responseText;
      if (result.text) {
        responseText = result.text;
      } else if (result.candidates && result.candidates[0] && result.candidates[0].content && result.candidates[0].content.parts) {
        responseText = result.candidates[0].content.parts[0].text;
      } else if (result.response && result.response.text) {
        responseText = result.response.text();
      } else {
        throw new Error('Could not extract text from AI response');
      }
      
      // Clean up the response text - remove markdown code blocks if present
      let cleanedResponse = responseText.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      log('Cleaned response:', cleanedResponse);
      const analysis = JSON.parse(cleanedResponse);

      // Save to Appwrite Database
      await databases.createDocument(
        process.env.APPWRITE_DATABASE_ID, // Database ID
        "feedback", // Collection ID (matching frontend)
        ID.unique(), // Document ID
        {
          content: analysis.summary,
          source: "Reddit",
          sentiment: analysis.sentiment,
          topic: analysis.topic,
          link: `https://reddit.com${comment.permalink}`,
          userQuery: userQuery,
        }
      );
    } catch (error) {
      console.error("AI analysis or DB write failed:", error);
    }
  }

  return res.json({ success: true, message: "Analysis complete." });
};
