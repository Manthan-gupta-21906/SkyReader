/**
 * Toast notifications container and alert items.
 */

import { useEffect } from 'react'
import { useAppState } from '../../state/useAppState'
import { CloseIcon, AlertIcon, CheckIcon } from '../icons/Icons'
import type { ToastNotification } from '../../state/types'

export function ToastContainer() {
  const { state, dismissNotification } = useAppState()

  if (state.notifications.length === 0) return null

  return (
    <div
      className="fixed bottom-20 md:bottom-6 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      aria-live="polite"
    >
      {state.notifications.map((toast) => (
        <ToastItem
          key={toast.id}
          notification={toast}
          onDismiss={() => dismissNotification(toast.id)}
        />
      ))}
    </div>
  )
}

function ToastItem({
  notification,
  onDismiss,
}: {
  notification: ToastNotification
  onDismiss: () => void
}) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 4000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  const typeStyles = {
    info: 'border-[var(--color-aurora-cyan)] bg-[rgba(15,22,41,0.95)] text-[var(--color-star-white)]',
    success: 'border-[var(--color-aurora-green)] bg-[rgba(5,30,20,0.95)] text-[var(--color-aurora-green)]',
    warning: 'border-[var(--color-sun-amber)] bg-[rgba(30,20,5,0.95)] text-[var(--color-sun-amber)]',
    error: 'border-[var(--color-supernova-red)] bg-[rgba(30,5,5,0.95)] text-[var(--color-supernova-red)]',
  }

  return (
    <div
      className={`pointer-events-auto p-3.5 rounded-xl border backdrop-blur-md shadow-xl flex items-start gap-3 transition-all ${typeStyles[notification.type]}`}
    >
      <span className="shrink-0 mt-0.5">
        {notification.type === 'success' ? (
          <CheckIcon size={16} />
        ) : (
          <AlertIcon size={16} />
        )}
      </span>
      <div className="flex-1 min-w-0">
        {notification.title && (
          <p className="text-xs font-bold leading-tight mb-0.5">{notification.title}</p>
        )}
        <p className="text-xs text-[var(--color-star-white)] leading-relaxed">
          {notification.message}
        </p>
      </div>
      <button
        onClick={onDismiss}
        className="text-[var(--color-space-200)] hover:text-white p-0.5 rounded cursor-pointer shrink-0"
        aria-label="Dismiss toast"
      >
        <CloseIcon size={14} />
      </button>
    </div>
  )
}
