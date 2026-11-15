// Public release metadata only. No GitHub credentials are sent to clients.
const REPOSITORY = 'A7me2d/Aqar_Matrix';
const RELEASES_URL = `https://github.com/${REPOSITORY}/releases`;
const CACHE_MS = 5 * 60 * 1000;

function stableVersion(value) {
  const match = /^v?(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.exec(String(value || ''));
  return match ? match.slice(1).join('.') : null;
}
function newer(candidate, current) {
  const a = candidate.split('.').map(BigInt), b = current.split('.').map(BigInt);
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i] > b[i];
  return false;
}
function trustedDownload(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'github.com' && !url.username && !url.password &&
      url.pathname.startsWith(`/${REPOSITORY}/releases/download/`) && !url.search && !url.hash;
  } catch { return false; }
}

module.exports = function createReleaseUpdates({ version, fetch }) {
  const base = { currentVersion:version, repository:REPOSITORY, releasesUrl:RELEASES_URL };
  let cached = null, expires = 0, pending = null;
  async function check() {
    if (cached && Date.now() < expires) return cached;
    if (pending) return pending;
    pending = (async () => {
      let result;
      try {
        const response = await fetch(`https://api.github.com/repos/${REPOSITORY}/releases?per_page=100`, {
          headers:{ Accept:'application/vnd.github+json', 'User-Agent':`Aqar-Matrix/${version}`, 'X-GitHub-Api-Version':'2022-11-28' },
          signal:AbortSignal.timeout(15000),
        });
        if (!response.ok) throw new Error(response.status === 403 || response.status === 429 ? 'طلبات كتير على GitHub، جرّب بعد شوية.' : 'تعذّر الوصول لإصدارات GitHub.');
        const releases = await response.json();
        if (!Array.isArray(releases)) throw new Error('بيانات الإصدار غير صالحة.');
        const stable = releases.filter(release => !release.draft && !release.prerelease && stableVersion(release.tag_name));
        stable.sort((a,b) => newer(stableVersion(a.tag_name),stableVersion(b.tag_name)) ? -1 : newer(stableVersion(b.tag_name),stableVersion(a.tag_name)) ? 1 : 0);
        const latest = stable[0], latestVersion = latest && stableVersion(latest.tag_name);
        if (!stableVersion(version)) throw new Error('تعذّر تحديد رقم النسخة الحالية.');
        if (!latest || !newer(latestVersion,version)) {
          result = { state:'latest', latestVersion:latestVersion || null, message:latest ? 'أنت تستخدم أحدث إصدار.' : 'لم يتم نشر إصدارات بعد.' };
        } else {
          const assets = Array.isArray(latest.assets) ? latest.assets : [];
          const asset = assets.find(file => file.name === `AqarMatrix-Setup-${latestVersion}.exe` && file.state === 'uploaded' && file.size > 0 && trustedDownload(file.browser_download_url));
          result = asset
            ? { state:'available', latestVersion, downloadUrl:asset.browser_download_url, fileName:asset.name, message:`الإصدار ${latestVersion} متاح. اضغط لتنزيل برنامج التثبيت لويندوز.` }
            : { state:'unpublished', latestVersion, message:`الإصدار ${latestVersion} منشور، وملف التثبيت لم يكتمل رفعه بعد.` };
        }
      } catch (error) {
        // Preserve a previously discovered update during a temporary outage.
        result = cached?.state === 'available' ? {...cached, stale:true, message:'يوجد تحديث متاح. تعذّر تحديث معلوماته مؤقتًا.'}
          : { state:'error', message:error.name === 'TimeoutError' ? 'انتهت مهلة فحص التحديث. جرّب مرة تانية.' : 'تعذّر فحص التحديثات. تأكد من الإنترنت وحاول مرة تانية.' };
      }
      cached = {...base,...result,checkedAt:Date.now()};
      expires = Date.now() + (result.state === 'error' || result.stale ? 60000 : CACHE_MS);
      return cached;
    })();
    try { return await pending; } finally { pending = null; }
  }
  return { check, trustedDownload };
};
