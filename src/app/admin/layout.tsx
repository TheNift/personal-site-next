'use client';

import React from 'react';
import { AdminAuthProvider } from '@/contexts/AdminAuthContext';
import AdminNav from '@/components/admin/AdminNav';

export default function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<AdminAuthProvider>
			<div className='admin-layout w-full h-full min-h-screen overflow-y-auto'>
				<AdminNav />
				<main className='admin-main'>{children}</main>
			</div>
		</AdminAuthProvider>
	);
}
