<?php
// Contact form endpoint (sections/ContactForm.astro, scripts/components/contactForm.js). Upload it with the site (it
// lands at /api/contact.php); needs PHP with mail() on the host (most shared hosting has it). Receives the form as a
// POST, checks it, mails it to TO with the visitor as Reply-To, and answers JSON: {"ok":true} or {"ok":false,...}.
// The page shows its thank-you message on ok, its error message (with the email address) otherwise.
// If the host's mail() isn't allowed or lands in spam, ask the host for its SMTP settings and switch to SMTP here.

const TO = 'robbe.vanaken@gmail.com';
const FROM = 'website@robbevanaken.be'; // an address on the site's own domain, so the mail isn't flagged as spoofed
const SITE = 'robbevanaken.be';
const MAX = 5000; // max characters of the message

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function reply(int $code, array $body): never {
  http_response_code($code);
  echo json_encode($body);
  exit;
}
// one line, no header injection, trimmed
function line(string $key, int $max = 200): string {
  $v = trim((string)($_POST[$key] ?? ''));
  $v = preg_replace('/[\r\n\t]+/', ' ', $v);
  return mb_substr($v, 0, $max);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') reply(405, ['ok' => false, 'error' => 'method']);

// spam trap: people never see the "website" field, bots fill it in. Pretend it worked.
if (!empty($_POST['website'])) reply(200, ['ok' => true]);

$first = line('first_name');
$last = line('last_name');
$email = line('email');
$company = line('company');
$budget = line('budget', 50);
$message = mb_substr(trim((string)($_POST['message'] ?? '')), 0, MAX);

if ($first === '' || $last === '' || $message === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
  reply(422, ['ok' => false, 'error' => 'invalid']);
}

$name = "$first $last";
$body = "New project enquiry via " . SITE . "\n\n"
  . "Name: $name\n"
  . "Email: $email\n"
  . ($company !== '' ? "Company: $company\n" : '')
  . ($budget !== '' ? "Budget: $budget\n" : '')
  . "\nMessage:\n$message\n";
$subject = '=?UTF-8?B?' . base64_encode("New project enquiry: $name") . '?=';
$headers = implode("\r\n", [
  'From: ' . '=?UTF-8?B?' . base64_encode('Robbe Van Aken website') . '?=' . " <" . FROM . ">",
  "Reply-To: $email",
  'MIME-Version: 1.0',
  'Content-Type: text/plain; charset=UTF-8',
  'Content-Transfer-Encoding: 8bit',
]);

$sent = @mail(TO, $subject, $body, $headers, '-f' . FROM);
reply($sent ? 200 : 500, $sent ? ['ok' => true] : ['ok' => false, 'error' => 'mail']);
