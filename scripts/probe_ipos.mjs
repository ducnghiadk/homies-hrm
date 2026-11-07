async function findLoginChunks() {
  const res = await fetch('https://hrm.ipos.vn/assets/index-CAB5I3MB.js', {
    headers: { 'User-Agent': 'Mozilla/5.0' }
  })
  const js = await res.text()
  
  // Find all dynamic imports like import("./Login-*.js") or similar
  const importMatches = js.match(/["'](?:\.\/|\/assets\/)[a-zA-Z0-9_\-\.]+\.js["']/g)
  console.log('Dynamic imports in index.js:', Array.from(new Set(importMatches || [])).slice(0, 30))

  const routeMatches = js.match(/\/account\/[a-zA-Z0-9_\-]+/g)
  console.log('Account routes:', Array.from(new Set(routeMatches || [])))
}
findLoginChunks()
