/**
 * Accessible Modal Dialog component with backdrop and escape key support.
 */

import { useEffect, type ReactNode } from 'react'
import { CloseIcon } from '../icons/Icons'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  maxWidth?: string
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-2xl',
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(5,8,16,0.85)] backdrop-blur-md animate-in fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className={`glass-card w-full ${maxWidth} max-h-[85vh] flex flex-col p-6 space-y-4 shadow-2xl relative border border-[rgba(255,255,255,0.15)]`}
      >
        <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.1)] pb-3">
          <h3 id="modal-title" className="text-base font-bold text-[var(--color-star-white)]">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="text-[var(--color-space-200)] hover:text-white p-1 rounded-lg hover:bg-[rgba(255,255,255,0.06)] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <CloseIcon size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  )
}
