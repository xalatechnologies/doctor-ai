import { FaRegPaperPlane } from 'react-icons/fa';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
}

export function ChatInput({ value, onChange, onSend }: ChatInputProps) {
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSend();
    }
  };

  return (
    <div className="p-4 border-t border-border/30 bg-card/50 backdrop-blur">
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          className="chat-input flex-1 p-2 rounded-lg focus:outline-none"
        />
        <button
          onClick={onSend}
          className="chat-send-button p-2 text-white rounded-lg"
        >
          <FaRegPaperPlane className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
} 