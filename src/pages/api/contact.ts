import type { NextApiRequest, NextApiResponse } from 'next';

type ResponseData = {
  success?: string;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method === 'POST') {
    const { name, email, message } = req.body;

    // Basic validation
    if (!email || !message) {
      return res.status(400).json({ error: 'Email and message are required.' });
    }
    // Basic email format validation
    if (!/.+@.+\..+/.test(email)) {
      return res.status(400).json({ error: 'Invalid email format.' });
    }

    // Simulate email sending by logging to the console
    console.log('--- Contact Form Submission ---');
    console.log('Name:', name || '(not provided)');
    console.log('Email:', email);
    console.log('Message:', message);
    console.log('-----------------------------');

    // In a real application, you would integrate an email service here (e.g., Nodemailer, SendGrid, Resend)
    // For example:
    // await sendEmail({ to: 'your-actual-email@example.com', subject: `New contact from ${name || email}`, text: message, replyTo: email });

    // Simulate a delay as if an email was being sent
    await new Promise(resolve => setTimeout(resolve, 1000));

    return res.status(200).json({ success: 'Message "sent" successfully (simulated)!' });
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}