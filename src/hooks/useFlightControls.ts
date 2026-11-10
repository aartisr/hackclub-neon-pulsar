import { useEffect, useRef } from 'react';
import type { MoveInput } from '../types/game';

interface FlightControlOptions {
  enabled: boolean;
  isChatOpen: boolean;
  onThrow: () => void;
  onToggleGuide: () => void;
  onOpenMenu: () => void;
  onOpenChat: (teamOnly: boolean) => void;
  onSendChat: () => void;
  onCloseChat: () => void;
}

const EMPTY_INPUT: MoveInput = { x: 0, y: 0, z: 0, jump: false, dash: false };

export function useFlightControls(options: FlightControlOptions) {
  const inputRef = useRef<MoveInput>({ ...EMPTY_INPUT });
  const pressedRef = useRef(new Set<string>());
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    if (!options.enabled) {
      pressedRef.current.clear();
      Object.assign(inputRef.current, EMPTY_INPUT);
    }
  }, [options.enabled]);

  useEffect(() => {
    const pressed = pressedRef.current;
    const updateMovement = () => {
      const input = inputRef.current;
      input.x = Number(pressed.has('d') || pressed.has('ArrowRight')) - Number(pressed.has('a') || pressed.has('ArrowLeft'));
      input.y = Number(pressed.has(' ')) - Number(pressed.has('Shift'));
      input.z = Number(pressed.has('s') || pressed.has('ArrowDown')) - Number(pressed.has('w') || pressed.has('ArrowUp'));
    };
    const reset = () => {
      pressed.clear();
      Object.assign(inputRef.current, EMPTY_INPUT);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const current = optionsRef.current;
      if (!current.enabled) return;
      if (current.isChatOpen) {
        if (event.key === 'Enter') current.onSendChat();
        if (event.key === 'Escape') current.onCloseChat();
        return;
      }
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) return;
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      if (['w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Shift'].includes(key)) {
        event.preventDefault();
        pressed.add(key);
        updateMovement();
      }
      if (event.repeat) return;
      if (key === 'e') current.onThrow();
      if (key === 'h') current.onToggleGuide();
      if (key === 'Escape') current.onOpenMenu();
      if (key === 't' || key === 'y') {
        event.preventDefault();
        reset();
        current.onOpenChat(key === 'y');
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      pressed.delete(event.key.length === 1 ? event.key.toLowerCase() : event.key);
      updateMovement();
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', reset);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', reset);
    };
  }, []);

  return inputRef;
}
