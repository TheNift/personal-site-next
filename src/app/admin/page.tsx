'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/contexts/AdminAuthContext';

export default function AdminIndexPage() {
	const { isAuthenticated, isLoading } = useAdminAuth();
	const router = useRouter();

	useEffect(() => {
		if (!isLoading) {
			if (isAuthenticated) {
				router.replace('/admin/gallery');
			} else {
				router.replace('/admin/login');
			}
		}
	}, [isAuthenticated, isLoading, router]);

	return (
		<div className='flex items-center justify-center min-h-[60vh]'>
			<div className='w-8 h-8 border-2 border-yorha/20 border-t-yorha rounded-full animate-spin' />
		</div>
	);
}
