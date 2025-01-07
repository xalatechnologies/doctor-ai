'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaRobot } from 'react-icons/fa';
import { ChatHeader } from './chat-header';
import { MessageList } from './message-list';
import { ChatInput } from './chat-input';
import { useChat } from '@/hooks/use-chat';

export function ChatFeature() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    messages,
    inputMessage,
    setInputMessage,
    handleSendMessage,
    messagesEndRef,
  } = useChat();

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
            <ChatHeader onClose={() => setIsOpen(false)} />
            <MessageList messages={messages} messagesEndRef={messagesEndRef} />
            <ChatInput
              value={inputMessage}
              onChange={setInputMessage}
              onSend={handleSendMessage}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 