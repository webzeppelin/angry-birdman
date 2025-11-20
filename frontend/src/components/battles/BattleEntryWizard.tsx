import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import ActionCodeAssignment from './ActionCodeAssignment';
import BattleMetadataForm from './BattleMetadataForm';
import BattleReview from './BattleReview';
import NonplayerManagement from './NonplayerManagement';
import PerformanceDataForm from './PerformanceDataForm';
import PlayerPerformanceTable from './PlayerPerformanceTable';

import type { BattleEntry } from '@angrybirdman/common';

interface BattleEntryWizardProps {
  clanId: number;
  onSubmit: (data: BattleEntry) => Promise<{ battleId: string } | void>;
  initialData?: Partial<BattleEntry>;
  mode?: 'create' | 'edit';
}

interface DraftData {
  savedAt: string;
  currentStep: number;
  data: Partial<BattleEntry>;
}

const STEPS = [
  { id: 1, name: 'Battle Info', component: 'metadata' },
  { id: 2, name: 'Performance', component: 'performance' },
  { id: 3, name: 'Player Stats', component: 'players' },
  { id: 4, name: 'Non-Players', component: 'nonplayers' },
  { id: 5, name: 'Action Codes', component: 'actions' },
  { id: 6, name: 'Review', component: 'review' },
];

export default function BattleEntryWizard({
  clanId,
  onSubmit,
  initialData,
  mode = 'create',
}: BattleEntryWizardProps) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [battleData, setBattleData] = useState<Partial<BattleEntry>>(initialData || {});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-save draft to sessionStorage
  useEffect(() => {
    if (mode === 'create') {
      const draftKey = `battle-draft-${clanId}`;
      const draftData: DraftData = {
        savedAt: new Date().toISOString(),
        currentStep,
        data: battleData,
      };
      sessionStorage.setItem(draftKey, JSON.stringify(draftData));
    }
  }, [battleData, currentStep, clanId, mode]);

  // Restore draft on mount
  useEffect(() => {
    if (mode === 'create' && !initialData) {
      const draftKey = `battle-draft-${clanId}`;
      const savedDraft = sessionStorage.getItem(draftKey);
      if (savedDraft) {
        try {
          const draft = JSON.parse(savedDraft) as DraftData;
          const savedAt = new Date(draft.savedAt);
          const now = new Date();
          const daysSince = (now.getTime() - savedAt.getTime()) / (1000 * 60 * 60 * 24);

          // Only restore if draft is less than 7 days old
          if (daysSince < 7 && draft.data && Object.keys(draft.data).length > 0) {
            const shouldRestore = window.confirm(
              `A draft from ${savedAt.toLocaleDateString()} was found. Would you like to resume?`
            );
            if (shouldRestore) {
              setBattleData(draft.data);
              setCurrentStep(draft.currentStep || 1);
            } else {
              sessionStorage.removeItem(draftKey);
            }
          } else if (daysSince >= 7) {
            // Remove expired draft
            sessionStorage.removeItem(draftKey);
          }
        } catch (error) {
          console.error('Error restoring draft:', error);
          sessionStorage.removeItem(draftKey);
        }
      }
    }
  }, [clanId, mode, initialData]);

  const updateBattleData = (updates: Partial<BattleEntry>) => {
    setBattleData((prev) => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleJumpToStep = (step: number) => {
    setCurrentStep(step);
  };

  const handleSubmitBattle = async () => {
    setIsSubmitting(true);
    try {
      const result = await onSubmit(battleData as BattleEntry);
      // Clear draft on successful submit
      if (mode === 'create') {
        const draftKey = `battle-draft-${clanId}`;
        sessionStorage.removeItem(draftKey);
      }
      // Navigate to battle details if we got a battleId, otherwise to battle list
      if (result && result.battleId) {
        navigate(`/clans/${clanId}/battles/${result.battleId}`);
      } else {
        navigate(`/clans/${clanId}/battles`);
      }
    } catch (error) {
      console.error('Error submitting battle:', error);
      alert('Failed to submit battle. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    const shouldCancel = window.confirm(
      'Are you sure you want to cancel? Your progress will be saved as a draft.'
    );
    if (shouldCancel) {
      navigate(`/clans/${clanId}/battles`);
    }
  };

  const renderStep = () => {
    const step = STEPS[currentStep - 1];
    if (!step) return null;

    switch (step.component) {
      case 'metadata':
        return (
          <BattleMetadataForm
            clanId={clanId}
            data={battleData}
            onUpdate={updateBattleData}
            onNext={handleNext}
            onCancel={handleCancel}
          />
        );
      case 'performance':
        return (
          <PerformanceDataForm
            data={battleData}
            onUpdate={updateBattleData}
            onNext={handleNext}
            onBack={handleBack}
            onCancel={handleCancel}
          />
        );
      case 'players':
        return (
          <PlayerPerformanceTable
            clanId={clanId}
            data={battleData}
            onUpdate={updateBattleData}
            onNext={handleNext}
            onBack={handleBack}
            onCancel={handleCancel}
          />
        );
      case 'nonplayers':
        return (
          <NonplayerManagement
            clanId={clanId}
            data={battleData}
            onUpdate={updateBattleData}
            onNext={handleNext}
            onBack={handleBack}
            onCancel={handleCancel}
          />
        );
      case 'actions':
        return (
          <ActionCodeAssignment
            clanId={clanId}
            data={battleData}
            onUpdate={updateBattleData}
            onNext={handleNext}
            onBack={handleBack}
            onCancel={handleCancel}
          />
        );
      case 'review':
        return (
          <BattleReview
            data={battleData}
            onJumpToStep={handleJumpToStep}
            onSubmit={() => void handleSubmitBattle()}
            onBack={handleBack}
            onCancel={handleCancel}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <button
                type="button"
                onClick={() => {
                  handleJumpToStep(step.id);
                }}
                className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold transition-colors ${
                  currentStep === step.id
                    ? 'bg-primary text-white'
                    : currentStep > step.id
                      ? 'bg-secondary hover:bg-secondary-dark cursor-pointer text-white'
                      : 'cursor-not-allowed bg-gray-300 text-gray-600'
                }`}
                disabled={currentStep < step.id}
              >
                {step.id}
              </button>
              {index < STEPS.length - 1 && (
                <div
                  className={`mx-2 h-1 w-16 ${
                    currentStep > step.id ? 'bg-secondary' : 'bg-gray-300'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-sm">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={`text-center ${
                currentStep === step.id
                  ? 'text-primary font-semibold'
                  : currentStep > step.id
                    ? 'text-secondary'
                    : 'text-gray-500'
              }`}
              style={{ width: '120px' }}
            >
              {step.name}
            </div>
          ))}
        </div>
      </div>

      {/* Current Step Content */}
      <div className="rounded-lg bg-white p-6 shadow-md">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">
          {STEPS[currentStep - 1]?.name || 'Battle Entry'}
        </h2>
        {renderStep()}
      </div>
    </div>
  );
}
