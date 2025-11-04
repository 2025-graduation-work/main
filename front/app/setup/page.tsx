'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OnboardingStep } from '@/app/components/setup/OnboardingStep';
import { NicknameStep } from '@/app/components/setup/NicknameStep';
import { DestinationStep } from '@/app/components/setup/DestinationStep';
import { FrequencyStep } from '@/app/components/setup/FrequencyStep';
import { CompletionStep } from '@/app/components/setup/CompletionStep';
import { Button } from '@/app/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { UserData, Destination } from '@/app/lib/types';

const TOTAL_STEPS = 5;

export default function Setup() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [nickname, setNickname] = useState('');
  const [firstDestination, setFirstDestination] = useState<Omit<Destination, 'id' | 'createdAt'> | null>(null);

  useEffect(() => {
    // すでにセットアップ済みの場合はホームへ
    if (typeof window !== 'undefined') {
      const userData = sessionStorage.getItem('userData');
      if (userData) {
        router.push('/home');
      }
    }
  }, [router]);

  const canGoNext = () => {
    switch (currentStep) {
      case 1: // Onboarding
        return true;
      case 2: // Nickname
        return nickname.trim().length > 0;
      case 3: // Destination
        return firstDestination !== null;
      case 4: // Frequency
        return firstDestination !== null && 
               firstDestination.frequency.days.length > 0;
      case 5: // Completion
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep === TOTAL_STEPS) {
      // Save data and navigate to home
      const userData: UserData = {
        nickname,
        destinations: firstDestination ? [{
          ...firstDestination,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        }] : [],
      };
      sessionStorage.setItem('userData', JSON.stringify(userData));
      router.push('/home');
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <OnboardingStep />;
      case 2:
        return <NicknameStep nickname={nickname} setNickname={setNickname} />;
      case 3:
        return (
          <DestinationStep
            destination={firstDestination}
            setDestination={setFirstDestination}
          />
        );
      case 4:
        return (
          <FrequencyStep
            destination={firstDestination}
            setDestination={setFirstDestination}
          />
        );
      case 5:
        return <CompletionStep nickname={nickname} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
      <div className="max-w-3xl mx-auto px-4 py-3 h-screen flex flex-col">
        {/* Progress Bar */}
        <div className="mb-3 flex-shrink-0">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-gray-600">
              ステップ {currentStep} / {TOTAL_STEPS}
            </span>
            <span className="text-xs text-gray-600">
              {Math.round((currentStep / TOTAL_STEPS) * 100)}%
            </span>
          </div>
          <div className="h-1.5 bg-white/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 transition-all duration-300"
              style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 flex items-center justify-center">
          {renderStep()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center pt-3 flex-shrink-0">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            もどる
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canGoNext()}
            className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            {currentStep === TOTAL_STEPS ? '完了' : 'つぎへ'}
            {currentStep !== TOTAL_STEPS && <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
