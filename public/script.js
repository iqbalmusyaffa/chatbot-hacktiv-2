const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

const fileInput = document.getElementById('file-upload');
const fileInfo = document.getElementById('file-info');
const fileNameSpan = document.getElementById('file-name');
const removeFileBtn = document.getElementById('remove-file');

const conversationHistory = [];

// --- File Upload UI ---
fileInput.addEventListener('change', () => {
  if (fileInput.files.length > 0) {
    fileNameSpan.textContent = fileInput.files[0].name;
    fileInfo.classList.remove('hidden');
    input.placeholder = "Tambahkan instruksi untuk file ini...";
  } else {
    fileInfo.classList.add('hidden');
    input.placeholder = "Type your message or ask about a file...";
  }
});

removeFileBtn.addEventListener('click', () => {
  fileInput.value = '';
  fileInfo.classList.add('hidden');
  fileNameSpan.textContent = '';
  input.placeholder = "Type your message or ask about a file...";
});

// --- Logika Chat ---
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const userMessage = input.value.trim();
  const uploadedFile = fileInput.files[0];
  if (!userMessage && !uploadedFile) return;

  input.disabled = true;
  form.querySelector('button').disabled = true;

  const isMultimodal = !!uploadedFile;
  const endpoint = isMultimodal ? '/gemini/generate' : '/chat';
  let requestBody;

  if (isMultimodal) {
    const formData = new FormData();
    formData.append('prompt', userMessage || 'Describe or summarize this file.');
    formData.append('file', uploadedFile);
    requestBody = formData;
  } else {
    conversationHistory.push({ role: 'user', text: userMessage });
    requestBody = JSON.stringify({ conversation: conversationHistory });
  }

  appendMessage('user', userMessage || `[File: ${uploadedFile.name}]`, uploadedFile);
  input.value = '';

  const thinkingElement = appendMessage('bot', 'Gemini is thinking...', null, true);

  try {
    const fetchOptions = { method: 'POST' };
    if (isMultimodal) {
      fetchOptions.body = requestBody;
    } else {
      fetchOptions.headers = { 'Content-Type': 'application/json' };
      fetchOptions.body = requestBody;
    }

    const response = await fetch(endpoint, fetchOptions);
    const data = await response.json();
    const resultText = data.data || data.response || data.error || "Failed to get response.";

    chatBox.removeChild(thinkingElement);

    if (response.ok && (data.success || data.response)) {
      if (!isMultimodal) conversationHistory.push({ role: 'model', text: resultText });
      animateTyping('bot', resultText);
    } else {
      if (!isMultimodal) conversationHistory.pop();
      appendMessage('bot', `Error: ${resultText}`);
    }
  } catch (error) {
    chatBox.removeChild(thinkingElement);
    if (!isMultimodal) conversationHistory.pop();
    console.error(error);
    appendMessage('bot', '⚠️ Oops! Something went wrong.');
  } finally {
    input.disabled = false;
    form.querySelector('button').disabled = false;
    fileInput.value = '';
    fileInfo.classList.add('hidden');
    input.placeholder = "Type your message or ask about a file...";
  }
});

function appendMessage(sender, text, file = null, isThinking = false) {
  const msgContainer = document.createElement('div');
  msgContainer.classList.add('flex', 'flex-col', 'mb-3', 'w-full', 'opacity-0', 'transition-opacity', 'duration-300');

  if (sender === 'user') msgContainer.classList.add('items-end');
  else msgContainer.classList.add('items-start');

  if (file && sender === 'user') {
    const filePreview = document.createElement('div');
    filePreview.classList.add('mb-2', 'p-2', 'border', 'border-gray-300', 'rounded-lg', 'bg-gray-50', 'max-w-xs');
    if (file.type.startsWith('image/')) {
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.alt = file.name;
      img.classList.add('rounded-lg', 'max-h-48', 'object-cover');
      filePreview.appendChild(img);
    } else {
      filePreview.textContent = `📄 ${file.name}`;
    }
    msgContainer.appendChild(filePreview);
  }

  const msgText = document.createElement('div');
  msgText.classList.add('px-4', 'py-2', 'rounded-2xl', 'max-w-xs', 'break-words', 'shadow-sm', 'animate-fadeIn');

  if (isThinking) {
    msgText.textContent = text;
    msgText.classList.add('italic', 'text-gray-500');
  } else if (sender === 'user') {
    msgText.textContent = text;
    msgText.classList.add('bg-blue-600', 'text-white', 'rounded-br-none');
  } else {
    msgText.textContent = text;
    msgText.classList.add('bg-gray-200', 'text-gray-800', 'rounded-bl-none');
  }

  msgContainer.appendChild(msgText);
  chatBox.appendChild(msgContainer);

  setTimeout(() => msgContainer.classList.remove('opacity-0'), 50);
  chatBox.scrollTop = chatBox.scrollHeight;

  return msgContainer;
}

// Efek mengetik bot
function animateTyping(sender, fullText) {
  const msgContainer = document.createElement('div');
  msgContainer.classList.add('flex', 'flex-col', 'mb-3', 'items-start');

  const msgText = document.createElement('div');
  msgText.classList.add('px-4', 'py-2', 'rounded-2xl', 'max-w-xs', 'bg-gray-200', 'text-gray-800', 'shadow-sm', 'rounded-bl-none', 'whitespace-pre-line');
  msgContainer.appendChild(msgText);
  chatBox.appendChild(msgContainer);

  let i = 0;
  const typingInterval = setInterval(() => {
    msgText.textContent = fullText.slice(0, i++);
    chatBox.scrollTop = chatBox.scrollHeight;
    if (i > fullText.length) clearInterval(typingInterval);
  }, 25);
}
