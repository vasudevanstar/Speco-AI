const http = require('http');

function post(path, body) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(body || {});
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data || '{}') }));
    });
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function get(path) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path,
      method: 'GET',
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data || '{}') }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('--- 1. Testing GET /api/subscriptions/plans ---');
  const plansRes = await get('/api/subscriptions/plans');
  console.log('Plans status:', plansRes.status);
  console.log('Plans loaded:', plansRes.data.data?.map(p => `${p.id}: ${p.planName} (Rs.${p.price})`));

  console.log('\n--- 2. Testing GET /api/subscriptions/current ---');
  const curRes = await get('/api/subscriptions/current');
  console.log('Current sub status:', curRes.status);
  console.log('Current plan:', curRes.data.data?.plan?.planName);
  console.log('Usage stats:', curRes.data.data?.usage);

  console.log('\n--- 3. Testing POST /api/subscriptions/recommend ---');
  const recRes = await post('/api/subscriptions/recommend', {
    title: 'AI Hospital & Clinic Patient Management System',
    description: 'Comprehensive hospital management with EHR, doctors, appointment scheduling, billing, and pharmacy modules.',
    industry: 'Healthcare',
    scale: 'medium',
    modulesCount: 7,
    requirementsCount: 25,
  });
  console.log('Recommendation status:', recRes.status);
  console.log('Recommended plan:', recRes.data.data?.recommendedPlanName, '(Price: Rs.' + recRes.data.data?.recommendedPrice + ')');
  console.log('Complexity score:', recRes.data.data?.complexityScore);
  console.log('Reasoning:', recRes.data.data?.reason);
  console.log('Expected features:', recRes.data.data?.expectedFeaturesNeeded);

  console.log('\n--- 4. Testing POST /api/payments/paypal/create-order ---');
  const orderRes = await post('/api/payments/paypal/create-order', {
    planId: 'pro',
  });
  console.log('Create order status:', orderRes.status);
  console.log('PayPal Order ID:', orderRes.data.data?.orderId);
  console.log('PayPal Status:', orderRes.data.data?.status);

  if (orderRes.data.data?.orderId) {
    console.log('\n--- 5. Testing POST /api/payments/paypal/capture-order ---');
    const captureRes = await post('/api/payments/paypal/capture-order', {
      orderId: orderRes.data.data.orderId,
      planId: 'pro',
    });
    console.log('Capture status:', captureRes.status);
    console.log('Capture result:', captureRes.data.message);
    console.log('Activated subscription planId:', captureRes.data.data?.subscription?.planId);
  }

  console.log('\n--- 6. Testing GET /api/payments/history ---');
  const payHistRes = await get('/api/payments/history');
  console.log('Payments count:', payHistRes.data.data?.length);
  if (payHistRes.data.data?.length > 0) {
    console.log('Recent payment:', {
      orderId: payHistRes.data.data[0].paypalOrderId,
      amount: payHistRes.data.data[0].amount,
      currency: payHistRes.data.data[0].currency,
      status: payHistRes.data.data[0].paymentStatus,
    });
  }

  console.log('\n--- 7. Testing GET /api/subscriptions/current after Upgrade ---');
  const afterSub = await get('/api/subscriptions/current');
  console.log('Upgraded Plan:', afterSub.data.data?.plan?.planName);
  console.log('New Limits:', afterSub.data.data?.usage);
}

run().catch(console.error);

