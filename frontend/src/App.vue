<template>
  <div id="app">
    <div id="chat" ref="chatRef">
      <div
          v-for="(msg, index) in messages"
          :key="index"
          class="chat-line"
      >
        <b>[{{ msg.source }}] {{ msg.user }}:</b> {{ msg.message }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, nextTick } from 'vue';
import { io } from 'socket.io-client';

interface IChatPayload {
  source: 'twitch' | 'youtube' | 'chimera';
  user: string;
  message: string;
  timestamp: string;
  avatar?: string | null;
}

const chatRef = ref<HTMLDivElement | null>(null);
const messages = ref<IChatPayload[]>([]);
const socket = io(import.meta.env.VITE_BACKEND_URL);

const scrollToBottom = () => {
  nextTick(() => {
    chatRef.value?.scrollTo({
      top: chatRef.value.scrollHeight,
      behavior: 'smooth',
    });
  });
}

onMounted(() => {
  const history = JSON.parse(localStorage.getItem('chimera-chat') || '[]');
  messages.value = history;

  socket.on('chatMessage', (msg: IChatPayload) => {
    messages.value.push(msg);
    localStorage.setItem('chimera-chat', JSON.stringify(messages.value.slice(-200)));
    scrollToBottom();
  });
});
</script>

<style>
#chat {
  max-height: 500px;
  overflow-y: auto;
  padding: 10px;
  background: #111;
  color: white;
  font-family: sans-serif;
}
.chat-line {
  opacity: 0;
  transform: translateY(10px);
  animation: fadeIn 0.3s ease forwards;
  margin-bottom: 4px;
}
@keyframes fadeIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
