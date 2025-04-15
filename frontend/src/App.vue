<template>
  <div id="app">
    <div id="chat" ref="chatRef">
      <div
          v-for="(msg, index) in messages"
          :key="index"
          class="chat-line"
      >
        <b :class="[msg.source === 'youtube' ? 'color-youtube': 'color-twitch']">[{{ msg.source }}]</b>
        <b class="user-name">{{ msg.user }}</b>: {{ msg.message }}
      </div>
    </div>

    <small class="release-label">Release v.1.1.0</small>
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
  margin-bottom: 8px;
}
@keyframes fadeIn {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.color-youtube {
  background-color: #FF0000;
  padding: 3px;
  display: inline-block;
}
.color-twitch {
  background-color: #9146FF;
  padding: 3px;
  display: inline-block;
}
.user-name {
  margin-inline-start: 5px;
}
.release-label {
  color: #b7b7b7;
}
</style>
