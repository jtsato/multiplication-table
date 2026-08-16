import { useEffect, useRef, type ReactNode } from 'react';

interface ModalProps {
  title: string;
  children: ReactNode;
  onClose: () => void;
  actions: ReactNode;
}

export function Modal({ title, children, onClose, actions }: ModalProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    ref.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    globalThis.addEventListener('keydown', onKey);
    return () => globalThis.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={ref}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="modal__title">{title}</h2>
        <div className="modal__body">{children}</div>
        <div className="modal__actions">{actions}</div>
      </div>
    </div>
  );
}
