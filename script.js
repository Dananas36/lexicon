let API_TOKEN = ""; // Stays blank to prevent GitHub security warnings

const wordBank = [
    { word: "Alacrity", def: "Brisk and cheerful readiness.", ex: "He accepted the invitation with alacrity." },
    { word: "Anomalous", def: "Deviating from what is standard or expected.", ex: "The experiment yielded an anomalous result." },
    { word: "Laconic", def: "Using very few words.", ex: "His laconic reply suggested he was not interested in talking." },
    { word: "Ephemeral", def: "Lasting for a very short time.", ex: "The beauty of the sunset was ephemeral." },
    { word: "Sycophant", def: "A person who acts obsequiously toward someone important to gain advantage.", ex: "The CEO was surrounded by sycophants who never disagreed with him." }
];

let currentIndex = 0;
let learnedWords = [];

function init() {
    const data = wordBank[currentIndex];
    document.getElementById('current-word').innerText = data.word;
    document.getElementById('definition').innerText = data.def;
    document.getElementById('word-example').innerText = data.ex;
    document.querySelectorAll('.target-word').forEach(el => el.innerText = data.word);
}

function showSection(type) {
    document.getElementById('main-card').classList.add('hidden');
    document.getElementById(`${type}-section`).classList.remove('hidden');
    document.getElementById('learned-list').innerText = learnedWords.length > 0 ? learnedWords.join(", ") : "No words learned yet.";
}

function goBack() {
    document.querySelectorAll('section, main').forEach(el => el.classList.add('hidden'));
    document.getElementById('main-card').classList.remove('hidden');
    document.querySelectorAll('.feedback').forEach(f => f.style.display = 'none');
}

function markAsKnown() {
    if (!learnedWords.includes(wordBank[currentIndex].word)) {
        learnedWords.push(wordBank[currentIndex].word);
    }
    currentIndex = (currentIndex + 1) % wordBank.length;
    init();
    alert("Word added to your learned list!");
}

async function checkAI(mode) {
    const text = (mode === 'sentence') ? document.getElementById('user-sentence').value : document.getElementById('user-paragraph').value;
    const feedback = document.getElementById(`${mode}-feedback`);
    const btn = document.getElementById(mode === 'sentence' ? 'check-btn' : 'story-btn');

    if (!text.trim()) return;

    if (!API_TOKEN) {
        API_TOKEN = prompt("Enter your Hugging Face API Token (hf_...):");
        if (!API_TOKEN) return;
    }

    btn.innerText = "AI is thinking...";
    feedback.style.display = "none";
    
    try {
        // Using corsproxy.io to avoid the "Origin null" or CORS errors on GitHub
        const response = await fetch("https://corsproxy.io/?https://api-inference.huggingface.co/models/facebook/bart-large-mnli", {
            headers: { Authorization: `Bearer ${API_TOKEN}` },
            method: "POST",
            body: JSON.stringify({
                inputs: text,
                parameters: { candidate_labels: ["logical and correct", "nonsense or incorrect"] }
            }),
        });
        
        const result = await response.json();
        
        if (result.error) throw new Error(result.error);

        const isLogical = result.labels[0] === "logical and correct";

        feedback.className = isLogical ? "feedback correct" : "feedback wrong";
        feedback.innerText = isLogical ? "Perfect! That is a logical use of the vocabulary." : "The AI suggests this sentence might be illogical. Try again.";
        feedback.style.display = "block";
    } catch (e) {
        feedback.className = "feedback wrong";
        feedback.innerText = "Error: Check your token or the AI is busy. Try again in 10s.";
        feedback.style.display = "block";
        API_TOKEN = ""; // Reset token so user can re-enter if wrong
    } finally {
        btn.innerText = mode === 'sentence' ? "Analyze Logic" : "Analyze Story";
    }
}

// Start the app
init();
