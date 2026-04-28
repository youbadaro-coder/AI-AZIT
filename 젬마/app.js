const chatMessages = document.getElementById('chatMessages');
const userInput = document.getElementById('userInput');
const sendBtn = document.getElementById('sendBtn');
const clearChat = document.getElementById('clearChat');
const settingsToggle = document.getElementById('settingsToggle');
const settingsPanel = document.getElementById('settingsPanel');
const closeSettings = document.getElementById('closeSettings');
const modelSelect = document.getElementById('modelSelect');
const temperatureInput = document.getElementById('temperature');
const tempValue = document.getElementById('tempValue');
const currentModelSpan = document.getElementById('currentModel');

let messages = [];
let isGenerating = false;

// Auto-resize textarea
userInput.addEventListener('input', () => {
    userInput.style.height = 'auto';
    userInput.style.height = userInput.scrollHeight + 'px';
});

// Settings Handlers
settingsToggle.addEventListener('click', () => settingsPanel.classList.toggle('hidden'));
closeSettings.addEventListener('click', () => settingsPanel.classList.add('hidden'));
temperatureInput.addEventListener('input', (e) => {
    tempValue.textContent = e.target.value;
});

// Add message to UI
function addMessage(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    contentDiv.innerHTML = content.replace(/\n/g, '<br>');
    
    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    return contentDiv;
}

// Send message to Ollama
async function sendMessage() {
    const text = userInput.value.trim();
    if (!text || isGenerating) return;

    // Reset input
    userInput.value = '';
    userInput.style.height = 'auto';
    
    // Add user message to UI and state
    addMessage('user', text);
    messages.push({ role: 'user', content: text });
    
    isGenerating = true;
    sendBtn.disabled = true;
    
    // Prepare AI response container
    const aiContentDiv = addMessage('ai', '...');
    let aiResponse = '';

    try {
        const response = await fetch('http://localhost:11434/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: modelSelect.value,
                messages: messages,
                stream: true,
                options: {
                    temperature: parseFloat(temperatureInput.value)
                }
            })
        });

        if (!response.ok) throw new Error('Ollama connection failed');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        aiContentDiv.innerHTML = ''; // Clear the "..."

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            
            for (const line of lines) {
                if (!line) continue;
                try {
                    const json = JSON.parse(line);
                    if (json.message && json.message.content) {
                        aiResponse += json.message.content;
                        // Simple markdown-ish bold/italic or just line breaks
                        aiContentDiv.innerHTML = aiResponse.replace(/\n/g, '<br>');
                        chatMessages.scrollTop = chatMessages.scrollHeight;
                    }
                } catch (e) {
                    console.error('Error parsing chunk', e);
                }
            }
        }

        messages.push({ role: 'assistant', content: aiResponse });

    } catch (error) {
        console.error('Error:', error);
        aiContentDiv.innerHTML = `<span style="color: #ff5252;">에러: Ollama 서버에 연결할 수 없습니다. (${error.message})</span>`;
    } finally {
        isGenerating = false;
        sendBtn.disabled = false;
    }
}

// Event Listeners
sendBtn.addEventListener('click', sendMessage);
userInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

clearChat.addEventListener('click', () => {
    chatMessages.innerHTML = '';
    messages = [];
    addMessage('system-message', '대화가 초기화되었습니다.');
});

// Fetch available models from Ollama
async function fetchModels() {
    try {
        const response = await fetch('http://localhost:11434/api/tags');
        if (response.ok) {
            const data = await response.json();
            modelSelect.innerHTML = '';
            
            // Prioritize gemma4 if available
            let defaultModel = data.models.length > 0 ? data.models[0].name : 'gemma';
            const hasGemma4 = data.models.find(m => m.name.includes('gemma4'));
            if (hasGemma4) defaultModel = hasGemma4.name;

            data.models.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m.name;
                opt.textContent = m.name;
                if (m.name === defaultModel) opt.selected = true;
                modelSelect.appendChild(opt);
            });
            
            currentModelSpan.textContent = defaultModel;
            modelSelect.value = defaultModel;
        }
    } catch (e) {
        console.warn('Could not fetch models initially');
    }
}

// Initial load
fetchModels();
// Update status dot periodically
setInterval(async () => {
    const dot = document.querySelector('.status-dot');
    const text = document.querySelector('.status-text');
    try {
        const res = await fetch('http://localhost:11434/api/tags');
        if (res.ok) {
            dot.className = 'status-dot online';
            text.textContent = 'Ollama: Online';
        } else {
            throw new Error();
        }
    } catch (e) {
        dot.className = 'status-dot';
        text.textContent = 'Ollama: Offline';
    }
}, 5000);
