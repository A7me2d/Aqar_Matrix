// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
// تخزين دائم على الجهاز: كل مفتاح في ملف JSON لوحده جوه فولدر الداتا
// الكتابة بتتأجل ثانية وتتعمل على ملف مؤقت وبعدين rename — عشان لو الكهربا قطعت الملف ما يبوظش
const fs = require("fs");
const path = require("path");

class Store {
  constructor(dir) {
    this.dir = dir;
    this.data = new Map();
    this.dirty = new Set();
    this.timer = null;
    fs.mkdirSync(dir, { recursive: true });
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith(".json")) continue;
      const key = decodeURIComponent(f.slice(0, -5));
      try { this.data.set(key, JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"))); }
      catch (e) {
        // ملف بايظ؟ جرّب النسخة اللي قبله
        try { this.data.set(key, JSON.parse(fs.readFileSync(path.join(dir, f + ".bak"), "utf8"))); } catch {}
      }
    }
  }
  bump(k) { this.ver = this.ver || new Map(); this.ver.set(k, (this.ver.get(k) || 0) + 1); }
  file(key) { return path.join(this.dir, encodeURIComponent(key) + ".json"); }
  get(keys) {
    const out = {};
    if (keys == null) { for (const [k, v] of this.data) out[k] = v; return out; }
    if (typeof keys === "string") keys = [keys];
    if (Array.isArray(keys)) { for (const k of keys) if (this.data.has(k)) out[k] = this.data.get(k); return out; }
    for (const [k, def] of Object.entries(keys)) out[k] = this.data.has(k) ? this.data.get(k) : def;
    return out;
  }
  set(obj) {
    const changes = {};
    for (const [k, v] of Object.entries(obj || {})) {
      if (v === undefined) continue;
      changes[k] = { oldValue: this.data.get(k), newValue: v };
      this.data.set(k, v);
      this.dirty.add(k); this.bump(k);
    }
    this.schedule();
    return changes;
  }
  remove(keys) {
    if (typeof keys === "string") keys = [keys];
    const changes = {};
    for (const k of keys || []) {
      if (!this.data.has(k)) continue;
      changes[k] = { oldValue: this.data.get(k) };
      this.data.delete(k);
      this.dirty.add(k); this.bump(k);
    }
    this.schedule();
    return changes;
  }
  clear() { return this.remove([...this.data.keys()]); }
  bytes(keys) {
    const o = this.get(keys);
    let n = 0;
    for (const [k, v] of Object.entries(o)) n += k.length + JSON.stringify(v).length;
    return n;
  }
  // ⚡ الكتابة: الملفات الكبيرة (البوستات والتعليقات) بتتكتب بحد أقصى مرة كل 5 ثواني ومن غير ما توقف البرنامج،
  // والنسخة الاحتياطية (.bak) بتتعمل كل 10 دقايق بس للملفات الكبيرة
  schedule() { if (!this.timer) this.timer = setTimeout(() => this.flushAsync(), 1000); }
  flushAsync() {
    this.timer = null;
    const now = Date.now();
    this.lastBig = this.lastBig || new Map(); this.bakAt = this.bakAt || new Map(); this.writing = this.writing || new Set();
    let later = false;
    for (const k of [...this.dirty]) {
      if (this.writing.has(k)) { later = true; continue; }
      const f = this.file(k);
      if (!this.data.has(k)) { this.dirty.delete(k); try { for (const x of [f, f + ".bak"]) if (fs.existsSync(x)) fs.unlinkSync(x); } catch {} continue; }
      if (this.lastBig.has(k) && now - this.lastBig.get(k) < 5000) { later = true; continue; }
      let json;
      try { json = JSON.stringify(this.data.get(k)); } catch (e) { console.error("store json", k, e); this.dirty.delete(k); continue; }
      const big = json.length > 1e6;
      this.dirty.delete(k);
      if (big) this.lastBig.set(k, now);
      this.ver = this.ver || new Map(); this.written = this.written || new Map();
      const myVer = this.ver.get(k) || 0;
      const doBak = !big || now - (this.bakAt.get(k) || 0) > 6e5;
      this.writing.add(k);
      const tmp = f + ".tmp";
      fs.promises.writeFile(tmp, json)
        .then(async () => { if ((this.written.get(k) || 0) > myVer) { fs.promises.unlink(tmp).catch(() => {}); return; } this.written.set(k, myVer); if (doBak && fs.existsSync(f)) { await fs.promises.copyFile(f, f + ".bak"); this.bakAt.set(k, Date.now()); if ((this.written.get(k) || 0) > myVer) { fs.promises.unlink(tmp).catch(() => {}); return; } } await fs.promises.rename(tmp, f); })
        .catch((e) => { console.error("store write", k, e); this.dirty.add(k); })
        .finally(() => { this.writing.delete(k); if (this.dirty.size) this.schedule(); });
    }
    if (later && !this.timer) this.timer = setTimeout(() => this.flushAsync(), 2000);
  }
  // كتابة فورية (وقت قفل البرنامج)
  flush() {
    clearTimeout(this.timer); this.timer = null;
    this.ver = this.ver || new Map(); this.written = this.written || new Map();
    for (const k of this.writing || []) this.dirty.add(k); // اللي كان بيتكتب يتكتب تاني بالأحدث
    for (const k of this.dirty) {
      const f = this.file(k);
      try {
        if (!this.data.has(k)) { for (const x of [f, f + ".bak"]) if (fs.existsSync(x)) fs.unlinkSync(x); continue; }
        const tmp = f + ".tmp2";
        fs.writeFileSync(tmp, JSON.stringify(this.data.get(k)));
        if (fs.existsSync(f)) fs.copyFileSync(f, f + ".bak");
        fs.renameSync(tmp, f);
        this.written.set(k, (this.ver.get(k) || 0) + 0.5); // أحدث من أي كتابة لسه شغالة بنفس النسخة
      } catch (e) { console.error("store write", k, e); }
    }
    this.dirty.clear();
  }
}

