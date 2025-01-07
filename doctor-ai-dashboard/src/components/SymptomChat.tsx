'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaMicrophone, FaPaperPlane, FaRobot, FaUser } from 'react-icons/fa';

interface Message {
  id: string;
  text: string;
  type: 'user' | 'bot';
  timestamp: Date;
}

export function SymptomChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! Please describe your symptoms, and I'll help analyze them.",
      type: 'bot',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      type: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      const response = await fetch('/api/symptom-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });

      const data = await response.json();
      
      const botMessage: Message = {
        id: Date.now().toString(),
        text: data.response,
        type: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Failed to analyze symptoms:', error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Health Status Card */}
      <div className="bg-[#0A192F] rounded-xl p-6 mb-6 border border-[#1E3A5F]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#00B894]" />
            <h2 className="text-lg font-semibold text-[#E2E8F0]">Your health is in good condition</h2>
          </div>
          <button className="text-[#00B894] hover:text-[#00D1A7] transition-colors">
            Details →
          </button>
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div>
            <p className="text-[#94A3B8] mb-1">Heart Rate</p>
            <p className="text-2xl font-bold text-[#E2E8F0]">72<span className="text-lg font-normal text-[#94A3B8] ml-1">bpm</span></p>
          </div>
          <div>
            <p className="text-[#94A3B8] mb-1">Blood Pressure</p>
            <p className="text-2xl font-bold text-[#E2E8F0]">120/80<span className="text-lg font-normal text-[#94A3B8] ml-1">mmHg</span></p>
          </div>
          <div>
            <p className="text-[#94A3B8] mb-1">Sleep</p>
            <p className="text-2xl font-bold text-[#E2E8F0]">7.5<span className="text-lg font-normal text-[#94A3B8] ml-1">hrs</span></p>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 bg-[#0A192F] rounded-xl p-6 border border-[#1E3A5F]">
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto mb-4 space-y-4">
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`flex items-start gap-2 max-w-[80%] ${
                      message.type === 'user' ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <div className={`p-2 rounded-full ${
                      message.type === 'user' ? 'bg-[#00B894]' : 'bg-[#1E3A5F]'
                    }`}>
                      {message.type === 'user' ? (
                        <FaUser className="w-4 h-4 text-white" />
                      ) : (
                        <FaRobot className="w-4 h-4 text-[#00B894]" />
                      )}
                    </div>
                    <div
                      className={`p-4 rounded-2xl ${
                        message.type === 'user'
                          ? 'bg-[#00B894] text-white rounded-tr-none'
                          : 'bg-[#1E3A5F] text-[#E2E8F0] rounded-tl-none'
                      }`}
                    >
                      {message.text}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setIsRecording(!isRecording)}
              className={`p-3 rounded-full transition-colors ${
                isRecording
                  ? 'bg-red-500 text-white'
                  : 'bg-[#1E3A5F] text-[#00B894] hover:bg-[#2A4A6F]'
              }`}
            >
              <FaMicrophone className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Describe your symptoms..."
              className="flex-1 p-4 rounded-xl bg-[#1E3A5F] text-[#E2E8F0] placeholder-[#94A3B8] border border-transparent focus:border-[#00B894] transition-colors"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="p-3 rounded-full bg-[#00B894] text-white hover:bg-[#00D1A7] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <FaPaperPlane className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 