import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types';
import { getChatResponse } from '../services/geminiService';
import { ChatIcon, CloseIcon, SendIcon, BrainIcon } from './icons';

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isThinkingMode, setIsThinkingMode] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSend = async () => {
    if (input.trim() === '' || isLoading) return;

    // Fix: Use 'content' property for ChatMessage
    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await getChatResponse(input, isThinkingMode);
      // Fix: Use 'content' property for ChatMessage
      const modelMessage: ChatMessage = { role: 'model', content: response };
      setMessages(prev => [...prev, modelMessage]);
    } catch (error) {
      console.error('Gemini API error:', error);
      // Fix: Use 'content' property for ChatMessage
      const errorMessage: ChatMessage = {
        role: 'error',
        content: 'Lo siento, algo salió mal. Por favor, inténtalo de nuevo.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-transform transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 z-30"
        aria-label="Toggle Chatbot"
      >
        {isOpen ? <CloseIcon className="h-8 w-8" /> : <ChatIcon className="h-8 w-8" />}
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-full max-w-md h-[70vh] bg-panel rounded-xl shadow-2xl flex flex-col z-30 animate-fade-in-up">
          <header className="bg-indigo-600 text-white p-4 rounded-t-xl flex justify-between items-center">
            <h3 className="font-bold text-lg">Asistente IA</h3>
            <div className="flex items-center space-x-2">
                <span className={`text-xs font-medium ${isThinkingMode ? 'text-indigo-200' : 'text-white'}`}>Modo Pensamiento</span>
                <button
                    onClick={() => setIsThinkingMode(!isThinkingMode)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isThinkingMode ? 'bg-indigo-400' : 'bg-gray-400'}`}
                >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isThinkingMode ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
                {isThinkingMode && <BrainIcon className="w-5 h-5 text-white" />}
            </div>
          </header>

          <div className="flex-1 p-4 overflow-y-auto bg-tertiary">
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-xs md:max-w-sm px-4 py-2 rounded-2xl ${
                      msg.role === 'user' ? 'bg-indigo-500 text-white rounded-br-none' :
                      msg.role === 'model' ? 'bg-panel text-main rounded-bl-none' :
                      'bg-red-500 text-white rounded-bl-none'
                    }`}
                  >
                    {/* Fix: Use 'content' property for ChatMessage */}
                    <p className="text-sm break-words">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                  <div className="flex justify-start">
                      <div className="bg-panel text-main rounded-2xl rounded-bl-none p-2">
                          <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-subtle rounded-full animate-pulse"></div>
                              <div className="w-2 h-2 bg-subtle rounded-full animate-pulse [animation-delay:0.2s]"></div>
                              <div className="w-2 h-2 bg-subtle rounded-full animate-pulse [animation-delay:0.4s]"></div>
                          </div>
                      </div>
                  </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <footer className="p-4 border-t border-main bg-panel rounded-b-xl">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Haz una pregunta..."
                className="flex-1 px-4 py-2 text-sm border border-main rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-tertiary text-main"
              />
              <button
                onClick={handleSend}
                disabled={isLoading}
                className="bg-indigo-600 text-white p-3 rounded-full hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                aria-label="Send message"
              >
                <SendIcon className="h-5 w-5" />
              </button>
            </div>
          </footer>
        </div>
      )}
    </>
  );
};

export default Chatbot;