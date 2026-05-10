import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bot,
  CalendarCheck2,
  CheckCircle2,
  ClipboardList,
  Mic,
  Rocket,
  ShieldCheck,
  Users,
  Video
} from 'lucide-react';
import { FAQ1 } from '@/components/ui/faq-monocrhome';
import { GlowingEffect } from '../components/ui/glowing-effect';
import DotGlobeHeroDemo, { ScrollImageSection } from '../components/ui/demo';

const LandingPage = () => {
  const features = [
    {
      icon: CalendarCheck2,
      title: 'Meeting Workflows',
      description: 'Create individual and group meetings with structured agendas and clear outcomes.',
    },
    {
      icon: Video,
      title: 'Live Meeting Rooms',
      description: 'Start live sessions instantly and share join links with your participants.',
    },
    {
      icon: Bot,
      title: 'AI Assistant Chat',
      description: 'Ask contextual questions about a meeting and get immediate AI responses.',
    },
    {
      icon: ClipboardList,
      title: 'Smart Summaries',
      description: 'Turn conversations into summaries, action items, and trackable decisions.',
    },
    {
      icon: Users,
      title: 'Organization Spaces',
      description: 'Manage organizations, switch contexts, and keep teams aligned.',
    },
    {
      icon: ShieldCheck,
      title: 'Secure Sign-In',
      description: 'User authentication and protected routes keep meeting data private.',
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="sticky top-0 z-20 backdrop-blur-md bg-black/50 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rocket size={18} />
            <h1 className="text-xl font-semibold">Meeting AI</h1>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-white/70">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#workflow" className="hover:text-white transition-colors">Workflow</a>
            <a href="#why" className="hover:text-white transition-colors">Why Us</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/signin" className="btn-secondary">Sign In</Link>
            <Link to="/signup" className="btn-primary">Get Started</Link>
          </div>
        </div>
      </header>

      <main className="pb-8 md:pb-12">
        <DotGlobeHeroDemo />
        <ScrollImageSection />

        <section id="features" className="max-w-6xl mx-auto px-4 py-16 md:py-20">
          <div className="text-center mb-10 md:mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-3">Built for modern team meetings</h2>
            <p className="text-white/70 max-w-2xl mx-auto">
              Everything in your project is represented here: authentication, organization management,
              live rooms, chat-based AI, and post-meeting clarity.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="card-glass relative overflow-hidden">
                  <GlowingEffect spread={90} glow={true} disabled={false} proximity={140} inactiveZone={0} borderWidth={3} />
                  <Icon className="mb-3" />
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-white/70">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section id="workflow" className="max-w-6xl mx-auto px-4 py-16 md:py-20">
          <div className="glass-container p-6 md:p-10 relative overflow-hidden">
            <GlowingEffect spread={90} glow={true} disabled={false} proximity={140} inactiveZone={0} borderWidth={3} />
            <h2 className="text-2xl md:text-3xl font-bold mb-8">How Meeting AI works</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3 text-white/90"><CheckCircle2 size={18} /> Step 1</div>
                <h3 className="font-semibold mb-2">Create or Join Organization</h3>
                <p className="text-white/70 text-sm">Set up your team workspace and invite collaborators to keep meetings centralized.</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3 text-white/90"><CheckCircle2 size={18} /> Step 2</div>
                <h3 className="font-semibold mb-2">Run Meetings Live</h3>
                <p className="text-white/70 text-sm">Create individual, group, or live meetings and share links instantly with participants.</p>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3 text-white/90"><CheckCircle2 size={18} /> Step 3</div>
                <h3 className="font-semibold mb-2">Extract Decisions with AI</h3>
                <p className="text-white/70 text-sm">Use the assistant to summarize sessions, surface tasks, and keep everyone accountable.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="why" className="max-w-6xl mx-auto px-4 py-16 md:py-20">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card-glass relative overflow-hidden">
              <GlowingEffect spread={90} glow={true} disabled={false} proximity={140} inactiveZone={0} borderWidth={3} />
              <h3 className="text-2xl font-semibold mb-4">Why teams choose your platform</h3>
              <ul className="space-y-3 text-white/75">
                <li className="flex items-start gap-2"><Mic size={16} className="mt-1" /> From planning to live execution in one place.</li>
                <li className="flex items-start gap-2"><Mic size={16} className="mt-1" /> Organization-aware collaboration for distributed teams.</li>
                <li className="flex items-start gap-2"><Mic size={16} className="mt-1" /> AI support directly inside the meeting detail experience.</li>
              </ul>
            </div>
            <div className="card-glass relative overflow-hidden">
              <GlowingEffect spread={90} glow={true} disabled={false} proximity={140} inactiveZone={0} borderWidth={3} />
              <h3 className="text-2xl font-semibold mb-4">Ready for your next sprint</h3>
              <p className="text-white/70 mb-6">
                Launch your team meeting hub with secure access, live collaboration, and AI-powered follow-through.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/signup" className="btn-primary inline-flex items-center gap-2">
                  Start Free <ArrowRight size={16} />
                </Link>
                <Link to="/create-live-meeting" className="btn-secondary">
                  Start Live Meeting
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="faq" className="relative scroll-mt-24">
          <FAQ1 />
        </section>
      </main>

      <footer className="border-t border-white/10 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-white/60 text-sm">
          <p>© {new Date().getFullYear()} Meeting AI. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/signin" className="hover:text-white transition-colors">Sign In</Link>
            <Link to="/signup" className="hover:text-white transition-colors">Create Account</Link>
            <Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
