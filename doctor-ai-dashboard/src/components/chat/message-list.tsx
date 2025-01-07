import { motion } from 'framer-motion';
import { FaRobot, FaUser } from 'react-icons/fa';
import { Message } from './types';

interface MessageListProps {
  messages: Message[];
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export function MessageList({ messages, messagesEndRef }: MessageListProps) {
  return (
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
  );
} 