// src/services/ai.js
import { aiBindings } from '../config/ai-bindings.js';

export async function aiRun(bindingKey, prompt) {
  const cfg = aiBindings[bindingKey];
  if (!cfg || !cfg.endpoint) {
    throw new Error(`Chưa cấu hình endpoint cho binding "${bindingKey}"`);
  }
  const method  = cfg.method || 'POST';
  const mode    = cfg.mode || 'cors';
  const headers = cfg.headers || {};
  const body    = cfg.bodyBuilder ? cfg.bodyBuilder(prompt) : undefined;

  const res = await fetch(cfg.endpoint, { method, mode, headers, body });
  if (!res.ok) {
    const text = await safeRead(res);
    throw new Error(`HTTP ${res.status} (${bindingKey}): ${text || 'request failed'}`);
  }
  return cfg.parse ? cfg.parse(res) : res.text();
}

async function safeRead(res){ try { return await res.text(); } catch { return ''; } }
