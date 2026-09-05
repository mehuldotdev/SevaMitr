'use client';

import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { speakInstruction, stopSpeaking, SupportedLanguage, LANGUAGE_LABELS } from '@/lib/audio/speechHelper';

interface VoicePromptProps {
  instructionText: string;
  language?: SupportedLanguage;
  label?: string;
  size?: 'normal' | 'large';
}

export function VoicePromptButton({
  instructionText,
  language = 'as',
  label,
  size = 'normal',
}: VoicePromptProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const handleSpeak = () => {
    if (isPlaying) {
      stopSpeaking();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
      speakInstruction(instructionText, language);
      
      // Reset state after estimated speaking duration
      const durationMs = Math.max(3000, (instructionText.length / 10) * 1000);
      setTimeout(() => {
        setIsPlaying(false);
      }, durationMs);
    }
  };

  const buttonLabel = label || LANGUAGE_LABELS[language]?.sunoText || 'Listen';

  return (
    <button
      onClick={handleSpeak}
      className="btn-voice-listen"
      style={{
        padding: size === 'large' ? '0.75rem 1.5rem' : '0.5rem 1rem',
        fontSize: size === 'large' ? '1.2rem' : '0.95rem',
        background: isPlaying ? '#fff176' : '#fff9c4',
        border: '2px solid #fbc02d',
      }}
      aria-label="Listen to voice instructions"
      title="Click to hear instructions out loud"
    >
      {isPlaying ? (
        <>
          <VolumeX size={size === 'large' ? 24 : 18} />
          <span>Stop</span>
        </>
      ) : (
        <>
          <Volume2 size={size === 'large' ? 24 : 18} className="gentle-pulse" />
          <span>{buttonLabel} (Audio)</span>
        </>
      )}
    </button>
  );
}
