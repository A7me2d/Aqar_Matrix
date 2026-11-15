import { Injectable, computed, signal } from '@angular/core';
const KEY = 'aqm:sidebar:appearance';
const DEFAULTS = { size: 13, weight: 600 };
@Injectable({ providedIn: 'root' })
export class SidebarAppearanceService {
  private readonly preferences = signal(this.read());
  readonly size = computed(() => this.preferences().size);
  readonly weight = computed(() => this.preferences().weight);
  setSize(value: number): void { this.save(value, this.weight()); }
  setWeight(value: number): void { this.save(this.size(), value); }
  reset(): void { this.save(DEFAULTS.size, DEFAULTS.weight); }
  private normalize(size: number, weight: number) {
    return {
      size: Number.isFinite(size) ? Math.round(Math.min(20, Math.max(11, size))) : DEFAULTS.size,
      weight: [400, 500, 600, 700, 800].includes(weight) ? weight : DEFAULTS.weight,
    };
  }
  private read() {
    try { const stored = JSON.parse(localStorage.getItem(KEY) || 'null'); return this.normalize(stored?.size, stored?.weight); }
    catch { return { ...DEFAULTS }; }
  }
  private save(size: number, weight: number): void {
    const value = this.normalize(size, weight);
    this.preferences.set(value);
    try { localStorage.setItem(KEY, JSON.stringify(value)); } catch {}
  }
}
