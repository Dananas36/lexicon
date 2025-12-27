/* LEXICON MASTER - LOGIC ENGINE
   This script handles word rotation and connects to the Hugging Face AI.
*/

let API_TOKEN = ""; // Stays blank for security; the site will prompt you for it.

// The Word Bank - You can add more words here following this same format.
const wordBank = [
    { word: "Alacrity", def: "Brisk and cheerful readiness.", ex: "He accepted the invitation with alacrity." },
    { word: "Anomalous", def: "Deviating from what is standard or expected.", ex: "The experiment yielded an anomalous result." },
    { word: "Laconic", def: "Using very few words.", ex: "His laconic reply suggested he was not interested in talking." },
    { word: "Ephemeral", def: "Lasting for a very short time.", ex: "The beauty of the sunset was ephemeral, fading in minutes." },
    { word: "Sycophant", def: "A person who acts obsequiously toward someone important to gain advantage.", ex: "The CEO was surrounded by sycophants who never disagreed with him." }
];

let currentIndex = 0;
let learnedWords = [];

// Initialize the app when the page loads
function init() {
    const data = wordBank[currentIndex];
    document.getElementById('current-word').innerText = data.word;
    document.getElementById('definition').innerText = data.def;
    document.getElementById('word-example').innerText = data.ex;
    
    // Update all span tags that show the current word
    document.querySelectorAll('.target-word').forEach(el => el.innerText = data.word);
}

// Navigation functions
function showSection(type) {
    document.getElementById('main-card').classList.add('hidden');
    document.getElementById(`${type}-section`).classList.remove('hidden');
    
    // For the Story section, show the list of words they've "learned"
    if (type === 'paragraph') {
        document.getElementById('learned-list').innerText = learnedWords.length > 0 ? learnedWords.join(", ") : "None yet (Mark words as 'Known' first)";
    }
}

function goBack() {
    document.querySelectorAll('section, main').forEach(el => el.classList.add('hidden'));
    document.getElementById('main-card').classList.remove('hidden');
    // Hide any previous feedback
    document.querySelectorAll('.feedback').forEach(f => f.style.display = 'none');
}

// Move to the next word and save to the "learned" list
function markAsKnown() {
    const currentWord = wordBank[currentIndex].word;
    if (!learnedWords.includes(currentWord)) {
        learnedWords.push(currentWord);
    }
    currentIndex = (currentIndex + 1) % wordBank.length;
    init();
    alert(`"${currentWord}" added to your collection!`);
}

// AI LOGIC CHECKER
async function checkAI(mode) {
    const textField = (mode === 'sentence') ? document.getElementById('user-sentence') : document.getElementById('user-paragraph');
    const text = textField.value;
    const feedback = document.getElementById(`${mode}-feedback`);
    const btn = document.getElementById(mode === 'sentence' ? 'check-btn' : 'story-btn');

    // 1. Check if the box is empty
    if (!text.trim()) {
        alert("Please write something first!");
        return;
    }

    // 2. Ask for the API Token if we don't have it yet
    if (!API_TOKEN) {
        API_TOKEN = prompt("Enter your Hugging Face API Token (hf_...):");
        if (!API_TOKEN) return;
    }

    btn.innerText = "AI is thinking...";
    btn.disabled = true; // Prevent multiple clicks
    feedback.style.display = "none";
    
    try {
        // Direct call to Hugging Face
        const response = await fetch("https://api-inference.huggingface.co/models/facebook/bart-large-mnli", {
            headers: { 
                "Authorization": `Bearer ${API_TOKEN}`,
                "Content-Type": "application/json"
            },
            method: "POST",
            body: JSON.stringify({
                inputs: text,
                parameters: { candidate_labels: ["logical and correct", "nonsense or incorrect"] }
            }),
        });
        
        const result = await response.json();
        
        // Handle "Model Loading" status (Error 503)
        if (result.estimated_time) {
            feedback.className = "feedback";
            feedback.style.display = "block";
            feedback.innerText = "AI is waking up... retrying in 5 seconds.";
            setTimeout(() => {
                btn.disabled = false;
                checkAI(mode);
            }, 5000); 
            return;
        }

        if (result.error) {
            // If the token is bad, reset it so they can re-enter it
            if (result.error.includes("token")) API_TOKEN = "";
            throw new Error(result.error);
        }

        // Logic Check Results
        const isLogical = result.labels[0] === "logical and correct";

        feedback.className = isLogical ? "feedback correct" : "feedback wrong";
        feedback.innerText = isLogical ? "Perfect! That is a logical use of the vocabulary." : "The AI suggests this sentence might be illogical or lacks context. Try again.";
        feedback.style.display = "block";

    } catch (e) {
        feedback.className = "feedback wrong";
        feedback.innerText = "Error: " + e.message;
        feedback.style.display = "block";
        console.error("AI Error:", e);
    } finally {
        // Only reset the button text if we aren't waiting for a retry
        if (btn.innerText !== "AI is waking up... retrying in 5 seconds.") {
             btn.innerText = mode === 'sentence' ? "Analyze Logic" : "Analyze Story";
             btn.disabled = false;
        }
    }
}

// Run the setup on startup
init();
