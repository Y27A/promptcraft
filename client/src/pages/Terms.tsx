import { usePageTitle } from "@/hooks/usePageTitle";
export default function Terms() {
  usePageTitle("Terms of Service");
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 prose prose-invert">
      <h1>Terms of Service</h1>
      <p>Last updated: {new Date().toLocaleDateString()}</p>
      <h2>Usage</h2>
      <p>PromptCraft is provided as-is. You may use it for personal and commercial prompt engineering. Do not use it to generate harmful, illegal, or deceptive content.</p>
      <h2>Free tier</h2>
      <p>Anonymous users receive 10 lifetime free generations. Registered free accounts receive 25 generations per day. Limits reset at midnight UTC.</p>
      <h2>Paid tiers</h2>
      <p>Stripe is not available in the GCC region. Tier upgrades are processed manually upon request. Contact us at yousifalbalooshi@gmail.com.</p>
      <h2>Disclaimer</h2>
      <p>We are not responsible for the output quality of AI-generated prompts. Always review AI output before use.</p>
    </div>
  );
}
