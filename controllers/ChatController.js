// // controllers/ChatController.js
// import axios from 'axios';
// import { GEMINI_API_URL, GEMINI_API_KEY, GEMINI_API_SECRET } from '../config/env.js';

// const chatWithGemini = async (message) => {
//   try {
//     // This structure might need adjustment based on the actual Gemini API documentation
//     const response = await axios.post(GEMINI_API_URL, {
//       contents: [{
//         parts: [{
//           text: message
//         }]
//       }],
//       generationConfig: {
//         temperature: 0.7,
//         maxOutputTokens: 1024
//       }
//     }, {
//       headers: {
//         'x-goog-api-key': GEMINI_API_KEY,
//         'Content-Type': 'appelication/json',
//       },
//     });
    
//     // Extract the text response from Gemini API response
//     // Adjust this based on the actual response structure from Gemini
//     if (response.data && 
//         response.data.candidates && 
//         response.data.candidates[0] && 
//         response.data.candidates[0].content && 
//         response.data.candidates[0].content.parts && 
//         response.data.candidates[0].content.parts[0] && 
//         response.data.candidates[0].content.parts[0].text) {
//       return response.data.candidates[0].content.parts[0].text;
//     } else {
//       // If response format is different, log it and return a fallback message
//       console.log("Unexpected response format:", JSON.stringify(response.data));
//       return "I received a response but couldn't parse it correctly. Please try again.";
//     }
//   } catch (error) {
//     console.error("Error communicating with Gemini API:", 
//       error.response ? JSON.stringify(error.response.data) : error.message);
//     throw new Error("Failed to communicate with Gemini API");
//   }
// };

// export default chatWithGemini;