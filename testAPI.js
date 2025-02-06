const fetch = require('node-fetch');

const API_KEY = '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'; // Replace with your actual Groq API key
const apiUrl = 'https://api.groq.com/openai/v1/chat/completions';

async function generateText() {
    const prompt = "Generate a professional, well-structured cover letter tailored to the provided job description using the given resume and cover letter as reference. Focus on aligning relevant skills and experience with the job requirements. Ensure the response is comprehensive and free of greetings or unnecessary text.";

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: "llama3-8b-8192",  // Choose an available Groq model
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
            max_tokens: 300 //????????
        }),
    });

    const data = await response.json();
    console.log('API Response:', data);

    // Extract generated text
    if (data && data.choices && data.choices[0] && data.choices[0].message) {
        console.log('Generated Text:', data.choices[0].message.content);
    } else {
        console.log('Error: Generated text not found in the response.');
    }
}

generateText();
