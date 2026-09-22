-- Migración: rate limiting para el login del admin
-- Registra cada intento fallido de login por IP para poder bloquear
-- fuerzas brutas (5 intentos fallidos por minuto como máximo).

CREATE TABLE IF NOT EXISTS login_attempts (
  ip TEXT NOT NULL,
  ts INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_ts ON login_attempts(ip, ts);
