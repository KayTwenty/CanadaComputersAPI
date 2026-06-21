'use client';

import { useState, FormEvent } from 'react';
import {
    TbMail, TbUser, TbMessageCircle, TbSend,
    TbBrandDiscord, TbClock, TbCheck, TbChevronDown,
    TbSparkles,
} from 'react-icons/tb';

const SUBJECTS = [
    'General question',
    'Bug report',
    'Feature request',
    'Missing product or category',
    'Data / price issue',
    'Partnership or business inquiry',
    'Other',
] as const;

type Subject = (typeof SUBJECTS)[number];

interface FormState {
    name: string;
    email: string;
    subject: Subject;
    message: string;
}

const EMPTY: FormState = {
    name: '',
    email: '',
    subject: 'General question',
    message: '',
};

export default function ContactPage() {
    const [form, setForm] = useState<FormState>(EMPTY);
    const [sent, setSent] = useState(false);

    function handleSubmit(e: FormEvent) {
        e.preventDefault();

        const subject = encodeURIComponent(`[CCDeals] ${form.subject} from ${form.name}`);
        const body = encodeURIComponent(
            `Hi CCDeals team,\n\n` +
            `Name: ${form.name}\n` +
            `Email: ${form.email}\n` +
            `Topic: ${form.subject}\n\n` +
            `---\n\n` +
            `${form.message}\n\n` +
            `---\n` +
            `Sent via ccdeals.ca/contact`
        );

        window.location.href = `mailto:hello@ccdeals.ca?subject=${subject}&body=${body}`;
        setSent(true);
    }

    const filled = form.name.trim() && form.email.trim() && form.message.trim();

    return (
        <div className="flex-1 bg-white">

            {/* Dark hero — matches other pages */}
            <section className="relative overflow-hidden bg-zinc-950 text-white">
                <div className="absolute inset-0 bg-grid pointer-events-none" />
                <div className="absolute inset-0 pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse 80% 55% at 50% 0%, rgba(124,58,237,0.18), transparent 65%)' }} />
                <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-violet-700/8 blur-3xl pointer-events-none" />
                <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-fuchsia-700/8 blur-3xl pointer-events-none" />

                <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-14 pb-16 text-center">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/25 mb-5 animate-fade-up">
                        <TbMail size={13} className="text-violet-400" />
                        <span className="text-[11px] font-bold text-violet-300 uppercase tracking-widest">Get in touch</span>
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.1] animate-fade-up" style={{ animationDelay: '40ms' }}>
                        We&apos;d love to{' '}
                        <span className="text-brand-gradient">hear from you</span>
                    </h1>
                    <p className="mt-4 text-zinc-400 max-w-lg mx-auto leading-relaxed text-sm animate-fade-up" style={{ animationDelay: '80ms' }}>
                        Missing a product? Found a bug? Have an idea? Fill out the form and your email client will open with everything pre-filled. Just hit send.
                    </p>
                </div>
            </section>

            {/* Body */}
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-16">
                <div className="grid lg:grid-cols-[1fr_340px] gap-8 items-start">

                    {/* ── Form card — dark ── */}
                    <div className="bg-zinc-950 rounded-2xl border border-zinc-800 shadow-xl shadow-black/10 overflow-hidden">

                        {sent ? (
                            /* Success state */
                            <div className="flex flex-col items-center justify-center gap-5 px-8 py-16 text-center">
                                <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                                    <TbCheck size={28} className="text-emerald-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-extrabold text-white">Your email app opened!</h2>
                                    <p className="text-sm text-zinc-400 mt-2 max-w-sm leading-relaxed">
                                        Your message has been pre-filled. Just hit send in your email client and we&apos;ll
                                        get back to you within a few days.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setSent(false)}
                                    className="text-sm text-violet-400 font-semibold hover:underline"
                                >
                                    Send another message
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="divide-y divide-zinc-800">
                                <div className="px-7 py-5">
                                    <h2 className="text-base font-bold text-white">Contact form</h2>
                                    <p className="text-xs text-zinc-500 mt-0.5">
                                        Submitting opens your email client with everything pre-filled.
                                    </p>
                                </div>

                                <div className="px-7 py-6 grid sm:grid-cols-2 gap-5">

                                    {/* Name */}
                                    <div>
                                        <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                                            Your name <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <TbUser size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                                            <input
                                                required
                                                type="text"
                                                placeholder="Jane Smith"
                                                value={form.name}
                                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-white placeholder:text-zinc-600 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div>
                                        <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                                            Your email <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <TbMail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                                            <input
                                                required
                                                type="email"
                                                placeholder="you@example.com"
                                                value={form.email}
                                                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-white placeholder:text-zinc-600 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all"
                                            />
                                        </div>
                                    </div>

                                    {/* Subject */}
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                                            Topic
                                        </label>
                                        <div className="relative">
                                            <TbMessageCircle size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                                            <select
                                                value={form.subject}
                                                onChange={e => setForm(f => ({ ...f, subject: e.target.value as Subject }))}
                                                className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 text-white text-sm outline-none appearance-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all cursor-pointer"
                                            >
                                                {SUBJECTS.map(s => (
                                                    <option key={s} value={s}>{s}</option>
                                                ))}
                                            </select>
                                            <TbChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none" />
                                        </div>
                                    </div>

                                    {/* Message */}
                                    <div className="sm:col-span-2">
                                        <label className="block text-xs font-semibold text-zinc-400 mb-1.5">
                                            Message <span className="text-rose-500">*</span>
                                        </label>
                                        <textarea
                                            required
                                            rows={6}
                                            placeholder="Tell us what's on your mind…"
                                            value={form.message}
                                            onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                                            className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900 text-white placeholder:text-zinc-600 text-sm outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 transition-all resize-none leading-relaxed"
                                        />
                                        <p className="text-[11px] text-zinc-600 mt-1.5 text-right">
                                            {form.message.length} characters
                                        </p>
                                    </div>
                                </div>

                                {/* Preview */}
                                {filled && (
                                    <div className="px-7 py-4 bg-zinc-900/40 border-t border-zinc-800">
                                        <p className="text-[11px] font-bold text-violet-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                            <TbSparkles size={12} />
                                            Email preview
                                        </p>
                                        <div className="font-mono text-[11px] text-zinc-500 leading-relaxed whitespace-pre-wrap wrap-break-word bg-zinc-900 rounded-lg border border-zinc-800 px-3 py-2.5">
                                            {`To: hello@ccdeals.ca\nSubject: [CCDeals] ${form.subject} from ${form.name}\n\nHi CCDeals team,\n\nName: ${form.name}\nEmail: ${form.email}\nTopic: ${form.subject}\n\n---\n\n${form.message}`}
                                        </div>
                                    </div>
                                )}

                                {/* Submit */}
                                <div className="px-7 py-5 flex items-center justify-between gap-4">
                                    <p className="text-xs text-zinc-600 leading-relaxed max-w-xs">
                                        Clicking &ldquo;Open in email&rdquo; launches your default mail client with this message pre-filled.
                                    </p>
                                    <button
                                        type="submit"
                                        disabled={!filled}
                                        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all shrink-0 ${
                                            filled
                                                ? 'bg-linear-to-r from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/25 hover:shadow-violet-500/40 hover:scale-[1.02] active:scale-100'
                                                : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                                        }`}
                                    >
                                        <TbSend size={15} />
                                        Open in email
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    {/* ── Side panel ── */}
                    <div className="space-y-4">

                        {/* Direct email card removed */}

                        {/* Response time */}
                        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5">
                            <div className="flex items-center gap-3 mb-3">
                                <span className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                                    <TbClock size={18} className="text-emerald-500" />
                                </span>
                                <div>
                                    <p className="text-sm font-bold text-slate-900">Response time</p>
                                    <p className="text-xs text-slate-400">Typically within</p>
                                </div>
                            </div>
                            <p className="text-2xl font-extrabold text-slate-900">1–3 days</p>
                            <p className="text-xs text-slate-400 mt-0.5">Mon – Fri, EST</p>
                        </div>

                        {/* Discord */}
                        <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-5">
                            <div className="flex items-center gap-3 mb-3">
                                <span className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center shrink-0">
                                    <TbBrandDiscord size={18} className="text-indigo-500" />
                                </span>
                                <div>
                                    <p className="text-sm font-bold text-slate-900">Community</p>
                                    <p className="text-xs text-slate-400">Chat with us on Discord</p>
                                </div>
                            </div>
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full uppercase tracking-widest">
                                <TbSparkles size={11} />
                                Coming soon
                            </span>
                        </div>

                        {/* Tips */}
                        <div className="bg-zinc-950 rounded-2xl border border-zinc-800 p-5 text-white">
                            <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">Tips for a fast reply</p>
                            <ul className="space-y-2">
                                {[
                                    'Include the product name or URL',
                                    'Describe what you expected vs what happened',
                                    'Attach a screenshot if it helps',
                                ].map(tip => (
                                    <li key={tip} className="flex items-start gap-2 text-xs text-zinc-400 leading-relaxed">
                                        <span className="mt-0.5 w-4 h-4 rounded-full bg-violet-500/15 border border-violet-500/25 flex items-center justify-center shrink-0">
                                            <TbCheck size={10} className="text-violet-400" />
                                        </span>
                                        {tip}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
