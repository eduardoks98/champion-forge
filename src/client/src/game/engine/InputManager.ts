export type KeyState = {
  pressed: boolean;
  justPressed: boolean;
  justReleased: boolean;
};

export class InputManager {
  private keys: Map<string, KeyState> = new Map();
  private mouse: {
    x: number;
    y: number;
    leftDown: boolean;
    rightDown: boolean;
    leftClicked: boolean;
    rightClicked: boolean;
    wheelDelta: number;  // Para zoom
  } = {
    x: 0,
    y: 0,
    leftDown: false,
    rightDown: false,
    leftClicked: false,
    rightClicked: false,
    wheelDelta: 0,
  };

  private canvas: HTMLCanvasElement | null = null;

  // Pointer Lock state
  private _isPointerLocked: boolean = false;
  private _escapeJustPressed: boolean = false;

  constructor() {
    this.setupKeyboardListeners();
    this.setupPointerLockListeners();
  }

  // Conectar ao canvas para eventos de mouse
  attachCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.setupMouseListeners();
    // Inicializar posição do mouse no centro do canvas
    this.mouse.x = canvas.width / 2;
    this.mouse.y = canvas.height / 2;
  }

  // Pointer Lock API
  private setupPointerLockListeners(): void {
    document.addEventListener('pointerlockchange', () => {
      this._isPointerLocked = document.pointerLockElement === this.canvas;
      console.log('[InputManager] Pointer lock:', this._isPointerLocked);
    });

    document.addEventListener('pointerlockerror', () => {
      console.error('[InputManager] Pointer lock error');
    });
  }

  // Solicitar pointer lock (travar mouse no canvas)
  requestPointerLock(): void {
    if (this.canvas && !this._isPointerLocked) {
      this.canvas.requestPointerLock();
    }
  }

  // Liberar pointer lock
  exitPointerLock(): void {
    if (this._isPointerLocked) {
      document.exitPointerLock();
    }
  }

  // Verificar se pointer lock está ativo
  isPointerLocked(): boolean {
    return this._isPointerLocked;
  }

  // Verificar se ESC foi pressionado (para menu)
  isEscapeJustPressed(): boolean {
    return this._escapeJustPressed;
  }

  private setupKeyboardListeners(): void {
    window.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      const state = this.keys.get(key);

      if (!state || !state.pressed) {
        this.keys.set(key, {
          pressed: true,
          justPressed: true,
          justReleased: false,
        });
      }

      // ESC toggle pointer lock (para menu)
      if (e.key === 'Escape') {
        this._escapeJustPressed = true;
        // Pointer lock é liberado automaticamente pelo browser quando ESC é pressionado
      }

      // Prevenir comportamento padrão para teclas do jogo
      // F3 precisa de preventDefault ANTES de qualquer coisa para não abrir busca do browser
      if (e.key === 'F3' || ['q', 'w', 'e', 'r', 'd', 'f', 't'].includes(key)) {
        e.preventDefault();
      }
    });

    window.addEventListener('keyup', (e) => {
      const key = e.key.toLowerCase();
      this.keys.set(key, {
        pressed: false,
        justPressed: false,
        justReleased: true,
      });
    });
  }

  private setupMouseListeners(): void {
    if (!this.canvas) return;

    this.canvas.addEventListener('mousemove', (e) => {
      if (this._isPointerLocked) {
        // Quando pointer lock está ativo, usar movimento relativo
        this.mouse.x += e.movementX;
        this.mouse.y += e.movementY;
        // Clamp para não sair dos limites do canvas
        this.mouse.x = Math.max(0, Math.min(this.canvas!.width, this.mouse.x));
        this.mouse.y = Math.max(0, Math.min(this.canvas!.height, this.mouse.y));
      } else {
        // Quando pointer lock não está ativo, usar posição absoluta
        const rect = this.canvas!.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
      }
    });

    this.canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        this.mouse.leftDown = true;
        this.mouse.leftClicked = true;
      } else if (e.button === 2) {
        this.mouse.rightDown = true;
        this.mouse.rightClicked = true;
      }
    });

    this.canvas.addEventListener('mouseup', (e) => {
      if (e.button === 0) {
        this.mouse.leftDown = false;
      } else if (e.button === 2) {
        this.mouse.rightDown = false;
      }
    });

    // Prevenir menu de contexto
    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    // Zoom com scroll do mouse
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.mouse.wheelDelta = e.deltaY;
    }, { passive: false });
  }

  // Checar se tecla está pressionada
  isKeyDown(key: string): boolean {
    return this.keys.get(key.toLowerCase())?.pressed ?? false;
  }

  // Checar se tecla foi pressionada neste frame
  isKeyJustPressed(key: string): boolean {
    return this.keys.get(key.toLowerCase())?.justPressed ?? false;
  }

  // Checar se tecla foi solta neste frame
  isKeyJustReleased(key: string): boolean {
    return this.keys.get(key.toLowerCase())?.justReleased ?? false;
  }

  // Obter posição do mouse
  getMousePosition(): { x: number; y: number } {
    return { x: this.mouse.x, y: this.mouse.y };
  }

  // Checar click esquerdo
  isLeftClick(): boolean {
    return this.mouse.leftClicked;
  }

  // Checar click direito
  isRightClick(): boolean {
    return this.mouse.rightClicked;
  }

  // Checar se botão esquerdo está pressionado
  isLeftDown(): boolean {
    return this.mouse.leftDown;
  }

  // Checar se botão direito está pressionado
  isRightDown(): boolean {
    return this.mouse.rightDown;
  }

  // Obter delta do scroll (para zoom)
  getWheelDelta(): number {
    return this.mouse.wheelDelta;
  }

  // Checar se Shift está pressionado (para kiting)
  isShiftHeld(): boolean {
    return this.keys.get('shift')?.pressed ?? false;
  }

  // Checar se F3 foi pressionado (para debug)
  isDebugKeyPressed(): boolean {
    return this.keys.get('f3')?.justPressed ?? false;
  }

  // Resetar estados de "just" no final do frame
  update(): void {
    // Reset keyboard just states
    for (const [key, state] of this.keys) {
      if (state.justPressed || state.justReleased) {
        this.keys.set(key, {
          ...state,
          justPressed: false,
          justReleased: false,
        });
      }
    }

    // Reset mouse click states
    this.mouse.leftClicked = false;
    this.mouse.rightClicked = false;
    this.mouse.wheelDelta = 0;

    // Reset escape state
    this._escapeJustPressed = false;
  }
}
