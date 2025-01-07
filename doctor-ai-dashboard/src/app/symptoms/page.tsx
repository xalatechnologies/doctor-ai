import { SymptomChat } from '@/components/SymptomChat';

export default function SymptomsPage() {
  return (
    <div className="h-[calc(100vh-4rem)]">
      <h1 className="text-2xl font-bold text-[#E2E8F0] mb-6">Symptom Analysis</h1>
      <SymptomChat />
    </div>
  );
} 