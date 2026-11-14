// Copyright 2026 Alaa Ahmed - Aqar Matrix. All rights reserved.
// Isolated full-app smoke test, including the real authenticated localhost route.
const { spawn } = require("node:child_process");
const fs = require("node:fs"), os = require("node:os"), path = require("node:path"), net = require("node:net");
(async () => {
  const tmpRoot = path.resolve(os.tmpdir()), dir = fs.mkdtempSync(path.join(tmpRoot, "aqar-matches-test-"));
  const probe = net.createServer();
  await new Promise((r) => probe.listen(0, "127.0.0.1", r));
  const port = probe.address().port; await new Promise((r) => probe.close(r));
  const env = { ...process.env, ALAA_TEST: "1", ALAA_USERDATA: dir, ALAA_PARTITION: "persist:matches" + Date.now(),
    ALAA_TEST_SCRIPT: path.join(__dirname, "electron-hook.js"), MATCH_TEST_PORT: String(port) };
  delete env.ELECTRON_RUN_AS_NODE;
  const child = spawn(require("electron"), [path.join(__dirname, "../../app/main.js")], { env, stdio: "inherit", windowsHide: true });
  const timer = setTimeout(() => child.kill(), 90000);
  child.on("error", (e) => { console.error(e); process.exitCode = 1; });
  child.on("exit", (code) => {
    clearTimeout(timer);
    const resolved = path.resolve(dir);
    if (path.dirname(resolved) === tmpRoot && path.basename(resolved).startsWith("aqar-matches-test-")) {
      try { fs.rmSync(resolved, { recursive: true, force: true }); } catch {}
    }
    if (code !== 0) process.exitCode = 1;
  });
})().catch((e) => { console.error(e); process.exitCode = 1; });
