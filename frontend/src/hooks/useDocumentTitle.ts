import { useEffect } from 'react';

const APP_NAME = 'JobPulse';

/**
 * Sets the document title to `title · JobPulse` while the component is mounted.
 * Pass an empty string (or nothing) to revert to the default `JobPulse` title.
 */
export default function useDocumentTitle(title?: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} · ${APP_NAME}` : APP_NAME;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
