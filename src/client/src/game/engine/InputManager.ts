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
  } = {
    x: 0,
    y: 0,
    leftDown: false,
    rightDown: false,
    leftClicked: false,
    rightClicked: false,
  };

  private canvas: HTMLCanvasElement | null = null;

  constructor() {
    this.setupKeyboardListeners();
  }

  // Conectar ao canvas para eventos de mouse
  attachCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.setupMouseListeners();
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

      // Prevenir comportamento padrão para teclas do jogo (LoL style: Q W E R D F + T para spawn)
      if (['q', 'w', 'e', 'r', 'd', 'f', 't'].includes(key)) {
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
      const rect = this.canvas!.getBoundingClientRect();
      this.mouse.x = e.clientX - rect.left;
      this.mouse.y = e.clientY - rect.top;
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
  }
}
