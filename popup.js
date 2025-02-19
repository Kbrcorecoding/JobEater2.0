// Event listener for saving the resume file and processing it
document.getElementById("saveFiles").addEventListener("click", function() {
    const resume = document.getElementById("resumeUpload").files[0];

    if (!resume) {
        document.getElementById("status").textContent = "Please upload a resume.";
        return;
    }

    document.getElementById("status").textContent = "Resume uploaded, processing...";

    extractTextFromFile(resume, 'resume', function() {
        document.getElementById("status").textContent = "Resume saved successfully!";
    });
});

// Event listener for generating the tailored cover letter using Groq API
document.getElementById("generateBtn").addEventListener("click", function() {
    const jobText = document.getElementById("jobRequirements").value;

    if (!jobText.trim()) {
        document.getElementById("status").textContent = "Please enter job requirements.";
        return;
    }

    // Retrieve extracted resume text
    chrome.storage.local.get(["resume"], function(result) {
        const resumeText = result.resume || '';

        if (!resumeText.trim()) {
            document.getElementById("status").textContent = "Please upload and process a resume first.";
            return;
        }

        const prompt = `
        Generate a professional, well-structured cover letter tailored to the provided job description using the given resume as reference. Focus on aligning relevant skills and experience with the job requirements. Ensure the response is comprehensive and free of greetings or unnecessary text.

        Job Description: ${jobText}
        Resume: ${resumeText}
        `;

        console.log("Prompt being sent:", prompt);
        sendToGroq(prompt);
    });
});

// Extract text from different file types
function extractTextFromFile(file, key, callback) {
    const reader = new FileReader();

    reader.onload = function(event) {
        const fileContent = event.target.result;

        if (file.type === 'application/pdf') {
            extractTextFromPDF(fileContent, key, callback);
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            extractTextFromDOCX(fileContent, key, callback);
        } else if (file.type === 'text/plain') {
            chrome.storage.local.set({ [key]: fileContent }, callback);
        }
    };

    if (file.type === 'application/pdf') {
        reader.readAsArrayBuffer(file);
    } else {
        reader.readAsText(file);
    }
}

// Extract text from PDF using pdf.js
function extractTextFromPDF(fileContent, key, callback) {
    const loadingTask = pdfjsLib.getDocument({ data: fileContent });

    loadingTask.promise.then(function(pdf) {
        let text = '';
        const promises = [];

        for (let i = 1; i <= pdf.numPages; i++) {
            promises.push(pdf.getPage(i).then(page => 
                page.getTextContent().then(textContent => {
                    textContent.items.forEach(item => text += item.str + ' ');
                })
            ));
        }

        Promise.all(promises).then(() => {
            chrome.storage.local.set({ [key]: text }, callback);
        });
    });
}

// Extract text from DOCX (Requires an external library like Mammoth.js)
function extractTextFromDOCX(fileContent, key, callback) {
    const text = fileContent; // Use actual DOCX parsing
    chrome.storage.local.set({ [key]: text }, callback);
}

// Send request to Groq API for cover letter generation
async function sendToGroq(prompt) {
    const apiKey = document.getElementById('apiKey').value;
    if (!apiKey) {
        document.getElementById("status").textContent = "Please enter your API key.";
        return;
    }

    const apiUrl = 'https://api.groq.com/openai/v1/chat/completions';

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: "llama3-8b-8192",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7,
                max_tokens: 1000 //max words response
            }),
        });

        const data = await response.json();
        console.log('API Response:', data);

        if (data && data.choices && data.choices[0] && data.choices[0].message) {
            const result = data.choices[0].message.content.trim();
            displayGeneratedResult(result);
        } else {
            console.error('Unexpected response structure:', data);
            document.getElementById("status").textContent = "Error: Unexpected response structure.";
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById("status").textContent = "Error generating cover letter.";
    }
}

// Display generated text
function displayGeneratedResult(result) {
    document.getElementById("status").textContent = "Generated successfully!";
    document.getElementById("generatedOutput").textContent = result;
    downloadFile("Generated_Cover_Letter.txt", result);
}

// Function to download the generated cover letter
function downloadFile(filename, content) {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