// منبّهات زي chrome.alarms — بتتحفظ في ملف عشان تكمل بعد ما البرنامج يتقفل ويتفتح
class Alarms {
  constructor(file, onFire) {
    this.file = file; this.onFire = onFire; this.list = {};
    try { this.list = JSON.parse(fs.readFileSync(file, "utf8")) || {}; } catch {}
    this.tick = setInterval(() => this.check(), 10e3);
  }
  save() { try { fs.writeFileSync(this.file, JSON.stringify(this.list)); } catch {} }
  create(name, info = {}) {
    const now = Date.now();
    const period = info.periodInMinutes ? +info.periodInMinutes : undefined;
    const scheduledTime = info.when ? +info.when : now + 6e4 * (info.delayInMinutes != null ? +info.delayInMinutes : period || 1);
    this.list[name] = { name, scheduledTime, periodInMinutes: period };
    this.save();
  }
  get(name) { return this.list[name] || undefined; }
  getAll() { return Object.values(this.list); }
  clear(name) { const had = !!this.list[name]; delete this.list[name]; this.save(); return had; }
  clearAll() { this.list = {}; this.save(); return true; }
  check() {
    const now = Date.now();
    let changed = false;
    for (const a of Object.values(this.list)) {
      if (a.scheduledTime > now) continue;
      // لو الجهاز كان مقفول وفاتت كذا مرة — نشغّلها مرة واحدة بس (زي كروم)
      if (a.periodInMinutes) {
        const p = a.periodInMinutes * 6e4;
        a.scheduledTime += Math.ceil((now - a.scheduledTime + 1) / p) * p;
      } else delete this.list[a.name];
      changed = true;
      try { this.onFire({ ...a }); } catch (e) { console.error(e); }
    }
    if (changed) this.save();
  }
}

module.exports = { Store, Alarms };
