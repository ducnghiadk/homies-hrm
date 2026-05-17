'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  initCareerPathStores, getOnboardingSteps, getEmployeeOnboarding,
  startOnboarding, completeOnboardingStep,
} from '@/lib/career-path-service';
import type { OnboardingStep, EmployeeOnboarding } from '@/lib/career-path-types';
import ProgressRing from '@/components/career-path/ProgressRing';
import TimelineView, { type TimelineItem } from '@/components/career-path/TimelineView';

export default function OnboardingPage() {
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [progress, setProgress] = useState<EmployeeOnboarding | null>(null);
  const empId = 'emp-003'; // Trial employee

  const reload = () => {
    setSteps(getOnboardingSteps());
    setProgress(getEmployeeOnboarding(empId));
  };

  useEffect(() => {
    initCareerPathStores();
    reload();
  }, []);

  const handleComplete = (stepId: string) => {
    completeOnboardingStep(empId, stepId);
    reload();
  };

  const handleStart = () => {
    startOnboarding(empId);
    reload();
  };

  if (!progress) {
    return (
      <div style={{ padding: '16px 16px 80px', maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <Link href="/career-path" style={{ fontSize: 20, textDecoration: 'none' }}>←</Link>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>📋 Onboarding</h1>
        </div>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🌱</div>
        <h2 style={{ fontSize: 18, fontWeight: 600 }}>Chào mừng bạn!</h2>
        <p style={{ fontSize: 13, color: '#888', marginBottom: 20 }}>Hoàn thành onboarding để bắt đầu hành trình sự nghiệp.</p>
        <button onClick={handleStart} style={{
          padding: '12px 24px', borderRadius: 10, border: 'none',
          background: 'linear-gradient(135deg, #667eea, #764ba2)', color: '#fff',
          fontSize: 14, fontWeight: 700, cursor: 'pointer',
        }}>🚀 Bắt đầu Onboarding</button>
      </div>
    );
  }

  const timelineItems: TimelineItem[] = steps.map(step => {
    const sp = progress.steps_progress.find(s => s.step_id === step.id);
    const status: TimelineItem['status'] = sp?.status === 'completed' ? 'completed' : sp?.status === 'in_progress' ? 'current' : 'upcoming';
    return {
      id: step.id, icon: step.type === 'video' ? '🎬' : step.type === 'quiz' ? '📝' : step.type === 'task' ? '✋' : step.type === 'checkin' ? '📍' : '📄',
      title: step.title,
      subtitle: `${step.estimated_minutes} phút${step.required ? '' : ' (tùy chọn)'}`,
      date: sp?.completed_at || '',
      status,
    };
  });

  return (
    <div style={{ padding: '16px 16px 80px', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Link href="/career-path" style={{ fontSize: 20, textDecoration: 'none' }}>←</Link>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>📋 Onboarding</h1>
      </div>

      {/* Progress Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16, padding: 16, borderRadius: 14,
        background: 'linear-gradient(135deg, #a8edea, #fed6e3)', marginBottom: 16,
      }}>
        <ProgressRing value={progress.overall_progress} size={76} strokeWidth={6} color="#667eea" bgColor="rgba(0,0,0,0.08)" />
        <div>
          <div style={{ fontSize: 15, fontWeight: 700 }}>{progress.overall_progress}% hoàn thành</div>
          <div style={{ fontSize: 12, color: '#555' }}>
            {progress.steps_progress.filter(s => s.status === 'completed').length}/{progress.steps_progress.length} bước
          </div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>
            Bắt đầu: {progress.started_at}
          </div>
        </div>
      </div>

      {/* Steps Timeline */}
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px' }}>Các bước onboarding</h2>
        {steps.map((step, i) => {
          const sp = progress.steps_progress.find(s => s.step_id === step.id);
          const isDone = sp?.status === 'completed';
          const isCurrent = sp?.status === 'in_progress';
          const isPending = sp?.status === 'pending';

          return (
            <div key={step.id} style={{
              display: 'flex', gap: 12, marginBottom: 10, padding: 12, borderRadius: 12,
              background: isDone ? '#e8f5e9' : isCurrent ? '#e3f2fd' : '#fafafa',
              border: `1px solid ${isDone ? '#c8e6c9' : isCurrent ? '#bbdefb' : '#eee'}`,
              opacity: isPending ? 0.6 : 1,
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
                background: isDone ? '#4caf50' : isCurrent ? '#2196F3' : '#e0e0e0', color: isDone || isCurrent ? '#fff' : '#888',
              }}>
                {isDone ? '✓' : i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 14 }}>
                    {step.type === 'video' ? '🎬' : step.type === 'quiz' ? '📝' : step.type === 'task' ? '✋' : step.type === 'checkin' ? '📍' : '📄'}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{step.title}</span>
                  {!step.required && <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 6, background: '#fff9c4', color: '#f57f17' }}>Tùy chọn</span>}
                </div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{step.description}</div>
                <div style={{ fontSize: 10, color: '#aaa', marginTop: 3 }}>⏱ {step.estimated_minutes} phút</div>
                {sp?.score !== undefined && <div style={{ fontSize: 11, color: '#4caf50', marginTop: 2 }}>Điểm: {sp.score}/100</div>}
                {isCurrent && (
                  <button onClick={() => handleComplete(step.id)} style={{
                    marginTop: 6, padding: '4px 12px', borderRadius: 6, border: 'none',
                    background: '#2196F3', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  }}>
                    ✅ Hoàn thành
                  </button>
                )}
                {isPending && i === progress.steps_progress.findIndex(s => s.status !== 'completed' && s.status !== 'skipped') && !progress.steps_progress.some(s => s.status === 'in_progress') && (
                  <button onClick={() => handleComplete(step.id)} style={{
                    marginTop: 6, padding: '4px 12px', borderRadius: 6, border: 'none',
                    background: '#667eea', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  }}>
                    ▶ Bắt đầu
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
