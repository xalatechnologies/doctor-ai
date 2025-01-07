'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IoMdClose } from 'react-icons/io';
import { FaRegPaperPlane, FaRobot, FaUser } from 'react-icons/fa';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export function ChatFeature() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Initialize WebSocket connection
    ws.current = new WebSocket('ws://api.doctorai.com/chat');

    ws.current.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        text: message.text,
        sender: 'ai',
        timestamp: new Date()
      }]);
    };

    return () => {
      ws.current?.close();
    };
  }, []);

  useEffect(() => {
    // Scroll to bottom on new messages
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user' as const,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    ws.current?.send(JSON.stringify({ message: inputMessage }));
    setInputMessage('');
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary-dark transition-colors"
            onClick={() => setIsOpen(true)}
          >
            <FaRobot className="w-6 h-6" />
          </motion.button>
        )}

        {isOpen && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="chat-window rounded-lg w-96 h-[600px] flex flex-col"
          >
            {/* Chat Header */}
            <div className="p-4 border-b border-border flex justify-between items-center bg-primary/90 backdrop-blur text-white rounded-t-lg">
              <div className="flex items-center gap-2">
                <FaRobot className="w-5 h-5" />
                <h3 className="font-semibold">Doctor AI Assistant</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <IoMdClose className="w-6 h-6" />
              </button>
            </div>

            {/* Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ x: message.sender === 'user' ? 20 : -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`chat-message max-w-[80%] p-3 rounded-lg ${
                      message.sender === 'user'
                        ? 'bg-primary/90 text-white rounded-br-none'
                        : 'bg-muted/80 text-foreground rounded-bl-none'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {message.sender === 'user' ? (
                        <FaUser className="w-4 h-4" />
                      ) : (
                        <FaRobot className="w-4 h-4" />
                      )}
                      <span className="text-xs opacity-75">
                        {message.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p>{message.text}</p>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-border/30 bg-card/50 backdrop-blur">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your message..."
                  className="chat-input flex-1 p-2 rounded-lg focus:outline-none"
                />
                <button
                  onClick={handleSendMessage}
                  className="chat-send-button p-2 text-white rounded-lg"
                >
                  <FaRegPaperPlane className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 