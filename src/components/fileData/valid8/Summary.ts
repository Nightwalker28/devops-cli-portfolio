export const valid8Summary: string[] = [
`Project: valid8`,
`Type: Microservice – Email Verification`,
`Author: Nightwalker28`,
'Status: Live Use',

'Summary:',
'Built initially to speed up internal email validation, Valid8 has grown into a standalone, Dockerized microservice now used by external partners via API and bulk uploads.',
'',
'I decided to break that cycle.',

'It performs deep email verification using SMTP pings, MX record lookups, domain risk profiling, and more — all asynchronously via Celery and Redis. It’s designed for speed, accuracy, and scaling.',
'',
'Currently in early production, Valid8 is used in real client flows, and actively being improved for a broader rollout.',
'',
'> Tip: Want the full breakdown?',
'> \`cd projects/valid8/\`',
];