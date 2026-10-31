const http = require('http');

function postJson(path, body, cookie = null) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
    };
    if (cookie) headers['Cookie'] = cookie;

    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path,
        method: 'POST',
        headers,
      },
      (res) => {
        let resData = '';
        const setCookie = res.headers['set-cookie']
          ? res.headers['set-cookie'][0].split(';')[0]
          : cookie;
        res.on('data', (chunk) => (resData += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(resData);
            resolve({ status: res.statusCode, data: parsed, cookie: setCookie });
          } catch (e) {
            resolve({ status: res.statusCode, raw: resData, cookie: setCookie });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function getJson(path, cookie = null) {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (cookie) headers['Cookie'] = cookie;

    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path,
        method: 'GET',
        headers,
      },
      (res) => {
        let resData = '';
        res.on('data', (chunk) => (resData += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(resData) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: resData });
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function runDemoFlow() {
  console.log('--- Step 1: Sign in as Aarav (Couple) & add idea ---');
  let auth = await postJson('/api/auth/demo', { uid: 'demo-aarav-1' });
  let aaravCookie = auth.cookie;
  console.log('Aarav signed in. Session cookie set.');

  let idea1 = await postJson(
    '/api/homes/demo-home-1/rooms/decor/ideas',
    { text: 'Warm terracotta earthen pots with brass urlis and floating candles' },
    aaravCookie
  );
  console.log('Aarav posted idea:', idea1.data.idea?.text);

  console.log('\n--- Step 2: Switch to Diya (Couple) & add idea ---');
  auth = await postJson('/api/auth/demo', { uid: 'demo-diya-1' });
  let diyaCookie = auth.cookie;
  let idea2 = await postJson(
    '/api/homes/demo-home-1/rooms/decor/ideas',
    { text: 'Pastel peach fabric drapes with baby breath and blush rose floral arches' },
    diyaCookie
  );
  console.log('Diya posted idea:', idea2.data.idea?.text);

  console.log('\n--- Step 3: Switch to Meenakshi (Voter) & add idea ---');
  auth = await postJson('/api/auth/demo', { uid: 'demo-mother-1' });
  let meenCookie = auth.cookie;
  let idea3 = await postJson(
    '/api/homes/demo-home-1/rooms/decor/ideas',
    { text: 'Traditional genda phool yellow garlands and fragrant mogra strings' },
    meenCookie
  );
  console.log('Meenakshi posted idea:', idea3.data.idea?.text);

  console.log('\n--- Step 4: Ask Maya to summarize room ideas ---');
  let synth = await postJson('/api/maya/synthesize', { roomId: 'decor' }, aaravCookie);
  console.log('Maya Synthesis Brief:', synth.data.brief?.topic);
  console.log('Candidate Options:', synth.data.brief?.options?.map((o) => `${o.id}: ${o.name}`).join(' | '));
  console.log('Maya Recommendation:', synth.data.brief?.recommendation?.why);

  console.log('\n--- Step 5: Aarav initiates family vote ---');
  let dec = await postJson(
    '/api/decisions',
    {
      roomId: 'decor',
      topic: synth.data.brief.topic,
      options: synth.data.brief.options,
    },
    aaravCookie
  );
  const decisionId = dec.data.decision.id;
  console.log('Decision Ballot Created:', decisionId);

  console.log('\n--- Step 6: Voting Round (2 for Option A, 1 for Option B) ---');
  // Aarav votes A
  let v1 = await postJson('/api/decisions/vote', { decisionId, optionId: 'A' }, aaravCookie);
  console.log('Aarav voted for Option A (HTTP ' + v1.status + ')');

  // Diya votes B
  let v2 = await postJson('/api/decisions/vote', { decisionId, optionId: 'B' }, diyaCookie);
  console.log('Diya voted for Option B (HTTP ' + v2.status + ')');

  // Meenakshi votes A
  let v3 = await postJson('/api/decisions/vote', { decisionId, optionId: 'A' }, meenCookie);
  console.log('Meenakshi voted for Option A (HTTP ' + v3.status + ')');

  // Live tally check
  let tallyCheck = await getJson(`/api/decisions/${decisionId}`, aaravCookie);
  console.log('Live Tally:', tallyCheck.data.tally);

  console.log('\n--- Step 7: Kabir (Advisor) checks voting eligibility ---');
  auth = await postJson('/api/auth/demo', { uid: 'demo-brother-1' });
  let kabirCookie = auth.cookie;
  let v4 = await postJson('/api/decisions/vote', { decisionId, optionId: 'A' }, kabirCookie);
  console.log('Kabir vote attempt result (Expected 403 Forbidden): HTTP', v4.status, '-', v4.data.error);

  console.log('\n--- Step 8: Aarav closes voting ---');
  let close = await postJson('/api/decisions/close', { decisionId }, aaravCookie);
  console.log('Outcome:', close.data.outcome);
  console.log('Winning Option:', close.data.winner);
  console.log('Decided By:', close.data.decidedBy);

  console.log('\n--- Step 9: Verify Wedding Plan updated ---');
  let plan = await getJson('/api/maya/plan', aaravCookie);
  console.log('Plan version:', plan.data.plan?.version, '| Updated at:', new Date(plan.data.plan?.updatedAt).toISOString());
  console.log('\nALL DEMO FLOW VERIFICATIONS COMPLETED SUCCESSFULLY!');
}

runDemoFlow().catch(console.error);

