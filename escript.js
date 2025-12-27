let API_TOKEN = ""; // Stays empty. The site will ask you for it.

const wordBank = [
    { word: "Alacrity", def: "Brisk and cheerful readiness.", ex: "He accepted the challenge with alacrity." },
    { word: "Anomalous", def: "Deviating from what is standard.", ex: "An anomalous result in the experiment." },
    { word: "Laconic", def: "Using very few words.", ex: "His laconic reply meant 'no'." }
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
    document.getElementById('learned-list').innerText = learnedWords.join(", ");
}

function goBack() {
    document.querySelectorAll('section, main').forEach(el => el.classList.add('hidden'));
    document.getElementById('main-card').classList.remove('hidden');
}

function markAsKnown() {
    if (!learnedWords.includes(wordBank[currentIndex].word)) {
        learnedWords.push(wordBank[currentIndex].word);
    }
    currentIndex = (currentIndex + 1) % wordBank.length;
    init();
}

async function checkAI(mode) {
    const text = (mode === 'sentence') ? document.getElementById('user-sentence').value : document.getElementById('user-paragraph').value;
    const feedback = document.getElementById(`${mode}-feedback`);

    if (!API_TOKEN) {
        API_TOKEN = prompt("Enter your Hugging Face API Token (hf_...):");
        if (!API_TOKEN) return;
    }

    feedback.innerText = "Analyzing...";
    
    try {
        const response = await fetch("https://corsproxy.io/?https://api-inference.huggingface.co/models/facebook/bart-large-mnli", {
            headers: { Authorization: `Bearer ${API_TOKEN}` },
            method: "POST",
            body: JSON.stringify({
                inputs: text,
                parameters: { candidate_labels: ["logical", "nonsense"] }
            }),
        });
        
        const result = await response.json();
        const isLogical = result.labels[0] === "logical";

        feedback.className = isLogical ? "feedback correct" : "feedback wrong";
        feedback.innerText = isLogical ? "Great! This makes sense." : "This seems illogical. Try again.";
    } catch (e) {
        feedback.innerText = "Error. Check your token or connection.";
        API_TOKEN = ""; 
    }
}

init();
