'use strict';

const axios = require('axios');
const crypto = require('crypto');

const BASE_URL = 'https://api.paystack.co';

function paystackClient() {
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
  });
}

async function initializeTransaction({ email, amountNGN, reference, metadata, callbackUrl }) {
  const client = paystackClient();
  const { data } = await client.post('/transaction/initialize', {
    email,
    amount: amountNGN * 100, // Paystack expects kobo
    reference,
    metadata,
    callback_url: callbackUrl,
    currency: 'NGN',
  });

  if (!data.status) throw new Error(data.message || 'Paystack initialization failed');
  return data.data; // { authorization_url, access_code, reference }
}

async function verifyTransaction(reference) {
  const client = paystackClient();
  const { data } = await client.get(`/transaction/verify/${encodeURIComponent(reference)}`);

  if (!data.status) throw new Error(data.message || 'Paystack verification failed');
  return data.data; // { status, amount, reference, customer, metadata, ... }
}

function verifyWebhookSignature(rawBody, signature) {
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
    .update(rawBody)
    .digest('hex');
  return hash === signature;
}

module.exports = { initializeTransaction, verifyTransaction, verifyWebhookSignature };
