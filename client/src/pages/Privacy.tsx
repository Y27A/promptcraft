import { usePageTitle } from "@/hooks/usePageTitle";
export default function Privacy() {
  usePageTitle("Privacy Policy");
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 prose prose-invert">
      <h1>Privacy Policy</h1>
      <p>Last updated: {new Date().toLocaleDateString()}</p>
      <h2>What we collect</h2>
      <p>We collect account information (name, email) when you sign up via Clerk, and the prompts you save to your library. Anonymous trial usage is tracked via a signed cookie that expires in 30 days.</p>
      <h2>How we use it</h2>
      <p>Your data is used only to provide the PromptCraft service. We do not sell your data to third parties.</p>
      <h2>AI processing</h2>
      <p>Prompt generation requests are sent to OpenAI's API. Please review <a href="https://openai.com/privacy" className="text-primary">OpenAI's privacy policy</a>.</p>
      <h2>Contact</h2>
      <p>For any privacy concerns, email yousifalbalooshi@gmail.com.</p>
    </div>
  );
}
