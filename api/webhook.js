import Stripe from 'stripe';
import { buffer } from 'micro';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).end();
    return;
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    console.log('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const invoiceId = session.metadata.app_invoice_id;
    console.log(`PAYMENT SUCCESS: Invoice ${invoiceId} paid $${session.amount_total / 100}`);
    // Later: update your app storage here
  }

  res.json({ received: true });
}

export const config = {
  api: {
    bodyParser: false,
  },
};
