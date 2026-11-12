'use client';

import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import MobileNav from '@/components/layout/MobileNav';

export default function SupportPage() {
  const router = useRouter();

  const faqs = [
    {
      q: "How do I start a new project?",
      a: "Click on 'Start New Project' from the home page, fill in your project details (name, description, industry), and click 'Create Project'."
    },
    {
      q: "How do I invite team members?",
      a: "Currently, projects are tied to your individual account. Team collaboration features are coming in our next major update!"
    },
    {
      q: "My FRD is empty or has minimal content. What should I do?",
      a: "Make sure you've: 1) Generated modules, 2) Completed the questionnaire, 3) Then generated the FRD. Each step feeds into the next."
    },
    {
      q: "How do I export my FRD?",
      a: "Go to your project's FRD tab and click 'View FRD'. From there you can copy the markdown or print to PDF."
    },
    {
      q: "Can I modify the generated modules?",
      a: "Yes, you can add custom modules or regenerate existing ones from the Modules tab to fit your specific needs."
    },
    {
      q: "Is my data stored securely?",
      a: "Yes. All your project data and specifications are encrypted at rest and securely backed up on our cloud infrastructure."
    }
  ];

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <Sidebar />
      <MobileNav />
      
      <main className="md:ml-64 min-h-screen flex flex-col">
        <TopBar title="Support" />
        
        <div className="pt-24 px-8 pb-12 sm:px-12 max-w-4xl mx-auto animate-fade-in">
          <h1 className="text-4xl font-bold mb-4">Support</h1>
          <p className="text-on-surface-variant mb-12">
            Get help with Speco and find answers to common questions.
          </p>
          
          <div className="space-y-12">
            {/* Quick Links */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a href="/docs" className="bg-surface-container-lowest p-6 rounded-xl hover:bg-surface-container-low transition-colors group">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined">menu_book</span>
                </div>
                <h3 className="font-bold mb-2">Documentation</h3>
                <p className="text-sm text-on-surface-variant">Learn how to use Speco</p>
              </a>

              <a href="/history" className="bg-surface-container-lowest p-6 rounded-xl hover:bg-surface-container-low transition-colors group">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined">history</span>
                </div>
                <h3 className="font-bold mb-2">Activity History</h3>
                <p className="text-sm text-on-surface-variant">View recent changes</p>
              </a>

              <a href="mailto:support@speco.ai" className="bg-surface-container-lowest p-6 rounded-xl hover:bg-surface-container-low transition-colors group">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined">email</span>
                </div>
                <h3 className="font-bold mb-2">Contact Us</h3>
                <p className="text-sm text-on-surface-variant">support@speco.ai</p>
              </a>
            </section>

            {/* FAQ */}
            <section className="space-y-6">
              <h2 className="text-2xl font-bold">Frequently Asked Questions</h2>
              
              <div className="space-y-4">
                {faqs.map((faq, idx) => (
                  <details key={idx} className="bg-surface-container-lowest rounded-xl group">
                    <summary className="p-6 cursor-pointer font-bold flex justify-between items-center">
                      {faq.q}
                      <span className="material-symbols-outlined text-primary transition-transform group-open:rotate-180">
                        expand_more
                      </span>
                    </summary>
                    <div className="px-6 pb-6 text-on-surface-variant">
                      {faq.a}
                    </div>
                  </details>
                ))}
              </div>
            </section>

            {/* Still need help */}
            <section className="bg-primary/5 border border-primary/10 rounded-xl p-8 text-center">
              <h3 className="text-xl font-bold mb-2">Still need help?</h3>
              <p className="text-on-surface-variant mb-6">
                Can't find what you're looking for? Reach out to our support team.
              </p>
              <a 
                href="mailto:support@speco.ai" 
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-colors"
              >
                <span className="material-symbols-outlined">email</span>
                Contact Support
              </a>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
