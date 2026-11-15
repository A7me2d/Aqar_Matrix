async function handlePostCardAction(act) {
    const id = act.closest(".card").dataset.id;
    const p = byId.get(id);
    if (act.dataset.act === "fix") return openFix(id);
    if (act.dataset.act === "matches") { state.open.has(id) ? state.open.delete(id) : state.open.add(id); return render(); }
    if (act.dataset.act === "toListing") return addSlotFromPost(p, p.type === "request" ? "want" : "offer");
    if (act.dataset.act === "dups") { const k = "d:" + id; state.open.has(k) ? state.open.delete(k) : state.open.add(k); return render(); }
    if (act.dataset.act === "tplPost") { state.tplFor = state.tplFor === "p:" + id ? "" : "p:" + id; return render(); }
    if (act.dataset.act === "copyText") { await copyText(p.text); toast("اتنسخ النص"); }
    if (act.dataset.act === "done") { const r = await chrome.runtime.sendMessage({ type: "phPost", id, op: "done" }).catch(() => null); if (!r || !r.ok) await updatePost(id, (x) => { x.done = !x.done; }); }
    if (act.dataset.act === "del") { const r = await chrome.runtime.sendMessage({ type: "phPost", id, op: "del" }).catch(() => null); if (!r || !r.ok) await updatePost(id, () => null); }
}
