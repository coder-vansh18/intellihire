import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Custom Proctoring Hook for Anti-Cheat Enforcement
 * @param {Function} onSubmit - Auto-trigger callback when warning limit is exceeded (e.g. 3rd violation)
 * @param {Object} options - Options object { maxWarnings: 3, enabled: true }
 */
export const useProctoring = (onSubmit, { maxWarnings = 3, enabled = true } = {}) => {
  const [warningCount, setWarningCount] = useState(0);
  const [fullscreenExits, setFullscreenExits] = useState(0);
  const [pasteAttempts, setPasteAttempts] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [isDisqualified, setIsDisqualified] = useState(false);

  const onSubmitRef = useRef(onSubmit);
  const warningCountRef = useRef(warningCount);
  const isSubmittedRef = useRef(false);

  useEffect(() => {
    onSubmitRef.current = onSubmit;
  }, [onSubmit]);

  useEffect(() => {
    warningCountRef.current = warningCount;
  }, [warningCount]);

  // Handle Tab Switch (Visibility Change API)
  const handleVisibilityChange = useCallback(() => {
    if (!enabled || isSubmittedRef.current) return;

    if (document.hidden) {
      setWarningCount((prevCount) => {
        const nextCount = prevCount + 1;
        
        if (nextCount >= maxWarnings) {
          setIsDisqualified(true);
          setWarningMessage(`🚨 Violation Limit Reached (${nextCount}/${maxWarnings})! Your assessment is being automatically submitted.`);
          setShowWarningModal(true);
          
          isSubmittedRef.current = true;
          if (onSubmitRef.current) {
            onSubmitRef.current({ 
              tab_switches: nextCount, 
              tab_switch_count: nextCount,
              disqualified: true 
            });
          }
        } else {
          setWarningMessage(`⚠️ Proctoring Warning: Tab switch detected! (Violation ${nextCount}/${maxWarnings}). On the ${maxWarnings}rd violation, your test will be auto-submitted.`);
          setShowWarningModal(true);
        }
        return nextCount;
      });
    }
  }, [enabled, maxWarnings]);

  // Handle Fullscreen Exit
  const handleFullscreenChange = useCallback(() => {
    if (!enabled || isSubmittedRef.current) return;

    if (!document.fullscreenElement) {
      setFullscreenExits((prev) => prev + 1);
      setWarningMessage("⚠️ Fullscreen Mode Required: Exiting fullscreen is recorded as a proctoring event.");
      setShowWarningModal(true);
    }
  }, [enabled]);

  // Handle Copy / Paste / Context Menu Prevention
  const handleCopyPaste = useCallback((e) => {
    if (!enabled || isSubmittedRef.current) return;
    e.preventDefault();
    setPasteAttempts((prev) => prev + 1);
    setWarningMessage("⚠️ Action Blocked: Copying and pasting is strictly prohibited during tests.");
    setShowWarningModal(true);
  }, [enabled]);

  const handleContextMenu = useCallback((e) => {
    if (!enabled || isSubmittedRef.current) return;
    e.preventDefault();
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("copy", handleCopyPaste);
    document.addEventListener("paste", handleCopyPaste);
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("copy", handleCopyPaste);
      document.removeEventListener("paste", handleCopyPaste);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [enabled, handleVisibilityChange, handleFullscreenChange, handleCopyPaste, handleContextMenu]);

  const dismissWarningModal = () => {
    setShowWarningModal(false);
  };

  const enterFullscreen = () => {
    const docEl = document.documentElement;
    if (docEl.requestFullscreen) {
      docEl.requestFullscreen().catch(() => {});
    } else if (docEl.webkitRequestFullscreen) {
      docEl.webkitRequestFullscreen().catch(() => {});
    }
    setShowWarningModal(false);
  };

  return {
    tabSwitches: warningCount,
    warningCount,
    fullscreenExits,
    pasteAttempts,
    showWarningModal,
    warningMessage,
    isDisqualified,
    dismissWarningModal,
    enterFullscreen
  };
};

export default useProctoring;
