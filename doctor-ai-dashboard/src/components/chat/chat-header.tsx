import { FaRobot } from 'react-icons/fa';
import { IoMdClose } from 'react-icons/io';

interface ChatHeaderProps {
  onClose: () => void;
}

export function ChatHeader({ onClose }: ChatHeaderProps) {
  return (
    <div className="p-4 border-b border-border flex justify-between items-center bg-primary/90 backdrop-blur text-white rounded-t-lg">
      <div className="flex items-center gap-2">
        <FaRobot className="w-5 h-5" />
        <h3 className="font-semibold">Doctor AI Assistant</h3>
      </div>
      <button
        onClick={onClose}
        className="text-white/80 hover:text-white transition-colors"
      >
        <IoMdClose className="w-6 h-6" />
      </button>
    </div>
  );
} 