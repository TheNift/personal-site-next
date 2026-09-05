'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Images, LogOut, ExternalLink, Shield } from 'lucide-react';

export default function AdminNav() {
	const pathname = usePathname();
	const { logout, isAuthenticated } = useAdminAuth();

	if (!isAuthenticated) return null;

	return (
		<header className='admin-nav'>
			<div className='flex items-center gap-3'>
				<Link
					href='/admin/gallery'
					className='admin-nav-brand flex items-center gap-2 hover:opacity-80 transition-opacity'
				>
					<Shield size={18} className='text-yorha' />
					<span>Admin Console</span>
				</Link>
			</div>

			<nav className='admin-nav-links'>
				<Link
					href='/admin/gallery'
					className={`admin-nav-link ${pathname === '/admin/gallery' ? 'active font-bold text-yorha' : ''}`}
				>
					<Images size={16} />
					<span>Gallery</span>
				</Link>

				<Link
					href='/gallery'
					target='_blank'
					rel='noopener noreferrer'
					className='admin-nav-link'
					title='View public gallery in a new tab'
				>
					<ExternalLink size={15} />
					<span>View Site</span>
				</Link>

				<button
					onClick={() => logout()}
					className='admin-nav-link text-red-300 hover:text-red-200 hover:bg-red-900/30 border border-transparent cursor-pointer'
					title='Log out of admin'
				>
					<LogOut size={15} />
					<span>Logout</span>
				</button>
			</nav>
		</header>
	);
}
