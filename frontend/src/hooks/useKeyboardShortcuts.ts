import { useEffect } from 'react';

interface KeyboardHandlers {
  onNewTask?: () => void;
  onOpenAgent?: () => void;
  onFocusMode?: () => void;
  onCloseModal?: () => void;
}

export function useKeyboardShortcuts(handlers: KeyboardHandlers) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      // Don't fire in text inputs
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
      // Don't fire with modifier keys (ctrl+n, etc.)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      switch (e.key) {
        case 'n':
        case 'N':
          handlers.onNewTask?.();
          break;
        case 'a':
        case 'A':
          handlers.onOpenAgent?.();
          break;
        case 'f':
        case 'F':
          handlers.onFocusMode?.();
          break;
        case 'Escape':
          handlers.onCloseModal?.();
          break;
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handlers]);
}
