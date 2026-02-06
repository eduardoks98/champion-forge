// ==========================================
// SAFE ACCESSOR - Acesso seguro com warnings para debug
// ==========================================

/**
 * Níveis de log para debug
 */
export type LogLevel = 'none' | 'warn' | 'error' | 'all';

/**
 * Configuração global do SafeAccessor
 */
const config = {
  logLevel: 'warn' as LogLevel,
  logOnce: true, // Só loga uma vez por contexto
  enabled: process.env.NODE_ENV === 'development',
};

// Set para rastrear warnings já emitidos
const emittedWarnings = new Set<string>();

/**
 * Configura o SafeAccessor globalmente
 */
export function configureSafeAccessor(options: Partial<typeof config>): void {
  Object.assign(config, options);
}

/**
 * Limpa o cache de warnings (útil para testes)
 */
export function clearWarningCache(): void {
  emittedWarnings.clear();
}

/**
 * Acessa um valor com fallback seguro e warning opcional
 *
 * @param value - Valor que pode ser undefined/null
 * @param defaultValue - Valor padrão a usar
 * @param context - Contexto para debug (ex: "SpatialGrid.getRadius")
 * @returns O valor ou o default
 *
 * @example
 * const radius = safeGet(entity.radius, DEFAULT_SPATIAL.ENTITY_RADIUS, 'SpatialGrid.radius');
 */
export function safeGet<T>(
  value: T | undefined | null,
  defaultValue: T,
  context?: string
): T {
  // Se valor existe, retorna diretamente
  if (value !== undefined && value !== null) {
    return value;
  }

  // Logar warning se habilitado
  if (config.enabled && context && config.logLevel !== 'none') {
    const shouldLog = !config.logOnce || !emittedWarnings.has(context);

    if (shouldLog) {
      const message = `[FALLBACK] ${context}: usando valor padrão ${JSON.stringify(defaultValue)}`;

      if (config.logLevel === 'error') {
        console.error(message);
      } else if (config.logLevel === 'warn' || config.logLevel === 'all') {
        console.warn(message);
      }

      if (config.logOnce) {
        emittedWarnings.add(context);
      }
    }
  }

  return defaultValue;
}

/**
 * Versão que lança erro se valor for undefined/null
 * Útil para valores que DEVEM existir
 *
 * @example
 * const stats = safeRequire(entity.stats, 'Entity.stats');
 */
export function safeRequire<T>(
  value: T | undefined | null,
  context: string
): T {
  if (value !== undefined && value !== null) {
    return value;
  }

  throw new Error(`[REQUIRED] ${context}: valor obrigatório está undefined/null`);
}

/**
 * Helper para calcular radius de entidade com fallback
 * Centraliza a lógica que estava espalhada em SpatialGrid, ViewportCulling, etc.
 */
export function getEntityRadius(
  entity: { radius?: number; width?: number; height?: number },
  defaultRadius: number,
  context?: string
): number {
  // Se tem radius explícito, usa
  if (entity.radius !== undefined && entity.radius !== null) {
    return entity.radius;
  }

  // Tenta calcular de width/height
  const width = entity.width ?? 0;
  const height = entity.height ?? 0;
  const calculatedRadius = Math.max(width, height) / 2;

  if (calculatedRadius > 0) {
    // Log warning que está usando radius calculado
    if (config.enabled && context && config.logLevel !== 'none') {
      const shouldLog = !config.logOnce || !emittedWarnings.has(context + '.calculated');
      if (shouldLog) {
        console.warn(`[CALCULATED] ${context}: radius calculado de width/height = ${calculatedRadius}`);
        if (config.logOnce) {
          emittedWarnings.add(context + '.calculated');
        }
      }
    }
    return calculatedRadius;
  }

  // Último fallback: valor padrão
  if (config.enabled && context && config.logLevel !== 'none') {
    const shouldLog = !config.logOnce || !emittedWarnings.has(context + '.default');
    if (shouldLog) {
      console.warn(`[FALLBACK] ${context}: usando radius padrão = ${defaultRadius}`);
      if (config.logOnce) {
        emittedWarnings.add(context + '.default');
      }
    }
  }

  return defaultRadius;
}

/**
 * Estatísticas de uso do SafeAccessor (para debug)
 */
export function getAccessorStats(): { totalWarnings: number; contexts: string[] } {
  return {
    totalWarnings: emittedWarnings.size,
    contexts: Array.from(emittedWarnings),
  };
}
