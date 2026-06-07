'use client';

import { useMemo, useState } from 'react';
import { Ban, CheckCircle2, Download, LogOut, Play, ShoppingCart, Upload } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTrialStore } from '@/lib/trial-store';
import { TrialScene } from './trial-scene';
import type { TrialStep } from '@/types/trial';

const stepOrder: TrialStep[] = ['overview', 'library', 'scene', 'handoff'];

export function TrialExperience() {
  const t = useTranslations('Trial');
  const {
    session,
    lastEndedProjectName,
    lastEndedAt,
    startTrial,
    endTrial,
    setStep,
    nextStep,
    previousStep,
    setDevicePosition,
  } = useTrialStore();
  const [phone, setPhone] = useState('');
  const phoneReady = /^1\d{10}$/.test(phone.trim()) || /^[0-9+\-\s]{6,20}$/.test(phone.trim());
  const currentIndex = session ? stepOrder.indexOf(session.step) : 0;
  const currentStepLabel = session ? t(`step.${session.step}`) : '';
  const disabledActions = useMemo(
    () => [
      { icon: Upload, label: t('upload') },
      { icon: Download, label: t('download') },
      { icon: Play, label: t('runReal') },
      { icon: ShoppingCart, label: t('cart') },
    ],
    [t],
  );

  if (!session) {
    return (
      <div className="mx-auto grid w-[94%] max-w-[1280px] gap-5 py-[20px] md:py-[28px] lg:grid-cols-[minmax(0,0.85fr)_minmax(380px,1fr)] lg:items-start">
        <section>
          <p className="text-brand-500 text-sm font-semibold tracking-[0.08em]">HITBOTOS</p>
          <h1 className="text-text-strong mt-2 text-3xl font-semibold md:text-4xl">{t('title')}</h1>
          <p className="text-text-muted mt-3 max-w-2xl text-base leading-relaxed">{t('subtitle')}</p>
          <div className="mt-5 max-w-xl">
            <label htmlFor="trial-phone" className="text-text-strong text-sm">
              {t('phoneLabel')}
            </label>
            <div className="mt-2 flex flex-col gap-3 sm:flex-row">
              <Input
                id="trial-phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder={t('phonePlaceholder')}
                className="flex-1"
              />
              <Button
                variant="primary"
                disabled={!phoneReady}
                onClick={() => startTrial(phone.trim(), t('trialProjectName'))}
              >
                {t('start')}
              </Button>
            </div>
            <p className="text-text-muted mt-3 text-sm">{t('phoneHint')}</p>
            {lastEndedAt && lastEndedProjectName && (
              <div className="bg-bg-surface mt-4 rounded-lg p-3" aria-live="polite">
                <p className="text-text-strong font-medium">{t('trialClearedTitle')}</p>
                <p className="text-text-muted mt-1 text-sm">
                  {t('trialClearedHint', { project: lastEndedProjectName })}
                </p>
              </div>
            )}
          </div>
          <section className="border-border-subtle mt-6 border-t pt-5">
            <h2 className="text-text-strong text-lg font-semibold">{t('rulesTitle')}</h2>
            <ul className="text-text-muted mt-3 grid gap-2 text-base sm:grid-cols-3 lg:grid-cols-1">
              <li>{t('readonly')}</li>
              <li>{t('fakeProject')}</li>
              <li>{t('disabledActions')}</li>
            </ul>
          </section>
        </section>

        <section className="bg-bg-surface self-start rounded-lg p-3">
          <div className="bg-bg-elevated relative h-[280px] overflow-hidden rounded-lg md:h-[320px] lg:h-[340px]">
            <div className="absolute inset-0">
              <TrialScene
                deviceX={0.6}
                deviceZ={0.2}
                interactive={false}
                onDeviceMove={() => undefined}
              />
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto w-[94%] max-w-[1500px] py-4 md:py-5">
      <div className="bg-bg-elevated mb-4 flex min-h-14 flex-wrap items-center justify-between gap-3 rounded-lg px-4 py-3">
        <div>
          <p className="text-text-strong text-lg font-semibold">{session.projectName}</p>
          <p className="text-text-muted text-sm">
            {session.projectId} · {t('trialAccount')} {maskPhone(session.phone)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {disabledActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button key={action.label} variant="secondary" size="sm" disabled>
                <Icon className="size-4" />
                <span>{action.label}</span>
              </Button>
            );
          })}
          <Button variant="subtle" size="sm" onClick={endTrial}>
            <LogOut className="size-4" />
            <span>{t('exit')}</span>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)_280px]">
        <aside className="bg-bg-elevated rounded-lg p-3">
          <p className="text-text-muted text-sm">{t('guide')}</p>
          <div className="mt-2 space-y-1">
            {stepOrder.map((step, index) => {
              const active = session.step === step;
              return (
                <button
                  key={step}
                  type="button"
                  onClick={() => setStep(step)}
                  className={`flex min-h-10 w-full items-center gap-3 rounded-md px-3 text-left text-base transition-colors ${
                    active
                      ? 'bg-brand-soft text-brand-500 font-semibold'
                      : 'text-text hover:bg-bg-control'
                  }`}
                >
                  <span className="text-sm tabular-nums">{index + 1}</span>
                  <span>{t(`step.${step}`)}</span>
                </button>
              );
            })}
          </div>

          <div className="bg-bg-surface mt-4 rounded-lg p-3">
            <p className="text-text-strong font-medium">{t('libraryTitle')}</p>
            <p className="text-text-muted mt-1 text-sm">{t('libraryHint')}</p>
            <div className="mt-3 space-y-2">
              {['Z-EFG-8S', 'Z-Arm S622', 'Fixture A1'].map((model, index) => (
                <div
                  key={model}
                  className="bg-bg-elevated flex items-center justify-between gap-3 rounded-md px-3 py-2"
                >
                  <span className="text-text text-base">{model}</span>
                  <span className="text-text-muted text-xs">
                    {index === 0 ? t('draggableTag') : t('readonlyTag')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        <main className="bg-bg-surface relative min-h-[420px] overflow-hidden rounded-lg xl:min-h-[460px]">
          <TrialScene
            deviceX={session.deviceX}
            deviceZ={session.deviceZ}
            interactive={session.step === 'scene'}
            onDeviceMove={setDevicePosition}
          />
          <div className="bg-bg-elevated/95 shadow-light pointer-events-none absolute top-3 left-3 rounded-md px-3 py-2">
            <p className="text-text-strong font-semibold">{currentStepLabel}</p>
            <p className="text-text-muted mt-1 max-w-[34ch] text-sm">
              {t(`stepHint.${session.step}`)}
            </p>
          </div>
        </main>

        <aside className="bg-bg-elevated rounded-lg p-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="text-state-green-strong mt-0.5 size-5" />
            <div>
              <h2 className="text-text-strong text-lg font-semibold">{t('statusTitle')}</h2>
              <p className="text-text-muted mt-1 text-sm">
                {session.step === 'scene' ? t('statusHint') : t('sceneLockedHint')}
              </p>
            </div>
          </div>
          <div className="bg-bg-surface mt-4 rounded-lg p-3">
            <p className="text-text-muted text-sm">{t('devicePosition')}</p>
            <p className="text-text-strong mt-1 text-lg font-semibold tabular-nums">
              X {session.deviceX.toFixed(2)} / Z {session.deviceZ.toFixed(2)}
            </p>
          </div>
          <div className="bg-bg-surface mt-3 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Ban className="text-text-muted size-4" />
              <p className="text-text-strong font-medium">{t('disabledTitle')}</p>
            </div>
            <p className="text-text-muted mt-2 text-sm leading-relaxed">{t('disabledExplain')}</p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button variant="secondary" disabled={currentIndex === 0} onClick={previousStep}>
              {t('previous')}
            </Button>
            <Button
              variant="primary"
              disabled={currentIndex === stepOrder.length - 1}
              onClick={nextStep}
            >
              {t('next')}
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
}

function maskPhone(phone: string): string {
  if (phone.length < 7) return phone;
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}
