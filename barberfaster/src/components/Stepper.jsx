import { Children, useState } from 'react';
import './Stepper.css';

// Controla el avance, retroceso y selección de etapas de un flujo de reserva.
export default function Stepper({
  children,
  initialStep = 1,
  currentStep,
  onStepChange = () => {},
  onFinalStepCompleted = () => {},
  backButtonText = 'Volver',
  nextButtonText = 'Continuar',
  finalButtonText = 'Completar',
  disableStepIndicators = false,
  canContinue = true,
  hideNextButton = false,
}) {
  const [internalStep, setInternalStep] = useState(initialStep);
  const step = currentStep ?? internalStep;
  const steps = Children.toArray(children);
  const totalSteps = steps.length;
  const isLastStep = step === totalSteps;

  // Actualiza el paso local cuando el control no está manejado desde el padre.
  const updateStep = (nextStep) => {
    if (currentStep === undefined) setInternalStep(nextStep);
    onStepChange(nextStep);
  };

  // Limita la navegación a los pasos existentes y ejecuta el cierre final.
  const navigateToStep = (nextStep) => {
    if (nextStep >= 1 && nextStep <= totalSteps && nextStep !== step) {
      updateStep(nextStep);
    }
  };

  const handleNext = () => {
    if (!canContinue) return;
    if (isLastStep) {
      onFinalStepCompleted();
      return;
    }
    navigateToStep(step + 1);
  };

  // Renderiza los indicadores, contenido activo y controles de navegación.
  return (
    <section className="booking-stepper" aria-label="Progreso de la reserva">
      <div className="booking-stepper-indicators">
        {steps.map((_, index) => {
          const stepNumber = index + 1;
          const isComplete = step > stepNumber;
          const isActive = step === stepNumber;
          const isClickable = !disableStepIndicators && stepNumber < step;

          return (
            <div className="booking-stepper-indicator-group" key={stepNumber}>
              <button
                type="button"
                className={`booking-stepper-indicator${isActive ? ' active' : ''}${isComplete ? ' complete' : ''}`}
                aria-current={isActive ? 'step' : undefined}
                aria-label={`${steps[index].props.label || `Paso ${stepNumber}`}${isComplete ? ', completado' : isActive ? ', actual' : ''}`}
                disabled={!isClickable}
                onClick={() => navigateToStep(stepNumber)}
              >
                <span className="booking-stepper-indicator-inner">
                  {isComplete ? (
                    <svg aria-hidden="true" viewBox="0 0 24 24">
                      <path d="m5 13 4 4L19 7" />
                    </svg>
                  ) : (
                    stepNumber
                  )}
                </span>
                {steps[index].props.label && (
                  <span className="booking-stepper-label">{steps[index].props.label}</span>
                )}
              </button>
              {index < totalSteps - 1 && (
                <span
                  className={`booking-stepper-connector${isComplete ? ' complete' : ''}`}
                  aria-hidden="true"
                >
                  <span />
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="booking-stepper-content" key={step} aria-live="polite">
        {steps[step - 1]}
      </div>

      {(step > 1 || !hideNextButton) && (
      <footer className="booking-stepper-footer">
        {step > 1 && (
          <button
            type="button"
            className="booking-stepper-back"
            onClick={() => navigateToStep(step - 1)}
          >
            {backButtonText}
          </button>
        )}
        {!hideNextButton && (
          <button
            type="button"
            className="booking-stepper-next"
            onClick={handleNext}
            disabled={!canContinue}
          >
            {isLastStep ? finalButtonText : nextButtonText}
          </button>
        )}
      </footer>
      )}
    </section>
  );
}

export function Step({ children }) {
  // Contenedor semántico para el contenido de una etapa del asistente.
  return <div className="booking-step">{children}</div>;
}
