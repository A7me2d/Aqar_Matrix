// © 2026 علاء أحمد (Alaa Ahmed) — Aqar Matrix. جميع الحقوق محفوظة / All rights reserved.
// كود خاص وسرّي: ممنوع النسخ أو التوزيع أو التعديل أو الاستخدام إلا بترخيص كتابي من المالك. Proprietary & confidential.
"use strict";
// 🖱 قايمة الكليك يمين (v10.71.4): قص / نسخ / لصق / تحديد الكل + نسخ الرابط + نسخ الصورة — في كل صفحات البرنامج
// إلكترون مش بيعمل قايمة كليك يمين لوحده، فكان الكليك يمين مابيعملش حاجة. المنطق هنا صافي (من غير إلكترون) عشان يتختبر.

// بيبني عناصر القايمة من بيانات الكليك (params بتاعة حدث context-menu)
function template(p) {
  p = p || {};
  const f = p.editFlags || {};
  const sel = String(p.selectionText || "").trim();
  const link = String(p.linkURL || "");
  const isHttp = /^(https?|tel|mailto):/i.test(link);
  const img = p.mediaType === "image" && p.srcURL && !/^data:/i.test(p.srcURL) ? p.srcURL : "";
  const en = (flag, needSel) => (flag !== undefined && flag !== null ? !!flag : needSel ? !!sel : true); // علامات كروميوم أدق من النص المحدد
  const out = [];
  const sep = () => { if (out.length && out[out.length - 1].type !== "separator") out.push({ type: "separator" }); };
  if (p.isEditable) {
    out.push({ act: "undo", label: "تراجع", enabled: en(f.canUndo) });
    out.push({ act: "redo", label: "إعادة", enabled: en(f.canRedo) });
    sep();
    out.push({ act: "cut", label: "قص", enabled: en(f.canCut, true) });
    out.push({ act: "copy", label: "نسخ", enabled: en(f.canCopy, true) });
    out.push({ act: "paste", label: "لصق", enabled: en(f.canPaste) });
    out.push({ act: "pasteAndMatchStyle", label: "لصق كنص عادي", enabled: en(f.canPaste) });
    out.push({ act: "delete", label: "حذف", enabled: en(f.canDelete, true) });
    sep();
    out.push({ act: "selectAll", label: "تحديد الكل", enabled: en(f.canSelectAll) });
  } else {
    out.push({ act: "copy", label: "نسخ", enabled: !!sel });
    if (link) {
      sep();
      if (isHttp && /^https?:/i.test(link)) out.push({ act: "openLink", label: "فتح الرابط", arg: link });
      out.push({ act: "copyText", label: "نسخ الرابط", arg: link.replace(/^mailto:|^tel:/i, "") });
    }
    if (img) {
      sep();
      out.push({ act: "copyImage", label: "نسخ الصورة" });
      out.push({ act: "copyText", label: "نسخ رابط الصورة", arg: img });
    }
    sep();
    out.push({ act: "selectAll", label: "تحديد الكل", enabled: en(f.canSelectAll) });
  }
  while (out.length && out[out.length - 1].type === "separator") out.pop();
  return out;
}

// بيربط القايمة بصفحة (webContents): deps = { Menu, clipboard, BrowserWindow, openUrl, win }
function attach(wc, deps) {
  wc.on("context-menu", (e, params) => {
    try {
      const items = template(params).map((it) => {
        if (it.type === "separator") return it;
        const o = { label: it.label, enabled: it.enabled !== false };
        o.click = () => {
          try {
            if (it.act === "copyText") deps.clipboard.writeText(String(it.arg || ""));
            else if (it.act === "copyImage") wc.copyImageAt(params.x, params.y);
            else if (it.act === "openLink") deps.openUrl(it.arg);
            else if (typeof wc[it.act] === "function") wc[it.act]();
          } catch (err) { console.warn("[ctxmenu]", it.act, err && err.message); }
        };
        return o;
      });
      if (!items.length) return;
      const win = (deps.BrowserWindow && deps.BrowserWindow.fromWebContents(wc)) || deps.win;
      deps.Menu.buildFromTemplate(items).popup(win ? { window: win } : {});
    } catch (err) { console.warn("[ctxmenu]", err && err.message); }
  });
}

module.exports = { template, attach };
