'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import MobileNav from '@/components/layout/MobileNav';

export default function DocsPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <Sidebar />
      <MobileNav />

      <main className="md:ml-64 min-h-screen flex flex-col">
        <TopBar title="Documentation" />

        <div className="pt-24 px-8 pb-12 sm:px-12 max-w-4xl mx-auto animate-fade-in">
          <h1 className="text-4xl font-bold mb-8">Documentation</h1>

          <div className="space-y-12">
            {/* Getting Started */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">Getting Started</h2>
              <div className="prose prose-slate max-w-none">
                <p className="text-on-surface-variant leading-relaxed">
                  Speco helps you create comprehensive Functional Requirements Documents (FRDs) through an AI-powered questionnaire system. Follow these steps to get started:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-on-surface-variant ml-4">
                  <li><strong>Create a Project</strong> - Define your project name, description, and industry</li>
                  <li><strong>Generate Modules</strong> - AI creates core functionality modules based on your project type</li>
                  <li><strong>Answer Questions</strong> - Complete the module-specific questionnaire</li>
                  <li><strong>Generate FRD</strong> - Create your complete functional requirements document</li>
                </ol>
              </div>
            </section>

            {/* Key Concepts */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">Key Concepts</h2>

              <div className="space-y-6">
                <div className="bg-surface-container-lowest p-6 rounded-xl">
                  <h3 className="font-bold text-lg mb-2">Projects</h3>
                  <p className="text-on-surface-variant">
                    A project is the container for your FRD. Each project has its own modules, questionnaire responses, and generated document.
                  </p>
                </div>

                <div className="bg-surface-container-lowest p-6 rounded-xl">
                  <h3 className="font-bold text-lg mb-2">Modules</h3>
                  <p className="text-on-surface-variant">
                    Modules are functional areas of your application (e.g., Authentication, Billing, Inventory). AI generates relevant modules based on your project type.
                  </p>
                </div>

                <div className="bg-surface-container-lowest p-6 rounded-xl">
                  <h3 className="font-bold text-lg mb-2">Questionnaire</h3>
                  <p className="text-on-surface-variant">
                    A series of questions specific to each module. Your answers help shape the requirements in your FRD.
                  </p>
                </div>

                <div className="bg-surface-container-lowest p-6 rounded-xl">
                  <h3 className="font-bold text-lg mb-2">FRD (Functional Requirements Document)</h3>
                  <p className="text-on-surface-variant">
                    The final output - a structured document containing all functional requirements, user flows, and technical specifications.
                  </p>
                </div>
              </div>
            </section>

            {/* Best Practices */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold">Best Practices</h2>

              <div className="space-y-4">
                <div className="border-l-4 border-primary pl-4">
                  <h3 className="font-bold">Provide clear descriptions</h3>
                  <p className="text-on-surface-variant text-sm">
                    The AI generates better modules when your initial project description is detailed and clear.
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h3 className="font-bold">Don't skip key questions</h3>
                  <p className="text-on-surface-variant text-sm">
                    While some questions are skippable, providing answers helps generate a more comprehensive and accurate FRD.
                  </p>
                </div>

                <div className="border-l-4 border-primary pl-4">
                  <h3 className="font-bold">Review before generating</h3>
                  <p className="text-on-surface-variant text-sm">
                    Make sure you have completed the questionnaire for all modules before hitting "Generate FRD" to avoid empty sections.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
