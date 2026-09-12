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
  const isSubmittedRef = useRef(false);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    onSubmitRef.current = onSubmit;
  }, [onSubmit]);

  useEffect(() => {
    enabledRef.current = enabled;
    if (!enabled) {
      isSubmittedRef.current = true;
      setShowWarningModal(false);
    }
  }, [enabled]);

  // Tab switch violation trigger helper
  const triggerTabViolation = useCallback(() => {
    if (!enabledRef.current || isSubmittedRef.current) return;

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
        setWarningMessage(`⚠️ Proctoring Warning: Tab switch / focus loss detected! (Violation ${nextCount}/${maxWarnings}). On the ${maxWarnings}rd violation, your test will be auto-submitted.`);
        setShowWarningModal(true);
      }
      return nextCount;
    });
  }, [maxWarnings]);

  // Handle Tab Switch / Window Blur
  const handleVisibilityChange = useCallback(() => {
    if (!enabledRef.current || isSubmittedRef.current) return;
    if (document.hidden) {
      triggerTabViolation();
    }
  }, [triggerTabViolation]);

  const handleWindowBlur = useCallback(() => {
    if (!enabledRef.current || isSubmittedRef.current) return;
    // Window lost focus (user clicked outside or switched window)
    triggerTabViolation();
  }, [triggerTabViolation]);

  // Handle Fullscreen Exit
  const handleFullscreenChange = useCallback(() => {
    if (!enabledRef.current || isSubmittedRef.current) return;

    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
      setFullscreenExits((prev) => prev + 1);
      setWarningMessage("⚠️ Fullscreen Mode Required: Exiting fullscreen is recorded as a proctoring event.");
      setShowWarningModal(true);
    }
  }, []);

  // Handle Copy / Paste / Context Menu Prevention
  const handleCopyPaste = useCallback((e) => {
    if (!enabledRef.current || isSubmittedRef.current) return;
    e.preventDefault();
    setPasteAttempts((prev) => prev + 1);
    setWarningMessage("⚠️ Action Blocked: Copying and pasting is strictly prohibited during tests.");
    setShowWarningModal(true);
  }, []);

  const handleContextMenu = useCallback((e) => {
    if (!enabledRef.current || isSubmittedRef.current) return;
    e.preventDefault();
  }, []);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("copy", handleCopyPaste);
    document.addEventListener("paste", handleCopyPaste);
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("copy", handleCopyPaste);
      document.removeEventListener("paste", handleCopyPaste);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [enabled, handleVisibilityChange, handleWindowBlur, handleFullscreenChange, handleCopyPaste, handleContextMenu]);

  const dismissWarningModal = useCallback(() => {
    setShowWarningModal(false);
  }, []);

  const enterFullscreen = useCallback(() => {
    if (!enabledRef.current || isSubmittedRef.current) return;
    const docEl = document.documentElement;
    if (docEl.requestFullscreen) {
      docEl.requestFullscreen().catch(() => {});
    } else if (docEl.webkitRequestFullscreen) {
      docEl.webkitRequestFullscreen().catch(() => {});
    }
    setShowWarningModal(false);
  }, []);

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
