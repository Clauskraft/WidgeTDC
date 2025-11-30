const fetch = global.fetch;

const BACKEND_URL = 'http://localhost:3001';

async function verify() {
  console.log('\n🧠 VECTOR MEMORY DIAGNOSTICS (Node.js)...');

  // 1. Broadcast
  const testId = Math.random().toString(36).substring(7);
  const memoryContent = `WidgeTDC System Initialization Vector Check ID ${testId}. The system is becoming self-aware.`;
  console.log(`📡 Broadcasting memory: '${memoryContent}'`);

  try {
    const broadcastRes = await fetch(`${BACKEND_URL}/api/hyper/broadcast`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'THOUGHT',
        agent: 'SystemVerifier',
        content: memoryContent,
        metadata: { test_id: testId, phase: 'verification' }
      })
    });
    const broadcastJson = await broadcastRes.json();
    if (broadcastJson.success || broadcastJson.eventId) {
        console.log(` [SUCCESS] EventID: ${broadcastJson.eventId}`);
    } else {
        console.error(' [FAILED] Broadcast failed', broadcastJson);
        process.exit(1);
    }
  } catch (e) {
    console.error(` [FAILED] Could not broadcast. Is backend running? ${e.message}`);
    process.exit(1);
  }

  // 2. Force Persist
  console.log('💾 Forcing Vector Persistence to Neo4j...');
  try {
    const persistRes = await fetch(`${BACKEND_URL}/api/hyper/force-persist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
    });
    const persistJson = await persistRes.json();
    console.log(` [SUCCESS] Processed: ${persistJson.success} events`);
  } catch (e) {
    console.error(` [FAILED] Persistence trigger failed. ${e.message}`);
  }

  // 3. Test Recall
  console.log('💤 Waiting for indexing...');
  await new Promise(r => setTimeout(r, 2000));
  
  console.log('💤 Testing Semantic Recall (Dreaming)...');
  try {
    const dreamRes = await fetch(`${BACKEND_URL}/api/hyper/dream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            query: 'system initialization self-aware',
            limit: 1
        })
    });
    const dreamJson = await dreamRes.json();
    
    if (dreamJson.results && dreamJson.results.length > 0) {
        const match = dreamJson.results[0];
        if (match.content.includes(testId)) {
            console.log(' [SUCCESS] Memory Recalled!');
            console.log(`   Match Score: ${match.score}`);
            console.log(`   Content: ${match.content}`);
        } else {
            console.log(` [WARNING] Recalled something else: ${match.content}`);
        }
    } else {
        console.log(' [FAILED] No memories found.');
    }
  } catch (e) {
    console.error(` [FAILED] Dream API failed. ${e.message}`);
  }
  
  console.log('\n✅ VERIFICATION COMPLETE.');
}

verify();
