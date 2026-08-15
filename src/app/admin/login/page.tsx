'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Lock, ArrowRight, AlertCircle, Shield } from 'lucide-react';
import Link from 'next/link';

export default function AdminLoginPage() {
	const [password, setPassword] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const { login, isAuthenticated, isLoading } = useAdminAuth();
	const router = useRouter();

	useEffect(() => {
		if (!isLoading && isAuthenticated) {
			router.replace('/admin/gallery');
		}
	}, [isAuthenticated, isLoading, router]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!password.trim()) {
			setError('Please enter the admin password');
			return;
		}

		setError(null);
		setSubmitting(true);

		const result = await login(password);
		setSubmitting(false);

		if (result.success) {
			router.replace('/admin/gallery');
		} else {
			setError(result.error || 'Invalid password');
		}
	};

	if (isLoading) {
		return (
			<div className='flex items-center justify-center min-h-[70vh]'>
				<div className='w-8 h-8 border-2 border-yorha/20 border-t-yorha rounded-full animate-spin' />
			</div>
		);
	}

	return (
		<div className='flex flex-col items-center justify-center min-h-[75vh] px-4'>
			<div className='w-full max-w-md admin-card'>
				<div className='flex items-center gap-3 mb-6 pb-4 border-b border-yorha/15'>
					<div className='p-2.5 bg-yorha/10 rounded-md text-yorha'>
						<Shield size={24} />
					</div>
					<div>
						<h1 className='text-lg font-bold text-yorha tracking-wider uppercase m-0'>
							Admin Access
						</h1>
						<p className='text-xs text-yorha/60 mt-1 m-0'>
							Enter the admin password to manage gallery photos.
						</p>
					</div>
				</div>

				<form onSubmit={handleSubmit} className='space-y-4'>
					<div>
						<label
							htmlFor='admin-password'
							className='block text-xs font-semibold uppercase tracking-wider text-yorha/80 mb-2'
						>
							Password
						</label>
						<div className='relative'>
							<input
								id='admin-password'
								type='password'
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								placeholder='••••••••••••'
								className='admin-input pr-10'
								autoFocus
								disabled={submitting}
							/>
							<div className='absolute right-3 top-1/2 -translate-y-1/2 text-yorha/40 pointer-events-none'>
								<Lock size={16} />
							</div>
						</div>
					</div>

					{error && (
						<div className='flex items-center gap-2 p-3 bg-red-950/40 border border-red-800/60 rounded text-red-300 text-xs'>
							<AlertCircle size={15} className='shrink-0' />
							<span>{error}</span>
						</div>
					)}

					<button
						type='submit'
						disabled={submitting || !password.trim()}
						className='admin-btn w-full justify-center mt-2'
					>
						{submitting ? (
							<>
								<div className='w-4 h-4 border-2 border-yorha-dark/40 border-t-yorha-dark rounded-full animate-spin' />
								<span>Authenticating...</span>
							</>
						) : (
							<>
								<span>Log In</span>
								<ArrowRight size={16} />
							</>
						)}
					</button>
				</form>

				<div className='mt-6 pt-4 border-t border-yorha/10 text-center'>
					<Link
						href='/'
						className='text-xs text-yorha/50 hover:text-yorha transition-colors inline-flex items-center gap-1'
					>
						← Return to site
					</Link>
				</div>
			</div>
		</div>
	);
}
