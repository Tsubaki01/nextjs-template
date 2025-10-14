'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setFormData({ name: '', email: '', message: '' });
      } else {
        setSubmitStatus('error');
      }
    } catch (_error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-2xl font-bold text-transparent">
            お問い合わせ
          </h1>
        </div>

        <div className="mx-auto max-w-2xl">
          <div className="rounded-2xl border border-white/20 bg-white/80 p-6 shadow-xl backdrop-blur-sm">
            <div className="mb-6">
              <p className="text-sm text-slate-600">
                ご質問、ご要望、その他お問い合わせは以下のフォームからお送りください。
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-700">
                  お名前 <span className="text-blue-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white/50 px-4 py-3 backdrop-blur-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  placeholder="山田 太郎"
                />
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
                  メールアドレス <span className="text-blue-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 bg-white/50 px-4 py-3 backdrop-blur-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  placeholder="example@email.com"
                />
              </div>

              <div>
                <label htmlFor="message" className="mb-2 block text-sm font-medium text-slate-700">
                  お問い合わせ内容 <span className="text-blue-500">*</span>
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white/50 px-4 py-3 backdrop-blur-sm transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  placeholder="お問い合わせ内容をご記入ください"
                />
              </div>

              {submitStatus === 'success' && (
                <div className="rounded-r-lg border-l-4 border-blue-400 bg-gradient-to-r from-blue-50 to-blue-100 p-4 shadow-sm">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-blue-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-800">
                        お問い合わせを受け付けました
                      </p>
                      <p className="mt-1 text-xs text-blue-700">
                        ご連絡ありがとうございます。1〜2営業日以内にご返信いたします。
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="rounded-r-lg border-l-4 border-slate-400 bg-gradient-to-r from-slate-50 to-slate-100 p-4 shadow-sm">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-slate-400"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-slate-800">
                        送信中にエラーが発生しました
                      </p>
                      <p className="mt-1 text-xs text-slate-700">
                        しばらく経ってから再度お試しください。
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gradient-to-r from-blue-500 to-blue-700 px-12 py-4 text-base font-medium hover:from-blue-600 hover:to-blue-800"
                  size="lg"
                >
                  {isSubmitting ? '送信中...' : '送信する'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
